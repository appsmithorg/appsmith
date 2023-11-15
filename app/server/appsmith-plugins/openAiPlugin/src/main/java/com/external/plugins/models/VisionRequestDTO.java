package com.external.plugins.models;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class VisionRequestDTO extends OpenAIRequestDTO {
    /**
     * a decimal number between 0 and 2 inclusive
     */
    Float temperature;
    /**
     * maximum tokens to use for this request
     */
    Integer maxTokens;

    List<VisionMessage> messages;
}
