package com.external.plugins;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

/** The plugin's ways of creating a DynamoDB client for a datasource. */
enum DynamoClientPath {
    /**
     * {@code datasourceCreate(configuration)} and {@code testDatasource(configuration)}: what the server calls when the
     * {@code release_dynamodb_connection_time_to_live_enabled} flag is off.
     */
    WITHOUT_FLAG,
    /** {@code datasourceCreate(configuration, false)} and {@code testDatasource(configuration, false)}. */
    FLAG_OFF,
    /**
     * {@code datasourceCreate(configuration, true)} and {@code testDatasource(configuration, true)}: what the server
     * calls when the flag is on.
     */
    FLAG_ON;

    private static final DynamoPlugin.DynamoPluginExecutor EXECUTOR = new DynamoPlugin.DynamoPluginExecutor();

    Mono<DynamoDbClient> create(DatasourceConfiguration datasource) {
        return switch (this) {
            case WITHOUT_FLAG -> EXECUTOR.datasourceCreate(datasource);
            case FLAG_OFF -> EXECUTOR.datasourceCreate(datasource, false);
            case FLAG_ON -> EXECUTOR.datasourceCreate(datasource, true);
        };
    }

    Mono<DatasourceTestResult> test(DatasourceConfiguration datasource) {
        return switch (this) {
            case WITHOUT_FLAG -> EXECUTOR.testDatasource(datasource);
            case FLAG_OFF -> EXECUTOR.testDatasource(datasource, false);
            case FLAG_ON -> EXECUTOR.testDatasource(datasource, true);
        };
    }
}
