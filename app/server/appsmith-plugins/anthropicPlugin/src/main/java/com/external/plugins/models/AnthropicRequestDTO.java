package com.external.plugins.models;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Common request Body of Anthropic completion and messages API
 */
@Getter
@Setter
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class AnthropicRequestDTO {
    String model;
    // system prompt
    String system;

    @Deprecated
    String prompt;

    @Deprecated
    Integer maxTokensToSample;

    Integer maxTokens;
    List<Message> messages;
    Float temperature;
}
