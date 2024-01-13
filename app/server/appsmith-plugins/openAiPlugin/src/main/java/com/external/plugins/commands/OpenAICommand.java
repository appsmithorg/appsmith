package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.models.OpenAIRequestDTO;
import org.json.JSONObject;
import org.springframework.http.HttpMethod;

import java.net.URI;
import java.util.Map;

public interface OpenAICommand {

    HttpMethod getTriggerHTTPMethod();

    HttpMethod getExecutionMethod();

    URI createTriggerUri();

    URI createExecutionUri();

    OpenAIRequestDTO makeRequestBody(ActionConfiguration actionConfiguration);

    Boolean isModelCompatible(JSONObject modelJsonObject);

    Map<String, String> getModelMap(JSONObject modelJsonObject);
}
