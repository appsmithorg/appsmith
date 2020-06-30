package com.appsmith.external.models;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.http.HttpMethod;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class ActionExecutionRequest {
    Object body;
    JsonNode headers;
    HttpMethod httpMethod;
    String url;
}
