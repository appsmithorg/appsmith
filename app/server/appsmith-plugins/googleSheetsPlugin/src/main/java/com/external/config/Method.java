package com.external.config;

import com.appsmith.external.constants.AppsmithType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public interface Method {

    String BASE_SHEETS_API_URL = "https://sheets.googleapis.com/v4/spreadsheets/";

    String BASE_DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files/";

    ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies
            .builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();

    default UriComponentsBuilder getBaseUriBuilder(String baseUri, String path) {
        return getBaseUriBuilder(baseUri, path, false);
    }

    default UriComponentsBuilder getBaseUriBuilder(String baseUri, String path, boolean isEncoded) {
        if (!isEncoded) {
            try {
                String decodedURL = URLDecoder.decode(baseUri + path, StandardCharsets.UTF_8);
                URL url = new URL(decodedURL);
                URI uri = new URI(url.getProtocol(), url.getUserInfo(), url.getHost(), url.getPort(), url.getPath(), url.getQuery(), url.getRef());
                UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
                return uriBuilder.uri(uri);
            } catch (URISyntaxException | MalformedURLException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
        } else {
            try {
                UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
                return uriBuilder.uri(new URI(baseUri + path));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
        }
    }

    boolean validateMethodRequest(MethodConfig methodConfig);

    default Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        return Mono.just(true);
    }

    WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig);

    default JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw Exceptions.propagate(new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object."));
        }
        // By default, no transformation takes place
        return response;
    }

    /**
     * Method for custom AppsmithType Mapping based on plugin,
     * so here in GoogleSheet, AppsmithTypes like Integer, Long, Float will be processed as Double as required.
     * For example, another plugin may implement this method to process all AppsmithType as String etc.
     * @return  -   Map containing custom AppsmithType to be considered against input AppsmithType.
     */
    default Map<AppsmithType, AppsmithType> getAppsmithTypeConversionMap() {
        Map<AppsmithType, AppsmithType> conversionMap = new HashMap<AppsmithType, AppsmithType>();
        conversionMap.put(AppsmithType.INTEGER, AppsmithType.DOUBLE);
        conversionMap.put(AppsmithType.LONG, AppsmithType.DOUBLE);
        conversionMap.put(AppsmithType.FLOAT, AppsmithType.DOUBLE);
        return conversionMap;
    }
}
