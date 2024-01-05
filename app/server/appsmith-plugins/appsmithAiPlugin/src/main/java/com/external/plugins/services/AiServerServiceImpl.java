package com.external.plugins.services;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.plugins.dtos.AiServerRequestDTO;
import com.external.plugins.utils.RequestUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;

import static com.external.plugins.constants.AppsmithAiErrorMessages.QUERY_FAILED_TO_EXECUTE;

@Service
public class AiServerServiceImpl implements AiServerService {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<ArrayList<String>> createDatasource(ArrayList<String> files) {
        return Mono.just(files);
    }

    @Override
    public Mono<Object> executeQuery(AiServerRequestDTO aiServerRequestDTO) {
        URI uri = RequestUtils.createQueryUri();
        return RequestUtils.makeRequest(HttpMethod.POST, uri, BodyInserters.fromValue(aiServerRequestDTO))
                .flatMap(responseEntity -> {
                    HttpStatusCode statusCode = responseEntity.getStatusCode();

                    if (HttpStatusCode.valueOf(401).isSameCodeAs(statusCode)) {
                        String errorMessage = "";
                        if (responseEntity.getBody() != null && responseEntity.getBody().length > 0) {
                            errorMessage = new String(responseEntity.getBody());
                        }
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_AUTHENTICATION_ERROR, errorMessage));
                    }

                    if (statusCode.is4xxClientError()) {
                        String errorMessage = "";
                        if (responseEntity.getBody() != null && responseEntity.getBody().length > 0) {
                            errorMessage = new String(responseEntity.getBody());
                        }
                        return Mono.error(
                                new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ERROR, errorMessage));
                    }

                    Object body;
                    try {
                        body = this.objectMapper.readValue(responseEntity.getBody(), Object.class);
                    } catch (IOException exception) {
                        body = new String(responseEntity.getBody());
                    }
                    if (!statusCode.is2xxSuccessful()) {
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR, QUERY_FAILED_TO_EXECUTE, body));
                    }
                    return Mono.just(body);
                });
    }
}
