package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHost;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.RestClient;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.elasticsearch.ElasticsearchContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

@Slf4j
public class ElasticSearchPluginTest {
    ElasticSearchPlugin.ElasticSearchPluginExecutor pluginExecutor = new ElasticSearchPlugin.ElasticSearchPluginExecutor();

    @ClassRule
    public static final ElasticsearchContainer container =
            new ElasticsearchContainer("docker.elastic.co/elasticsearch/elasticsearch:6.4.1")
                    .withEnv("discovery.type", "single-node");

    private static final DatasourceConfiguration dsConfig = new DatasourceConfiguration();

    @BeforeClass
    public static void setUp() throws IOException {
        final Integer port = container.getMappedPort(9200);

        final RestClient client = RestClient.builder(
                new HttpHost("localhost", port, "http")
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

        dsConfig.setEndpoints(List.of(new Endpoint("localhost", port.longValue())));
    }

    private Mono<ActionExecutionResult> execute(String contentJson) {
        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(contentJson);

        return pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));
    }

    @Test
    public void testGet() {
        StepVerifier.create(execute("{\"method\": \"GET\", \"path\": \"/planets/doc/id1\"}"))
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
                "  \"method\": \"GET\",\n" +
                "  \"path\": \"/planets/_mget\",\n" +
                "  \"body\": {\n" +
                "    \"docs\": [\n" +
                "      {\n" +
                "        \"_index\": \"planets\",\n" +
                "        \"_id\": \"id1\"\n" +
                "      },\n" +
                "      {\n" +
                "        \"_index\": \"planets\",\n" +
                "        \"_id\": \"id2\"\n" +
                "      }\n" +
                "    ]\n" +
                "  }\n" +
                "}";
        StepVerifier.create(execute(contentJson))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final List<Map> docs = ((Map<String, List<Map>>) result.getBody()).get("docs");
                    assertEquals(2, docs.size());
                })
                .verifyComplete();
    }

    @Test
    public void testPutCreate() {
        final String contentJson = "{\n\"method\": \"PUT\", \"path\": \"/planets/doc/id9\", \"body\": {\"name\": \"Pluto\"}}";
        StepVerifier.create(execute(contentJson))
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
        final String contentJson = "{\n\"method\": \"PUT\", \"path\": \"/planets/doc/id2\", \"body\": {\"name\": \"New Venus\"}}";
        StepVerifier.create(execute(contentJson))
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
        final String contentJson = "{\n\"method\": \"DELETE\", \"path\": \"/planets/doc/id3\"}";
        StepVerifier.create(execute(contentJson))
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

}
