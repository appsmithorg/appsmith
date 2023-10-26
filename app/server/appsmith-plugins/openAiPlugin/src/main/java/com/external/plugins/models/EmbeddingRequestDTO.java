package com.external.plugins.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmbeddingRequestDTO extends OpenAIRequestDTO {

    String input;
}
