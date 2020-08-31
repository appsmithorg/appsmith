package com.external.plugins;

import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.elasticsearch.ElasticsearchContainer;

@Slf4j
public class ElasticSearchPluginTest {
    ElasticSearchPlugin.ElasticSearchPluginExecutor pluginExecutor = new ElasticSearchPlugin.ElasticSearchPluginExecutor();

    @ClassRule
    public static final ElasticsearchContainer container = new ElasticsearchContainer()
            .withEnv("","");

    @Before
    public void setUp() {

    }

    @Test
    public void testValidJsonApiExecution() {
        container.start();
        System.out.println("-=-=--=-=-=-=-=-=-=-=-=-=-=----=-=-=-=-=-=-=-=-=--=-=");
        System.out.println(container.getHttpHostAddress());
        System.out.println("-=-=--=-=-=-=-=-=-=-=-=-=-=----=-=-=-=-=-=-=-=-=--=-=");
        pluginExecutor.esTest(container.getHttpHostAddress());
    }
}
