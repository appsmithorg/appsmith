## Goal
- Build appsmith-ce image support multiple architecture (amd64 & arm64)

## Setup Build Environment
- Follow docker buildx guide to setup buildx environment [https://docs.docker.com/buildx/working-with-buildx/](https://docs.docker.com/buildx/working-with-buildx/)
- Command to setup buildx
```
docker buildx create --name builder --driver docker-container --use
docker buildx inspect --bootstrap
```

## Build
- Run command below to build & push multi-arch image to docker registry
```
docker buildx build --platform linux/arm64,linux/amd64 --push -t appsmith/appsmith-ce  .
```
- To read more option of `buildx build`, read more at: [https://github.com/docker/buildx/blob/master/docs/reference/buildx_build.md](https://github.com/docker/buildx/blob/master/docs/reference/buildx_build.md)
