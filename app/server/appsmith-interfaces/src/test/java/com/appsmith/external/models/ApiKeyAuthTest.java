package com.appsmith.external.models;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ApiKeyAuthTest {

    @Test
    void testConstructor() {
        ApiKeyAuth actualApiKeyAuth = new ApiKeyAuth();
        actualApiKeyAuth.setAddTo(ApiKeyAuth.Type.QUERY_PARAMS);
        actualApiKeyAuth.setHeaderPrefix("Header Prefix");
        actualApiKeyAuth.setLabel("Label");
        actualApiKeyAuth.setValue("42");
        String actualToStringResult = actualApiKeyAuth.toString();
        ApiKeyAuth.Type actualAddTo = actualApiKeyAuth.getAddTo();
        String actualHeaderPrefix = actualApiKeyAuth.getHeaderPrefix();
        String actualLabel = actualApiKeyAuth.getLabel();
        assertEquals("42", actualApiKeyAuth.getValue());
        assertEquals(
            "ApiKeyAuth(addTo=QUERY_PARAMS, label=Label, headerPrefix=Header Prefix, value=42)",
            actualToStringResult);
        assertEquals("Header Prefix", actualHeaderPrefix);
        assertEquals("Label", actualLabel);
        assertEquals(ApiKeyAuth.Type.QUERY_PARAMS, actualAddTo);
    }

    @Test
    void testConstructor2() {
        ApiKeyAuth actualApiKeyAuth = new ApiKeyAuth(ApiKeyAuth.Type.QUERY_PARAMS, "Label", "Header Prefix", "42");
        actualApiKeyAuth.setAddTo(ApiKeyAuth.Type.QUERY_PARAMS);
        actualApiKeyAuth.setHeaderPrefix("Header Prefix");
        actualApiKeyAuth.setLabel("Label");
        actualApiKeyAuth.setValue("42");
        String actualToStringResult = actualApiKeyAuth.toString();
        ApiKeyAuth.Type actualAddTo = actualApiKeyAuth.getAddTo();
        String actualHeaderPrefix = actualApiKeyAuth.getHeaderPrefix();
        String actualLabel = actualApiKeyAuth.getLabel();
        assertEquals("42", actualApiKeyAuth.getValue());
        assertEquals(
            "ApiKeyAuth(addTo=QUERY_PARAMS, label=Label, headerPrefix=Header Prefix, value=42)",
            actualToStringResult);
        assertEquals("Header Prefix", actualHeaderPrefix);
        assertEquals("Label", actualLabel);
        assertEquals(ApiKeyAuth.Type.QUERY_PARAMS, actualAddTo);
    }
}
