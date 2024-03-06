package com.external.plugins.pluginActions.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.exceptions.WorkflowPluginError;
import com.external.plugins.pluginActions.PluginActionsImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ReactiveHttpOutputMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.util.CollectionUtils;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Objects;

import static com.external.plugins.constants.FieldNames.DATA;
import static com.external.plugins.constants.FieldNames.ERROR;
import static com.external.plugins.constants.FieldNames.MESSAGE;
import static com.external.plugins.constants.FieldNames.RESPONSE_META;
import static com.external.plugins.utils.RequestUtility.makeRequest;

public class BaseWorkflowCommand extends PluginActionsImpl implements WorkflowCommand {

    protected final ActionConfiguration actionConfiguration;
    protected final ObjectMapper objectMapper;

    public BaseWorkflowCommand(ActionConfiguration actionConfiguration, ObjectMapper objectMapper) {
        this.actionConfiguration = actionConfiguration;
        this.objectMapper = objectMapper;
    }

    protected HttpHeaders getHeaders() {
        List<Property> configurationHeaders = actionConfiguration.getHeaders();
        HttpHeaders httpHeaders = new HttpHeaders();
        if (!CollectionUtils.isEmpty(configurationHeaders)) {
            configurationHeaders.forEach(configurationHeader ->
                    httpHeaders.add(configurationHeader.getKey(), (String) configurationHeader.getValue()));
        }
        return httpHeaders;
    }

    @Override
    public URI getExecutionUri() {
        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_UNSUPPORTED_OPERATION);
    }

    @Override
    public Mono<ResponseEntity<String>> getResponse() {
        URI executionUri = getExecutionUri();
        HttpMethod httpMethod = getHttpMethod();
        HttpHeaders headers = getHeaders();
        String requestBody = getRequestBody();
        BodyInserter<?, ReactiveHttpOutputMessage> reactiveHttpOutputMessageBodyInserter =
                Objects.isNull(requestBody) ? BodyInserters.empty() : BodyInserters.fromValue(requestBody);

        return makeRequest(httpMethod, executionUri, headers, reactiveHttpOutputMessageBodyInserter)
                .flatMap(responseEntity -> {
                    try {
                        HttpStatusCode statusCode = responseEntity.getStatusCode();
                        JsonNode responseBody = objectMapper.readTree(responseEntity.getBody());
                        if (statusCode.is2xxSuccessful()) {
                            JsonNode data = responseBody.get(DATA);
                            return Mono.just(new ResponseEntity<>(data.toString(), statusCode));
                        } else {
                            JsonNode responseMeta = responseBody.get(RESPONSE_META);
                            JsonNode error = responseMeta.get(ERROR);
                            String message = error.get(MESSAGE).asText();
                            return Mono.error(
                                    new AppsmithPluginException(WorkflowPluginError.QUERY_EXECUTION_FAILED, message));
                        }
                    } catch (JsonProcessingException e) {
                        return Mono.error(new AppsmithPluginException(
                                WorkflowPluginError.QUERY_EXECUTION_FAILED, e.getMessage()));
                    }
                });
    }
}
