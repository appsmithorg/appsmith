package com.appsmith.external.helpers.restApiUtils.helpers;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.net.URI;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class RequestCaptureFilterTest {

    @Test
    public void testMaskQueryParamInURL_NoQueryParams() throws Exception {
        final URI uri = URI.create("http://example.com/api");
        final String maskedUrl = invokeMaskQueryParamInURL(uri, "token");
        assertEquals("http://example.com/api", maskedUrl);
    }

    @Test
    public void testMaskQueryParamInURL_MatchingQueryParam() throws Exception {
        final URI uri = URI.create("http://example.com/api?token=12345&user=admin");
        final String maskedUrl = invokeMaskQueryParamInURL(uri, "token");
        assertEquals("http://example.com/api?token=****&user=admin", maskedUrl);
    }

    @Test
    public void testMaskQueryParamInURL_NonMatchingQueryParam() throws Exception {
        final URI uri = URI.create("http://example.com/api?session=abcd&user=admin");
        final String maskedUrl = invokeMaskQueryParamInURL(uri, "token");
        assertEquals("http://example.com/api?session=abcd&user=admin", maskedUrl);
    }

    @Test
    public void testMaskQueryParamInURL_MultipleMatchingQueryParams() throws Exception {
        final URI uri = URI.create("http://example.com/api?token=12345&token=67890&user=admin");
        final String maskedUrl = invokeMaskQueryParamInURL(uri, "token");
        assertEquals("http://example.com/api?token=****&token=****&user=admin", maskedUrl);
    }

    private String invokeMaskQueryParamInURL(final URI uri, final String queryParamKeyToMask) throws Exception {
        final Method method =
                RequestCaptureFilter.class.getDeclaredMethod("maskQueryParamInURL", URI.class, String.class);
        method.setAccessible(true);
        return (String) method.invoke(null, uri, queryParamKeyToMask);
    }
}
