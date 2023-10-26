package com.external.plugins.models;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatRequestDTO extends OpenAIRequestDTO {

    /**
     * a decimal number between 0 and 2 inclusive
     */
    Float temperature;

    List<ChatMessage> messages;
}
