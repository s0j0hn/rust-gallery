# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rust Gallery is a high-performance image gallery application built with Rust (Rocket framework) and React TypeScript. The backend uses SQLite with Diesel ORM, while the frontend features client-side thumbnail caching and modern React patterns.

## Commands

### Development
- `cargo run --release` - Run the backend server
- `cargo build --release` - Build the backend
- `cargo test` - Run Rust tests
- `cargo fmt` - Format Rust code
- `make dev` - Run with hot reloading (installs cargo-watch if needed)
- `make help` - Show all available make targets

### Frontend (in src-ui/)
- `pnpm start` - Start React development server
- `pnpm build` - Build for production (outputs to ../static)
- `pnpm test` - Run frontend tests
- `pnpm analyze` - Analyze bundle size

### Database
- Migrations run automatically on startup
- Database file: `db.sqlite` (created automatically)

### Docker
- `make docker-build` - Build Docker image
- `make docker-run` - Run in container
- `docker run -p 8000:8000 -v /path/to/images:/build/images rust-gallery`

## Architecture

### Backend Structure (src/)
- `main.rs` - Application entry point with Rocket configuration
- `handlers/` - API route handlers organized by feature:
  - `files/` - Image file operations and thumbnail generation
  - `folders/` - Album/directory management
  - `tags/` - Tagging system for images and albums
  - `configs/` - Application configuration management
  - `tasks/` - Background task management
- `models/` - Database models and repositories using Diesel ORM
- `cache_files.rs` - Server-side caching logic using Moka
- `error.rs` - Custom error types and handling

### Frontend Structure (src-ui/src/)
- `components/` - Reusable React components
- `hooks/` - Custom React hooks
- `services/` - API communication layer
- `utils/imageCacheUtils.ts` - Client-side thumbnail caching system
- `pages/` - Page-level components

### Key Features
- **Dual Caching System**: Server-side (Moka) + client-side (localStorage) for thumbnails
- **Image Processing**: WebP generation with JPEG fallbacks
- **Real-time Updates**: Interface updates automatically when filesystem changes
- **Tag Management**: Hierarchical tagging system for images and albums
- **Progressive Loading**: Efficient lazy loading and preloading strategies

### Database Schema
Uses Diesel migrations in `migrations/` directory. Key entities:
- Files (images with metadata)
- Configurations (app settings)
- File-folder relationships
- Tagging associations

### API Architecture
RESTful API with endpoints for:
- `/folders` - Album browsing and management
- `/files` - Image operations and thumbnails
- `/tags` - Tagging system
- `/configs` - Application settings
- `/index` - Filesystem indexing

### Configuration
- `Rocket.toml` - Web server configuration
- Environment variables: `ROCKET_ADDRESS`, `ROCKET_PORT`, `DATABASE_URL`
- Frontend build outputs to `static/` for embedded serving

The application serves both API endpoints and static React build from a single Rocket server.