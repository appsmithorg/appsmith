package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.models.GoogleAIRequestDTO;
import org.springframework.http.HttpMethod;

import java.net.URI;

public interface GoogleAICommand {
    HttpMethod getTriggerHTTPMethod();

    HttpMethod getExecutionMethod();

    URI createTriggerUri();

    URI createExecutionUri(ActionConfiguration actionConfiguration);

    GoogleAIRequestDTO makeRequestBody(ActionConfiguration actionConfiguration);

    void validateRequest(ActionConfiguration actionConfiguration);
}
