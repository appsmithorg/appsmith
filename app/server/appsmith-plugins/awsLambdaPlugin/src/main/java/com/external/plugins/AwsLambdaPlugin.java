package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.awscore.exception.AwsServiceException;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.LambdaClientBuilder;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.LambdaException;
import software.amazon.awssdk.services.lambda.model.ListAliasesRequest;
import software.amazon.awssdk.services.lambda.model.ListAliasesResponse;
import software.amazon.awssdk.services.lambda.model.ListFunctionsResponse;
import software.amazon.awssdk.services.lambda.model.ListVersionsByFunctionRequest;
import software.amazon.awssdk.services.lambda.model.ListVersionsByFunctionResponse;
import software.amazon.awssdk.services.lambda.model.ResourceNotFoundException;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;

public class AwsLambdaPlugin extends BasePlugin {

    public AwsLambdaPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class AwsLambdaPluginExecutor implements PluginExecutor<LambdaClient> {

        /**
         * A synchronous invoke receives no response bytes until the function returns, so the socket timeout has to
         * cover the run time of the function being invoked.
         */
        static final Duration HTTP_SOCKET_TIMEOUT = Duration.ofSeconds(50);

        static final Duration HTTP_CONNECTION_TIMEOUT = Duration.ofSeconds(10);

        static final String DEFAULT_REGION = "us-east-1";

        static final String INVALID_REGION_MESSAGE =
                "Invalid AWS region. Please enter a region code such as us-east-1.";

        /** An AWS region code: lowercase letters, digits and single hyphens, ending in a number (e.g. us-gov-west-1). */
        private static final Pattern REGION_PATTERN = Pattern.compile("[a-z]{2,}(?:-[a-z0-9]+)*-[0-9]{1,2}");

        private static final int MAX_REGION_LENGTH = 32;

        private static final int HTTP_NO_CONTENT = 204;

        private final Scheduler scheduler = Schedulers.boundedElastic();

        @Override
        public Mono<ActionExecutionResult> execute(
                LambdaClient connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            log.debug(Thread.currentThread().getName() + ": execute() called for AWS Lambda plugin.");
            Map<String, Object> formData = actionConfiguration.getFormData();
            String command = getDataValueSafelyFromFormData(formData, "command", STRING_TYPE);

            return Mono.fromCallable(() -> {
                        log.debug(Thread.currentThread().getName()
                                + ": creating action execution result for AWS Lambda plugin.");
                        ActionExecutionResult result;
                        switch (Objects.requireNonNull(command)) {
                            case "LIST_FUNCTIONS" -> result = listFunctions(actionConfiguration, connection);
                            case "LIST_FUNCTION_VERSIONS" ->
                                result = listFunctionVersions(actionConfiguration, connection);
                            case "LIST_FUNCTION_ALIASES" ->
                                result = listFunctionAliases(actionConfiguration, connection);
                            case "INVOKE_FUNCTION" -> result = invokeFunction(actionConfiguration, connection);
                            default -> throw new IllegalStateException("Unexpected value: " + command);
                        }

                        return result;
                    })
                    .onErrorMap(
                            IllegalArgumentException.class,
                            e -> new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR, "Unsupported command: " + command))
                    .onErrorMap(
                            ResourceNotFoundException.class,
                            e -> new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, serviceErrorMessage(e)))
                    .onErrorMap(
                            Exception.class,
                            e -> new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()))
                    .map(obj -> obj)
                    .subscribeOn(scheduler);
        }

        /** The message returned by the Lambda service, without the SDK's request metadata suffix. */
        private static String serviceErrorMessage(AwsServiceException e) {
            return e.awsErrorDetails() != null ? e.awsErrorDetails().errorMessage() : e.getMessage();
        }

        private static String serviceErrorCode(AwsServiceException e) {
            return e.awsErrorDetails() != null ? e.awsErrorDetails().errorCode() : null;
        }

        @Override
        public Mono<TriggerResultDTO> trigger(
                LambdaClient connection, DatasourceConfiguration datasourceConfiguration, TriggerRequestDTO request) {
            log.debug(Thread.currentThread().getName() + ": trigger() called for AWS Lambda plugin.");
            // The list* calls below are blocking SDK calls; keep them off the subscribing thread.
            return Mono.fromCallable(() -> listTriggerOptions(connection, request))
                    .subscribeOn(scheduler);
        }

        private TriggerResultDTO listTriggerOptions(LambdaClient connection, TriggerRequestDTO request) {
            if (!StringUtils.hasText(request.getRequestType())) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "request type is missing");
            }

            String requestType = request.getRequestType();
            ActionExecutionResult actionExecutionResult;
            List<Map<String, String>> options;
            Map<?, Object> params = request.getParameters() == null ? Map.of() : request.getParameters();

            switch (requestType) {
                case "FUNCTION_NAMES" -> {
                    actionExecutionResult = listFunctions(null, connection);
                    ArrayNode body = (ArrayNode) actionExecutionResult.getBody();
                    options = StreamSupport.stream(body.spliterator(), false)
                            .map(function -> function.get("functionName").asText())
                            .sorted()
                            .map(functionName -> Map.of("label", functionName, "value", functionName))
                            .collect(Collectors.toList());
                }
                case "FUNCTION_VERSIONS" -> {
                    // Handle both old and new parameter structures
                    String functionName;
                    if (params.containsKey("parameters") && params.get("parameters") instanceof Map) {
                        Map<?, ?> parameters = (Map<?, ?>) params.get("parameters");
                        functionName = (String) parameters.get("functionName");
                    } else {
                        functionName = (String) params.get("functionName");
                    }

                    if (!StringUtils.hasText(functionName)) {
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "function name is required for listing versions");
                    }
                    actionExecutionResult = listFunctionVersions(null, connection, functionName);
                    ArrayNode body = (ArrayNode) actionExecutionResult.getBody();
                    options = StreamSupport.stream(body.spliterator(), false)
                            .map(version -> version.get("version").asText())
                            .sorted()
                            .map(version -> Map.of("label", version, "value", version))
                            .collect(Collectors.toList());
                }
                case "FUNCTION_ALIASES" -> {
                    // Handle both old and new parameter structures
                    String functionName;
                    if (params.containsKey("parameters") && params.get("parameters") instanceof Map) {
                        Map<?, ?> parameters = (Map<?, ?>) params.get("parameters");
                        functionName = (String) parameters.get("functionName");
                    } else {
                        functionName = (String) params.get("functionName");
                    }

                    if (!StringUtils.hasText(functionName)) {
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "function name is required for listing aliases");
                    }
                    actionExecutionResult = listFunctionAliases(null, connection, functionName);
                    ArrayNode body = (ArrayNode) actionExecutionResult.getBody();
                    options = StreamSupport.stream(body.spliterator(), false)
                            .map(alias -> alias.get("name").asText())
                            .sorted()
                            .map(alias -> Map.of("label", alias, "value", alias))
                            .collect(Collectors.toList());
                }
                default ->
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Unsupported request type: " + requestType);
            }

            TriggerResultDTO triggerResultDTO = new TriggerResultDTO();
            triggerResultDTO.setTrigger(options);

            return triggerResultDTO;
        }

        ActionExecutionResult invokeFunction(ActionConfiguration actionConfiguration, LambdaClient connection) {
            InvokeRequest.Builder invokeRequest = InvokeRequest.builder();

            // Validate and set function name (required parameter)
            String functionName =
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "functionName", STRING_TYPE);
            if (!StringUtils.hasText(functionName)) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Function name is required for Lambda invocation");
            }

            // Get version and alias parameters
            String functionVersion =
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "functionVersion", STRING_TYPE);
            String functionAlias =
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "functionAlias", STRING_TYPE);

            // Set function name (without qualifier)
            invokeRequest.functionName(functionName);

            // Use the qualifier for version/alias instead of embedding in function name
            if (StringUtils.hasText(functionAlias)) {
                // If alias is specified, use it (alias takes precedence over version)
                invokeRequest.qualifier(functionAlias);
            } else if (StringUtils.hasText(functionVersion)) {
                // If version is specified and no alias, use version
                invokeRequest.qualifier(functionVersion);
            }
            // If neither version nor alias is specified, defaults to $LATEST
            String body = getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "body", STRING_TYPE);
            if (body != null) {
                invokeRequest.payload(SdkBytes.fromUtf8String(body));
            }
            invokeRequest.invocationType(
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "invocationType", STRING_TYPE));
            InvokeResponse invokeResponse = connection.invoke(invokeRequest.build());

            ActionExecutionResult result = new ActionExecutionResult();
            result.setStatusCode(String.valueOf(invokeResponse.statusCode()));
            Boolean isExecutionSuccess = (invokeResponse.functionError() == null);
            result.setIsExecutionSuccess(isExecutionSuccess);
            result.setBody(responseBody(invokeResponse.statusCode(), invokeResponse.payload()));

            return result;
        }

        /**
         * The invocation result as text: null when the response has no content (HTTP 204, as for a dry run), and
         * otherwise decoded as UTF-8 with malformed byte sequences replaced by U+FFFD rather than rejected.
         */
        private static String responseBody(Integer statusCode, SdkBytes payload) {
            if (payload == null) {
                return null;
            }
            byte[] bytes = payload.asByteArrayUnsafe();
            if (bytes.length == 0 && Objects.equals(statusCode, HTTP_NO_CONTENT)) {
                return null;
            }
            return new String(bytes, StandardCharsets.UTF_8);
        }

        ActionExecutionResult listFunctions(ActionConfiguration actionConfiguration, LambdaClient connection) {
            // Only the first page of functions is returned.
            ListFunctionsResponse listFunctionsResponse = connection.listFunctions();

            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(AwsLambdaResponseMapper.functionConfigurations(listFunctionsResponse.functions()));
            result.setIsExecutionSuccess(true);
            return result;
        }

        ActionExecutionResult listFunctionVersions(
                ActionConfiguration actionConfiguration, LambdaClient connection, String functionName) {
            if (actionConfiguration != null) {
                functionName =
                        getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "functionName", STRING_TYPE);
            }
            if (!StringUtils.hasText(functionName)) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "function name is required for listing versions");
            }

            ListVersionsByFunctionRequest request = ListVersionsByFunctionRequest.builder()
                    .functionName(functionName)
                    .build();

            ListVersionsByFunctionResponse listVersionsResponse = connection.listVersionsByFunction(request);

            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(AwsLambdaResponseMapper.functionConfigurations(listVersionsResponse.versions()));
            result.setIsExecutionSuccess(true);
            return result;
        }

        ActionExecutionResult listFunctionVersions(ActionConfiguration actionConfiguration, LambdaClient connection) {
            String functionName =
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "functionName", STRING_TYPE);
            return listFunctionVersions(null, connection, functionName);
        }

        ActionExecutionResult listFunctionAliases(
                ActionConfiguration actionConfiguration, LambdaClient connection, String functionName) {
            if (actionConfiguration != null) {
                functionName =
                        getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "functionName", STRING_TYPE);
            }

            ListAliasesRequest request =
                    ListAliasesRequest.builder().functionName(functionName).build();

            ListAliasesResponse listAliasesResponse = connection.listAliases(request);

            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(AwsLambdaResponseMapper.aliasConfigurations(listAliasesResponse.aliases()));
            result.setIsExecutionSuccess(true);
            return result;
        }

        ActionExecutionResult listFunctionAliases(ActionConfiguration actionConfiguration, LambdaClient connection) {
            String functionName =
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "functionName", STRING_TYPE);
            return listFunctionAliases(null, connection, functionName);
        }

        @Override
        public Mono<LambdaClient> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": datasourceCreate() called for AWS Lambda plugin.");
            // Building the client can read the AWS profile files, so keep it off the caller thread.
            return Mono.fromCallable(() -> createLambdaClient(datasourceConfiguration))
                    .subscribeOn(scheduler);
        }

        private LambdaClient createLambdaClient(DatasourceConfiguration datasourceConfiguration) {
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            String accessKey = authentication.getUsername();
            String secretKey = authentication.getPassword();
            String authenticationType = authentication.getAuthenticationType();
            String region = configuredRegion(datasourceConfiguration);

            if (!StringUtils.hasText(region)) {
                region = DEFAULT_REGION;
            }
            if (!isValidRegion(region)) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, INVALID_REGION_MESSAGE);
            }

            // The HTTP client is chosen explicitly so the transport and its timeouts are deterministic. It is passed
            // as a builder so that the Lambda client owns its connection pool and releases it in close().
            LambdaClientBuilder lambdaClientBuilder = LambdaClient.builder()
                    .region(Region.of(region))
                    .httpClientBuilder(httpClientBuilder(HTTP_SOCKET_TIMEOUT, HTTP_CONNECTION_TIMEOUT));

            // If access key and secret key are not provided, use the default credentials provider chain. That will
            // pick up the instance role if running on an EC2 instance.
            if ("accessKey".equals(authenticationType)) {
                AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKey, secretKey);

                lambdaClientBuilder =
                        lambdaClientBuilder.credentialsProvider(StaticCredentialsProvider.create(awsCreds));
            }

            return lambdaClientBuilder.build();
        }

        static ApacheHttpClient.Builder httpClientBuilder(Duration socketTimeout, Duration connectionTimeout) {
            return ApacheHttpClient.builder().socketTimeout(socketTimeout).connectionTimeout(connectionTimeout);
        }

        /** The region entered for the datasource, or null when none is set. */
        private static String configuredRegion(DatasourceConfiguration datasourceConfiguration) {
            List<Property> properties = datasourceConfiguration.getProperties();
            if (properties == null || properties.size() < 2 || properties.get(1) == null) {
                return null;
            }
            Object value = properties.get(1).getValue();
            return value == null ? null : String.valueOf(value);
        }

        private static boolean isValidRegion(String region) {
            return region.length() <= MAX_REGION_LENGTH
                    && REGION_PATTERN.matcher(region).matches();
        }

        @Override
        public void datasourceDestroy(LambdaClient connection) {
            if (connection == null) {
                return;
            }
            // Closing the SDK client releases its HTTP connection pool; keep it off the caller thread.
            Mono.fromRunnable(connection::close)
                    .subscribeOn(scheduler)
                    .subscribe(ignored -> {}, error -> log.error("Error closing AWS Lambda client.", error));
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(LambdaClient connection) {
            log.debug(Thread.currentThread().getName() + ": testDatasource() called for AWS Lambda plugin.");
            return Mono.fromCallable(() -> {
                        /*
                         * - Please note that as of 28 Jan 2021, the way Amazon client SDK works, creating a connection
                         *   object with wrong credentials does not throw any exception.
                         * - Hence, adding a listFunctions() method call to test the connection.
                         */
                        connection.listFunctions();
                        return new DatasourceTestResult();
                    })
                    .subscribeOn(scheduler)
                    .onErrorResume(error -> {
                        if (error instanceof LambdaException lambdaException
                                && "AccessDenied".equals(serviceErrorCode(lambdaException))) {
                            /*
                             * Sometimes a valid account credential may not have permission to run listFunctions action
                             * . In this case `AccessDenied` error is returned.
                             * That fact that the credentials caused `AccessDenied` error instead of invalid access key
                             * id or signature mismatch error means that the credentials are valid, we are able to
                             * establish a connection as well, but the account does not have permission to run
                             * listFunctions.
                             */
                            return Mono.just(new DatasourceTestResult());
                        }

                        return Mono.just(new DatasourceTestResult(error.getMessage()));
                    });
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": validateDatasource() called for AWS Lambda plugin.");
            Set<String> invalids = new HashSet<>();
            if (datasourceConfiguration == null
                    || datasourceConfiguration.getAuthentication() == null
                    || !StringUtils.hasText(
                            datasourceConfiguration.getAuthentication().getAuthenticationType())) {
                invalids.add("Invalid authentication mechanism provided. Please choose valid authentication type.");
                return invalids;
            }

            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

            if ("instanceRole".equals(authentication.getAuthenticationType())
                    && "true".equalsIgnoreCase(System.getenv("APPSMITH_CLOUD_HOSTING"))) {
                // Instance role is not supported for cloud hosting. It's only supported for self-hosted environments.
                // This is to prevent a security risk where a user can use the instance role to access resources in a
                // hosted environment.
                invalids.add(
                        "Instance role is not supported for cloud hosting. Please choose a different authentication type.");
            } else if ("accessKey".equals(authentication.getAuthenticationType())) {
                // Only check for access key and secret key if accessKey authentication is selected.
                if (!StringUtils.hasText(authentication.getUsername())) {
                    invalids.add("Unable to find an AWS access key. Please add a valid access key.");
                }

                if (!StringUtils.hasText(authentication.getPassword())) {
                    invalids.add("Unable to find an AWS secret key. Please add a valid secret key.");
                }
            }

            // A blank region means the default region.
            String region = configuredRegion(datasourceConfiguration);
            if (StringUtils.hasText(region) && !isValidRegion(region)) {
                invalids.add(INVALID_REGION_MESSAGE);
            }

            return invalids;
        }
    }
}
