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

        client.close();

        dsConfig.setEndpoints(List.of(new Endpoint("localhost", port.longValue())));
    }

    private Mono<ActionExecutionResult> execute(String body) {
        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(body);

        return pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));
    }

    @Test
    public void testValidJsonApiExecution() {
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

}
