package com.appsmith.external.models;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class ActionExecutionResult {

    String statusCode;
    JsonNode headers;
    Object body;
    Boolean isExecutionSuccess = false;

    /*
     * - To return useful hints to the user.
     * - E.g. if sql query result has identical columns
     */
    Set<String> messages;

    ActionExecutionRequest request;

}
