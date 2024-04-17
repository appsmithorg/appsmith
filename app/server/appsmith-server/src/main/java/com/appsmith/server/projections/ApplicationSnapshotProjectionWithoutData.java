package com.appsmith.server.projections;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ApplicationSnapshotProjectionWithoutData {
    String applicationId;
    int chunkOrder;
    Instant updatedAt;
    Instant createdAt;
}
