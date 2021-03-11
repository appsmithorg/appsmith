package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Property;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * API reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get
 */
@Slf4j
public class GetValuesMethod implements Method {

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                pluginSpecifiedTemplates.get(1).getValue() /* spreadsheet Id */
                        + "/values/"
                        + pluginSpecifiedTemplates.get(2).getValue() /* spreadsheet Range */
        );

        return webClient.method(HttpMethod.GET)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.empty());
    }

    @Override
    public JsonNode transformResponse(JsonNode response, ObjectMapper objectMapper) {
        if (response == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object.");
        }
        ArrayNode values = (ArrayNode) response.get("values");
        if (values == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing expected field 'values' in response.");
        }
        int headerRow = 0;
        while (headerRow < values.size() && values.get(headerRow).size() == 0) {
            headerRow++;
        }
        ArrayNode headers = (ArrayNode) values.get(headerRow);
        Set<String> columnsSet = new HashSet<>();
        List<HashMap<String, String>> collectedCells = StreamSupport
                .stream(values.spliterator(), false)
                .skip(headerRow + 1)
                .map(row -> {
                    HashMap<String, String> objectHashMap = new LinkedHashMap<>();
                    AtomicInteger i = new AtomicInteger();
                    row.forEach((cell) -> {
                        try {
                            String k = objectMapper.treeToValue(headers.get(i.getAndIncrement()), String.class);
                            // If the column header is missing, use a placeholder
                            if (k == null || k.isBlank()) {
                                k = "Column-" + i.get();
                            }
                            // In case of repetitive names in column headers, add an identifier
                            int counter = 1;
                            String addition = "";
                            while (objectHashMap.containsKey(k + addition)) {
                                addition = "_" + counter++;
                            }
                            k = k + addition;
                            final String v = objectMapper.treeToValue(cell, String.class);
                            // If a single row has a valid value for a particular column, retain the column
                            if (v != null && !v.isBlank()) {
                                columnsSet.add(k);
                            }
                            objectHashMap.put(k, v);
                        } catch (JsonProcessingException e) {
                            e.printStackTrace();
                        }
                    });
                    return objectHashMap;
                })
                .collect(Collectors.toList());

        collectedCells = collectedCells
                .stream()
                .peek(row -> {
                    row.keySet().retainAll(columnsSet);
                })
                .collect(Collectors.toList());

        return objectMapper.valueToTree(collectedCells);
    }
}
