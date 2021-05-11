package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String query; // Only used for analytics. Not to be returned back to the client.
    Object body;
    Object headers;
    HttpMethod httpMethod;
    String url;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    Map<String, ?> properties; // Only used for analytics. Not to be returned back to the client.
    List<String> executionParameters;
    Object requestParams;
}
