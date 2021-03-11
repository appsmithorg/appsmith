package com.external.config;

import com.appsmith.external.models.Property;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * API reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/get
 */
public class InfoMethod implements Method {

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                pluginSpecifiedTemplates.get(1).getValue() /* spreadsheet Id */);

        uriBuilder.queryParam("includeGridData", Boolean.FALSE);

        return webClient.method(HttpMethod.GET)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.empty());
    }

}
