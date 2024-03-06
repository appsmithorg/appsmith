package com.appsmith.server.dtos;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@NoArgsConstructor
public class ResolvedApprovalRequestResponseDTO extends ApprovalRequestResponseDTO {

    @Builder
    public ResolvedApprovalRequestResponseDTO(
            String id,
            String requestName,
            String message,
            Instant createdAt,
            Map<String, Object> metadata,
            String resolvedBy,
            Instant resolvedAt,
            ApprovalRequestResolutionMetadata resolution) {
        super(id, requestName, message, createdAt, metadata);
        this.resolvedBy = resolvedBy;
        this.resolvedAt = resolvedAt;
        this.resolution = resolution;
    }

    String resolvedBy;
    Instant resolvedAt;
    ApprovalRequestResolutionMetadata resolution;
}
