package com.appsmith.external.models;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class ActionExecutionResult {

    String statusCode;
    JsonNode headers;
    Object body;
    Boolean isExecutionSuccess = false;

    // We also return the specific body and headers for the request
    // Makes it easier for the user to debug and fix their issues on the client
    Object requestBody;
    JsonNode requestHeaders;
}
