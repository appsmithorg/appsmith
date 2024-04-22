package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.util.SerializationUtils;
import com.appsmith.util.WebClientUtils;
import com.external.constants.FieldName;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

import static org.springframework.util.CollectionUtils.isEmpty;
import static org.springframework.util.StringUtils.hasLength;

@Slf4j
public class GetDatasourceMetadataMethod {

    protected static final ObjectMapper objectMapper = SerializationUtils.getObjectMapperWithSourceInLocationEnabled();

    public static Mono<DatasourceConfiguration> getDatasourceMetadata(DatasourceConfiguration datasourceConfiguration) {

        // verifying the presence of Oauth Token for now making call to fetch email address
        if (datasourceConfiguration.getAuthentication() == null
                || datasourceConfiguration.getAuthentication().getAuthenticationResponse() == null) {
            return Mono.just(datasourceConfiguration);
        }

        String accessToken = datasourceConfiguration
                .getAuthentication()
                .getAuthenticationResponse()
                .getToken();

        if (!hasLength(accessToken)) {
            return Mono.just(datasourceConfiguration);
        }

        return fetchEmailAddressFromGoogleAPI(accessToken).map(emailAddress -> {
            List<Property> properties = datasourceConfiguration.getProperties();
            datasourceConfiguration.setProperties(setPropertiesWithEmailAddress(properties, emailAddress));
            return datasourceConfiguration;
        });
    }

    public static List<Property> setPropertiesWithEmailAddress(List<Property> properties, String emailAddress) {
        if (isEmpty(properties)) {
            properties = new ArrayList<>();
            properties.add(new Property(FieldName.EMAIL_ADDRESS, emailAddress));

        } else if (!FieldName.EMAIL_ADDRESS.equals(properties.get(0).getKey())) {
            properties.set(0, new Property(FieldName.EMAIL_ADDRESS, emailAddress));
        } else {
            properties.get(0).setValue(emailAddress);
        }

        return properties;
    }

    public static Mono<String> fetchEmailAddressFromGoogleAPI(String accessToken) {

        WebClient client = WebClientUtils.builder().build();
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            uriBuilder
                    .uri(new URI(FieldName.GOOGLE_API_BASE_URL + "/drive/v3/about"))
                    .queryParam("fields", "user");
        } catch (URISyntaxException e) {
            // since the datasource authorisation doesn't get affected if this flow fails,
            // let's return a value so that the datasource gets authorised
            log.debug("Error while parsing access token URL.", e);
            return Mono.just("");
        }

        return client.method(HttpMethod.GET)
                .uri(uriBuilder.build(false).toUri())
                .body(BodyInserters.empty())
                .headers(headers -> headers.set("Authorization", "Bearer " + accessToken))
                .exchange()
                .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                .map(response -> {
                    // Choose body depending on response status
                    byte[] responseBody = response.getBody();

                    if (responseBody == null || !response.getStatusCode().is2xxSuccessful()) {
                        return "";
                    }

                    String jsonBody = new String(responseBody);
                    JsonNode userNode = null;
                    try {
                        userNode = objectMapper.readTree(jsonBody).get("user");
                    } catch (IOException e) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, new String(responseBody), e.getMessage()));
                    }

                    return userNode.get(FieldName.EMAIL_ADDRESS).asText();
                });
    }
}
