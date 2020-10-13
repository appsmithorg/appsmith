package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHost;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.Response;
import org.elasticsearch.client.RestClient;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;

public class ElasticSearchPlugin extends BasePlugin {

    public ElasticSearchPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class ElasticSearchPluginExecutor implements PluginExecutor<RestClient> {

        @Override
        public Mono<ActionExecutionResult> execute(RestClient client,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            ActionExecutionResult result = new ActionExecutionResult();

            final String body = actionConfiguration.getBody();
            final HashMap<String, Object> configBody;
            try {
                configBody = objectMapper.readValue(body, HashMap.class);
            } catch (IOException e) {
                return Mono.error(e);
            }

            Request request = new Request(
                    configBody.get("method").toString().toUpperCase(),
                    configBody.get("path").toString()
            );

            if (configBody.get("body") != null) {
                try {
                    request.setJsonEntity(objectMapper.writeValueAsString(configBody.get("body")));
                } catch (JsonProcessingException e) {
                    return Mono.error(e);
                }
            }

            final Response response;
            try {
                response = client.performRequest(request);
            } catch (IOException e) {
                return Mono.error(e);
            }

            final String responseBody;
            try {
                responseBody = new String(response.getEntity().getContent().readAllBytes());
            } catch (IOException e) {
                return Mono.error(e);
            }

            try {
                result.setBody(objectMapper.readValue(responseBody, HashMap.class));
            } catch (IOException e) {
                return Mono.error(e);
            }

            result.setIsExecutionSuccess(true);
            return Mono.just(result);
        }

        @Override
        public Mono<RestClient> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            final List<HttpHost> hosts = new ArrayList<>();

            for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                hosts.add(new HttpHost(endpoint.getHost(), endpoint.getPort().intValue(), "http"));
            }

            return Mono.just(RestClient.builder(hosts.toArray(new HttpHost[]{})).build());
        }

        @Override
        public void datasourceDestroy(RestClient client) {
            try {
                client.close();
            } catch (IOException e) {
                log.warn("Error closing connection to ElasticSearch.", e);
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }
    }
}
