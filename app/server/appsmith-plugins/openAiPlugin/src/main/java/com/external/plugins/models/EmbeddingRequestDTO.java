package com.external.plugins.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmbeddingRequestDTO extends OpenAIRequestDTO {

    String input;

    @JsonProperty("encoding_format")
    EncodingFormat encodingFormat;
}
