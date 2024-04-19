package com.appsmith.server.projections;

import com.appsmith.server.helpers.DateUtils;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

public record ApplicationSnapshotResponseDTO(
        @JsonIgnore String id, int chunkOrder, @JsonIgnore Instant updatedAt, @JsonIgnore Instant createdAt) {

    public ApplicationSnapshotResponseDTO() {
        this(null, 0, null, null);
    }

    @JsonInclude
    public boolean isNew() {
        return id == null;
    }

    @JsonInclude
    public String getUpdatedTime() {
        return updatedAt == null ? null : DateUtils.ISO_FORMATTER.format(updatedAt);
    }

    // Likely not used by the client. Verify and remove if not needed.
    @JsonInclude
    public List<?> getUserPermissions() {
        return Collections.emptyList();
    }
}
