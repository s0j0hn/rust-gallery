# Variables
IMAGE_NAME := s0j0hn/photo-album-portal
VERSION := $(shell node -p "require('./package.json').version")
PLATFORMS := linux/amd64,linux/arm64
CONTAINER_NAME := photo-album-portal
LOCAL_PORT := 8080

# Colors for terminal output
COLOR_RESET := \033[0m
COLOR_GREEN := \033[1;32m
COLOR_YELLOW := \033[1;33m
COLOR_CYAN := \033[1;36m

# Default target (help)
.PHONY: help
help:
	@echo "$(COLOR_CYAN)Photo Album Portal - Docker Build Commands$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_YELLOW)Usage:$(COLOR_RESET)"
	@echo "  make [target]"
	@echo ""
	@echo "$(COLOR_YELLOW)Available targets:$(COLOR_RESET)"
	@echo "  $(COLOR_GREEN)build$(COLOR_RESET)              - Build the Docker image locally"
	@echo "  $(COLOR_GREEN)build-multi$(COLOR_RESET)        - Build multi-platform Docker image"
	@echo "  $(COLOR_GREEN)run$(COLOR_RESET)                - Run the Docker container locally on port $(LOCAL_PORT)"
	@echo "  $(COLOR_GREEN)stop$(COLOR_RESET)               - Stop the running container"
	@echo "  $(COLOR_GREEN)login$(COLOR_RESET)              - Login to Docker Hub (required before push)"
	@echo "  $(COLOR_GREEN)push$(COLOR_RESET)               - Push image to Docker Hub"
	@echo "  $(COLOR_GREEN)deploy$(COLOR_RESET)             - Build and push image to Docker Hub"
	@echo "  $(COLOR_GREEN)deploy-multi$(COLOR_RESET)       - Build and push multi-platform image to Docker Hub"
	@echo "  $(COLOR_GREEN)compose-up$(COLOR_RESET)         - Run using docker-compose"
	@echo "  $(COLOR_GREEN)compose-down$(COLOR_RESET)       - Stop docker-compose services"
	@echo "  $(COLOR_GREEN)clean$(COLOR_RESET)              - Remove local container and image"
	@echo ""
	@echo "$(COLOR_YELLOW)Example:$(COLOR_RESET)"
	@echo "  make build run"
	@echo "  make deploy-multi"

# Build the Docker image
.PHONY: build
build:
	@echo "$(COLOR_CYAN)Building Docker image: $(IMAGE_NAME):$(VERSION)$(COLOR_RESET)"
	docker build -t $(IMAGE_NAME):$(VERSION) -t $(IMAGE_NAME):latest .
	@echo "$(COLOR_GREEN)✓ Build complete!$(COLOR_RESET)"

# Run the container locally
.PHONY: run
run:
	@echo "$(COLOR_CYAN)Running container on http://localhost:$(LOCAL_PORT)$(COLOR_RESET)"
	docker run --name $(CONTAINER_NAME) -d -p $(LOCAL_PORT):80 --rm $(IMAGE_NAME):latest
	@echo "$(COLOR_GREEN)✓ Container started!$(COLOR_RESET)"

# Stop the running container
.PHONY: stop
stop:
	@echo "$(COLOR_CYAN)Stopping container$(COLOR_RESET)"
	-docker stop $(CONTAINER_NAME)
	@echo "$(COLOR_GREEN)✓ Container stopped!$(COLOR_RESET)"

# Login to Docker Hub
.PHONY: login
login:
	@echo "$(COLOR_CYAN)Logging in to Docker Hub...$(COLOR_RESET)"
	docker login
	@echo "$(COLOR_GREEN)✓ Login successful!$(COLOR_RESET)"

# Push to Docker Hub
.PHONY: push
push:
	@echo "$(COLOR_CYAN)Pushing image to Docker Hub...$(COLOR_RESET)"
	docker push $(IMAGE_NAME):$(VERSION)
	docker push $(IMAGE_NAME):latest
	@echo "$(COLOR_GREEN)✓ Push complete!$(COLOR_RESET)"

# Build and push to Docker Hub
.PHONY: deploy
deploy: build login push
	@echo "$(COLOR_GREEN)✓ Deployment complete!$(COLOR_RESET)"

# Setup buildx builder for multi-platform builds
.PHONY: setup-buildx
setup-buildx:
	@echo "$(COLOR_CYAN)Setting up Docker Buildx...$(COLOR_RESET)"
	-docker buildx create --use --name multi-platform-builder --platform $(PLATFORMS)
	docker buildx inspect --bootstrap
	@echo "$(COLOR_GREEN)✓ Buildx setup complete!$(COLOR_RESET)"

# Build multi-platform image
.PHONY: build-multi
build-multi: setup-buildx
	@echo "$(COLOR_CYAN)Building multi-platform image...$(COLOR_RESET)"
	docker buildx build \
		--platform $(PLATFORMS) \
		--tag $(IMAGE_NAME):$(VERSION) \
		--tag $(IMAGE_NAME):latest \
		--load \
		.
	@echo "$(COLOR_GREEN)✓ Multi-platform build complete!$(COLOR_RESET)"

# Build and push multi-platform image
.PHONY: deploy-multi
deploy-multi: login setup-buildx
	@echo "$(COLOR_CYAN)Building and pushing multi-platform image...$(COLOR_RESET)"
	docker buildx build \
		--platform $(PLATFORMS) \
		--tag $(IMAGE_NAME):$(VERSION) \
		--tag $(IMAGE_NAME):latest \
		--push \
		.
	@echo "$(COLOR_GREEN)✓ Multi-platform deployment complete!$(COLOR_RESET)"

# Clean up containers and images
.PHONY: clean
clean: stop
	@echo "$(COLOR_CYAN)Removing images...$(COLOR_RESET)"
	-docker rmi $(IMAGE_NAME):$(VERSION) $(IMAGE_NAME):latest
	@echo "$(COLOR_GREEN)✓ Cleanup complete!$(COLOR_RESET)"
