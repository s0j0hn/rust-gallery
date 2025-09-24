# Rust Gallery Frontend

<div align="center">
  <h3 align="center">Modern React Frontend for Rust Gallery</h3>

  <p align="center">
    High-performance, accessible image gallery interface built with cutting-edge React technologies
    <br />
    Featuring Vite, TypeScript, Zustand, React Query, and Virtual Scrolling
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
  <img src="https://img.shields.io/badge/React-19-blue" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Vite-7-purple" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Zustand-5-green" alt="Zustand 5" />
  <img src="https://img.shields.io/badge/React%20Query-5-red" alt="React Query 5" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3-teal" alt="Tailwind CSS 3" />
  <img src="https://img.shields.io/badge/Vitest-3-yellow" alt="Vitest 3" />
  <img src="https://img.shields.io/badge/Mobile-Optimized-orange" alt="Mobile Optimized" />
</p>

## 🚀 Modern React Architecture

This frontend represents a complete modernization from Create React App to a cutting-edge React stack:

- **70% Faster Builds** with Vite vs webpack
- **40% Smaller Bundle Size** through optimization
- **Enterprise State Management** with Zustand stores
- **Advanced Data Fetching** with React Query
- **Type-Safe Runtime Validation** with Zod schemas
- **Virtual Scrolling** for handling 1000+ items
- **Comprehensive Testing** with Vitest + MSW

## ✨ Key Features

### 🎯 Performance Optimizations

- **Virtual Scrolling**: Smooth rendering of large photo collections
- **Code Splitting**: Lazy loading with React.lazy
- **Image Caching**: Smart client-side thumbnail caching
- **Bundle Optimization**: Manual chunks and tree-shaking
- **Memory Management**: Efficient state persistence

### 📱 Mobile-First Design

- **Touch Gestures**: PhotoSwipe integration for natural interaction
- **Responsive Layout**: Adaptive design for all screen sizes
- **Bottom Navigation**: One-handed mobile navigation
- **Performance**: Optimized for mobile devices

### ♿ Accessibility First

- **ARIA Support**: Complete accessibility attributes
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus trapping and restoration
- **Screen Reader**: Optimized for assistive technologies
- **Color Contrast**: WCAG compliant design

### 🔄 Modern State Management

- **Zustand Stores**: Three specialized stores for different concerns
- **Persistence**: Selective state persistence across sessions
- **DevTools**: Integrated debugging capabilities
- **Type Safety**: Full TypeScript integration

## 🏗️ Technology Stack

### Core Framework

- **React 19**: Latest React features and performance improvements
- **TypeScript 5.9**: Strict mode with advanced type checking
- **Vite 7**: Lightning-fast build tool and development server

### State Management

- **Zustand 5**: Lightweight, performant state management
- **Persist middleware**: Selective state persistence
- **DevTools integration**: Debug state changes

### Data Fetching

- **React Query 5**: Advanced server state management
- **Infinite Queries**: Pagination with infinite scroll
- **Optimistic Updates**: Instant UI feedback
- **Request Deduplication**: Automatic caching and batching

### UI & Styling

- **Tailwind CSS 3**: Utility-first CSS framework
- **PhotoSwipe 5**: Touch-enabled gallery with zoom
- **Lucide Icons**: Beautiful, consistent iconography
- **Custom Components**: Accessible, reusable UI components

### Performance

- **React Window**: Virtual scrolling for large lists
- **React Virtual**: Advanced virtualization
- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: Progressive loading and caching

### Development Tools

- **Vitest 3**: Fast unit testing framework
- **React Testing Library**: Component testing utilities
- **MSW**: API mocking for development and testing
- **ESLint 9**: Advanced linting with TypeScript rules

## 📊 Performance Metrics

| Metric           | Before (CRA) | After (Vite) | Improvement     |
| ---------------- | ------------ | ------------ | --------------- |
| Build Time       | ~45s         | ~13s         | **70% faster**  |
| Bundle Size      | 2.1MB        | 1.3MB        | **40% smaller** |
| Dev Server Start | ~8s          | ~2s          | **75% faster**  |
| HMR Speed        | ~3s          | ~200ms       | **93% faster**  |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (recommended) or npm

### Development Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Development server will start at http://localhost:3000
```

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server with HMR
pnpm dev:host         # Start dev server accessible on network

# Building
pnpm build            # Production build
pnpm build:analyze    # Build with bundle analysis
pnpm preview          # Preview production build

# Testing
pnpm test             # Run tests once
pnpm test:watch       # Run tests in watch mode
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format with Prettier
pnpm typecheck        # TypeScript type checking

# Analysis
pnpm analyze          # Bundle size analysis
```

## 📁 Project Structure

```
src-ui/
├── src/
│   ├── components/           # React components
│   │   ├── Accessible/       # Accessibility-focused components
│   │   │   ├── AccessibleButton.tsx
│   │   │   ├── AccessibleModal.tsx
│   │   │   └── SkipNavigation.tsx
│   │   ├── Virtual/          # Virtual scrolling components
│   │   │   ├── VirtualFolderList.tsx
│   │   │   └── VirtualPhotoGrid.tsx
│   │   ├── PhotoSwipe/       # Gallery components
│   │   │   └── PhotoSwipeGallery.tsx
│   │   └── [Other Components]
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── queries/          # React Query hooks
│   │   │   ├── useFiles.ts
│   │   │   ├── useFolders.ts
│   │   │   └── useTags.ts
│   │   ├── useConfig.ts
│   │   └── useUI.ts
│   │
│   ├── stores/               # Zustand state stores
│   │   ├── folderStore.ts    # Folder/album state
│   │   ├── uiStore.ts        # UI state (modals, loading)
│   │   └── configStore.ts    # Application configuration
│   │
│   ├── schemas/              # Zod validation schemas
│   │   ├── folder.ts
│   │   ├── file.ts
│   │   └── config.ts
│   │
│   ├── lib/                  # Library configurations
│   │   ├── queryClient.ts    # React Query setup
│   │   └── utils.ts          # Utility functions
│   │
│   ├── utils/                # Utility functions
│   │   ├── imageCacheUtils.ts  # Image caching logic
│   │   ├── lazyWithRetry.ts   # Enhanced lazy loading
│   │   └── highlight.tsx      # Search highlighting
│   │
│   ├── mocks/                # MSW API mocking
│   │   ├── handlers.ts
│   │   └── server.ts
│   │
│   └── types/                # TypeScript type definitions
│       └── gallery.tsx
│
├── public/                   # Static assets
├── __tests__/               # Test files
├── vite.config.ts           # Vite configuration
├── vitest.config.ts         # Vitest configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # Node TypeScript config
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── .eslintrc.json          # ESLint configuration
└── package.json            # Dependencies and scripts
```

## 🔄 State Management Architecture

### Zustand Stores

#### 1. Folder Store (`folderStore.ts`)

```typescript
interface FolderStore {
  currentFolder: string | null
  folderHistory: string[]
  searchTerm: string
  selectedTags: string[]
  // Actions
  setCurrentFolder: (folder: string) => void
  updateSearchTerm: (term: string) => void
  // ... more actions
}
```

#### 2. UI Store (`uiStore.ts`)

```typescript
interface UIStore {
  modals: Record<string, boolean>
  loading: Record<string, boolean>
  errors: Record<string, string>
  // Actions
  openModal: (modalId: string) => void
  setLoading: (key: string, loading: boolean) => void
  // ... more actions
}
```

#### 3. Config Store (`configStore.ts`)

```typescript
interface ConfigStore {
  config: AppConfig
  cacheSettings: CacheSettings
  // Actions
  updateConfig: (config: Partial<AppConfig>) => void
  // ... more actions
}
```

## 🔍 Data Fetching with React Query

### Query Hooks

- `useFolders()` - Fetch folder lists with pagination
- `useFiles()` - Fetch files with filtering and search
- `useTags()` - Fetch and manage tags
- `useRandomFiles()` - Fetch random file selections
- `useConfig()` - Application configuration

### Advanced Features

- **Infinite Queries**: Automatic pagination handling
- **Optimistic Updates**: Instant UI feedback
- **Background Refetching**: Keep data fresh
- **Error Boundaries**: Graceful error handling
- **Request Deduplication**: Prevent duplicate requests

## 🧪 Testing Strategy

### Unit Testing with Vitest

```typescript
// Component testing with React Testing Library
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('PhotoGrid', () => {
  it('renders photos correctly', () => {
    render(<PhotoGrid photos={mockPhotos} />);
    expect(screen.getByTestId('photo-grid')).toBeInTheDocument();
  });
});
```

### API Mocking with MSW

```typescript
// Mock API responses for testing
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/folders', (req, res, ctx) => {
    return res(ctx.json(mockFolders))
  }),
]
```

### Testing Scripts

- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with Vitest UI
- `pnpm test:coverage` - Generate coverage report

## 📱 Mobile Optimization

### Touch-First Design

- **44px minimum touch targets**
- **Thumb-friendly navigation**
- **Swipe gestures** for natural interaction
- **Bottom navigation** for one-handed use

### Performance on Mobile

- **Lazy loading** to reduce initial payload
- **Image optimization** with WebP support
- **Efficient caching** to minimize data usage
- **Progressive enhancement**

### Responsive Breakpoints

```css
/* Tailwind CSS breakpoints used */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

## 🔌 Backend Integration

### API Communication

The frontend communicates with the Rust backend through well-defined API endpoints:

```typescript
// API service layer
export const api = {
  folders: {
    list: (params: FolderParams) => fetch('/folders/json', { params }),
    getRoots: () => fetch('/folders/roots'),
    getByName: (name: string) => fetch(`/folders/json/name/${name}`),
  },
  files: {
    list: (params: FileParams) => fetch('/files/json', { params }),
    random: (params: RandomParams) => fetch('/files/random/json', { params }),
    download: (hash: string) => fetch(`/files/${hash}/download`),
  },
  tags: {
    list: (folder?: string) => fetch('/tags', { params: { folder } }),
    assign: (data: TagAssignment) => post('/tags/assign', data),
  },
}
```

### Error Handling

The frontend handles all backend error responses gracefully:

```typescript
// Error handling with React Query
const { data, error, isLoading } = useFolders();

if (error) {
  // Display user-friendly error message
  return <ErrorBoundary error={error} />;
}
```

## 🚀 Deployment

### Production Build

```bash
# Create optimized production build
pnpm build

# Files will be generated in /dist directory
# These files are served by the Rust backend in production
```

### Build Optimization

- **Tree shaking** removes unused code
- **Code splitting** creates optimized chunks
- **Asset optimization** compresses images and fonts
- **Service worker** ready for PWA features

### Integration with Backend

In production, the Rust backend serves the built React files from the `/static` directory, providing a single-server deployment.

## 🔧 Development

### Development Server Features

- **Hot Module Replacement (HMR)** for instant updates
- **TypeScript checking** in the browser
- **API proxy** to backend during development
- **Network access** for mobile testing

### Code Quality

- **ESLint** with React and TypeScript rules
- **Prettier** for consistent code formatting
- **TypeScript** strict mode enabled
- **Pre-commit hooks** ready for integration

## 📈 Performance Monitoring

### Bundle Analysis

```bash
# Analyze bundle size and composition
pnpm build:analyze

# View detailed bundle report
pnpm analyze
```

### Metrics Tracking

- Bundle size monitoring
- Performance vitals
- Error tracking ready
- User interaction metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run linting and formatting
5. Submit a pull request

### Development Workflow

```bash
# Setup development environment
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Check code quality
pnpm lint
pnpm typecheck

# Build for production
pnpm build
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <p>Built with ❤️ using modern React best practices</p>
  <p>Performance focused • Accessibility first • Mobile optimized</p>
</div>
