// Application constants - extracted magic numbers for better maintainability

// Cache durations (in seconds)
pub const CACHE_TTL_1_DAY: u64 = 86400;
pub const CACHE_TTL_4_DAYS: u64 = 345600;
pub const CACHE_TTL_1_WEEK: u64 = 604800;

// Image processing defaults
pub const DEFAULT_THUMBNAIL_WIDTH: u32 = 150;
pub const DEFAULT_THUMBNAIL_HEIGHT: u32 = 150;

// Validation limits
pub const MIN_HASH_LENGTH: usize = 8;
pub const MAX_HASH_LENGTH: usize = 128;
pub const MAX_FOLDER_NAME_LENGTH: usize = 255;
pub const MAX_PAGINATION_SIZE: usize = 1000;
pub const MAX_ITEMS_PER_PAGE: usize = 100;
pub const DEFAULT_ITEMS_PER_PAGE: usize = 25;
pub const MAX_CACHE_CAPACITY: u64 = 10_000;

// File processing
pub const HASH_BUFFER_SIZE: usize = 4096;
pub const MAX_WALKDIR_DEPTH: usize = 2;
pub const FILENAME_TRUNCATE_LENGTH: usize = 16;

// Default values
pub const DEFAULT_PAGE: usize = 1;
pub const DEFAULT_RANDOM_SIZE: usize = 10;
pub const DEFAULT_EQUAL_SIZE: usize = 50;
