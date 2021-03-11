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
import java.util.Map;

/**
 * API reference: https://developers.google.com/sheets/api/guides/migration#delete_a_sheet
 */
public class DeleteMethod implements Method {

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                pluginSpecifiedTemplates.get(1).getValue() /* spreadsheet Id */
                        + ":batchUpdate");

        uriBuilder.queryParam("valueInputOption", "USER_ENTERED");
        uriBuilder.queryParam("insertDataOption", "OVERWRITE");
        uriBuilder.queryParam("includeValuesInResponse", Boolean.TRUE);

        return webClient.method(HttpMethod.POST)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.fromValue(
                        Map.of(
                                "requests", List.of(
                                        Map.of(
                                                "deleteSheet", Map.of(
                                                        "sheetId", pluginSpecifiedTemplates.get(3).getValue()))))));
    }

}
