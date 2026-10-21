package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.TriggerRequestDTO;
import com.external.plugins.SoapPlugin.SoapPluginExecutor;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import mockwebserver3.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

class SoapPluginTest {

    private static final String ITEM_RESPONSE =
            "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body>"
                    + "<ns:GetItemResponse xmlns:ns=\"http://example.com/items\">"
                    + "<ns:item id=\"7\"><ns:name>Widget</ns:name></ns:item>"
                    + "</ns:GetItemResponse></soap:Body></soap:Envelope>";

    private final SoapPluginExecutor executor = new SoapPluginExecutor();
    private MockWebServer server;

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    @Test
    void should_sendSoap11RequestWithEscapedBindings_when_executingOperation() throws Exception {
        // Given
        DatasourceConfiguration datasource = datasource(null);
        server.enqueue(new MockResponse()
                .setBody(SoapFixtures.wsdl(server.url("/items").toString())));
        server.enqueue(new MockResponse().setBody(ITEM_RESPONSE));
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(List.of(new Param("Input1.text", "<b>&\"q\"")));

        // When
        var result = executor.datasourceCreate(datasource)
                .flatMap(operations -> executor.executeParameterized(
                        operations,
                        executeActionDTO,
                        datasource,
                        action(
                                "ItemsSoap/GetItem",
                                "<tns:GetItem xmlns:tns=\"http://example.com/items\">"
                                        + "<tns:id kind=\"{{Input1.text}}\">{{Input1.text}}</tns:id></tns:GetItem>")));

        // Then
        StepVerifier.create(result)
                .assertNext(r -> {
                    assertThat(r.getIsExecutionSuccess()).isTrue();
                    assertThat(r.getStatusCode()).isEqualTo("200");
                    assertThat(r.getBody()).isEqualTo(Map.of("item", Map.of("id", "7", "name", "Widget")));
                })
                .verifyComplete();
        RecordedRequest wsdlRequest = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(wsdlRequest.getPath()).isEqualTo("/items?wsdl");
        assertThat(wsdlRequest.getHeader("Authorization")).isEqualTo("Basic dXNlcjpwYXNz");
        RecordedRequest soapRequest = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(soapRequest.getMethod()).isEqualTo("POST");
        assertThat(soapRequest.getPath()).isEqualTo("/items");
        assertThat(soapRequest.getHeader("SOAPAction")).isEqualTo("\"http://example.com/items/GetItem\"");
        assertThat(soapRequest.getHeader("Content-Type")).isEqualTo("text/xml; charset=utf-8");
        assertThat(soapRequest.getBody().readUtf8())
                .contains("<tns:id kind=\"&lt;b&gt;&amp;&#x22;q&#x22;\">&lt;b&gt;&amp;&#x22;q&#x22;</tns:id>");
    }

    @Test
    void should_notSendCredentials_when_wsdlPointsToAnotherHost() throws Exception {
        // Given: the WSDL's address names the same server under a different host name
        String otherHost = "localhost".equals(server.getHostName()) ? "127.0.0.1" : "localhost";
        DatasourceConfiguration datasource = datasource(null);
        server.enqueue(new MockResponse()
                .setBody(SoapFixtures.wsdl("http://" + otherHost + ":" + server.getPort() + "/items")));
        server.enqueue(new MockResponse().setBody(ITEM_RESPONSE));

        // When
        var result = executor.datasourceCreate(datasource)
                .flatMap(operations ->
                        executor.execute(operations, datasource, action("ItemsSoap/GetItem", "<GetItem/>")));

        // Then
        StepVerifier.create(result)
                .assertNext(r -> assertThat(r.getIsExecutionSuccess()).isTrue())
                .verifyComplete();
        server.takeRequest(5, TimeUnit.SECONDS);
        RecordedRequest soapRequest = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(soapRequest.getHeader("Authorization")).isNull();
    }

    @Test
    void should_sendToOverrideWithSoap12Action_when_endpointOverrideIsSet() throws Exception {
        // Given
        DatasourceConfiguration datasource = datasource(server.url("/internal").toString());
        server.enqueue(new MockResponse().setBody(SoapFixtures.wsdl("https://unreachable.example.com/items")));
        server.enqueue(new MockResponse().setBody(ITEM_RESPONSE));

        // When
        var result = executor.datasourceCreate(datasource)
                .flatMap(operations ->
                        executor.execute(operations, datasource, action("ItemsSoap12/GetItem", "<GetItem/>")));

        // Then
        StepVerifier.create(result)
                .assertNext(r -> assertThat(r.getIsExecutionSuccess()).isTrue())
                .verifyComplete();
        server.takeRequest(5, TimeUnit.SECONDS);
        RecordedRequest soapRequest = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(soapRequest.getPath()).isEqualTo("/internal");
        assertThat(soapRequest.getHeader("Content-Type"))
                .isEqualTo("application/soap+xml; charset=utf-8; action=\"http://example.com/items/GetItem\"");
        assertThat(soapRequest.getBody().readUtf8())
                .startsWith("<soap:Envelope xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\">");
    }

    @Test
    void should_returnFailedResultWithFaultMessage_when_serviceReturnsFault() {
        // Given
        DatasourceConfiguration datasource = datasource(null);
        server.enqueue(new MockResponse()
                .setBody(SoapFixtures.wsdl(server.url("/items").toString())));
        server.enqueue(new MockResponse()
                .setResponseCode(500)
                .setBody("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body>"
                        + "<soap:Fault><faultcode>soap:Server</faultcode><faultstring>Item not found</faultstring>"
                        + "</soap:Fault></soap:Body></soap:Envelope>"));

        // When
        var result = executor.datasourceCreate(datasource)
                .flatMap(operations ->
                        executor.execute(operations, datasource, action("ItemsSoap/GetItem", "<GetItem/>")));

        // Then
        StepVerifier.create(result)
                .assertNext(r -> {
                    assertThat(r.getIsExecutionSuccess()).isFalse();
                    assertThat(r.getStatusCode()).isEqualTo("500");
                    assertThat(r.getPluginErrorDetails().getAppsmithErrorMessage())
                            .isEqualTo("Item not found");
                    assertThat(r.getBody())
                            .isEqualTo(Map.of("faultcode", "soap:Server", "faultstring", "Item not found"));
                })
                .verifyComplete();
    }

    @Test
    void should_failDatasourceCreate_when_wsdlUrlReturnsNonWsdl() {
        // Given
        server.enqueue(new MockResponse().setBody("<html><body>Login</body></html>"));

        // When / Then
        StepVerifier.create(executor.datasourceCreate(datasource(null)))
                .expectErrorSatisfies(e -> assertThat(e)
                        .isInstanceOf(AppsmithPluginException.class)
                        .hasMessage("Could not read the WSDL: Not a WSDL 1.1 document"))
                .verify();
    }

    @Test
    void should_listOperationsWithPortNames_when_wsdlHasSeveralPorts() {
        // Given
        server.enqueue(new MockResponse()
                .setBody(SoapFixtures.wsdl(server.url("/items").toString())));
        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType("OPERATIONS");

        // When
        var options = executor.datasourceCreate(datasource(null))
                .flatMap(operations -> executor.trigger(operations, datasource(null), request));

        // Then
        StepVerifier.create(options)
                .assertNext(r -> assertThat(r.getTrigger())
                        .isEqualTo(List.of(
                                Map.of("label", "GetItem (ItemsSoap)", "value", "ItemsSoap/GetItem"),
                                Map.of("label", "GetItem (ItemsSoap12)", "value", "ItemsSoap12/GetItem"),
                                Map.of("label", "ListItems (ItemsSoap)", "value", "ItemsSoap/ListItems"))))
                .verifyComplete();
    }

    @Test
    void should_reportInvalidUrls_when_validatingDatasource() {
        // Given
        DatasourceConfiguration datasource = new DatasourceConfiguration();
        datasource.setUrl("file:///etc/passwd");
        datasource.setProperties(List.of(new Property("endpoint", "ftp://example.com")));

        // When
        var invalids = executor.validateDatasource(datasource);

        // Then
        assertThat(invalids)
                .containsExactlyInAnyOrder(
                        "WSDL URL must be an http:// or https:// URL.",
                        "Endpoint URL override must be an http:// or https:// URL.");
    }

    private DatasourceConfiguration datasource(String endpointOverride) {
        DatasourceConfiguration datasource = new DatasourceConfiguration();
        datasource.setUrl(server.url("/items?wsdl").toString());
        DBAuth auth = new DBAuth();
        auth.setUsername("user");
        auth.setPassword("pass");
        datasource.setAuthentication(auth);
        datasource.setProperties(List.of(new Property("endpoint", endpointOverride)));
        return datasource;
    }

    private static ActionConfiguration action(String operation, String body) {
        Map<String, Object> formData = new HashMap<>();
        formData.put("operation", new HashMap<>(Map.of("data", operation)));
        formData.put("body", new HashMap<>(Map.of("data", body)));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);
        return actionConfiguration;
    }
}
