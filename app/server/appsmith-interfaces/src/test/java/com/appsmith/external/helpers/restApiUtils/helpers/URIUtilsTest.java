package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link URIUtils}.
 */
class URIUtilsTest {

    private final URIUtils uriUtils = new URIUtils();

    /**
     * Verifies that null input is returned unchanged.
     */
    @Test
    void should_returnNull_when_urlIsNull() {
        // Given
        String inputUrl = null;

        // When
        String result = uriUtils.addHttpToUrlWhenPrefixNotPresent(inputUrl);

        // Then
        assertThat(result).isNull();
    }

    /**
     * Verifies that schemeless URLs (including domains starting with "http" or query strings containing "://")
     * have "http://" prepended.
     */
    @ParameterizedTest
    @CsvSource({
        "httpbin.org/get, http://httpbin.org/get",
        "https-api.example.com, http://https-api.example.com",
        "http:8080/status, http://http:8080/status",
        "example.com/path?next=https://other.com, http://example.com/path?next=https://other.com"
    })
    void should_prependHttpPrefix_when_schemelessUrlProvided(String inputUrl, String expectedUrl) {
        // Given
        // inputUrl from parameterized source

        // When
        String result = uriUtils.addHttpToUrlWhenPrefixNotPresent(inputUrl);

        // Then
        assertThat(result).isEqualTo(expectedUrl);
    }

    /**
     * Verifies that URLs starting with an explicit {@code scheme://} prefix remain unchanged.
     */
    @ParameterizedTest
    @ValueSource(
            strings = {
                "http://httpbin.org/get",
                "https://httpbin.org/get",
                "HTTPS://EXAMPLE.COM/api",
                "ftp://files.example.com"
            })
    void should_keepUrlUnchanged_when_explicitSchemePrefixExists(String inputUrl) {
        // Given
        // inputUrl with explicit scheme:// prefix

        // When
        String result = uriUtils.addHttpToUrlWhenPrefixNotPresent(inputUrl);

        // Then
        assertThat(result).isEqualTo(inputUrl);
    }

    /**
     * Verifies that {@link URIUtils#createUriWithQueryParams} builds a valid HTTP URI for schemeless domains
     * starting with "http".
     */
    @Test
    void should_buildValidHttpUri_when_schemelessDomainStartsWithHttp() throws URISyntaxException {
        // Given
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setQueryParameters(List.of(new Property("key", "value")));
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        // When
        URI result = uriUtils.createUriWithQueryParams(
                actionConfiguration, datasourceConfiguration, "httpbin.org/get", true);

        // Then
        assertThat(result).isEqualTo(URI.create("http://httpbin.org/get?key=value"));
    }
}
