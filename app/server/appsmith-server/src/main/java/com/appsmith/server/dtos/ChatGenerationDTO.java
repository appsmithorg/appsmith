package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ChatGenerationDTO {

    @JsonProperty("user_query")
    String userQuery;

    @JsonProperty("api_context")
    Object apiContext;
}
