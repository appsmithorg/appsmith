package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.BooleanUtils;
import org.apache.commons.lang.ObjectUtils;
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

import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    public static class DynamoPluginExecutor implements PluginExecutor<DynamoDbClient> {

        @Override
        public Mono<ActionExecutionResult> execute(DynamoDbClient ddb,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            ActionExecutionResult result = new ActionExecutionResult();

            final Command command;

            try {
                command = objectMapper.readValue(actionConfiguration.getBody(), Command.class);
            } catch (MismatchedInputException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Mismatched input types. Need `action` string and `parameters` object."));
            } catch (IOException e) {
                e.printStackTrace();
                return Mono.just(result);
            }

            final String action = command.getAction();
            final Map parameters = command.getParameters();

            if ("ListTables".equalsIgnoreCase(action)) {
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

                        final Map<String, Object> body = new LinkedHashMap<>();
                        body.put("tables", ObjectUtils.defaultIfNull(tableNames, Collections.emptyList()));
                        body.put("lastEvaluatedTableName", response.lastEvaluatedTableName());
                        result.setBody(body);

                    } catch (DynamoDbException e) {
                        return Mono.error(e);

                    }
                }

            } else {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unknown command `" + action + "`."));

            }

            result.setBody("result");
            result.setIsExecutionSuccess(true);
            log.debug("In the DynamoPlugin, got action execution result: " + result.toString());
            return Mono.just(result);
        }

        @Override
        public Mono<DynamoDbClient> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            final AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();
            if (authentication == null) {
                return Mono.empty();
            }

            DynamoDbClient ddb = DynamoDbClient.builder()
                    .region(Region.of(authentication.getDatabaseName()))
                    .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(authentication.getUsername(), authentication.getPassword())))
                    .build();

            return Mono.justOrEmpty(ddb);
        }

        @Override
        public void datasourceDestroy(DynamoDbClient client) {
            if (client != null) {
                client.close();
            }
        }

        @Override
        public Set<String> validateDatasource(@NonNull DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                .map(client -> {
                    client.close();
                    return true;
                })
                .defaultIfEmpty(false)
                .map(isValid -> BooleanUtils.isTrue(isValid)
                        ? new DatasourceTestResult()
                        : new DatasourceTestResult("Unable to create DynamoDB Client.")
                );
        }

    }

}
