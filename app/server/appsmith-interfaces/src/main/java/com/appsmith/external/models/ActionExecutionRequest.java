package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.http.HttpMethod;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ActionExecutionRequest {
    String actionId;
    Instant requestedAt;
    @JsonView(Views.Internal.class)
    String query; // Only used for analytics. Not to be returned back to the client.
    Object body;
    Object headers;
    HttpMethod httpMethod;
    String url;
    @JsonView(Views.Internal.class)
    Map<String, ?> properties; // Only used for analytics. Not to be returned back to the client.
    List<String> executionParameters;
    Object requestParams;
}
