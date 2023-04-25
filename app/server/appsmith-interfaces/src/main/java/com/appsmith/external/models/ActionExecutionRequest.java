package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonView(Views.Public.class)
    String actionId;

    @JsonView(Views.Public.class)
    Instant requestedAt;

    @JsonView(Views.Internal.class)
    String query; // Only used for analytics. Not to be returned back to the client.

    @JsonView(Views.Public.class)
    Object body;

    @JsonView(Views.Public.class)
    Object headers;

    @JsonView(Views.Public.class)
    HttpMethod httpMethod;

    @JsonView(Views.Public.class)
    String url;

    @JsonView(Views.Internal.class)
    Map<String, ?> properties; // Only used for analytics. Not to be returned back to the client.

    @JsonView(Views.Public.class)
    List<String> executionParameters;

    @JsonView(Views.Public.class)
    Object requestParams;

    @JsonProperty(value = "requestedAt")
    public long getRequestedAtInEpochMilliseconds() {
        return this.requestedAt.toEpochMilli();
    }
}
