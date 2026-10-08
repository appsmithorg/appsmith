package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockingDetails;
import static org.mockito.Mockito.verifyNoInteractions;

/** Actions are limited to the ones the query editor offers; other DynamoDB operations are unknown actions. */
class DynamoPluginUnknownActionTest {

    private static final DynamoPlugin.DynamoPluginExecutor EXECUTOR = new DynamoPlugin.DynamoPluginExecutor();

    @ParameterizedTest
    @ValueSource(
            strings = {
                "BatchExecuteStatement",
                "DeleteResourcePolicy",
                "DescribeExport",
                "DescribeImport",
                "DescribeKinesisStreamingDestination",
                "DisableKinesisStreamingDestination",
                "EnableKinesisStreamingDestination",
                "ExecuteStatement",
                "ExecuteTransaction",
                "ExportTableToPointInTime",
                "GetResourcePolicy",
                "ImportTable",
                "ListExports",
                "ListImports",
                "PutResourcePolicy",
                "SearchVectors",
                "UpdateKinesisStreamingDestination"
            })
    void should_reportUnknownAction_when_operationIsNotAnEditorAction(String action) {
        // Given
        DynamoDbClient client = mock(DynamoDbClient.class);
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setPath(action);
        configuration.setBody("{}");

        // When
        ActionExecutionResult result = EXECUTOR.execute(client, new DatasourceConfiguration(), configuration)
                .block(Duration.ofSeconds(30));

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getStatusCode()).isEqualTo("PE-DYN-5001");
        assertThat(result.getPluginErrorDetails().getAppsmithErrorMessage())
                .isEqualTo("Unknown action: `" + action + "`. Note that action names are case-sensitive.");
        assertThat(result.getBody()).isEqualTo("software.amazon.awssdk.services.dynamodb.model." + action + "Request");
        verifyNoInteractions(client);
    }

    static Stream<String> editorActions() {
        List<String> actions = new ArrayList<>();
        JsonNode editor = CharacterizationGolden.readResource("editor.json");
        for (JsonNode control : editor.findParents("configProperty")) {
            if ("actionConfiguration.path".equals(control.get("configProperty").asText())) {
                control.get("options")
                        .forEach(option -> actions.add(option.get("value").asText()));
            }
        }
        return actions.stream();
    }

    @ParameterizedTest
    @MethodSource("editorActions")
    void should_runActionOnClient_when_actionIsAnEditorAction(String action) {
        // Given
        DynamoDbClient client = mock(DynamoDbClient.class);
        ActionConfiguration configuration = new ActionConfiguration();
        configuration.setPath(action);

        // When
        ActionExecutionResult result = EXECUTOR.execute(client, new DatasourceConfiguration(), configuration)
                .block(Duration.ofSeconds(30));

        // Then
        assertThat(result.getStatusCode()).isNotEqualTo("PE-DYN-5001");
        assertThat(mockingDetails(client).getInvocations()).hasSize(1);
    }

    @Test
    void should_allowExactlyTheEditorActions_when_actionsAreListed() {
        // Given
        List<String> editorActions = editorActions().toList();

        // When
        Set<String> allowedActions = DynamoPlugin.ACTIONS;

        // Then
        assertThat(allowedActions).containsExactlyInAnyOrderElementsOf(editorActions);
    }
}
