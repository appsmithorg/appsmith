package com.appsmith.external.models;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.http.HttpMethod;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class ActionExecutionRequest {
    Object query;

    JsonNode headers;
    HttpMethod httpMethod;
    String url;
    List<String> executionParameters;
}
