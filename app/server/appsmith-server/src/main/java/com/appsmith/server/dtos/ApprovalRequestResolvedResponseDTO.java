package com.appsmith.server.dtos;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;

@Builder
@Getter
public class ApprovalRequestResolvedResponseDTO {
    String id;
    String requestName;
    String message;
    String resolution;
    Map<String, Object> metadata;
    String resolvedBy;
    Instant resolvedAt;
}
