FROM rust:1-slim-bookworm AS build

## cargo package name: customize here or provide via --build-arg
ARG pkg=rusty-images

WORKDIR /build
RUN rustup default nightly

# Install SQLite development libraries
RUN apt-get update && apt-get install -y libsqlite3-dev

COPY . .

RUN --mount=type=cache,target=/build/target \
    --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    set -eux; \
    cargo build --release; \
    objcopy --compress-debug-sections target/release/$pkg ./main

################################################################################

FROM debian:stable-slim

WORKDIR /build

# Install runtime library for SQLite
RUN apt-get update && \
    apt-get install -y --no-install-recommends libsqlite3-0 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

## copy the main binary
COPY --from=build /build/main ./

## copy runtime assets which may or may not exist
COPY --from=build /build/Rocket.toml ./
COPY --from=build /build/static ./static
COPY --from=build /build/migrations ./migrations
#COPY --from=build /build/db.sqlite ./db.sqlite

CMD ./main