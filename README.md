# Rust Gallery

A high-performance image gallery application built with Rust and PhotoSwipe, designed for efficient browsing and management of image collections.

## Features

- **Fast Image Browsing**: Efficiently navigate through large image collections
- **Image Tagging**: Add and manage tags for easy categorization
- **WebP Support**: Modern image format support with fallbacks to JPEG
- **Responsive Design**: Works across desktop and mobile devices
- **Download Options**: Easily download individual images
- **Real-time Updates**: Interface updates automatically when changes occur
- **SQLite Database**: Efficient local storage with Diesel ORM integration
- **Docker Support**: Easy deployment in containerized environments

## Technology Stack

- **Backend**: Rust with Rocket framework
- **Database**: SQLite with Diesel ORM
- **Frontend**: JavaScript with PhotoSwipe library
- **Image Processing**: Rust's image crate
- **Caching**: Moka for high-performance caching

## Prerequisites

- Rust (latest stable or nightly)
- SQLite
- Node.js (for frontend development)
- Docker (optional, for containerized deployment)

## Installation

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rust-gallery.git
   cd rust-gallery
   ```

2. Build the Rust application:
   ```bash
   cargo build --release
   ```

3. Set up the database (migrations will run automatically on first start):
   ```bash
   # No manual steps needed
   ```

4. Run the application:
   ```bash
   cargo run --release
   ```

5. Access the gallery at `http://localhost:8000`

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

The application is configured through a `Rocket.toml` file with the following structure:

```toml
[default]
address = "0.0.0.0"
port = 8000
workers = 16
keep_alive = 5
log_level = "normal"

[default.databases]
sqlite_db = { url = "db.sqlite" }

[default.limits]
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

## Usage

### Image Management

1. **View Images**: Navigate to the main page to browse the image gallery
2. **Full Screen View**: Click on any thumbnail to open the full-screen viewer
3. **Download Images**: Use the download button in the viewer to save images
4. **Tag Images**: Use the tag button to add or edit image tags

### Keyboard Shortcuts

- **Arrow Keys**: Navigate between images
- **Esc**: Exit full-screen view
- **Space**: Play/pause slideshow
- **Z**: Toggle zoom

## Project Structure

```
rust-gallery/
├── src/               # Rust source code
│   ├── main.rs        # Application entry point
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   └── services/      # Business logic
├── static/            # Static assets
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   └── favicon.ico    # Favicon
├── migrations/        # Database migrations
├── templates/         # HTML templates
├── Cargo.toml         # Rust dependencies
├── Dockerfile         # Docker configuration
└── README.md          # This file
```

## API Endpoints

The application provides the following REST API endpoints:

- `GET /api/images`: List all images
- `GET /api/images/:id`: Get image details
- `POST /api/tags/assign`: Assign tags to an image
- `GET /api/tags`: List all tags

## Performance Optimization

The gallery is optimized for performance in several ways:

1. **Efficient Image Loading**: Images are loaded progressively and only when needed
2. **WebP Support**: Modern image format support reduces bandwidth usage
3. **Caching**: Uses Moka for high-performance in-memory caching
4. **Lazy Loading**: Only loads images as they come into view
5. **Optimized Asset Delivery**: Static assets are properly compressed and cached

## Development

### Frontend Development

The frontend uses PhotoSwipe for the gallery view. The main JavaScript file is `static/js/gallery.js`.

To modify the frontend:

1. Edit the JavaScript files in the `static/js/` directory
2. The styles can be found in `static/css/`
3. No build step is required; simply refresh the browser

### Backend Development

To work on the Rust backend:

1. Make changes to the Rust code in the `src/` directory
2. Run the application in development mode:
   ```bash
   cargo run
   ```
3. For hot reloading during development, use cargo-watch:
   ```bash
   cargo install cargo-watch
   cargo watch -x run
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [PhotoSwipe](https://photoswipe.com/) for the excellent gallery library
- [Rocket](https://rocket.rs/) for the Rust web framework
- [Diesel](https://diesel.rs/) for the Rust ORM

---

Created with ❤️ using Rust and modern web technologies.