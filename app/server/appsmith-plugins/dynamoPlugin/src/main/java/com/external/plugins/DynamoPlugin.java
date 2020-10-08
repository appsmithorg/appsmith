package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbException;
import software.amazon.awssdk.services.dynamodb.model.ListTablesRequest;
import software.amazon.awssdk.services.dynamodb.model.ListTablesResponse;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class DynamoPlugin extends BasePlugin {

    public DynamoPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    /**
     * Dynamo plugin receives the query as json of the following format :
     */

    @Slf4j
    @Extension
    public static class DynamoPluginExecutor implements PluginExecutor<Connection> {

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            DynamoDbClient ddb = DynamoDbClient.builder()
                    .region(Region.AP_SOUTH_1)
                    .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create("", "")))
                    .build();

            boolean moreTables = true;
            String lastName = null;

            while(moreTables) {
                try {
                    ListTablesResponse response = null;
                    if (lastName == null) {
                        ListTablesRequest request = ListTablesRequest.builder().build();
                        response = ddb.listTables(request);
                    } else {
                        ListTablesRequest request = ListTablesRequest.builder()
                                .exclusiveStartTableName(lastName).build();
                        response = ddb.listTables(request);
                    }

                    List<String> tableNames = response.tableNames();

                    if (!tableNames.isEmpty()) {
                        for (String curName : tableNames) {
                            System.out.format("* %s\n", curName);
                        }
                    } else {
                        System.out.println("No tables found!");
                        System.exit(0);
                    }

                    lastName = response.lastEvaluatedTableName();
                    if (lastName == null) {
                        moreTables = false;
                    }
                } catch (DynamoDbException e) {
                    System.err.println(e.getMessage());
                    System.exit(1);
                }
            }

            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody("result");
            result.setIsExecutionSuccess(true);
            log.debug("In the DynamoPlugin, got action execution result: " + result.toString());
            return Mono.just(result);
        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return Mono.empty();
        }

        @Override
        public void datasourceDestroy(Connection connection) {
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                log.error("Error closing Dynamo Connection.", e);
            }
        }

        @Override
        public Set<String> validateDatasource(@NonNull DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Mono.just(new DatasourceTestResult());
        }

    }

}
