package com.external.config;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * This interface defines the behaviour required to execute an action template
 * It is separated from `ExecutionMethod` so that we are able to reuse as well as
 * differentiate trigger behaviours
 */
public interface TriggerMethod {

    /**
     * Checks for whether the configuration that has been parsed from the TriggerRequestDTO
     * is valid or not
     */
    boolean validateTriggerMethodRequest(MethodConfig methodConfig);

    /**
     * Returns with the specification required to hit that particular trigger request
     */
    WebClient.RequestHeadersSpec<?> getTriggerClient(WebClient webClient, MethodConfig methodConfig);

    /**
     * Transforms the response from the end point into an Appsmith friendly structure
     */
    JsonNode transformTriggerResponse(JsonNode response, MethodConfig methodConfig);
}
