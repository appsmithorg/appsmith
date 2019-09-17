package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.ResourceConfiguration;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class RestApiPlugin extends BasePlugin {

    public RestApiPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RestApiPluginExecutor implements PluginExecutor {

        @Override
        public Flux<Object> execute(ResourceConfiguration resourceConfiguration,
                                    ActionConfiguration actionConfiguration,
                                    List<Param> params) {
            JSONObject requestBody = actionConfiguration.getBody();
            if(requestBody == null) {
                requestBody = new JSONObject();
            }
            Map<String, Param> propertyMap = params.stream()
                    .collect(Collectors.toMap(Param::getKey, param -> param));

            String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
            String url = resourceConfiguration.getUrl() + path;
            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            if(httpMethod == null) {
                return Flux.error(new Exception("HttpMethod must not be null"));
            }

            log.debug("Going to make a RestApi call to url: {}, httpMethod: {}", url, httpMethod);

            WebClient webClient = WebClient.builder()
                    .baseUrl(url)
                    .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .build();

            WebClient.RequestHeadersSpec<?> request = webClient.method(httpMethod)
                    .body(BodyInserters.fromObject(requestBody));

            Mono<ClientResponse> responseMono = request.exchange();
            return responseMono.flatMapMany(response -> {
                log.debug("Got response: {}", response);
                List<String> contentTypes = response.headers().header(HttpHeaders.CONTENT_TYPE);
                Class clazz = String.class;
                if (contentTypes != null && contentTypes.size() > 0) {
                    String contentType = contentTypes.get(0);
                    boolean isJson = MediaType.APPLICATION_JSON_UTF8_VALUE.toLowerCase()
                            .equals(contentType.toLowerCase()
                                    .replaceAll("\\s", ""))
                            || MediaType.APPLICATION_JSON_VALUE.equals(contentType.toLowerCase());

                    if (isJson) {
                        clazz = JSONObject.class;
                    }
                }
                return response.bodyToFlux(clazz);
            });
        }
    }
}
