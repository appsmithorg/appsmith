package com.external.plugins;

import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHost;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.Response;
import org.elasticsearch.client.RestClient;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.elasticsearch.ElasticsearchContainer;

import java.io.IOException;

@Slf4j
public class ElasticSearchPluginTest {
    ElasticSearchPlugin.ElasticSearchPluginExecutor pluginExecutor = new ElasticSearchPlugin.ElasticSearchPluginExecutor();

    @ClassRule
    public static final ElasticsearchContainer container = new ElasticsearchContainer()
            .withEnv("discovery.type", "single-node");

    @BeforeClass
    public static void setUp() throws IOException {
        final RestClient client = RestClient.builder(
                new HttpHost("localhost", container.getMappedPort(9200), "http")
        ).build();

        final Request request = new Request("PUT", "/target1/_create/id1");
        request.setJsonEntity("{\"name\": \"Mercury\"}");
        final Response response = client.performRequest(request);
        log.info("Response: {}", response.toString());

        client.close();
    }

    @Test
    public void testValidJsonApiExecution() {
        container.start();
        System.out.println("-=-=--=-=-=-=-=-=-=-=-=-=-=----=-=-=-=-=-=-=-=-=--=-=");
        System.out.println(container.getHttpHostAddress());
        System.out.println("-=-=--=-=-=-=-=-=-=-=-=-=-=----=-=-=-=-=-=-=-=-=--=-=");
    }
}
