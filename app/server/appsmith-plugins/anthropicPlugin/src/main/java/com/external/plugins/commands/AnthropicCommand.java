package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.models.AnthropicRequestDTO;
import org.springframework.http.HttpMethod;

import java.net.URI;

public interface AnthropicCommand {
    HttpMethod getTriggerHTTPMethod();

    HttpMethod getExecutionMethod();

    URI createTriggerUri();

    URI createExecutionUri();

    AnthropicRequestDTO makeRequestBody(ActionConfiguration actionConfiguration);
}
