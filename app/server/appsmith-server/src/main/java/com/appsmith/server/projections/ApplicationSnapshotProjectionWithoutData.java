package com.appsmith.server.projections;

import java.time.Instant;

public record ApplicationSnapshotProjectionWithoutData(
        String applicationId, Integer chunkOrder, Instant updatedAt, Instant createdAt) {}
