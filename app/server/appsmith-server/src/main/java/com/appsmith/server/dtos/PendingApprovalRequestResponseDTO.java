package com.appsmith.server.dtos;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

@Data
@NoArgsConstructor
public class PendingApprovalRequestResponseDTO extends ApprovalRequestResponseDTO {

    @Builder
    public PendingApprovalRequestResponseDTO(
            String id,
            String requestName,
            String message,
            Instant createdAt,
            Map<String, Object> metadata,
            Set<String> allowedResolutions) {
        super(id, requestName, message, createdAt, metadata);
        this.allowedResolutions = allowedResolutions;
    }

    Set<String> allowedResolutions;
}
