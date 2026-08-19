package com.external.plugins.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatRequestDTO extends OpenAIRequestDTO {

    /**
     * a decimal number between 0 and 2 inclusive; null means "let OpenAI apply the model's default"
     */
    Float temperature;

    List<ChatMessage> messages;
}
