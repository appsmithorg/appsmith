package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.RequestParamDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHost;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.RestClient;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.springframework.http.HttpMethod;
import org.testcontainers.elasticsearch.ElasticsearchContainer;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

@Slf4j
public class ElasticSearchPluginTest {
    ElasticSearchPlugin.ElasticSearchPluginExecutor pluginExecutor = new ElasticSearchPlugin.ElasticSearchPluginExecutor();

    @ClassRule
    public static final ElasticsearchContainer container = new ElasticsearchContainer("docker.elastic.co/elasticsearch/elasticsearch:7.12.1")
            .withEnv("discovery.type", "single-node");

    private static final DatasourceConfiguration dsConfig = new DatasourceConfiguration();
    private static String host;
    private static Integer port;

    @BeforeClass
    public static void setUp() throws IOException {
        port = container.getMappedPort(9200);
        host = "http://" + container.getContainerIpAddress();

        final RestClient client = RestClient.builder(
                new HttpHost(container.getContainerIpAddress(), port, "http")
        ).build();

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

        dsConfig.setEndpoints(List.of(new Endpoint(host, port.longValue())));
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
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY,  contentJson, null, null, null));
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

        Assert.assertEquals(Set.of("No endpoint provided. Please provide a host:port where ElasticSearch is reachable."),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyPort() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        Assert.assertEquals(Set.of("Missing port for endpoint"),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyHost() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint();
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        Assert.assertEquals(Set.of("Missing host for endpoint"),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithMissingEndpoint() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        Endpoint endpoint = new Endpoint();
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        Assert.assertEquals(Set.of("Missing port for endpoint", "Missing host for endpoint"),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void itShouldValidateDatasourceWithEndpointNoProtocol() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("localhost");
        endpoint.setPort(Long.valueOf(port));
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        Assert.assertEquals(Set.of("Invalid host provided. It should be of the form http(s)://your-es-url.com"),
                pluginExecutor.validateDatasource(datasourceConfiguration)
        );
    }

    @Test
    public void itShouldTestDatasourceWithInvalidEndpoint() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
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
}
