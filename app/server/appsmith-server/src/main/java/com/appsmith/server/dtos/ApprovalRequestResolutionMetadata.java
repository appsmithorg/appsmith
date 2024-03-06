package com.appsmith.server.dtos;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Builder
@Getter
public class ApprovalRequestResolutionMetadata {
    String resolution;
    Map<String, Object> metadata;
}
