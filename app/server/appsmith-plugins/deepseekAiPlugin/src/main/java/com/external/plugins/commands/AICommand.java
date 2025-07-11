package com.external.plugins.commands;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.models.AIRequestDTO;
import org.json.JSONObject;
import org.springframework.http.HttpMethod;

import java.net.URI;
import java.util.Map;

public interface AICommand {

    HttpMethod getTriggerHTTPMethod();

    HttpMethod getExecutionMethod();

    URI createTriggerUri(DatasourceConfiguration datasourceConfiguration);

    URI createExecutionUri(DatasourceConfiguration datasourceConfiguration);

    AIRequestDTO makeRequestBody(ActionConfiguration actionConfiguration);

    Boolean isModelCompatible(JSONObject modelJsonObject);

    Map<String, String> getModelMap(JSONObject modelJsonObject);
}
