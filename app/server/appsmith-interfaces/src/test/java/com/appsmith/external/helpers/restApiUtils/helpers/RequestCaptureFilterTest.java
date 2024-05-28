package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.helpers.restApiUtils.connections.ApiKeyAuthentication;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFunction;

import java.io.IOException;
import java.net.URISyntaxException;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class RequestCaptureFilterTest {

    private final RequestCaptureFilter requestCaptureFilter = new RequestCaptureFilter(new ObjectMapper());

    @BeforeEach
    public void setUp() throws IOException, URISyntaxException {
        final ApiKeyAuthentication connection = ApiKeyAuthentication.create(
                        new ApiKeyAuth(ApiKeyAuth.Type.QUERY_PARAMS, "token", null, "12345"))
                .block(Duration.ofMillis(100));
        connection.filter(Mockito.mock(ClientRequest.class), Mockito.mock(ExchangeFunction.class));
    }

    @Test
    public void testMaskQueryParamInURL_NoQueryParams() {

        final DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("http://example.com/api");
        dsConfig.setAuthentication(new ApiKeyAuth(ApiKeyAuth.Type.QUERY_PARAMS, "token", null, "12345"));

        final ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
        actionExecutionRequest.setHttpMethod(HttpMethod.GET);

        final ActionExecutionRequest result =
                requestCaptureFilter.populateRequestFields(actionExecutionRequest, false, dsConfig);

        assertEquals("http://example.com/api", result.getUrl());
    }

    @Test
    public void testMaskQueryParamInURL_MatchingQueryParam() {
        final DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("http://example.com/api?token=12345&user=admin");
        dsConfig.setAuthentication(new ApiKeyAuth(ApiKeyAuth.Type.QUERY_PARAMS, "token", null, "12345"));

        final ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
        actionExecutionRequest.setHttpMethod(HttpMethod.GET);

        final ActionExecutionRequest result =
                requestCaptureFilter.populateRequestFields(actionExecutionRequest, false, dsConfig);

        assertEquals("http://example.com/api?token=****&user=admin", result.getUrl());
    }

    @Test
    public void testMaskQueryParamInURL_NonMatchingQueryParam() {
        final DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("http://example.com/api?session=abcd&user=admin");
        dsConfig.setAuthentication(new ApiKeyAuth(ApiKeyAuth.Type.QUERY_PARAMS, "token", null, "12345"));

        final ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
        actionExecutionRequest.setHttpMethod(HttpMethod.GET);

        final ActionExecutionRequest result =
                requestCaptureFilter.populateRequestFields(actionExecutionRequest, false, dsConfig);

        assertEquals("http://example.com/api?session=abcd&user=admin", result.getUrl());
    }

    @Test
    public void testMaskQueryParamInURL_MultipleMatchingQueryParams() {
        final DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("http://example.com/api?token=12345&token=67890&user=admin");
        dsConfig.setAuthentication(new ApiKeyAuth(ApiKeyAuth.Type.QUERY_PARAMS, "token", null, "12345"));

        final ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
        actionExecutionRequest.setHttpMethod(HttpMethod.GET);

        final ActionExecutionRequest result =
                requestCaptureFilter.populateRequestFields(actionExecutionRequest, false, dsConfig);

        assertEquals("http://example.com/api?token=****&token=****&user=admin", result.getUrl());
    }
}
