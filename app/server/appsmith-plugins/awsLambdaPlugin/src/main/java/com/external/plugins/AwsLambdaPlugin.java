package com.external.plugins;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.AWSLambdaClientBuilder;
import com.amazonaws.services.lambda.model.AWSLambdaException;
import com.amazonaws.services.lambda.model.FunctionConfiguration;
import com.amazonaws.services.lambda.model.InvokeRequest;
import com.amazonaws.services.lambda.model.InvokeResult;
import com.amazonaws.services.lambda.model.ListFunctionsResult;
import com.amazonaws.services.lambda.model.ResourceNotFoundException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
    public static class AwsLambdaPluginExecutor implements PluginExecutor<AWSLambda> {

        @Override
        public Mono<ActionExecutionResult> execute(
                AWSLambda connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            String printMessage = Thread.currentThread().getName() + ": execute() called for AWS Lambda plugin.";
            System.out.println(printMessage);
            Map<String, Object> formData = actionConfiguration.getFormData();
            String command = getDataValueSafelyFromFormData(formData, "command", STRING_TYPE);

            return Mono.fromCallable(() -> {
                        System.out.println(Thread.currentThread().getName()
                                + ": creating action execution result for AWS Lambda plugin.");
                        ActionExecutionResult result;
                        switch (Objects.requireNonNull(command)) {
                            case "LIST_FUNCTIONS" -> result = listFunctions(actionConfiguration, connection);
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
                            e -> new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getErrorMessage()))
                    .onErrorMap(
                            Exception.class,
                            e -> new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()))
                    .map(obj -> obj)
                    .subscribeOn(Schedulers.boundedElastic());
        }

        @Override
        public Mono<TriggerResultDTO> trigger(
                AWSLambda connection, DatasourceConfiguration datasourceConfiguration, TriggerRequestDTO request) {
            String printMessage = Thread.currentThread().getName() + ": trigger() called for AWS Lambda plugin.";
            System.out.println(printMessage);
            if (!StringUtils.hasText(request.getRequestType())) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "request type is missing");
            }
            ActionExecutionResult actionExecutionResult = listFunctions(null, connection);
            ArrayNode body = (ArrayNode) actionExecutionResult.getBody();
            List<Map<String, String>> functionNames = StreamSupport.stream(body.spliterator(), false)
                    .map(function -> function.get("functionName").asText())
                    .sorted()
                    .map(functionName -> Map.of("label", functionName, "value", functionName))
                    .collect(Collectors.toList());

            TriggerResultDTO triggerResultDTO = new TriggerResultDTO();
            triggerResultDTO.setTrigger(functionNames);

            return Mono.just(triggerResultDTO);
        }

        ActionExecutionResult invokeFunction(ActionConfiguration actionConfiguration, AWSLambda connection) {
            InvokeRequest invokeRequest = new InvokeRequest();
            invokeRequest.setFunctionName(
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "functionName", STRING_TYPE));
            invokeRequest.setPayload(
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "body", STRING_TYPE));
            invokeRequest.setInvocationType(
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "invocationType", STRING_TYPE));
            InvokeResult invokeResult = connection.invoke(invokeRequest);

            ActionExecutionResult result = new ActionExecutionResult();
            result.setStatusCode(String.valueOf(invokeResult.getStatusCode()));
            Boolean isExecutionSuccess = (invokeResult.getFunctionError() == null);
            result.setIsExecutionSuccess(isExecutionSuccess);
            ByteBuffer responseBuffer = invokeResult.getPayload();
            String responsePayload = ObjectUtils.isEmpty(responseBuffer)
                    ? null
                    : new String(responseBuffer.array(), StandardCharsets.UTF_8);
            result.setBody(responsePayload);

            return result;
        }

        ActionExecutionResult listFunctions(ActionConfiguration actionConfiguration, AWSLambda connection) {
            ListFunctionsResult listFunctionsResult = connection.listFunctions();
            List<FunctionConfiguration> functions = listFunctionsResult.getFunctions();

            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(objectMapper.valueToTree(functions));
            result.setIsExecutionSuccess(true);
            return result;
        }

        @Override
        public Mono<AWSLambda> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            String printMessage =
                    Thread.currentThread().getName() + ": datasourceCreate() called for AWS Lambda plugin.";
            System.out.println(printMessage);
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            String accessKey = authentication.getUsername();
            String secretKey = authentication.getPassword();
            String authenticationType = authentication.getAuthenticationType();
            String region =
                    (String) datasourceConfiguration.getProperties().get(1).getValue();

            if (!StringUtils.hasText(region)) {
                region = "us-east-1"; // Default region
            }

            AWSLambdaClientBuilder awsLambdaClientBuilder =
                    AWSLambdaClientBuilder.standard().withRegion(Regions.fromName(region));

            // If access key and secret key are not provided, use the default credentials provider chain. That will
            // pick up the instance role if running on an EC2 instance.
            if ("accessKey".equals(authenticationType)) {
                BasicAWSCredentials awsCreds = new BasicAWSCredentials(accessKey, secretKey);

                AWSStaticCredentialsProvider staticCredentials = new AWSStaticCredentialsProvider(awsCreds);

                awsLambdaClientBuilder = awsLambdaClientBuilder.withCredentials(staticCredentials);
            }

            AWSLambda awsLambda = awsLambdaClientBuilder.build();
            return Mono.just(awsLambda);
        }

        @Override
        public void datasourceDestroy(AWSLambda connection) {
            // No need to do anything here.
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(AWSLambda connection) {
            String printMessage = Thread.currentThread().getName() + ": testDatasource() called for AWS Lambda plugin.";
            System.out.println(printMessage);
            return Mono.fromCallable(() -> {
                        /*
                         * - Please note that as of 28 Jan 2021, the way Amazon client SDK works, creating a connection
                         *   object with wrong credentials does not throw any exception.
                         * - Hence, adding a listFunctions() method call to test the connection.
                         */
                        connection.listFunctions();
                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> {
                        if (error instanceof AWSLambdaException
                                && "AccessDenied".equals(((AWSLambdaException) error).getErrorCode())) {
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
            String printMessage =
                    Thread.currentThread().getName() + ": validateDatasource() called for AWS Lambda plugin.";
            System.out.println(printMessage);
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

            return invalids;
        }
    }
}
