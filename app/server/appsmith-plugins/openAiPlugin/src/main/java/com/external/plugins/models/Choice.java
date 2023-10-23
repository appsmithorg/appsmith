package com.external.plugins.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Choice {

    Integer index;

    ChatMessage message;

    String finish_reason;
}
