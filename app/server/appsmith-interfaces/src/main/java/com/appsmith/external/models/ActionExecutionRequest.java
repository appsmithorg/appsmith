package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.http.HttpMethod;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ActionExecutionRequest {
    String query;
    Object body;
    Object headers;
    HttpMethod httpMethod;
    String url;
    Map<String, ?> properties;
    List<String> executionParameters;
}
