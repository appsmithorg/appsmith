package com.external.plugins.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class VisionRequestDTO extends OpenAIRequestDTO {
    /**
     * a decimal number between 0 and 2 inclusive
     */
    Float temperature;
    /**
     * maximum tokens to use for this request
     */
    @JsonProperty(value = "max_tokens")
    Integer maxTokens;

    List<VisionMessage> messages;
}
