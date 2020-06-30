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

    ActionExecutionRequest request;

}
