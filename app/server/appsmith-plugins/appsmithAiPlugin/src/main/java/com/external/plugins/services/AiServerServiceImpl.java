package com.external.plugins.services;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.plugins.dtos.AiServerRequestDTO;
import com.external.plugins.utils.RequestUtils;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.ArrayList;
import java.util.Map;

import static com.external.plugins.constants.AppsmithAiErrorMessages.QUERY_FAILED_TO_EXECUTE;

public class AiServerServiceImpl implements AiServerService {
    private final Gson gson = new GsonBuilder().create();

    @Override
    public Mono<ArrayList<String>> createDatasource(ArrayList<String> files) {
        return Mono.just(files);
    }

    @Override
    public Mono<Object> executeQuery(AiServerRequestDTO aiServerRequestDTO, Map<String, String> headers) {
        URI uri = RequestUtils.createQueryUri();
        String jsonBody = gson.toJson(aiServerRequestDTO);

        return RequestUtils.makeRequest(HttpMethod.POST, uri, headers, BodyInserters.fromValue(jsonBody))
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
                    if (HttpStatusCode.valueOf(429).isSameCodeAs(statusCode)) {
                        String errorMessage = "";
                        if (responseEntity.getBody() != null && responseEntity.getBody().length > 0) {
                            errorMessage = new String(responseEntity.getBody());
                        }
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_RATE_LIMIT_ERROR, errorMessage));
                    }

                    if (statusCode.is4xxClientError()) {
                        String errorMessage = "";
                        if (responseEntity.getBody() != null && responseEntity.getBody().length > 0) {
                            errorMessage = new String(responseEntity.getBody());
                        }
                        return Mono.error(
                                new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ERROR, errorMessage));
                    }

                    Object body = gson.fromJson(new String(responseEntity.getBody()), Object.class);
                    if (!statusCode.is2xxSuccessful()) {
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR, QUERY_FAILED_TO_EXECUTE, body));
                    }
                    return Mono.just(body);
                });
    }
}
