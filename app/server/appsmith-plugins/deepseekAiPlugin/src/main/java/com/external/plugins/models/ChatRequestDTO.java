package com.external.plugins.models;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatRequestDTO extends AIRequestDTO {

    /**
     * a decimal number between 0 and 2 inclusive
     */
    Float temperature = 1.0f;

    Float top_p = 1.0f;

    List<ChatMessage> messages;

    Float frequency_penalty = 0.0f;

    int max_tokens = 2048;

    Float presence_penalty = 0.0f;

    FormatRequestDTO response_format;

    boolean stream = false;

    //TODO : tools

}
