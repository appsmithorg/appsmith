package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @JsonIgnore
    String query; // Only used for analytics. Not to be returned back to the client.
    Object body;
    Object headers;
    HttpMethod httpMethod;
    String url;
    @JsonIgnore
    Map<String, ?> properties; // Only used for analytics. Not to be returned back to the client.
    List<String> executionParameters;
    Object requestParams;
}
