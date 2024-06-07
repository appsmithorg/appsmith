package com.external.plugins.models;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

import static com.external.plugins.constants.AnthropicConstants.IMAGE;
import static com.external.plugins.constants.AnthropicConstants.TEXT;

/**
 * This DTO is part of request body for Anthropic messages API
 */
@Getter
@Setter
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class Message {
    String role;
    List<Content> content;

    @Getter
    @Setter
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class Content {
        public Content(String type) {
            this.type = type;
        }

        String type;
    }

    @Setter
    @Getter
    public static class TextContent extends Content {
        String text;

        public TextContent() {
            super(TEXT);
        }
    }

    @Setter
    @Getter
    public static class ImageContent extends Content {
        public ImageContent() {
            super(IMAGE);
        }

        Source source;
    }

    @Getter
    @Setter
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class Source {
        String type;
        String mediaType;
        String data;
    }
}
