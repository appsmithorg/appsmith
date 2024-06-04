package com.appsmith.server.projections;

import com.appsmith.server.helpers.DateUtils;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

public record ApplicationSnapshotResponseDTO(@JsonIgnore Instant updatedAt) {
    @JsonInclude
    public String getUpdatedTime() {
        return updatedAt == null ? null : DateUtils.ISO_FORMATTER.format(updatedAt);
    }
}
