package com.appsmith.server.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@NoArgsConstructor
public class ApprovalRequestResponseDTO {
    String id;
    String requestName;
    String message;
    Instant createdAt;
    Map<String, Object> metadata;

    public ApprovalRequestResponseDTO(
            String id, String requestName, String message, Instant createdAt, Map<String, Object> metadata) {
        this.id = id;
        this.requestName = requestName;
        this.message = message;
        this.createdAt = createdAt;
        this.metadata = metadata;
    }
}
