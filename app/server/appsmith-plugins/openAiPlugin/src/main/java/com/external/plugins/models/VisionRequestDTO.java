package com.external.plugins.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VisionRequestDTO extends OpenAIRequestDTO {
    /**
     * a decimal number between 0 and 2 inclusive
     */
    Float temperature;
    /**
     * output token cap for this request, sent as max_completion_tokens; the older max_tokens
     * field is rejected by reasoning models (o-series, gpt-5.*)
     */
    Integer maxCompletionTokens;

    List<VisionMessage> messages;
}
