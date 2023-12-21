package com.external.plugins;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.AWSLambdaClientBuilder;
import com.amazonaws.services.lambda.model.AWSLambdaException;
import com.amazonaws.services.lambda.model.FunctionConfiguration;
import com.amazonaws.services.lambda.model.InvokeRequest;
import com.amazonaws.services.lambda.model.InvokeResult;
import com.amazonaws.services.lambda.model.ListFunctionsResult;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.pf4j.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

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

            Map<String, Object> formData = actionConfiguration.getFormData();
            String command = getDataValueSafelyFromFormData(formData, "command", STRING_TYPE);

            //            String query = actionConfiguration.getBody();

            return Mono.fromCallable(() -> {
                        ActionExecutionResult result = null;
                        switch (Objects.requireNonNull(command)) {
                            case "LIST_FUNCTIONS" -> result = listFunctions(actionConfiguration, connection);
                            case "INVOKE_FUNCTION" -> result = invokeFunction(actionConfiguration, connection);
                            default -> throw new IllegalStateException("Unexpected value: " + command);
                        }

                        return result;
                    })
                    .onErrorMap(
                            Exception.class,
                            e -> new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR, "Unsupported command: " + command))
                    .map(obj -> {
                        System.out.println("obj = " + obj.getBody());
                        return obj;
                    })
                    .subscribeOn(Schedulers.boundedElastic());
        }

        private ActionExecutionResult invokeFunction(ActionConfiguration actionConfiguration, AWSLambda connection) {
            InvokeRequest invokeRequest = new InvokeRequest();
            invokeRequest.setFunctionName(
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "functionName", STRING_TYPE));
            invokeRequest.setPayload(
                    getDataValueSafelyFromFormData(actionConfiguration.getFormData(), "body", STRING_TYPE));
            InvokeResult invokeResult = connection.invoke(invokeRequest);

            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(objectMapper.valueToTree(
                    new String(invokeResult.getPayload().array(), StandardCharsets.UTF_8)));
            result.setIsExecutionSuccess(true);
            return result;
        }

        private ActionExecutionResult listFunctions(ActionConfiguration actionConfiguration, AWSLambda connection) {
            ListFunctionsResult listFunctionsResult = connection.listFunctions();
            List<FunctionConfiguration> functions = listFunctionsResult.getFunctions();

            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(objectMapper.valueToTree(functions));
            result.setIsExecutionSuccess(true);
            return result;
        }

        @Override
        public Mono<AWSLambda> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            String accessKey = authentication.getUsername();
            String secretKey = authentication.getPassword();
            String region =
                    (String) datasourceConfiguration.getProperties().get(1).getValue();

            BasicAWSCredentials awsCreds = new BasicAWSCredentials(accessKey, secretKey);

            AWSStaticCredentialsProvider staticCredentials = new AWSStaticCredentialsProvider(awsCreds);

            AWSLambda awsLambda = AWSLambdaClientBuilder.standard()
                    .withCredentials(staticCredentials)
                    //                .withRegion(Regions.fromName(region))
                    .build();

            return Mono.just(awsLambda);
        }

        @Override
        public void datasourceDestroy(AWSLambda connection) {
            // No need to do anything here.
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(AWSLambda connection) {
            return Mono.fromCallable(() -> {
                        /*
                         * - Please note that as of 28 Jan 2021, the way AmazonS3 client works, creating a connection
                         *   object with wrong credentials does not throw any exception.
                         * - Hence, adding a listFunctions() method call to test the connection.
                         */
                        connection.listFunctions();
                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> {
                        if (error instanceof AWSLambdaException
                                && "AccessDenied".equals(((AWSLambdaException) error).getErrorCode())) {
                            /**
                             * Sometimes a valid account credential may not have permission to run listBuckets action
                             * . In this case `AccessDenied` error is returned.
                             * That fact that the credentials caused `AccessDenied` error instead of invalid access key
                             * id or signature mismatch error means that the credentials are valid, we are able to
                             * establish a connection as well, but the account does not have permission to run
                             * listBuckets.
                             */
                            return Mono.just(new DatasourceTestResult());
                        }

                        return Mono.just(new DatasourceTestResult(error.getMessage()));
                    });
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();
            if (datasourceConfiguration == null || datasourceConfiguration.getAuthentication() == null) {
                invalids.add("Missing AWS credentials");
            } else {
                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (StringUtils.isNullOrEmpty(authentication.getUsername())) {
                    invalids.add("Missing AWS access key");
                }

                if (StringUtils.isNullOrEmpty(authentication.getPassword())) {
                    invalids.add("Missing AWS secret key");
                }
            }
            return invalids;
        }
    }
}
