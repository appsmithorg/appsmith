package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import org.junit.jupiter.api.Assertions;
import org.testcontainers.containers.BindMode;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Testcontainers
public class GrpcPluginTest {
    GrpcPlugin.GrpcPluginExecutor pluginExecutor = new GrpcPlugin.GrpcPluginExecutor();

    @Container
    public static GenericContainer grpcContainer = new GenericContainer(CompletableFuture.completedFuture("gerritforge/gripmock"))
            .withClasspathResourceMapping("Chat.proto",
                    "/proto/Chat.proto",
                    BindMode.READ_ONLY)
            .withClasspathResourceMapping("/mystubs",
                    "/stub",
                    BindMode.READ_ONLY)
            .withCommand("--stub=/stub", "/proto/Chat.proto")
            .withExposedPorts(4770)
            .waitingFor(Wait.forLogMessage("Serving gRPC.*", 1));

    @Test
    public void testConnection() {
        DatasourceConfiguration dc = DatasourceConfiguration.builder()
                .url(grpcContainer.getHost() + ":" + grpcContainer.getFirstMappedPort())
                .properties(List.of(new Property("Reflection Timeout", "60"), new Property("TLS", false)))
                .headers(List.of(new Property("X-Origin-Service", "appsmith")))
                .build();
        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(dc);

        StepVerifier.create(datasourceTestResultMono)
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testExecute() {
        DatasourceConfiguration dc = DatasourceConfiguration.builder()
                .url(grpcContainer.getHost() + ":" + grpcContainer.getFirstMappedPort())
                .properties(List.of(new Property("Reflection Timeout", "60"), new Property("TLS", false)))
                .headers(List.of(new Property("X-Origin-Service", "appsmith")))
                .build();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(
                Map.of(
                        "service", Map.of("data", "com.example.grpc.chat.ChatService"),
                        "endpoint", Map.of("data", "chat"),
                        "body", Map.of("data", "{\n" +
                                "  \"from\": \"From\",\n" +
                                "  \"message\": \"Message\"\n" +
                                "}")
                )
        );

        Mono<ActionExecutionResult> actionExecutionResultMono = pluginExecutor.datasourceCreate(dc)
                .flatMap((connection) -> pluginExecutor.executeParameterized(
                        connection,
                        new ExecuteActionDTO(),
                        dc,
                        actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext((actionExecutionResult -> {
                    Assertions.assertNotNull(actionExecutionResult);
                    Assertions.assertEquals(true, actionExecutionResult.getIsExecutionSuccess());
                }))
                .verifyComplete();
    }

    @Test
    public void testExecuteStream() {
        DatasourceConfiguration dc = DatasourceConfiguration.builder()
                .url(grpcContainer.getHost() + ":" + grpcContainer.getFirstMappedPort())
                .properties(List.of(new Property("Reflection Timeout", "60"), new Property("TLS", false)))
                .headers(List.of(new Property("X-Origin-Service", "appsmith")))
                .build();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(
                Map.of(
                        "service", Map.of("data", "com.example.grpc.chat.ChatService"),
                        "endpoint", Map.of("data", "chatStream"),
                        "body", Map.of("data", "{\n" +
                                "  \"from\": \"From\",\n" +
                                "  \"message\": \"Message\"\n" +
                                "}")
                )
        );

        Mono<ActionExecutionResult> actionExecutionResultMono = pluginExecutor.datasourceCreate(dc)
                .flatMap((connection) -> pluginExecutor.executeParameterized(
                        connection,
                        new ExecuteActionDTO(),
                        dc,
                        actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext((actionExecutionResult -> {
                    Assertions.assertNotNull(actionExecutionResult);
                    Assertions.assertEquals(true, actionExecutionResult.getIsExecutionSuccess());
                }))
                .verifyComplete();
    }
    @Test
    public void testExecuteBidirectionalStream() {
        DatasourceConfiguration dc = DatasourceConfiguration.builder()
                .url(grpcContainer.getHost() + ":" + grpcContainer.getFirstMappedPort())
                .properties(List.of(new Property("Reflection Timeout", "60"), new Property("TLS", false)))
                .headers(List.of(new Property("X-Origin-Service", "appsmith")))
                .build();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(
                Map.of(
                        "service", Map.of("data", "com.example.grpc.chat.ChatService"),
                        "endpoint", Map.of("data", "chatBidirectionalStream"),
                        "body", Map.of("data", "{\n" +
                                "  \"from\": \"From\",\n" +
                                "  \"message\": \"Message\"\n" +
                                "}")
                )
        );

        Mono<ActionExecutionResult> actionExecutionResultMono = pluginExecutor.datasourceCreate(dc)
                .flatMap((connection) -> pluginExecutor.executeParameterized(
                        connection,
                        new ExecuteActionDTO(),
                        dc,
                        actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext((actionExecutionResult -> {
                    Assertions.assertNotNull(actionExecutionResult);
                    Assertions.assertEquals(true, actionExecutionResult.getIsExecutionSuccess());
                }))
                .verifyComplete();
    }
}
