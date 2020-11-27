package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.BooleanUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.core.SdkField;
import software.amazon.awssdk.core.SdkPojo;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClientBuilder;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbResponse;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;

public class DynamoPlugin extends BasePlugin {

    public DynamoPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    /**
     * Dynamo plugin receives the query as json of the following format:
     * {
     *     "action": "GetItem",
     *     "parameters": {...}  // Depends on the action above.
     * }
     *
     * DynamoDB actions and parameters reference:
     * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Operations_Amazon_DynamoDB.html
     */

    @Slf4j
    @Extension
    public static class DynamoPluginExecutor implements PluginExecutor<DynamoDbClient> {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        @Override
        public Mono<ActionExecutionResult> execute(DynamoDbClient ddb,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            return (Mono<ActionExecutionResult>) Mono.fromCallable(() -> {
                ActionExecutionResult result = new ActionExecutionResult();

                final String action = actionConfiguration.getPath();
                if (StringUtils.isEmpty(action)) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Missing action name (like `ListTables`, `GetItem` etc.)."
                    ));
                }

                final String body = actionConfiguration.getBody();
                Map<String, Object> parameters = null;
                try {
                    if (!StringUtils.isEmpty(body)) {
                        parameters = objectMapper.readValue(body, HashMap.class);
                    }
                } catch (IOException e) {
                    final String message = "Error parsing the JSON body: " + e.getMessage();
                    log.warn(message, e);
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, message));
                }

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
                    final Method actionExecuteMethod = DynamoDbClient.class.getMethod(
                            // Convert `ListTables` to `listTables`, which is the name of the method to execute this action.
                            toLowerCamelCase(action),
                            requestClass
                    );
                    final DynamoDbResponse response = (DynamoDbResponse) actionExecuteMethod.invoke(ddb, plainToSdk(parameters, requestClass));
                    result.setBody(sdkToPlain(response));
                } catch (AppsmithPluginException | InvocationTargetException | IllegalAccessException | NoSuchMethodException | ClassNotFoundException e) {
                    final String message = "Error executing the DynamoDB Action: " + (e.getCause() == null ? e : e.getCause()).getMessage();
                    log.warn(message, e);
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, message));
                }

                result.setIsExecutionSuccess(true);
                System.out.println(Thread.currentThread().getName() + ": In the DynamoPlugin, got action execution result: " + result.toString());
                return Mono.just(result);
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<DynamoDbClient> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            return (Mono<DynamoDbClient>) Mono.fromCallable(() -> {
                final DynamoDbClientBuilder builder = DynamoDbClient.builder();

                if (!CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                    final Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                    builder.endpointOverride(URI.create("http://" + endpoint.getHost() + ":" + endpoint.getPort()));
                }

                final AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();
                if (authentication == null || StringUtils.isEmpty(authentication.getDatabaseName())) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Missing region in datasource."
                    ));
                }

                builder.region(Region.of(authentication.getDatabaseName()));

                builder.credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(authentication.getUsername(), authentication.getPassword())
                ));

                return Mono.justOrEmpty(builder.build());
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
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

            final AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();
            if (authentication == null) {
                invalids.add("Missing AWS Access Key ID and Secret Access Key.");
            } else {
                if (StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add("Missing AWS Access Key ID.");
                }

                if (StringUtils.isEmpty(authentication.getPassword())) {
                    invalids.add("Missing AWS Secret Access Key.");
                }

                if (StringUtils.isEmpty(authentication.getDatabaseName())) {
                    invalids.add("Missing region configuration.");
                }
            }

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
                    )
                    .subscribeOn(scheduler);
        }

    }

    private static String toLowerCamelCase(String action) {
        return action.substring(0, 1).toLowerCase() + action.substring(1);
    }

    /**
     * Given a map that conforms to what a valid DynamoDB request should look like, this function will convert into
     * a DynamoDBRequest object from AWS SDK. This is done using Java's reflection API.
     * @param mapping Mapping object representing the request details.
     * @param type Request type that should be created. Eg., ListTablesRequest.class, PutItemRequest.class etc.
     * @param <T> Type param of the request class.
     * @return An object of the request class, containing details of the request from the mapping.
     * @throws IllegalAccessException Thrown if any of the SDK methods' contracts change.
     * @throws InvocationTargetException Thrown if any of the SDK methods' contracts change.
     * @throws NoSuchMethodException Thrown if any of the SDK methods' contracts change.
     * @throws ClassNotFoundException Thrown if any of the builder class could not be found corresponding to the action class.
     */
    public static <T> T plainToSdk(Map<String, Object> mapping, Class<T> type)
            throws IllegalAccessException, InvocationTargetException, NoSuchMethodException,
            AppsmithPluginException, ClassNotFoundException {

        final Class<?> builderType = Class.forName(type.getName() + "$Builder");

        final Object builder = type.getMethod("builder").invoke(null);

        if (mapping != null) {
            for (final Map.Entry<String, Object> entry : mapping.entrySet()) {
                final String setterName = getSetterMethodName(entry.getKey());
                Object value = entry.getValue();

                if (value instanceof String) {
                    // AWS SDK has two data types that are represented as Strings in JSON, namely strings and binary.
                    // We look at the parameter types for the setter method to decide which it should be, and then set
                    // convert the value if needed before calling the setter.
                    final Method setterMethod = findMethod(builderType, method -> {
                        final Class<?>[] parameterTypes = method.getParameterTypes();
                        return method.getName().equals(setterName)
                                && (SdkBytes.class.isAssignableFrom(parameterTypes[0]) || String.class.isAssignableFrom(parameterTypes[0]));
                    });
                    if (setterMethod == null) {
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Invalid attribute/value by name " + entry.getKey()
                        );
                    }
                    if (SdkBytes.class.isAssignableFrom(setterMethod.getParameterTypes()[0])) {
                        value = SdkBytes.fromUtf8String((String) value);
                    }
                    setterMethod.invoke(builder, value);

                } else if (value instanceof Boolean
                        || value instanceof Integer
                        || value instanceof Float
                        || value instanceof Double) {
                    // These data types have a setter method that takes a the value as is. Nothing fancy here.
                    builderType.getMethod(setterName, value.getClass()).invoke(builder, value);

                } else if (value instanceof Map) {
                    // For maps, we go recursive, applying this transformation to each value, and replacing with the
                    // result in the map. Generic types in the setter method's signature are used to convert the values.
                    final Method setterMethod = findMethod(builderType, m -> m.getName().equals(setterName));
                    final ParameterizedType valueType = (ParameterizedType) setterMethod.getGenericParameterTypes()[0];
                    final Map<String, Object> transformedMap = new HashMap<>();
                    for (final Map.Entry<String, Object> innerEntry : ((Map<String, Object>) value).entrySet()) {
                        Object innerValue = innerEntry.getValue();
                        if (innerValue instanceof Map) {
                            innerValue = plainToSdk((Map) innerValue, (Class<?>) valueType.getActualTypeArguments()[1]);
                        }
                        transformedMap.put(innerEntry.getKey(), innerValue);
                    }
                    value = transformedMap;
                    if (!Map.class.isAssignableFrom((Class<?>) valueType.getRawType())) {
                        // Some setters don't take a plain map. For example, some require an `AttributeValue` instance
                        // for objects that are just maps in JSON. So, we make that conversion here.
                        value = plainToSdk((Map) value, (Class<T>) valueType.getRawType());
                    }
                    setterMethod.invoke(builder, value);

                } else if (value instanceof Collection) {
                    // For linear collections, the process is similar to that of maps.
                    final Collection<Object> valueAsCollection = (Collection) value;
                    // Find method by name and exclude the varargs version of the method.
                    final Method setterMethod = findMethod(builderType, m -> m.getName().equals(setterName) && !m.getParameterTypes()[0].getName().startsWith("[L"));
                    final ParameterizedType valueType = (ParameterizedType) setterMethod.getGenericParameterTypes()[0];
                    final Collection<Object> reTypedList = new ArrayList<>();
                    for (final Object innerValue : valueAsCollection) {
                        if (innerValue instanceof Map) {
                            reTypedList.add(plainToSdk((Map) innerValue, (Class<?>) valueType.getActualTypeArguments()[0]));
                        } else if (innerValue instanceof String && SdkBytes.class.isAssignableFrom((Class<?>) valueType.getActualTypeArguments()[0])) {
                            reTypedList.add(SdkBytes.fromUtf8String((String) innerValue));
                        } else {
                            reTypedList.add(innerValue);
                        }
                    }
                    setterMethod.invoke(builder, reTypedList);

                } else {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Unknown value type while deserializing:" + value.getClass().getName()
                    );

                }
            }
        }

        return (T) builderType.getMethod("build").invoke(builder);
    }

    private static Method findMethod(Class<?> builderType, Predicate<Method> predicate) {
        return Arrays.stream(builderType.getMethods())
                .filter(predicate)
                .findFirst()
                .orElse(null);
    }

    /**
     * Computes the name of the setter method in AWS SDK that will set the value of the field given by the argument.
     * @param key Name of the field for which to compute the setter method's name.
     * @return Name of the setter method that will set the value of the given `key` field.
     */
    private static String getSetterMethodName(final String key) {
        if ("NULL".equals(key)) {
            // Since `null` is a reserved word in Java, AWS SDK uses `nul` for this field.
            return "nul";
        } else if (isUpperCase(key)) {
            return key.toLowerCase();
        } else {
            return toLowerCamelCase(key);
        }
    }

    private static Map<String, Object> sdkToPlain(SdkPojo response) {
        final Map<String, Object> plain = new HashMap<>();

        for (final SdkField<?> field : response.sdkFields()) {
            Object value = field.getValueOrDefault(response);

            if (value instanceof SdkPojo) {
                value = sdkToPlain((SdkPojo) value);

            } else if (value instanceof Map) {
                final Map<String, Object> valueAsMap = (Map) value;
                final Map<String, Object> plainMap = new HashMap<>();
                for (final Map.Entry<String, Object> entry : valueAsMap.entrySet()) {
                    final var key = entry.getKey();
                    Object innerValue = entry.getValue();
                    if (innerValue instanceof SdkPojo) {
                        innerValue = sdkToPlain((SdkPojo) innerValue);
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
