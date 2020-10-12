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
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.core.SdkField;
import software.amazon.awssdk.core.SdkPojo;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbResponse;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class DynamoPlugin extends BasePlugin {

    public DynamoPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    /**
     * Dynamo plugin receives the query as json of the following format:
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

            // new AwsSyncClientHandler(SdkClientConfiguration.builder().build());

            final Class<?> requestClass;
            try {
                requestClass = Class.forName("software.amazon.awssdk.services.dynamodb.model." + action + "Request");
            } catch (ClassNotFoundException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Unknown action: `" + action + "`. Note that action names are case-sensitive."
                ));
            }

            try {
                final Method actionExecuteMethod = DynamoDbClient.class.getMethod(action.substring(0, 1).toLowerCase() + action.substring(1), requestClass);
                final DynamoDbResponse response = (DynamoDbResponse) actionExecuteMethod.invoke(ddb, convertValue(parameters, requestClass));
                result.setBody(responseToPlain(response));
            } catch (InvocationTargetException | IllegalAccessException | NoSuchMethodException | InstantiationException e) {
                return Mono.error(e.getCause() == null ? e : e.getCause());
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
                final Method setterMethod = Arrays.stream(builderType.getMethods())
                        .filter(m -> {
                            final Class<?> parameterType = m.getParameterTypes()[0];
                            return m.getName().equals(setterName)
                                    && (SdkBytes.class.isAssignableFrom(parameterType) || String.class.isAssignableFrom(parameterType));
                        })
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
                for (final Map.Entry<String, Object> innerEntry : valueAsMap.entrySet()) {
                    final Object innerValue = innerEntry.getValue();
                    if (innerValue instanceof Map) {
                        valueAsMap.put(
                                innerEntry.getKey(),
                                convertValue((Map) innerValue, (Class<?>) valueType.getActualTypeArguments()[1])
                        );
                    }
                }
                if (!Map.class.isAssignableFrom((Class<?>) valueType.getRawType())) {
                    value = convertValue((Map) value, (Class<T>) valueType.getRawType());
                }
                setterMethod.invoke(builder, value);

            } else if (value instanceof Collection) {
                final Collection<Object> valueAsCollection = (Collection) value;
                final Method setterMethod = Arrays.stream(builderType.getMethods())
                        // Find method by name and exclude the varargs version of the method.
                        .filter(m -> m.getName().equals(setterName) && !m.getParameterTypes()[0].getName().startsWith("[L"))
                        .findFirst()
                        .orElse(null);
                final ParameterizedType valueType = (ParameterizedType) setterMethod.getGenericParameterTypes()[0];
                final Collection<Object> reTypedList = valueAsCollection.getClass().getConstructor().newInstance();
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

        return (T) builderType.getMethod("build").invoke(builder);
    }

    private static Map<String, Object> responseToPlain(SdkPojo response) {
        final Map<String, Object> plain = new HashMap<>();

        for (final SdkField<?> field : response.sdkFields()) {
            Object value = field.getValueOrDefault(response);

            if (value instanceof SdkPojo) {
                value = responseToPlain((SdkPojo) value);

            } else if (value instanceof Map) {
                final Map<String, Object> valueAsMap = (Map) value;
                final Map<String, Object> plainMap = new HashMap<>();
                for (final Map.Entry<String, Object> entry : valueAsMap.entrySet()) {
                    final var key = entry.getKey();
                    Object innerValue = entry.getValue();
                    if (innerValue instanceof SdkPojo) {
                        innerValue = responseToPlain((SdkPojo) innerValue);
                    }
                    plainMap.put(key, innerValue);
                }
                value = plainMap;

            }

            plain.put(field.memberName(), value);
        }

        return plain;
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
