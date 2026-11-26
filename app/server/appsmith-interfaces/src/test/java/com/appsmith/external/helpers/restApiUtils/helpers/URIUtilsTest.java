package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;

class URIUtilsTest {

    private final URIUtils uriUtils = new URIUtils();

    @ParameterizedTest
    @CsvSource({
        "httpbin.org/get, http://httpbin.org/get",
        "httpstat.us/200, http://httpstat.us/200",
        "localhost:8080/api, http://localhost:8080/api",
        "example.com/redirect?to=http://other.com, http://example.com/redirect?to=http://other.com",
        "http://example.com/a, http://example.com/a",
        "HTTPS://example.com/a, HTTPS://example.com/a",
        "ftp://example.com/a, ftp://example.com/a"
    })
    void should_addHttpScheme_only_when_urlHasNoScheme(String url, String expected) throws Exception {
        // Given
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        // When
        URI uri = uriUtils.createUriWithQueryParams(actionConfiguration, datasourceConfiguration, url, true);

        // Then
        assertThat(uri.toString()).isEqualTo(expected);
    }
}
