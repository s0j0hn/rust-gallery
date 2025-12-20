# Test Suite Documentation

This document describes the comprehensive test suite for the Rust Gallery application, covering all API endpoints, validation logic, security measures, and database operations.

## Overview

The test suite contains **41 integration and unit tests** organized into logical categories. All tests use Rocket's async test client with proper database isolation to ensure test independence.

## Running Tests

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_name

# Run tests with output
cargo test -- --nocapture

# Run tests showing only failures
cargo test 2>&1 | grep -E "FAILED|failures:"
```

## Test Architecture

### Test Isolation
- Uses `Mutex` lock (`DB_LOCK`) to prevent concurrent database access
- Database is cleaned before and after each test
- Helper macro `run_test!` ensures proper async handling and cleanup

### Helper Functions
- `create_test_image()` - Creates test image metadata
- `insert_test_images()` - Inserts multiple test images with folders

## Test Categories

### 1. Folders Handler Tests (9 tests)

#### `test_get_folders_json_success`
- **Endpoint**: `GET /folders/json`
- **Tests**: Successful retrieval of folder list with pagination
- **Validates**:
  - 200 OK status
  - JSON array response format
  - Pagination parameters (page, per_page)

#### `test_get_folders_json_pagination`
- **Endpoint**: `GET /folders/json`
- **Tests**: Pagination functionality
- **Validates**:
  - Correct page numbers in query params
  - Results match requested page size

#### `test_get_folders_json_empty_database`
- **Endpoint**: `GET /folders/json`
- **Tests**: Behavior with empty database
- **Validates**:
  - 200 OK status even with no data
  - Empty array response

#### `test_get_roots_json_success`
- **Endpoint**: `GET /folders/roots`
- **Tests**: Retrieval of root directories
- **Validates**:
  - 200 OK status
  - JSON array of root paths

#### `test_get_folder_by_name_success`
- **Endpoint**: `GET /folders/json/name/<name>`
- **Tests**: Folder lookup by name
- **Validates**:
  - 200 OK status for existing folders
  - JSON array response

#### `test_get_folder_by_name_not_found`
- **Endpoint**: `GET /folders/json/name/<name>`
- **Tests**: Non-existent folder handling
- **Validates**:
  - 404 Not Found status

#### `test_get_folder_by_name_directory_traversal_prevention`
- **Endpoint**: `GET /folders/json/name/<name>`
- **Tests**: Directory traversal attack prevention
- **Validates**:
  - `..` returns 400 BadRequest
  - Patterns with forward slashes (`../secrets`) return 404 (route doesn't match)
  - Patterns with backslashes (`..\\windows`) return 400 BadRequest
- **Security**: Prevents path traversal attacks

#### `test_get_folder_by_name_length_validation`
- **Endpoint**: `GET /folders/json/name/<name>`
- **Tests**: Folder name length validation
- **Validates**:
  - Names > 255 chars return 422 UnprocessableEntity
- **Prevents**: DoS via excessive name lengths

#### `test_delete_folder_success`
- **Endpoint**: `POST /folders/delete`
- **Tests**: Successful folder deletion
- **Validates**:
  - 200 OK status
  - All files in folder are deleted
  - Database row count = 0 after deletion

#### `test_delete_folder_validation`
- **Endpoint**: `POST /folders/delete`
- **Tests**: Empty folder name validation
- **Validates**:
  - Empty name returns 422 UnprocessableEntity

---

### 2. Files Handler Tests (3 tests)

#### `test_retrieve_file_success`
- **Endpoint**: `GET /files/<hash>/download`
- **Tests**: File retrieval by hash
- **Validates**:
  - 200 OK status
  - Response has valid Content-Type
  - Response body is not empty

#### `test_retrieve_file_not_found`
- **Endpoint**: `GET /files/<hash>/download`
- **Tests**: Non-existent file handling
- **Validates**:
  - 404 Not Found for invalid hash

#### `test_get_all_files_json_success`
- **Endpoint**: `GET /files/json`
- **Tests**: File listing with pagination
- **Validates**:
  - 200 OK status
  - Response contains `items`, `page`, `total` fields
  - JSON structure matches `JsonFileResponse`

---

### 3. Tags Handler Tests (5 tests)

#### `test_assign_tag_success`
- **Endpoint**: `POST /tags/assign`
- **Tests**: Tag assignment to images
- **Validates**:
  - 200 OK status
  - Request body uses `image_hash` field (not `hash`)
  - Tags array is accepted

#### `test_assign_tag_invalid_hash`
- **Endpoint**: `POST /tags/assign`
- **Tests**: Invalid hash handling
- **Validates**:
  - 400/404 status for non-existent hash

#### `test_assign_tag_folder_success`
- **Endpoint**: `POST /tags/assign/folder`
- **Tests**: Bulk tag assignment to folders
- **Validates**:
  - 200 OK status
  - Multiple tags can be assigned
  - Response confirms tags were applied

#### `test_get_all_tags_success`
- **Endpoint**: `GET /tags`
- **Tests**: Tag retrieval
- **Validates**:
  - 200 OK status
  - JSON array of tag strings

#### `test_get_all_tags_validation`
- **Endpoint**: `GET /tags`
- **Tests**: Folder name length validation
- **Validates**:
  - Folder name > 255 chars returns 422 UnprocessableEntity
- **Note**: Tags handler only validates length, not directory traversal

---

### 4. Config Handler Tests (3 tests)

#### `test_get_config_success`
- **Endpoint**: `GET /config`
- **Tests**: Configuration retrieval
- **Validates**:
  - 200 OK status
  - JSON object with config fields

#### `test_update_config_success`
- **Endpoint**: `POST /config`
- **Tests**: Configuration update
- **Validates**:
  - 200 OK status
  - Valid config JSON is accepted
  - Fields: `random_equal_folders`, `photo_per_random`, `folders_per_page`, `equal_enabled`

#### `test_update_config_invalid_json`
- **Endpoint**: `POST /config`
- **Tests**: Invalid JSON handling
- **Validates**:
  - 422 UnprocessableEntity for malformed JSON

---

### 5. Tasks Handler Tests (4 tests)

#### `test_index_files_success`
- **Endpoint**: `GET /files/task/index`
- **Tests**: File indexing task initiation
- **Validates**:
  - 200 OK status
  - Works with `force=true` and `force=false` parameters

#### `test_index_files_invalid_force_parameter`
- **Endpoint**: `GET /files/task/index`
- **Tests**: Invalid boolean parameter handling
- **Validates**:
  - 422 UnprocessableEntity for invalid `force` value

#### `test_cancel_task_no_task_running`
- **Endpoint**: `GET /files/task/cancel`
- **Tests**: Task cancellation when no task is running
- **Validates**:
  - 200 OK status
  - Response indicates no task was running
  - Fields: `status: "info"`, `task_running: false`

---

### 6. Database Model Tests (6 tests)

#### `test_insert_and_retrieve_file`
- **Tests**: Basic CRUD operations
- **Validates**:
  - File insertion succeeds
  - File retrieval by hash works
  - Retrieved data matches inserted data

#### `test_file_count_by_folder`
- **Tests**: Folder file counting
- **Validates**:
  - Count matches number of inserted files
  - Filtering by folder name works

#### `test_delete_all_files`
- **Tests**: Bulk deletion
- **Validates**:
  - All files can be deleted
  - Count = 0 after deletion

#### `test_get_random_files`
- **Tests**: Random file selection
- **Validates**:
  - Requested number of files returned
  - Files are randomly selected (not ordered)

#### `test_get_all_tags_from_db`
- **Tests**: Tag retrieval from database
- **Validates**:
  - Tags are parsed from comma-separated strings
  - All unique tags are returned

#### `test_pagination_offset`
- **Tests**: Database pagination
- **Validates**:
  - Offset calculation works correctly
  - Limit parameter restricts results
  - Different pages return different results

---

### 7. Security & Validation Tests (9 tests)

#### `test_hash_validation_min_length`
- **Tests**: Minimum hash length validation
- **Validates**:
  - Hash with exactly 8 chars (MIN_HASH_LENGTH) is valid
  - No validation error for valid length
- **Constant**: `MIN_HASH_LENGTH = 8`

#### `test_hash_validation_max_length`
- **Tests**: Maximum hash length validation
- **Validates**:
  - Hash with exactly 128 chars (MAX_HASH_LENGTH) is valid
  - No validation error for valid length
- **Constant**: `MAX_HASH_LENGTH = 128`

#### `test_folder_name_max_length_boundary`
- **Tests**: Folder name boundary conditions
- **Validates**:
  - 255 chars (MAX_FOLDER_NAME_LENGTH) is valid
  - 256 chars returns 422 UnprocessableEntity
- **Constant**: `MAX_FOLDER_NAME_LENGTH = 255`

#### `test_pagination_boundaries`
- **Tests**: Pagination parameter validation
- **Validates**:
  - `page=0` returns 422 (page must be >= 1)
  - `page=1` is valid
  - `per_page=1000` (MAX_ITEMS_PER_PAGE) is valid
  - `per_page=1001` returns 422
- **Constants**: `MAX_ITEMS_PER_PAGE = 1000`

#### `test_directory_traversal_patterns`
- **Tests**: Comprehensive directory traversal prevention
- **Validates**:
  - Patterns with dots only (`..`, `..secret`) return 400 BadRequest
  - Patterns with embedded slashes (`./../`, `folder/..`) return 404 (route doesn't match)
  - Patterns with trailing slash (`../`) return 400 (slash stripped)
  - Patterns with backslashes (`..\\`, `..\\..\\windows`) return 400 BadRequest
- **Security**: Multi-layer protection against path traversal

#### `test_sql_injection_prevention`
- **Tests**: SQL injection attack prevention
- **Validates**:
  - Injection patterns are handled safely
  - Database integrity is maintained
  - No crashes or errors from malicious input
- **Attack Patterns Tested**:
  - `'; DROP TABLE files; --`
  - `' OR '1'='1`
  - `admin' --`
  - `1' OR '1' = '1`
- **Security**: Diesel ORM provides protection

#### `test_config_value_validation`
- **Tests**: Configuration value validation
- **Validates**:
  - Negative values return 422
  - Zero values return 422
  - Positive values are accepted
- **Fields Tested**:
  - `random_equal_folders`
  - `photo_per_random`
  - `folders_per_page`
  - `equal_enabled`

---

### 8. Error Handling Tests (2 tests)

#### `test_invalid_endpoint_returns_404`
- **Tests**: Non-existent route handling
- **Validates**:
  - 404 Not Found for invalid endpoints
  - Rocket's default 404 handler works

#### `test_invalid_json_body`
- **Tests**: Malformed JSON handling
- **Validates**:
  - 422 UnprocessableEntity for invalid JSON
  - Parser errors are caught gracefully

---

## Security Validation Summary

### Input Validation
- ✅ Hash length (8-128 chars)
- ✅ Folder name length (max 255 chars)
- ✅ Pagination boundaries (page ≥ 1, per_page ≤ 1000)
- ✅ Configuration value ranges (no negatives)

### Attack Prevention
- ✅ **Directory Traversal**: Multi-layer protection
  - Route-level (Rocket doesn't match paths with `/`)
  - Handler-level (checks for `..`, `/`, `\`)
- ✅ **SQL Injection**: Protected by Diesel ORM
- ✅ **DoS Prevention**:
  - Max folder name length
  - Max pagination size
  - Request size limits

### HTTP Status Codes
- `200 OK` - Successful operations
- `400 Bad Request` - Directory traversal, forbidden characters
- `404 Not Found` - Resource not found, route not matched
- `422 Unprocessable Entity` - Validation errors (length, range, format)
- `500 Internal Server Error` - Database/server errors

---

## Constants Used in Tests

From `src/constants.rs`:

```rust
// Hash validation
MIN_HASH_LENGTH: 8
MAX_HASH_LENGTH: 128

// Folder validation
MAX_FOLDER_NAME_LENGTH: 255

// Pagination
DEFAULT_PAGE: 1
DEFAULT_ITEMS_PER_PAGE: 25
MAX_ITEMS_PER_PAGE: 1000
MAX_PAGINATION_SIZE: 1000

// Random selection
DEFAULT_RANDOM_SIZE: 10
DEFAULT_EQUAL_SIZE: 50

// Thumbnails
DEFAULT_THUMBNAIL_WIDTH: 150
DEFAULT_THUMBNAIL_HEIGHT: 150

// Image resize limits (DoS prevention)
MAX_RESIZE_WIDTH: 4096
MAX_RESIZE_HEIGHT: 4096
MAX_RESIZE_PIXELS: 16,777,216 (4096 × 4096)
```

---

## Test Coverage by Feature

| Feature | Tests | Coverage |
|---------|-------|----------|
| Folders API | 9 | ✅ List, Get, Delete, Pagination, Security |
| Files API | 3 | ✅ Retrieve, List, Not Found |
| Tags API | 5 | ✅ Assign, Bulk Assign, List, Validation |
| Config API | 3 | ✅ Get, Update, Invalid Input |
| Tasks API | 4 | ✅ Index, Cancel, Parameters |
| Database | 6 | ✅ CRUD, Count, Random, Tags, Pagination |
| Security | 9 | ✅ Validation, Traversal, SQL Injection |
| Error Handling | 2 | ✅ 404, Malformed JSON |

**Total: 41 tests, 100% passing**

---

## Future Test Considerations

Potential areas for additional testing:

1. **Image Processing**
   - Thumbnail generation
   - Image resizing with width/height parameters
   - WebP/JPEG format handling
   - Cache behavior

2. **Concurrency**
   - Multiple simultaneous indexing tasks
   - Cache invalidation under load
   - Database connection pool limits

3. **File System**
   - Missing file handling
   - Symlink following
   - Permission errors

4. **Performance**
   - Large result set pagination
   - Random file selection performance
   - Cache hit/miss ratios

---

## Contributing

When adding new tests:

1. Use the `run_test!` macro for database isolation
2. Clean up test data in the test body
3. Add appropriate comments explaining what is being tested
4. Follow the naming convention: `test_<feature>_<scenario>`
5. Update this documentation with new test details
