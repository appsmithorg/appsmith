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
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.BooleanUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.awscore.client.handler.AwsSyncClientHandler;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.core.client.config.SdkClientConfiguration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.ListTablesRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public class DynamoPlugin extends BasePlugin {

    private static final ObjectMapper objectMapper1 = new ObjectMapper();

    static {
        objectMapper1.enable(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES);
    }

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
                command = objectMapper1.readValue(actionConfiguration.getBody(), Command.class);
            } catch (MismatchedInputException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Mismatched input types. Need `action` string and `parameters` object."));
            } catch (IOException e) {
                e.printStackTrace();
                return Mono.just(result);
            }

            final String action = command.getAction();
            final Map<String, Object> parameters = command.getParameters();

            new AwsSyncClientHandler(SdkClientConfiguration.builder().build());

            try {
                if ("ListTables".equals(action)) {
                    ListTablesRequest request = convertValue(parameters, ListTablesRequest.class);
                    result.setBody(ddb.listTables(request));
                } else if ("PutItem".equals(action)) {
                    PutItemRequest request = convertValue(parameters, PutItemRequest.class);
                    result.setBody(ddb.putItem(request));
                } else {
                    result.setBody("Unknown action " + action);
                }
            } catch (IllegalAccessException | InvocationTargetException | NoSuchMethodException | InstantiationException e) {
                e.printStackTrace();
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
/*
            try {
                result.setBody(executeMethod.get().invoke(
                        null,
                        ddb,
                        objectMapper1.convertValue(
                                parameters,
                                Class.forName(actionClass.getName() + "$Parameters")
                        )
                ));
            } catch (IllegalAccessException | InvocationTargetException | ClassNotFoundException e) {
                return Mono.error(e);
            }
*/
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

    private static <T> T convertValue(Map<String, Object> mapping, Class<T> type)
            throws IllegalAccessException, InvocationTargetException, NoSuchMethodException, InstantiationException {
        final Class<?> builderType;
        try {
            builderType = Class.forName(type.getName() + "$Builder");
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
            return null;
        }

        final Object builder = type.getMethod("builder").invoke(null);

        for (final Map.Entry<String, Object> entry : mapping.entrySet()) {
            final String key = entry.getKey();
            Object value = entry.getValue();

            String setterName1 = key;

            if ("NULL".equals(setterName1)) {
                // Since `null` is a reserved word in Java, AWS_SDK uses `nul` for this field.
                setterName1 = "nul";
            } else if (isUpperCase(setterName1)) {
                setterName1 = setterName1.toLowerCase();
            } else {
                setterName1 = setterName1.substring(0, 1).toLowerCase() + setterName1.substring(1);
            }
            final String setterName = setterName1;

            if (value instanceof String) {
                final Method setterMethod = Arrays.stream(builderType.getMethods()).filter(m -> m.getName().equals(setterName))
                        .findFirst()
                        .orElse(null);
                if (SdkBytes.class.isAssignableFrom(setterMethod.getParameterTypes()[0])) {
                    value = SdkBytes.fromUtf8String((String) value);
                }
                setterMethod.invoke(builder, value);

            } else if (value instanceof Boolean) {
                builderType.getMethod(setterName, Boolean.class).invoke(builder, value);

            } else if (value instanceof Integer) {
                builderType.getMethod(setterName, Integer.class).invoke(builder, value);

            } else if (value instanceof Map) {
                Map<String, Object> valueAsMap = (Map) value;
                final Method setterMethod = Arrays.stream(builderType.getMethods())
                        .filter(m -> m.getName().equals(setterName))
                        .findFirst()
                        .orElse(null);
                final ParameterizedType valueType = (ParameterizedType) setterMethod.getGenericParameterTypes()[0];
                for (final String innerKey : valueAsMap.keySet()) {
                    final Object innerValue = valueAsMap.get(innerKey);
                    if (innerValue instanceof Map) {
                        valueAsMap.put(innerKey, convertValue((Map) innerValue, (Class<?>) valueType.getActualTypeArguments()[1]));
                    }
                }
                if (!Map.class.isAssignableFrom((Class<?>) valueType.getRawType())) {
                    value = convertValue((Map) value, (Class<T>) valueType.getRawType());
                }
                setterMethod.invoke(builder, value);

            } else if (value instanceof Collection) {
                final Collection valueAsCollection = (Collection) value;
                final Method setterMethod = Arrays.stream(builderType.getMethods())
                        // Find method by name and exclude the varargs version of the method.
                        .filter(m -> m.getName().equals(setterName) && !m.getParameterTypes()[0].getName().startsWith("[L"))
                        .findFirst()
                        .orElse(null);
                final ParameterizedType valueType = (ParameterizedType) setterMethod.getGenericParameterTypes()[0];
                final Collection reTypedList = valueAsCollection.getClass().getConstructor().newInstance();
                for (final Object innerValue : valueAsCollection) {
                    if (innerValue instanceof Map) {
                        reTypedList.add(convertValue((Map) innerValue, (Class<?>) valueType.getActualTypeArguments()[0]));
                    } else if (innerValue instanceof String && SdkBytes.class.isAssignableFrom((Class<?>) valueType.getActualTypeArguments()[0])) {
                        reTypedList.add(SdkBytes.fromUtf8String((String) innerValue));
                    } else {
                        reTypedList.add(innerValue);
                    }
                }
                setterMethod.invoke(builder, reTypedList);

            } else {
                System.out.println("Unknown value type while deserializing: " + value.getClass().getName());

            }
        }

        final T out = (T) builderType.getMethod("build").invoke(builder);
        System.out.println("out " + out);
        return out;
    }

    private static boolean isUpperCase(String s) {
        for (char c : s.toCharArray()) {
            if (!Character.isUpperCase(c)) {
                return false;
            }
        }
        return true;
    }

}
