package com.appsmith.server.projections;

public class CustomSnapshotProjection {
    public CustomSnapshotProjection(String applicationId, Integer chunkOrder, String createdAt, String updatedAt) {
        this.applicationId = applicationId;
        this.chunkOrder = chunkOrder;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    String applicationId;
    Integer chunkOrder;
    String createdAt;
    String updatedAt;
}
