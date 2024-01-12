package com.external.plugins.pluginActions.trigger;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.external.plugins.pluginActions.PluginActionsImpl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ReactiveHttpOutputMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.util.CollectionUtils;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Objects;

import static com.external.plugins.utils.RequestUtility.makeRequest;

public class BaseWorkflowTrigger extends PluginActionsImpl implements WorkflowTrigger {

    protected final TriggerRequestDTO triggerRequestDTO;

    public BaseWorkflowTrigger(TriggerRequestDTO triggerRequestDTO) {
        this.triggerRequestDTO = triggerRequestDTO;
    }

    protected HttpHeaders getHeaders() {
        List<Property> configurationHeaders = triggerRequestDTO.getHeaders();
        HttpHeaders httpHeaders = new HttpHeaders();
        if (!CollectionUtils.isEmpty(configurationHeaders)) {
            configurationHeaders.forEach(configurationHeader ->
                    httpHeaders.add(configurationHeader.getKey(), (String) configurationHeader.getValue()));
        }
        return httpHeaders;
    }

    protected URI getExecutionUri() {
        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_UNSUPPORTED_OPERATION);
    }

    @Override
    public Mono<TriggerResultDTO> getTriggerResult() {
        return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ResponseEntity<String>> getResponse() {
        URI executionUri = getExecutionUri();
        HttpMethod httpMethod = getHttpMethod();
        HttpHeaders headers = getHeaders();
        String requestBody = getRequestBody();
        BodyInserter<?, ReactiveHttpOutputMessage> body =
                Objects.isNull(requestBody) ? BodyInserters.empty() : BodyInserters.fromValue(requestBody);
        return makeRequest(httpMethod, executionUri, headers, body);
    }
}
