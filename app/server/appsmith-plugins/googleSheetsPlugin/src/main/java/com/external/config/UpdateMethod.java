package com.external.config;

import com.appsmith.external.models.Property;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

/**
 * API reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/update
 */
public class UpdateMethod implements Method {

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                pluginSpecifiedTemplates.get(1).getValue() /* spreadsheet Id */
                        + "/values/"
                        + pluginSpecifiedTemplates.get(2).getValue() /* spreadsheet Range */
        );

        uriBuilder.queryParam("valueInputOption", "USER_ENTERED");
        uriBuilder.queryParam("includeValuesInResponse", Boolean.TRUE);

        return webClient.method(HttpMethod.PUT)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.fromObject(body));
    }

}
