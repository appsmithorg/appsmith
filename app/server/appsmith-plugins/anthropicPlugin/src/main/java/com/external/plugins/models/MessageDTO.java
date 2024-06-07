package com.external.plugins.models;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * This DTO is being used as a response body for Anthropic messages API
 */
@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class MessageDTO {
    private List<ContentItem> content;
    private String id;
    private String model;
    private String role;
    private String stopReason;
    private Integer stopSequence;
    private String type;
    private Map<String, Integer> usage;

    @Data
    public static class ContentItem {
        private String text;
        private String type;
    }

    public String getFirstMessage() {
        if (content == null || content.isEmpty()) {
            return null;
        }
        return content.get(0).getText();
    }
}
