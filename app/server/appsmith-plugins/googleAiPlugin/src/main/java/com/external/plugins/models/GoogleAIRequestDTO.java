package com.external.plugins.models;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class GoogleAIRequestDTO {
    List<Content> contents;

    @Data
    @AllArgsConstructor
    public static class Content {
        Role role;
        List<Part> parts;
    }

    @Data
    @AllArgsConstructor
    public static class Part {
        String text;
    }
}
