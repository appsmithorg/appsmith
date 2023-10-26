package com.external.plugins.models;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatRequestDTO extends OpenAIRequestDTO {

    List<ChatMessage> messages;
}
