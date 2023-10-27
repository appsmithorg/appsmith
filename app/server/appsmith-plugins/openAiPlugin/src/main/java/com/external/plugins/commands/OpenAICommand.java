package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.models.OpenAIRequestDTO;
import org.json.JSONObject;
import org.springframework.http.HttpMethod;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Map;

public interface OpenAICommand {

    Mono<List<Map<String, String>>> trigger(DatasourceConfiguration datasourceConfiguration);

    HttpMethod getTriggerHTTPMethod();

    HttpMethod getExecutionMethod();

    URI createTriggerUri();

    URI createExecutionUri();

    OpenAIRequestDTO makeRequestBody(ActionConfiguration actionConfiguration);

    Boolean isModelCompatible(JSONObject modelJsonObject);

    Map<String, String> getModelMap(JSONObject modelJsonObject);
}
