package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.external.plugins.exceptions.DynamoErrorMessages;
import com.external.plugins.exceptions.DynamoPluginError;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
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
import software.amazon.awssdk.services.dynamodb.model.ListTablesResponse;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.WildcardType;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;

@Slf4j
public class DynamoPlugin extends BasePlugin {

    private static final String DYNAMO_TYPE_STRING_LABEL = "S";
    private static final String DYNAMO_TYPE_NUMBER_LABEL = "N";
    private static final String DYNAMO_TYPE_BINARY_LABEL = "B";
    private static final String DYNAMO_TYPE_BOOLEAN_LABEL = "BOOL";
    private static final String DYNAMO_TYPE_NULL_LABEL = "NUL";
    private static final String DYNAMO_TYPE_STRING_SET_LABEL = "SS";
    private static final String DYNAMO_TYPE_NUMBER_SET_LABEL = "NS";
    private static final String DYNAMO_TYPE_BINARY_SET_LABEL = "BS";
    private static final String DYNAMO_TYPE_MAP_LABEL = "M";
    private static final String DYNAMO_TYPE_LIST_LABEL = "L";

    public DynamoPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    /**
     * Dynamo plugin receives the query as json of the following format:
     * {
     * "action": "GetItem",
     * "parameters": {...}  // Depends on the action above.
     * }
     * <p>
     * DynamoDB actions and parameters reference:
     * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Operations_Amazon_DynamoDB.html
     */

    @Extension
    public static class DynamoPluginExecutor implements PluginExecutor<DynamoDbClient> {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        public Object extractValue(Object rawItem) {

            if (!(rawItem instanceof List)
                    && !(rawItem instanceof Map)) {
                return rawItem;
            }

            if (rawItem instanceof List) {
                return ((List<Object>) rawItem)
                        .stream()
                        .map(item -> extractValue(item))
                        .collect(Collectors.toList());
            } else { /* map type */
                Map<String, Object> extractedValueMap = new HashMap<>();
                Map<String, Object> rawItemAsMap = (Map<String, Object>) rawItem;
                for (Map.Entry<String, Object> entry : rawItemAsMap.entrySet()) {
                    switch (entry.getKey()) {
                        case DYNAMO_TYPE_NUMBER_LABEL:
                        case DYNAMO_TYPE_STRING_LABEL:
                        case DYNAMO_TYPE_BINARY_LABEL:
                        case DYNAMO_TYPE_BOOLEAN_LABEL:
                        case DYNAMO_TYPE_NULL_LABEL:
                            if (entry.getValue() != null) {
                                return entry.getValue();
                            }

                            break;
                        case DYNAMO_TYPE_STRING_SET_LABEL:
                        case DYNAMO_TYPE_NUMBER_SET_LABEL:
                        case DYNAMO_TYPE_BINARY_SET_LABEL:
                            if (entry.getValue() != null && ((List<Object>) entry.getValue()).size() > 0) {
                                return entry.getValue();
                            }

                            break;
                        case DYNAMO_TYPE_LIST_LABEL:
                            /*
                             * - If size of rawValueAsList is 0, then we don't want to return.
                             */
                            List<Object> rawValueAsList = (List<Object>) entry.getValue();
                            if (rawValueAsList.size() > 0) {
                                return rawValueAsList
                                        .stream()
                                        .map(listItem -> extractValue(listItem))
                                        .collect(Collectors.toList());
                            }

                            break;
                        case DYNAMO_TYPE_MAP_LABEL:
                            /*
                             * - If size of rawValueAsMap is 0, then we don't want to return.
                             */
                            Map<String, Object> rawValueAsMap = (Map<String, Object>) entry.getValue();
                            if (rawValueAsMap.size() > 0) {
                                return rawValueAsMap
                                        .entrySet()
                                        .stream()
                                        .map(item -> Map.entry(item.getKey(), extractValue(item.getValue())))
                                        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
                            }

                            break;
                        default:
                            extractedValueMap.put(entry.getKey(), extractValue(entry.getValue()));
                    }
                }

                return extractedValueMap;
            }
        }

        /*
         * - Transform response for easy consumption. For details please visit
         *   https://github.com/appsmithorg/appsmith/issues/3010
         */
        public Object getTransformedResponse(Map<String, Object> rawResponse,
                                             String action) throws AppsmithPluginException {

            Map<String, Object> transformedResponse = new HashMap<>();
            for (Map.Entry<String, Object> responseEntry : rawResponse.entrySet()) {
                Object rawItems = responseEntry.getValue();
                if (rawItems != null) {
                    /*
                     * - Insert transformed values into extractedResponse list.
                     */
                    transformedResponse.put(responseEntry.getKey(), extractValue(rawItems));
                } else {
                    transformedResponse.put(responseEntry.getKey(), null);
                }
            }

            return transformedResponse;
        }

        @Override
        public Mono<ActionExecutionResult> execute(DynamoDbClient ddb,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            final Map<String, Object> requestData = new HashMap<>();
            final String body = actionConfiguration.getBody();
            List<RequestParamDTO> requestParams = new ArrayList<>();

            return Mono.fromCallable(() -> {
                        ActionExecutionResult result = new ActionExecutionResult();

                        final String action = actionConfiguration.getPath();
                        if (! StringUtils.hasLength(action)) {
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    DynamoErrorMessages.MISSING_ACTION_NAME_ERROR_MSG
                            );
                        }
                        requestData.put("action", action);
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, action, null, null, null));
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY, body, null, null, null));

                        Map<String, Object> parameters = null;
                        try {
                            if (StringUtils.hasLength(body)) {
                                parameters = objectMapper.readValue(body, HashMap.class);
                            }
                        } catch (IOException e) {
                            final String message = "Error parsing the JSON body: " + e.getMessage();
                            log.warn(message, e);
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, body, e.getMessage());
                        }
                        requestData.put("parameters", parameters);

                        final Class<?> requestClass;
                        try {
                            requestClass = Class.forName("software.amazon.awssdk.services.dynamodb.model." + action + "Request");
                        } catch (ClassNotFoundException e) {
                            throw new AppsmithPluginException(
                                    DynamoPluginError.UNKNOWN_ACTION_NAME,
                                    String.format(DynamoErrorMessages.UNKNOWN_ACTION_NAME_ERROR_MSG, action),
                                    e.getMessage()
                            );
                        }

                        try {
                            final Method actionExecuteMethod = DynamoDbClient.class.getMethod(
                                    // Convert `ListTables` to `listTables`, which is the name of the method to execute this action.
                                    toLowerCamelCase(action),
                                    requestClass
                            );
                            final Object sdkValue = plainToSdk(parameters, requestClass);
                            final DynamoDbResponse response = (DynamoDbResponse) actionExecuteMethod.invoke(ddb, sdkValue);
                            Object rawResponse = sdkToPlain(response);
                            Object transformedResponse = getTransformedResponse((Map<String, Object>) rawResponse, action);
                            result.setBody(transformedResponse);
                        } catch (InvocationTargetException | IllegalAccessException |
                                 NoSuchMethodException | ClassNotFoundException e) {
                            final String message = "Error executing the DynamoDB Action: " + (e.getCause() == null ? e : e.getCause()).getMessage();
                            log.warn(message, e);
                            throw new AppsmithPluginException(DynamoPluginError.QUERY_EXECUTION_FAILED, DynamoErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG, e.getMessage());
                        }

                        result.setIsExecutionSuccess(true);
                        log.debug("In the DynamoPlugin, got action execution result");
                        return result;
                    })
                    .onErrorResume(error -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        if (! (error instanceof AppsmithPluginException)) {
                            error = new AppsmithPluginException(DynamoPluginError.QUERY_EXECUTION_FAILED, DynamoErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG, error.getMessage());
                        }
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned to the server
                    .map(actionExecutionResult -> {
                        ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
                        actionExecutionRequest.setProperties(requestData);
                        actionExecutionRequest.setQuery(body);
                        actionExecutionRequest.setRequestParams(requestParams);
                        actionExecutionResult.setRequest(actionExecutionRequest);
                        return actionExecutionResult;
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<DynamoDbClient> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            return Mono.fromCallable(() -> {
                        final DynamoDbClientBuilder builder = DynamoDbClient.builder();

                        if (!CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                            final Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                            builder.endpointOverride(URI.create("http://" + endpoint.getHost() + ":" + endpoint.getPort()));
                        }

                        final DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                        if (authentication == null || ! StringUtils.hasLength(authentication.getDatabaseName())) {
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    DynamoErrorMessages.MISSING_REGION_ERROR_MSG
                            );
                        }

                        builder.region(Region.of(authentication.getDatabaseName()));

                        builder.credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(authentication.getUsername(), authentication.getPassword())
                        ));

                        return builder.build();
                    })
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

            final DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
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
        public Mono<DatasourceTestResult> testDatasource(DynamoDbClient connection) {
            return Mono.fromCallable(() -> {
                /*
                 * - Creating a connection with false credentials does not throw an error. Hence,
                 *   calling listTables() method to check validity.
                 */
                connection.listTables();
                return new DatasourceTestResult();
            });
        }

        @Override
        public Mono<DatasourceStructure> getStructure(DynamoDbClient ddb, DatasourceConfiguration datasourceConfiguration) {
            return Mono.fromCallable(() -> {
                final ListTablesResponse listTablesResponse = ddb.listTables();

                List<DatasourceStructure.Table> tables = new ArrayList<>();
                for (final String tableName : listTablesResponse.tableNames()) {
                    tables.add(new DatasourceStructure.Table(
                            DatasourceStructure.TableType.TABLE,
                            null,
                            tableName,
                            Collections.emptyList(),
                            Collections.emptyList(),
                            Collections.emptyList()
                    ));
                }

                return new DatasourceStructure(tables);

            }).subscribeOn(scheduler);
        }

    }

    private static String toLowerCamelCase(String action) {
        return action.substring(0, 1).toLowerCase() + action.substring(1);
    }

    /**
     * Given a map that conforms to what a valid DynamoDB request should look like, this function will convert into
     * a DynamoDBRequest object from AWS SDK. This is done using Java's reflection API.
     *
     * @param mapping Mapping object representing the request details.
     * @param type    Request type that should be created. Eg., ListTablesRequest.class, PutItemRequest.class etc.
     * @param <T>     Type param of the request class.
     * @return An object of the request class, containing details of the request from the mapping.
     * @throws IllegalAccessException    Thrown if any of the SDK methods' contracts change.
     * @throws InvocationTargetException Thrown if any of the SDK methods' contracts change.
     * @throws NoSuchMethodException     Thrown if any of the SDK methods' contracts change.
     * @throws ClassNotFoundException    Thrown if any of the builder class could not be found corresponding to the action class.
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
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                String.format(DynamoErrorMessages.INVALID_ATTRIBUTE_ERROR_MSG, entry.getKey())
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
                    // This will *never* be successful. DynamoDB takes in numeric values as strings, which means the
                    // control should never flow here for numeric types.
                    builderType.getMethod(setterName, value.getClass()).invoke(builder, value);

                } else if (value instanceof Map) {
                    // For maps, we go recursive, applying this transformation to each value, and replacing with the
                    // result in the map. Generic types in the setter method's signature are used to convert the values.
                    final Method setterMethod = findMethod(builderType, m -> m.getName().equals(setterName));
                    final Type parameterType = setterMethod.getGenericParameterTypes()[0];
                    if (parameterType instanceof ParameterizedType) {
                        final ParameterizedType valueType = (ParameterizedType) parameterType;
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
                    } else if (parameterType instanceof Class) {
                        setterMethod.invoke(builder, plainToSdk((Map) value, (Class) parameterType));
                    }

                } else if (value instanceof Collection) {
                    // For linear collections, the process is similar to that of maps.
                    final Collection<Object> valueAsCollection = (Collection) value;
                    // Find method by name and exclude the varargs version of the method.
                    final Method setterMethod = findMethod(builderType, m -> m.getName().equals(setterName) && !m.getParameterTypes()[0].getName().startsWith("[L"));
                    Type valueType = ((ParameterizedType) setterMethod.getGenericParameterTypes()[0]).getActualTypeArguments()[0];
                    if (valueType instanceof WildcardType) {
                        // This occurs when the method's parameter is typed as `Collection<? extends Map<...>>`. Example op: `BatchGetItem`.
                        valueType = ((WildcardType) valueType).getUpperBounds()[0];
                    }
                    final Collection<Object> reTypedList = new ArrayList<>();
                    for (final Object innerValue : valueAsCollection) {
                        if (innerValue instanceof Map) {
                            reTypedList.add(plainToSdk((Map) innerValue, valueType));
                        } else if (innerValue instanceof String && SdkBytes.class.isAssignableFrom((Class<?>) valueType)) {
                            reTypedList.add(SdkBytes.fromUtf8String((String) innerValue));
                        } else {
                            reTypedList.add(innerValue);
                        }
                    }
                    setterMethod.invoke(builder, reTypedList);

                } else {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            String.format(DynamoErrorMessages.UNKNOWN_TYPE_DURING_DESERIALIZATION_ERROR_MSG, value.getClass().getName())
                    );

                }
            }
        }

        return (T) builderType.getMethod("build").invoke(builder);
    }

    public static Object plainToSdk(Map<String, Object> mapping, Type type)
            throws InvocationTargetException, NoSuchMethodException, ClassNotFoundException, AppsmithPluginException,
            IllegalAccessException {

        if (mapping == null) {
            return null;
        }

        if (!(type instanceof ParameterizedType)) {
            return plainToSdk(mapping, (Class) type);
        }

        final ParameterizedType ptype = (ParameterizedType) type;

        if (Map.class.equals(ptype.getRawType())) {
            final Map<String, Object> convertedMap = new HashMap<>();
            for (final Map.Entry<String, Object> entry : mapping.entrySet()) {
                convertedMap.put(entry.getKey(), plainToSdk((Map) entry.getValue(), (Class<?>) ptype.getActualTypeArguments()[1]));
            }
            return convertedMap;
        }

        throw new AppsmithPluginException(
                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                String.format(DynamoErrorMessages.UNKNOWN_TYPE_FOUND_TO_CONVERT_TO_SDK_STYLE_ERROR_MSG, type.getTypeName())
        );
    }

    private static Method findMethod(Class<?> builderType, Predicate<Method> predicate) {
        return Arrays.stream(builderType.getMethods())
                .filter(predicate)
                .findFirst()
                .orElse(null);
    }

    /**
     * Computes the name of the setter method in AWS SDK that will set the value of the field given by the argument.
     *
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

    private static Object sdkToPlain(Object valueObj) {
        if (valueObj instanceof SdkPojo) {
            SdkPojo response = (SdkPojo) valueObj;
            final Map<String, Object> plain = new HashMap<>();

            for (final SdkField<?> field : response.sdkFields()) {
                Object value = field.getValueOrDefault(response);
                plain.put(field.memberName(), sdkToPlain(value));
            }

            return plain;

        } else if (valueObj instanceof SdkBytes) {
            SdkBytes response = (SdkBytes) valueObj;

            return new String(response.asByteArray());
        } else if (valueObj instanceof Map) {
            final Map<?, ?> valueAsMap = (Map<?, ?>) valueObj;
            final Map<Object, Object> plainMap = new HashMap<>();

            for (final Map.Entry<?, ?> entry : valueAsMap.entrySet()) {
                plainMap.put(entry.getKey(), sdkToPlain(entry.getValue()));
            }

            return plainMap;

        } else if (valueObj instanceof Collection) {
            final List<?> valueAsList = (List<?>) valueObj;
            final List<Object> plainList = new ArrayList<>();

            for (Object item : valueAsList) {
                plainList.add(sdkToPlain(item));
            }

            return plainList;
        }

        return valueObj;
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
