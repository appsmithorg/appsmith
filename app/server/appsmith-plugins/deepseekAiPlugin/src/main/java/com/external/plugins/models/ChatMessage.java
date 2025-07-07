package com.external.plugins.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessage {

    Role role;

    String content;
}
