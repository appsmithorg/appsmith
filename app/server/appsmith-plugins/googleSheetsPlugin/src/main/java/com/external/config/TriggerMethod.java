package com.external.config;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.reactive.function.client.WebClient;

public interface TriggerMethod {

    boolean validateTriggerMethodRequest(MethodConfig methodConfig);

    WebClient.RequestHeadersSpec<?> getTriggerClient(WebClient webClient, MethodConfig methodConfig);

    JsonNode transformTriggerResponse(JsonNode response, MethodConfig methodConfig);
}
