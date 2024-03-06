package com.appsmith.server.dtos;

import lombok.Data;

import java.util.Map;

@Data
public class AnalyticEventDTO {
    /**
     * Keep the names consistent with AnalyticsEvents
     */
    public enum Event {
        EXECUTE
    }

    public enum ResourceType {
        ACTION;
    }

    String resourceId;
    Event event;
    ResourceType resourceType;
    Map<String, Object> metadata;
}
