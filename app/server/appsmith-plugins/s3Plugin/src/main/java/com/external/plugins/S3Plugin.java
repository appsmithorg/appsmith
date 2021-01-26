package com.external.plugins;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;

import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.transfer.TransferManager;
import com.amazonaws.services.s3.transfer.TransferManagerBuilder;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.apache.commons.lang.StringUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Properties;
import java.util.Set;

import static com.appsmith.external.models.Connection.Mode.READ_ONLY;

public class S3Plugin extends BasePlugin {

    private static final String S3_DRIVER = "com.amazonaws.services.s3.AmazonS3";
    private static final String USER = "user";
    private static final String PASSWORD = "password";
    private static final String SSL = "ssl";
    private static final int VALIDITY_CHECK_TIMEOUT = 5; /* must be positive, otherwise may receive exception */

    public S3Plugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class S3PluginExecutor implements PluginExecutor<AmazonS3> {
        private final Scheduler scheduler = Schedulers.elastic();

        void uploadFileFromBody(AmazonS3 connection, String path, String body) throws InterruptedException {
            //TODO: remove it and get bucket name properly.
            String bucketName = "testbucketforappsmithinternaltesting";
            InputStream inputStream = new ByteArrayInputStream(body.getBytes());
            TransferManager transferManager = TransferManagerBuilder.standard().withS3Client(connection).build();
            transferManager.upload(bucketName, path, inputStream, new ObjectMetadata()).waitForUploadResult();
        }

        @Override
        public Mono<ActionExecutionResult> execute(AmazonS3 connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            final String path = actionConfiguration.getPath();

            if (StringUtils.isBlank(path)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Document/Collection path cannot be empty"
                ));
            }

            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            final com.external.plugins.S3Action s3Action = CollectionUtils.isEmpty(properties)
                                                           ? null
                                                           : com.external.plugins.S3Action
                                                           .valueOf(properties.get(0).getValue());
            if (s3Action == null) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Missing S3 action."
                ));
            }

            final String body = actionConfiguration.getBody();

            if (body == null || StringUtils.isBlank(body)) {
                //TODO: report error
            }

            return Mono.fromCallable(() -> {
                switch (s3Action) {
                    case UPLOAD_FILE_FROM_BODY:
                        uploadFileFromBody(connection, path, body);
                        break;
                    default:
                        return Mono.error(
                                new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    "Invalid S3 action: " + s3Action.toString()
                                )
                        );
                }

                return Mono.just(true);
            })
            .flatMap(x -> {
                ActionExecutionResult result = new ActionExecutionResult();
                result.setBody("Upload successful");
                result.setIsExecutionSuccess(true);
                System.out.println(
                        Thread.currentThread().getName()
                                + ": In the S3 Plugin, got action execution result");
                return Mono.just(result);
            });
        }

        @Override
        public Mono<AmazonS3> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            try {
                Class.forName(S3_DRIVER);
            } catch (ClassNotFoundException e) {
                return Mono.error(
                        new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Error loading S3 driver class."
                        )
                );
            }

            List<Property> properties = datasourceConfiguration.getProperties();
            //TODO: remove it
            //Regions clientRegion = Regions.fromName("ap-south-1");
            Regions clientRegion = Regions.fromName(properties.get(0).getValue()); 
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            String accessKey = authentication.getUsername();
            String secretKey = authentication.getPassword();
            BasicAWSCredentials awsCreds = new BasicAWSCredentials(accessKey, secretKey);

            //TODO: handle errors
            return Mono.fromCallable(() ->
                        AmazonS3ClientBuilder
                        .standard()
                        .withRegion(clientRegion)
                        .withCredentials(new AWSStaticCredentialsProvider(awsCreds))
                        .build()
            )
            .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(AmazonS3 connection) {
            if (connection != null) {
                Mono.fromCallable(() -> {
                        connection.shutdown();
                        return connection;
                    })
                    .onErrorResume(exception -> {
                        log.debug("In datasourceDestroy function error mode.", exception);
                        System.out.println("In datasourceDestroy function error mode: " + exception);
                        return Mono.empty();
                    })
                    .subscribeOn(scheduler)
                    .subscribe();
            }
        }

        @Override
        public boolean isDatasourceValid(DatasourceConfiguration datasourceConfiguration) {
            return false;
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceStructure> getStructure(AmazonS3 connection, DatasourceConfiguration datasourceConfiguration) {
            return null;
        }
    }
}