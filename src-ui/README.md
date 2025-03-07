# Photo Album Portal

<div align="center">
  <img src="https://via.placeholder.com/150?text=Photo+Album" alt="Photo Album Portal Logo" width="150"/>
  <h3 align="center">A modern, responsive photo album management application</h3>

  <p align="center">
    Browse, organize, and view your photo collections with an intuitive interface
    <br />
    Built with React, TypeScript, and PhotoSwipe
    <br />
    <br />
    <a href="#live-demo">View Demo</a>
    ·
    <a href="#installation">Installation</a>
    ·
    <a href="#features">Features</a>
  </p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-blue" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-4.9.x-blue" alt="TypeScript 4.9" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.x-blue" alt="Tailwind CSS 3" />
  <img src="https://img.shields.io/badge/PhotoSwipe-5.x-green" alt="PhotoSwipe 5" />
  <img src="https://img.shields.io/badge/Docker-Ready-blue" alt="Docker Ready" />
  <img src="https://img.shields.io/badge/Mobile-Optimized-orange" alt="Mobile Optimized" />
</p>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Live Demo](#live-demo)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Development Setup](#development-setup)
    - [Production Build](#production-build)
- [Docker Support](#docker-support)
    - [Development with Docker](#development-with-docker)
    - [Production Deployment](#production-deployment)
    - [Docker Hub Integration](#docker-hub-integration)
- [Project Structure](#project-structure)
- [Mobile Optimization](#mobile-optimization)
- [Backend Integration](#backend-integration)
- [Contributing](#contributing)
- [License](#license)

## 🔍 Overview

Photo Album Portal is a modern web application designed for browsing and organizing photo collections. It provides an intuitive interface for viewing albums, managing tags, and enjoying high-quality image viewing experiences. The application is fully responsive and optimized for both desktop and mobile devices.

## ✨ Features

- **Album Organization**
    - Browse albums organized by folders
    - View album details with thumbnails and metadata
    - Filter and search across your photo collection

- **Advanced Photo Viewing**
    - Full-screen photo viewing with PhotoSwipe integration
    - Touch-optimized gestures for zoom, pan, and navigation
    - Slideshow functionality with customizable controls

- **Tag Management**
    - Add, remove, and organize tags for albums
    - Filter photos by tags across your collection
    - Quick navigation through tag-based organization

- **Mobile Experience**
    - Responsive design adapts to all screen sizes
    - Touch-optimized controls and larger tap targets
    - Bottom navigation for one-handed mobile use
    - Swipe gestures for natural photo browsing

- **Additional Features**
    - Random photo viewer for rediscovering memories
    - Animated thumbnail slideshows for album previews
    - Real-time search and filtering
    - Performance optimizations for fast loading

## 📸 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Album+List+View" alt="Album List" width="80%"/>
  <p><em>Album List View</em></p>

  <img src="https://via.placeholder.com/800x450?text=Photo+Gallery+View" alt="Photo Gallery" width="80%"/>
  <p><em>Photo Gallery with PhotoSwipe Integration</em></p>

  <img src="https://via.placeholder.com/350x700?text=Mobile+View" alt="Mobile Experience" width="40%"/>
  <p><em>Mobile-Optimized Experience</em></p>
</div>

## 🌐 Live Demo

*A live demo will be available soon*

## 💻 Technology Stack

- **Frontend Framework**
    - React 18
    - TypeScript 4.9
    - Tailwind CSS 3.x

- **Libraries**
    - PhotoSwipe 5.x (enhanced photo viewing)
    - react-photoswipe-gallery (React wrapper for PhotoSwipe)
    - Lucide Icons (modern icon library)

- **Development Tools**
    - Create React App with TypeScript template
    - ESLint & Prettier for code quality
    - Jest & React Testing Library for testing

- **DevOps & Deployment**
    - Docker for containerization
    - Nginx for serving static assets
    - GitHub Actions for CI/CD

## 🚀 Installation

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Docker (optional, for container-based development)

### Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/photo-album-portal.git
   cd photo-album-portal
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

1. Create a production build
   ```bash
   npm run build
   ```

2. The build files will be in the `build` directory

## 🐳 Docker Support

This project includes Docker support for easy deployment and containerization.

### Development with Docker

```bash
# Build and run with Docker directly
docker build -t s0j0hn/photo-album-portal:dev .
docker run -p 8080:80 s0j0hn/photo-album-portal:dev

# OR using docker-compose
docker-compose up
```

The application will be available at http://localhost:8080

### Production Deployment

For production deployment, the following files are provided:

- `Dockerfile` - Multi-stage build for creating a production-optimized image
- `nginx.conf` - Nginx configuration for serving the React application
- `.dockerignore` - Excludes unnecessary files from the Docker build
- `docker-compose.yml` - Compose configuration for local testing

### Docker Hub Integration

A Makefile is provided for building and deploying the Docker image:

```bash
# Display available commands
make

# Build the image locally
make build

# Run the image locally
make run

# Build and push to Docker Hub (single platform)
make deploy

# Build and push multi-platform image (amd64 and arm64)
make deploy-multi

# Use docker-compose
make compose-up
make compose-down
```

The Makefile provides targets for:
- Building single or multi-platform images
- Running containers locally
- Pushing to Docker Hub
- Cleaning up resources
- Working with docker-compose

### Pulling from Docker Hub

Once pushed, you can pull the image from any Docker-compatible system:

```bash
docker pull s0j0hn/photo-album-portal:latest
```

## 📁 Project Structure

```
photo-album-portal/
├── public/                 # Static files
├── src/                    # Source files
│   ├── App.tsx             # Main application component
│   ├── components/         # Reusable components
│   │   ├── PhotoSwipeGallery.tsx  # Gallery component with PhotoSwipe
│   │   ├── MobilePhotoSwipeGallery.tsx  # Mobile-optimized gallery
│   │   ├── AlbumCard.tsx   # Album display component
│   │   ├── ThumbnailSlideshow.tsx # Album preview component
│   │   ├── RandomPhotoView.tsx    # Random photo viewer
│   │   └── MobileNavigation.tsx   # Mobile bottom navigation
│   ├── hooks/              # Custom React hooks
│   │   └── useMobile.ts    # Hook to detect mobile devices
│   ├── index.tsx           # Entry point
│   ├── reportWebVitals.ts  # Performance monitoring
│   └── styles/             # CSS styles
│       └── globals.css     # Global styles including Tailwind imports
├── .github/                # GitHub workflows
│   └── workflows/
│       └── docker-publish.yml  # Automated Docker build & publish
├── docker/                 # Docker-related files
│   └── nginx.conf          # Nginx configuration
├── .dockerignore           # Docker ignore file
├── .gitignore              # Git ignore file
├── Dockerfile              # Docker build instructions
├── docker-compose.yml      # Docker Compose configuration
├── Makefile                # Build and deployment commands
├── package.json            # Dependencies and scripts
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 📱 Mobile Optimization

The application is fully optimized for mobile devices:

- **Responsive Design**: Adapts layout to any screen size
- **Touch Controls**: Larger touch targets (44×44px minimum)
- **Mobile Navigation**: Fixed bottom navigation for easy thumb access
- **Gesture Support**: Swipe gestures for natural interaction
- **Performance**: Optimized loading and rendering for mobile devices

## 🔌 Backend Integration

The application is designed to connect with a backend API:

1. **API Endpoints**
    - `/api/albums`: Get all albums or a specific album
    - `/api/photos`: Get photos with optional filtering
    - `/api/tags`: Manage photo and album tags

2. **Integration Points**
    - The `fetchAlbums()`, `fetchPhotos()`, and `fetchPhotosByTag()` functions are designed to be replaced with real API calls
    - All data manipulation functions are prepared for backend integration

To connect your own backend:
1. Update the API utility functions in the application
2. Ensure your backend provides the expected data structure
3. Add authentication if needed

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <p>
    Developed with ❤️ by Your Team
  </p>
</div>