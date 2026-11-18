package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Unit tests for {@link URIUtils}.
 */
public class URIUtilsTest {

    private final URIUtils uriUtils = new URIUtils();

    /**
     * Tests that null input is returned as null.
     */
    @Test
    public void addHttpToUrlWhenPrefixNotPresent_withNull_returnsNull() {
        assertNull(uriUtils.addHttpToUrlWhenPrefixNotPresent(null));
    }

    /**
     * Tests that URLs starting with "http" as part of the hostname (without a scheme) get "http://" prepended.
     */
    @Test
    public void addHttpToUrlWhenPrefixNotPresent_withHostnameStartingWithHttp_prependsHttp() {
        assertEquals("http://httpbin.org/get", uriUtils.addHttpToUrlWhenPrefixNotPresent("httpbin.org/get"));
        assertEquals("http://https-api.example.com", uriUtils.addHttpToUrlWhenPrefixNotPresent("https-api.example.com"));
        assertEquals("http://http:8080/status", uriUtils.addHttpToUrlWhenPrefixNotPresent("http:8080/status"));
    }

    /**
     * Tests that schemeless URLs containing "://" only inside a query parameter still get "http://" prepended.
     */
    @Test
    public void addHttpToUrlWhenPrefixNotPresent_withSchemeInQueryParamOnly_prependsHttp() {
        assertEquals(
                "http://example.com/path?next=https://other.com",
                uriUtils.addHttpToUrlWhenPrefixNotPresent("example.com/path?next=https://other.com"));
    }

    /**
     * Tests that URLs already starting with an explicit scheme remain unchanged.
     */
    @Test
    public void addHttpToUrlWhenPrefixNotPresent_withExistingScheme_returnsUnchanged() {
        assertEquals("http://httpbin.org/get", uriUtils.addHttpToUrlWhenPrefixNotPresent("http://httpbin.org/get"));
        assertEquals("https://httpbin.org/get", uriUtils.addHttpToUrlWhenPrefixNotPresent("https://httpbin.org/get"));
        assertEquals("HTTPS://EXAMPLE.COM/api", uriUtils.addHttpToUrlWhenPrefixNotPresent("HTTPS://EXAMPLE.COM/api"));
        assertEquals("ftp://files.example.com", uriUtils.addHttpToUrlWhenPrefixNotPresent("ftp://files.example.com"));
    }

    /**
     * Tests that createUriWithQueryParams builds a valid HTTP URI for schemeless domains starting with "http".
     */
    @Test
    public void createUriWithQueryParams_withHttpPrefixedDomainWithoutScheme_buildsValidUri()
            throws URISyntaxException {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setQueryParameters(List.of(new Property("key", "value")));
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        URI result = uriUtils.createUriWithQueryParams(
                actionConfiguration, datasourceConfiguration, "httpbin.org/get", true);

        assertEquals(URI.create("http://httpbin.org/get?key=value"), result);
    }
}
