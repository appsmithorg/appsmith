package com.appsmith.server.plugins;

import com.appsmith.server.services.PluginExecutor;
import com.appsmith.server.domains.Property;
import com.appsmith.server.domains.Query;
import com.appsmith.server.dtos.CommandQueryParams;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Slf4j
public class RestTemplatePluginExecutor extends PluginExecutor {

    final String PROP_URL = "url";
    final String PROP_HTTP_METHOD = "method";

    @Override
    protected Flux<Object> execute(Query query, CommandQueryParams params) {
        String requestBody = query.getCommandTemplate();
        Map<String, Property> propertyMap = query.getProperties()
                .stream()
                .collect(Collectors.toMap(Property::getKey, prop -> prop));

        String url = propertyMap.get(PROP_URL).getValue();
        String httpMethod = propertyMap.get(PROP_HTTP_METHOD).getValue();

        WebClient webClient = WebClient.builder()
                .baseUrl(url)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

        WebClient.RequestHeadersSpec<?> request = webClient.method(HttpMethod.resolve(httpMethod))
                .body(BodyInserters.fromObject(requestBody));

        Mono<ClientResponse> responseMono = request.exchange();
        ClientResponse clientResponse = responseMono.block();

        List<String> contentTypes = clientResponse.headers().header(HttpHeaders.CONTENT_TYPE);

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
        return clientResponse.bodyToFlux(clazz);
    }

    @Override
    protected void init() {
        log.debug("In the RestTemplatePluginExecutor init()");
    }

    @Override
    protected void destroy() {
        log.debug("In the RestTemplatePluginExecutor destroy()");
    }
}
