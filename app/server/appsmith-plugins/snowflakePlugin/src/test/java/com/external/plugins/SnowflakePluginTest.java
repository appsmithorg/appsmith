package com.external.plugins;

import com.appsmith.external.models.ActionExecutionResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.log4j.Log4j;
import org.junit.Assert;
import org.junit.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;

import static org.junit.Assert.assertNotNull;

@Log4j
public class SnowflakePluginTest {

    SnowflakePlugin.SnowflakePluginExecutor pluginExecutor = new SnowflakePlugin.SnowflakePluginExecutor();

    @Test
    public void testConnectSnowflakeConnection() {
        Mono<Connection> connectionMono = pluginExecutor.datasourceCreate(null);
        StepVerifier.create(connectionMono)
                .assertNext(conn -> {
                    System.out.println(conn.toString());
                    assertNotNull(conn);
                })
                .verifyComplete();
        Assert.assertTrue(true);
    }

    @Test
    public void executeTest() {
        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(null)
                .flatMap(conn -> pluginExecutor.execute(conn, null, null));
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    System.out.println(node.toString());
                })
                .verifyComplete();
    }

}
