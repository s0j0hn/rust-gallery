PROJECT_NAME= rusty-images
VERSION= 0.5.4
DOCKER_REGISTRY= docker.io
DOCKER_REPO= s0j0hn/$(PROJECT_NAME)
DOCKER_TAG= $(VERSION)
DOCKER_IMG= $(DOCKER_REPO):$(DOCKER_TAG)
DOCKER_IMG_LATEST= $(DOCKER_REPO):latest

# Rust configuration
CARGO= cargo
CARGO_FLAGS= --release
RUST_LOG= info

# Docker configuration
DOCKER = docker
DOCKER_BUILD_FLAGS=
DOCKER_RUN_FLAGS= -p 8000:8000 -v $(PWD)/images:/build/images

# Default target
.PHONY: all
all: help

# Development commands
.PHONY: build
build: ## Build the Rust application
	@echo "Building Rust application..."
	$(CARGO) build $(CARGO_FLAGS)

.PHONY: run
run: ## Run the application locally
	@echo "Running Rust application..."
	RUST_LOG=$(RUST_LOG) $(CARGO) run $(CARGO_FLAGS)

.PHONY: dev
dev: ## Run the application in development mode (installs cargo-watch if needed)
	@if ! command -v cargo-watch > /dev/null; then \
		echo "Installing cargo-watch..."; \
		cargo install cargo-watch; \
	fi
	@echo "Running in development mode with hot reloading..."
	RUST_LOG=$(RUST_LOG) cargo watch -x run

.PHONY: clean
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	$(CARGO) clean
	@echo "Removing temporary files..."
	find . -name "*.rs.bk" -type f -delete
	find . -name "*.swp" -type f -delete

.PHONY: test
test: ## Run all tests
	@echo "Running tests..."
	$(CARGO) test

# Docker commands
.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "Building Docker image: $(DOCKER_IMG)"
	$(DOCKER) build --cache-from $(DOCKER_IMG) -t $(DOCKER_IMG) .
	$(DOCKER) tag $(DOCKER_IMG) $(DOCKER_IMG_LATEST)
	@echo "Successfully built $(DOCKER_IMG) and tagged as latest"

.PHONY: docker-run
docker-run: ## Run application in Docker container
	@echo "Running Docker container from image: $(DOCKER_IMG_LATEST)"
	$(DOCKER) run $(DOCKER_RUN_FLAGS) $(DOCKER_IMG_LATEST)

.PHONY: docker-push
docker-push: docker-build ## Push Docker image to registry
	@echo "Pushing Docker image to registry: $(DOCKER_IMG) and $(DOCKER_IMG_LATEST)"
	$(DOCKER) push $(DOCKER_IMG)
	$(DOCKER) push $(DOCKER_IMG_LATEST)
	@echo "Successfully pushed $(DOCKER_IMG) and latest tag"

.PHONY: docker-deploy
docker-deploy: docker-build docker-push ## Build and push Docker image (shorthand)
	@echo "Docker image built and pushed successfully"

# Database commands
.PHONY: db-setup
db-setup: ## Initialize the database
	@echo "Setting up database..."
	$(CARGO) run --bin setup_db

# Utility commands
.PHONY: help
help: ## Display this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: format
format: ## Format code using rustfmt
	@echo "Formatting code..."
	$(CARGO) fmt

.PHONY: update
update: ## Update dependencies
	@echo "Updating dependencies..."
	$(CARGO) update

.PHONY: version
version: ## Show project version
	@echo "$(PROJECT_NAME) v$(VERSION)"
	@$(CARGO) --version
	@rustc --version

# Release commands
.PHONY: release
release: clean test build ## Prepare a release (clean, test, build)
	@echo "Release v$(VERSION) prepared successfully!"

# Production deployment commands
.PHONY: prod-deploy
prod-deploy: release docker-deploy ## Full production deployment
	@echo "Production deployment completed successfully!"