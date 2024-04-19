package com.appsmith.server.projections;

public record CustomSnapshotProjection(String applicationId, Integer chunkOrder, Long createdAt, Long updatedAt) {}
