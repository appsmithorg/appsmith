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
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
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
            final Map<String, Object> parameters = command.getParameters();

            final Map<String, Object> correctedCaseParameters = new HashMap<>();
            for (final Map.Entry<String, Object> entry : parameters.entrySet()) {
                correctedCaseParameters.put(
                        entry.getKey().substring(0, 1).toLowerCase() + entry.getKey().substring(1),
                        entry.getValue()
                );
            }

            // Get the class implementing this DynamoDB action.
            final Class<?> actionClass;
            try {
                actionClass = Class.forName("com.external.plugins.dynamodb.actions." + action);
            } catch (ClassNotFoundException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Action class not found for `" + action + "`."));
            }

            // Get the "execute" method in that action class.
            final Optional<Method> executeMethod = Arrays
                    .stream(actionClass.getMethods())
                    .filter(method -> "execute".equals(method.getName()))
                    .findFirst();

            if (executeMethod.isEmpty()) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Missing execute method on action class for action `" + action + "`."));
            }

            try {
                result.setBody(executeMethod.get().invoke(
                        null,
                        ddb,
                        objectMapper.convertValue(
                                correctedCaseParameters,
                                Class.forName(actionClass.getName() + "$Parameters")
                        )
                ));
            } catch (IllegalAccessException | InvocationTargetException | ClassNotFoundException e) {
                return Mono.error(e);
            }

            log.debug("In the DynamoPlugin, got action execution result: " + result.toString());
            result.setIsExecutionSuccess(true);
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
