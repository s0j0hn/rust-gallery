# Rust Gallery

A high-performance image gallery application built with Rust and React, designed for efficient browsing and management of image collections.

## Features

- **Fast Image Browsing**: Efficiently navigate through large image collections
- **Client-side Image Caching**: Browser-based caching system for faster thumbnail loading and reduced bandwidth
- **Image Tagging**: Add and manage tags for easy categorization
- **WebP Support**: Modern image format support with fallbacks to JPEG
- **Responsive Design**: Works across desktop and mobile devices
- **Download Options**: Easily download individual images
- **Real-time Updates**: Interface updates automatically when changes occur
- **SQLite Database**: Efficient local storage with Diesel ORM integration
- **Docker Support**: Easy deployment in containerized environments

## Technology Stack

### Backend
- **Language**: Rust
- **Web Framework**: Rocket
- **Database**: SQLite with Diesel ORM
- **Image Processing**: Rust's image crate
- **Server-side Caching**: Moka for high-performance caching

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API and hooks
- **Image Gallery**: PhotoSwipe integration
- **Client-side Caching**: Custom localStorage-based caching system for thumbnails
- **Responsive Design**: Mobile-first UI components

## Prerequisites

- Rust (latest stable or nightly)
- SQLite
- Node.js and npm/pnpm (for frontend development)
- Docker (optional, for containerized deployment)

## Installation

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rust-gallery.git
   cd rust-gallery
   ```

2. Build the Rust backend:
   ```bash
   cargo build --release
   ```

3. Set up the database (migrations will run automatically on first start):
   ```bash
   # No manual steps needed
   ```

4. Build and run the frontend:
   ```bash
   cd src-ui
   pnpm install
   pnpm start
   ```

5. Run the backend application:
   ```bash
   cargo run --release
   ```

6. Access the gallery at `http://localhost:3000` (frontend) which connects to `http://localhost:8000` (backend API)

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t rust-gallery .
   ```

2. Run the container:
   ```bash
   docker run -p 8000:8000 -v /path/to/images:/build/images rust-gallery
   ```

3. Access the gallery at `http://localhost:8000`

## Configuration

### Rocket.toml

The backend application is configured through a `Rocket.toml` file with the following structure:

```toml
["default"]
address = "0.0.0.0"
port = 8000
workers = 16
keep_alive = 5
log_level = "normal"

["default".databases]
sqlite_db = { url = "db.sqlite" }

["default".limits]
forms = "64 kB"
json = "1 MiB"
```

### Environment Variables

You can also configure the application using environment variables:

- `ROCKET_ADDRESS`: Server address (default: 0.0.0.0)
- `ROCKET_PORT`: Server port (default: 8000)
- `ROCKET_WORKERS`: Number of worker threads (default: 16)
- `ROCKET_LOG_LEVEL`: Logging level (default: normal)
- `DATABASE_URL`: SQLite database path (default: db.sqlite)
- `REACT_APP_API_URL` Backend API URL for frontend (default: http://localhost:8000)

## Usage

### Image Management

1. **View Albums**: Navigate to the main page to browse all photo albums
2. **Browse Images**: Click on any album to view its contents
3. **Full Screen View**: Click on any thumbnail to open the full-screen viewer
4. **Download Images**: Use the download button in the viewer to save images
5. **Tag Images/Albums**: Use the tag button to add or edit image or album tags
6. **Filter by Tags**: Click on tags to filter content by specific tags
7. **Manage Roots**: Use the roots filter to organize content by source directories

### Cache Management

1. **View Cache Statistics**: Use the "Manage Cache" button to see cache usage
2. **Clear Cache**: Clear the thumbnail cache if needed
3. **Configure Cache Size**: Adjust the maximum number of thumbnails to cache
4. **Performance Monitoring**: Monitor thumbnail loading performance with visual indicators

### Keyboard Shortcuts

- **Arrow Keys**: Navigate between images
- **Esc**: Exit full-screen view
- **Space**: Play/pause slideshow
- **Z**: Toggle zoom

## Performance Optimization

The gallery is optimized for performance in several ways:

1. **Efficient Image Loading**: Images are loaded progressively and only when needed
2. **Client-side Caching**: Thumbnails are cached in the browser's localStorage
3. **Preloading Strategy**: Next images in a slideshow are preloaded in advance
4. **WebP Support**: Modern image format support reduces bandwidth usage
5. **Server-side Caching**: Uses Moka for high-performance in-memory caching
6. **Lazy Loading**: Only loads images as they come into view
7. **Responsive Images**: Multiple image sizes for different device capabilities
8. **Optimized Asset Delivery**: Static assets are properly compressed and cached

## Project Structure

```
rust-gallery/
│ ─ src/                # Rust backend source code
│ │ ─ main.rs        # Application entry point
│ │ ─ models/        # Database models
│ │ ─ handlers/      # API route handlers
│ ┌ ─ cache_files.rs # Server-side caching logic
│ ─ migrations/        # Database migrations

│ ─ src-ui/            # React frontend code
│ │ ─ src/
│ │ │ ─ components/  # React components
│ │ │ ─ hooks/       # Custom React hooks
│ │ │ ─ services/    # API service functions
│ │ │ ─ utils/        # Utility functions including imageCacheUtils.ts
│ │ ┌ ─ pages/       # Page components
│ │ ─ public/        # Static assets
│ ┌ ─ package.json   # Node.js dependencies
│ ─ Cargo.toml         # Rust dependencies
│ ─ Dockerfile         # Docker configuration
┌ ─ README.md          # This file
```

## API Endpoints

The application provides the following REST API endpoints:

- `GET /folders`: List all folders/albums
- `GET /folders/roots`: List all root directories
- `GET /folders/json`: Get folders in JSON format with filtering options
- `GET /files/json`: Get files in a folder in JSON format
- `GET /files/random/json`: Get random files from a folder
- `GET /folders/thumbnail/folder/download`: Get a thumbnail for a specific file
- `POST /index`: Trigger photo indexation
- `GET /tags`: List all tags
- `POST /tags/assign`: Assign tags to an image
- `POST /tags/assign/folder`: Assign tags to a folder

## Development

### Frontend Development

The frontend uses React with TypeScript and Tailwind CSS.

To modify the frontend:

1. Navigate to the `src-ui` directory
2. Make changes to the React components or styles
3. Run the development server:
   ```bash
   pnpm start
   ```
4. The app will automatically reload as you make c