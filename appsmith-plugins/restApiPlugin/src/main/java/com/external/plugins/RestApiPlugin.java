package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.ResourceConfiguration;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class RestApiPlugin extends BasePlugin {

    private static ObjectMapper objectMapper;

    public RestApiPlugin(PluginWrapper wrapper) {
        super(wrapper);
        this.objectMapper = new ObjectMapper();
    }

    @Slf4j
    @Extension
    public static class RestApiPluginExecutor implements PluginExecutor {

        @Override
        public Mono<ActionExecutionResult> execute(Object connection,
                                                   ResourceConfiguration resourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            Map<String, Object> requestBody = actionConfiguration.getBody();
            if (requestBody == null) {
                requestBody = (Map<String, Object>) new HashMap<String, Object>();
            }

            String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
            String url = resourceConfiguration.getUrl() + path;

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            if (httpMethod == null) {
                return Mono.error(new Exception("HttpMethod must not be null"));
            }

            WebClient.Builder webClientBuilder = WebClient.builder().baseUrl(url);

            if (resourceConfiguration.getHeaders() != null) {
                List<Property> headers = resourceConfiguration.getHeaders();
                for (Property header : headers) {

                    webClientBuilder.defaultHeader(header.getKey(), header.getValue());
                }
            }

            if (actionConfiguration.getHeaders() != null) {
                List<Property> headers = actionConfiguration.getHeaders();
                for (Property header : headers) {
                    webClientBuilder.defaultHeader(header.getKey(), header.getValue());
                }
            }

            return webClientBuilder
                    .build()
                    .method(httpMethod)
                    .body(BodyInserters.fromObject(requestBody))
                    .exchange()
                    .flatMap(clientResponse -> clientResponse.toEntity(String.class))
                    .map(stringResponseEntity -> {
                        /**TODO
                         * Handle XML response. Currently we only handle JSON responses.
                         */
                        HttpHeaders headers = stringResponseEntity.getHeaders();
                        String body = stringResponseEntity.getBody();
                        HttpStatus statusCode = stringResponseEntity.getStatusCode();

                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setStatusCode(statusCode.toString());
                        try {
                            if (body!=null) {
                                result.setBody(objectMapper.readTree(body));
                            }
                            if (headers != null) {
                                String headerInJsonString = objectMapper.writeValueAsString(headers);
                                result.setHeaders(objectMapper.readTree(headerInJsonString));
                            }
                        } catch (IOException e) {
                            e.printStackTrace();
                        }

                        return result;
                    });
        }

        @Override
        public Object resourceCreate(ResourceConfiguration resourceConfiguration) {
            return null;
        }

        @Override
        public void resourceDestroy(Object connection) {

        }
    }
}
