package com.external.plugins;

import com.appsmith.external.constants.Authentication;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.RequestParamDTO;
import com.external.plugins.exceptions.ElasticSearchPluginError;
import lombok.extern.slf4j.Slf4j;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.nio.client.HttpAsyncClientBuilder;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.testcontainers.elasticsearch.ElasticsearchContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Slf4j
@Testcontainers
public class ElasticSearchPluginTest {
    ElasticSearchPlugin.ElasticSearchPluginExecutor pluginExecutor = new ElasticSearchPlugin.ElasticSearchPluginExecutor();

    @Container
    public static final ElasticsearchContainer container = new ElasticsearchContainer("docker.elastic.co/elasticsearch/elasticsearch:7.12.1")
            .withEnv("discovery.type", "single-node")
            .withPassword("esPassword");
    private static String username = "elastic";
    private static String password = "esPassword";
    private static final DatasourceConfiguration dsConfig = new DatasourceConfiguration();
    private static DBAuth elasticInstanceCredentials = new DBAuth(DBAuth.Type.USERNAME_PASSWORD, username, password, null);
    private static String host;
    private static Integer port;


    @BeforeAll
    public static void setUp() throws IOException {
        port = container.getMappedPort(9200);
        host = "http://" + container.getContainerIpAddress();

        final CredentialsProvider credentialsProvider =
                new BasicCredentialsProvider();
        credentialsProvider.setCredentials(AuthScope.ANY,
                new UsernamePasswordCredentials(username, password));

        RestClient client = RestClient.builder(
                        new HttpHost(container.getContainerIpAddress(), port, "http"))
                .setHttpClientConfigCallback(new RestClientBuilder.HttpClientConfigCallback() {
                    @Override
                    public HttpAsyncClientBuilder customizeHttpClient(
                            HttpAsyncClientBuilder httpClientBuilder) {
                        return httpClientBuilder
                                .setDefaultCredentialsProvider(credentialsProvider);
                    }
                }).build();

        Request request;

        request = new Request("PUT", "/planets/doc/id1");
        request.setJsonEntity("{\"name\": \"Mercury\"}");
        client.performRequest(request);

        request = new Request("PUT", "/planets/doc/id2");
        request.setJsonEntity("{\"name\": \"Venus\"}");
        client.performRequest(request);

        request = new Request("PUT", "/planets/doc/id3");
        request.setJsonEntity("{\"name\": \"Earth\"}");
        client.performRequest(request);

        client.close();
        elasticInstanceCredentials.setAuthenticationType(Authentication.BASIC);
        elasticInstanceCredentials.setUsername(username);
        elasticInstanceCredentials.setPassword(password);
        dsConfig.setEndpoints(List.of(new Endpoint(host, port.longValue())));
        dsConfig.setAuthentication(elasticInstanceCredentials);
    }

    private Mono<ActionExecutionResult> execute(HttpMethod method, String path, String body) {
        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(method);
        actionConfiguration.setPath(path);
        actionConfiguration.setBody(body);

        return pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));
    }

    @Test
    public void testDefaultPort() {

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);

        Long defaultPort = pluginExecutor.getPort(endpoint);

        assertEquals(9200L,defaultPort);
    }

    @Test
    public void testGet() {
        StepVerifier.create(execute(HttpMethod.GET, "/planets/doc/id1", null))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final Map<String, Object> resultBody = (Map) result.getBody();
                    assertEquals("Mercury", ((Map<String, String>) resultBody.get("_source")).get("name"));
                })
                .verifyComplete();
    }

    @Test
    public void testMultiGet() {
        final String contentJson = "{\n" +
                "  \"docs\": [\n" +
                "    {\n" +
                "      \"_index\": \"planets\",\n" +
                "      \"_id\": \"id1\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"_index\": \"planets\",\n" +
                "      \"_id\": \"id2\"\n" +
                "    }\n" +
                "  ]\n" +
                "}";
        StepVerifier.create(execute(HttpMethod.GET, "/planets/_mget", contentJson))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final List<Map> docs = ((Map<String, List<Map>>) result.getBody()).get("docs");
                    assertEquals(2, docs.size());

                    /*
                     * - Adding only in this test as the query editor form for Elastic plugin is exactly same for each
                     *  query type. Hence, checking with only one query should suffice. Also, changing the query type
                     *  does not change the execution flow w.r.t request params.
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO("actionConfiguration.httpMethod", HttpMethod.GET.toString(),
                            null, null, null));
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, "/planets/_mget", null, null, null));
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY, contentJson, null, null, null));
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testPutCreate() {
        final String contentJson = "{\"name\": \"Pluto\"}";
        StepVerifier.create(execute(HttpMethod.PUT, "/planets/doc/id9", contentJson))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final Map<String, Object> resultBody = (Map) result.getBody();
                    assertEquals("created", resultBody.get("result"));
                    assertEquals("id9", resultBody.get("_id"));
                })
                .verifyComplete();
    }

    @Test
    public void testPutUpdate() {
        final String contentJson = "{\"name\": \"New Venus\"}";
        StepVerifier.create(execute(HttpMethod.PUT, "/planets/doc/id2", contentJson))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final Map<String, Object> resultBody = (Map) result.getBody();
                    assertEquals("updated", resultBody.get("result"));
                    assertEquals("id2", resultBody.get("_id"));
                })
                .verifyComplete();
    }

    @Test
    public void testDelete() {
        StepVerifier.create(execute(HttpMethod.DELETE, "/planets/doc/id3", null))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final Map<String, Object> resultBody = (Map) result.getBody();
                    assertEquals("deleted", resultBody.get("result"));
                    assertEquals("id3", resultBody.get("_id"));
                })
                .verifyComplete();
    }

    @Test
    public void testBulkWithArrayBody() {
        final String contentJson = "[\n" +
                "  { \"index\" : { \"_index\" : \"test1\", \"_type\": \"doc\", \"_id\" : \"1\" } },\n" +
                "  { \"field1\" : \"value1\" },\n" +
                "  { \"delete\" : { \"_index\" : \"test1\", \"_type\": \"doc\", \"_id\" : \"2\" } },\n" +
                "  { \"create\" : { \"_index\" : \"test1\", \"_type\": \"doc\", \"_id\" : \"3\" } },\n" +
                "  { \"field1\" : \"value3\" },\n" +
                "  { \"update\" : {\"_id\" : \"1\", \"_type\": \"doc\", \"_index\" : \"test1\"} },\n" +
                "  { \"doc\" : {\"field2\" : \"value2\"} }\n" +
                "]";

        StepVerifier.create(execute(HttpMethod.POST, "/_bulk", contentJson))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final Map<String, Object> resultBody = (Map) result.getBody();
                    assertFalse((Boolean) resultBody.get("errors"));
                    assertEquals(4, ((List) resultBody.get("items")).size());
                })
                .verifyComplete();
    }

    @Test
    public void testBulkWithDirectBody() {
        final String contentJson =
                "{ \"index\" : { \"_index\" : \"test2\", \"_type\": \"doc\", \"_id\" : \"1\" } }\n" +
                        "{ \"field1\" : \"value1\" }\n" +
                        "{ \"delete\" : { \"_index\" : \"test2\", \"_type\": \"doc\", \"_id\" : \"2\" } }\n" +
                        "{ \"create\" : { \"_index\" : \"test2\", \"_type\": \"doc\", \"_id\" : \"3\" } }\n" +
                        "{ \"field1\" : \"value3\" }\n" +
                        "{ \"update\" : {\"_id\" : \"1\", \"_type\": \"doc\", \"_index\" : \"test2\"} }\n" +
                        "{ \"doc\" : {\"field2\" : \"value2\"} }\n";

        StepVerifier.create(execute(HttpMethod.POST, "/_bulk", contentJson))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final Map<String, Object> resultBody = (Map) result.getBody();
                    assertFalse((Boolean) resultBody.get("errors"));
                    assertEquals(4, ((List) resultBody.get("items")).size());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldValidateDatasourceWithNoEndpoints() {
        DatasourceConfiguration invalidDatasourceConfiguration = new DatasourceConfiguration();
        invalidDatasourceConfiguration.setAuthentication(elasticInstanceCredentials);

        assertEquals(Set.of("No endpoint provided. Please provide a host:port where ElasticSearch is reachable."),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyPort() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        assertEquals(Set.of(),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyHost() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        assertEquals(Set.of("Missing host for endpoint"),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithMissingEndpoint() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        assertEquals(Set.of("Missing host for endpoint"),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithEndpointNoProtocol() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        endpoint.setHost("localhost");
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        assertEquals(Set.of("Invalid host provided. It should be of the form http(s)://your-es-url.com"),
                pluginExecutor.validateDatasource(datasourceConfiguration)
        );
    }

    @Test
    public void itShouldTestDatasourceWithInvalidEndpoint() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("localhost");
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        StepVerifier.create(pluginExecutor.testDatasource(datasourceConfiguration))
                .assertNext(result -> {
                    assertFalse(result.getInvalids().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldTestDatasource() {
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(result -> {
                    assertTrue(result.getInvalids().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    public void shouldVerifyUnauthorized() {
        final Integer secureHostPort = container.getMappedPort(9200);
        final String secureHostEndpoint = "http://" + container.getHttpHostAddress();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint(secureHostEndpoint, Long.valueOf(secureHostPort));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));


        StepVerifier.create(pluginExecutor.testDatasource(datasourceConfiguration)
                        .map(result -> {
                            return (Set<String>) result.getInvalids();
                        }))
                .expectNext(Set.of("Your username or password is not correct"))
                .verifyComplete();

    }


    @Test
    public void shouldVerifyNotFound() {
        final Integer secureHostPort = container.getMappedPort(9200);
        final String secureHostEndpoint = "http://esdatabasenotfound.co";
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint(secureHostEndpoint, Long.valueOf(secureHostPort));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        StepVerifier.create(pluginExecutor.testDatasource(datasourceConfiguration)
                        .map(result -> {
                            return (Set<String>) result.getInvalids();
                        }))
                .expectNext(Set.of("Either your host URL is invalid or the page you are trying to access does not exist"))
                .verifyComplete();

    }

    @Test
    public void itShouldDenyTestDatasourceWithInstanceMetadataAws() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("http://169.254.169.254");
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        StepVerifier.create(pluginExecutor.testDatasource(datasourceConfiguration))
                .assertNext(result -> {
                    assertFalse(result.getInvalids().isEmpty());
                    assertTrue(result.getInvalids().contains("Error running HEAD request: Host 169.254.169.254 is not allowed"));
                })
                .verifyComplete();
    }

    @Test
    public void itShouldDenyTestDatasourceWithInstanceMetadataAwsWithDnsResolution() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("http://169.254.169.254.nip.io");
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        StepVerifier.create(pluginExecutor.testDatasource(datasourceConfiguration))
                .assertNext(result -> {
                    assertFalse(result.getInvalids().isEmpty());
                    assertTrue(result.getInvalids().contains("Error running HEAD request: Host 169.254.169.254.nip.io is not allowed"));
                })
                .verifyComplete();
    }

    @Test
    public void itShouldDenyTestDatasourceWithInstanceMetadataGcp() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("http://metadata.google.internal");
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        StepVerifier.create(pluginExecutor.testDatasource(datasourceConfiguration))
                .assertNext(result -> {
                    assertFalse(result.getInvalids().isEmpty());
                    assertTrue(result.getInvalids().contains("Error running HEAD request: Host metadata.google.internal is not allowed"));
                })
                .verifyComplete();
    }

    @Test
    public void itShouldRejectGetToMetadataAws() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("http://169.254.169.254");
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setPath("/");

        final Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    assertEquals("Host 169.254.169.254 is not allowed", result.getPluginErrorDetails().getDownstreamErrorMessage());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldRejectGetToMetadataAwsWithDnsResolution() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("http://169.254.169.254.nip.io");
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setPath("/");

        final Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    assertEquals("Host 169.254.169.254.nip.io is not allowed", result.getPluginErrorDetails().getDownstreamErrorMessage());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldRejectGetToMetadataAwsWithDnsResolutionAndRedirect() throws IOException {
        MockWebServer mockWebServer = new MockWebServer();
        MockResponse mockRedirectResponse = new MockResponse()
                .setResponseCode(301)
                .addHeader("Location", "http://169.254.169.254.nip.io/latest/meta-data");
        mockWebServer.enqueue(mockRedirectResponse);
        mockWebServer.start();

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("http://" + mockWebServer.getHostName());
        endpoint.setPort((long) mockWebServer.getPort());
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setPath("/");

        final Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    assertEquals("Host 169.254.169.254.nip.io is not allowed", result.getPluginErrorDetails().getDownstreamErrorMessage());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldRejectGetToMetadataGcp() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("http://metadata.google.internal");
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setPath("/");

        final Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    assertEquals("Host metadata.google.internal is not allowed", result.getPluginErrorDetails().getDownstreamErrorMessage());
                })
                .verifyComplete();
    }

    @Test
    public void itShouldRejectGetToMetadataGcpAndRedirect() throws IOException {
        MockWebServer mockWebServer = new MockWebServer();
        MockResponse mockRedirectResponse = new MockResponse()
                .setResponseCode(301)
                .addHeader("Location", "http://metadata.google.internal");
        mockWebServer.enqueue(mockRedirectResponse);
        mockWebServer.start();

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(elasticInstanceCredentials);
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("http://" + mockWebServer.getHostName());
        endpoint.setPort((long) mockWebServer.getPort());
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setPath("/");

        final Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    assertEquals("Host metadata.google.internal is not allowed", result.getPluginErrorDetails().getDownstreamErrorMessage());
                })
                .verifyComplete();
    }

    @Test
    public void verifyUniquenessOfElasticSearchPluginErrorCode() {
        assert (Arrays.stream(ElasticSearchPluginError.values()).map(ElasticSearchPluginError::getAppErrorCode).distinct().count() == ElasticSearchPluginError.values().length);

        assert (Arrays.stream(ElasticSearchPluginError.values()).map(ElasticSearchPluginError::getAppErrorCode)
                .filter(appErrorCode-> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-ELS"))
                .collect(Collectors.toList()).size() == 0);

    }

}
