package com.external.plugins;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.dynamodbv2.xspec.S;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;

import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ListObjectsV2Result;
import com.amazonaws.services.s3.model.ObjectListing;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.amazonaws.services.s3.model.S3ObjectSummary;
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
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.apache.commons.lang.StringUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static com.appsmith.external.models.Connection.Mode.READ_ONLY;

public class S3Plugin extends BasePlugin {

    private static final String S3_DRIVER = "com.amazonaws.services.s3.AmazonS3";
    private static final int ACTION_PROPERTY_INDEX = 0;
    private static final int BUCKET_NAME_PROPERTY_INDEX = 1;
    private static final int CLIENT_REGION_PROPERTY_INDEX = 0;

    public S3Plugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class S3PluginExecutor implements PluginExecutor<AmazonS3> {
        private final Scheduler scheduler = Schedulers.elastic();

        /*
         * - Exception thrown by this method is expected to be handled by the caller.
         */
        ArrayList<String> getFilenamesFromObjectListing(ObjectListing objectListing) throws AppsmithPluginException {
            if(objectListing == null) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Oops! Something went wrong. Appsmith server has encountered an error when fetching file " +
                        "content from AWS S3 server. This should not have happened"
                );
            }

            ArrayList<String> result = new ArrayList<>();
            List<S3ObjectSummary> objects = objectListing.getObjectSummaries();
            for (S3ObjectSummary os : objects) {
                result.add(os.getKey());
            }

            return result;
        }

        /*
         * - Exception thrown by this method is expected to be handled by the caller.
         */
        ArrayList<String> listAllFilesInBucket(AmazonS3 connection, String bucketName) throws AppsmithPluginException {
            if(connection == null) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Oops! Something went wrong. Appsmith server has encountered an error when establishing " +
                        "connection with AWS S3 server. This should not have happened"
                );
            }

            ArrayList<String> fileList = new ArrayList<>();
            ObjectListing result = connection.listObjects(bucketName);
            fileList.addAll(getFilenamesFromObjectListing(result));

            while(result.isTruncated()) {
                result = connection.listNextBatchOfObjects(result);
                fileList.addAll(getFilenamesFromObjectListing(result));
            }

            return fileList;
        }

        /*
         * - Exception thrown here is handled by the caller.
         */
        boolean uploadFileFromBody(AmazonS3 connection,
                                   String bucketName,
                                   String path,
                                   String body)
                                   throws InterruptedException {
            InputStream inputStream = new ByteArrayInputStream(body.getBytes());
            TransferManager transferManager = TransferManagerBuilder.standard().withS3Client(connection).build();
            transferManager.upload(bucketName, path, inputStream, new ObjectMetadata()).waitForUploadResult();

            return true;
        }

        /*
         * - Exception thrown here needs to be handled by the caller.
         */
        String readFile(AmazonS3 connection, String bucketName, String path) throws IOException {
            S3Object fullObject = connection.getObject(new GetObjectRequest(bucketName, path));
            S3ObjectInputStream content = fullObject.getObjectContent();

            String result = "";
            String line = null;
            BufferedReader reader = new BufferedReader(new InputStreamReader(content));
            while ((line = reader.readLine()) != null) {
                result += line;
            }

            try {
                if(fullObject != null) {
                    fullObject.close();
                }
            } catch (IOException e) {
                System.out.println("Error when closing AWS S3 connection after reading file: " + e.getMessage());
            }

            return result;
        }

        @Override
        public Mono<ActionExecutionResult> execute(AmazonS3 connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            /*
             * AmazonS3 API collection does not seem to provide any API to test connection validity or staleness.
             * Hence, unable to do stale connection check.
             */

            final List<Map<String, Object>> rowsList = new ArrayList<>(50);
            final String path = actionConfiguration.getPath();

            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            final com.external.plugins.S3Action s3Action = CollectionUtils.isEmpty(properties)
                                                           ? null
                                                           : com.external.plugins.S3Action
                                                           .valueOf(properties.get(ACTION_PROPERTY_INDEX).getValue());
            if (s3Action == null) {
                return Mono.error(
                        new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Oops! Something went wrong. Appsmith server has encountered an error when fetching query" +
                            " configuration. This should not have happened"
                        )
                );
            }

            if ((s3Action == S3Action.UPLOAD_FILE_FROM_BODY || s3Action == S3Action.READ_FILE ||
                 s3Action == S3Action.DELETE_FILE) && StringUtils.isBlank(path)) {
                return Mono.error(
                        new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Your query could not be executed. It seems that the 'File " +
                            "Path' field in the query form is left empty. 'File Path' field cannot be left empty with" +
                            " the chosen action"
                        )
                );
            }

            final String bucketName = CollectionUtils.isEmpty(properties)
                                      ? null
                                      : properties.get(BUCKET_NAME_PROPERTY_INDEX).getValue();
            if (bucketName == null) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Oops! Something went wrong. Appsmith server has encountered an error when reading AWS S3 " +
                        "bucket name from the datasource configuration. This should not have happened."
                ));
            }

            final String body = actionConfiguration.getBody();

            if (body == null) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Oops! Something went wrong. Appsmith server has encountered an error when reading " +
                                "query body from the query form. This should not have happened."
                        )
                );
            }

            return Mono.fromCallable(() -> {
                switch (s3Action) {
                    case LIST:
                        ArrayList<String> listOfFiles = listAllFilesInBucket(connection, bucketName);
                        for(int i=0; i<listOfFiles.size(); i++) {
                            rowsList.add(Map.of("List of Files", listOfFiles.get(i)));
                        }
                        break;
                    case UPLOAD_FILE_FROM_BODY:
                        uploadFileFromBody(connection, bucketName, path, body);
                        rowsList.add(Map.of("Action Status", "File uploaded successfully"));
                        break;
                    case READ_FILE:
                        final String result = readFile(connection, bucketName, path);
                        rowsList.add(Map.of("File Content", result));
                        break;
                    case DELETE_FILE:
                        connection.deleteObject(bucketName, path);
                        rowsList.add(Map.of("Action Status", "File deleted successfully"));
                        break;
                    default:
                        throw Exceptions.propagate(
                                new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                        "Oops! Something went wrong. It seems that the query has requested an " +
                                        "unsupported action: " + s3Action + ". This should not have happened"
                                )
                        );
                }

                return rowsList;
            })
            .flatMap(result -> {
                ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
                actionExecutionResult.setBody(objectMapper.valueToTree(rowsList));
                actionExecutionResult.setIsExecutionSuccess(true);
                System.out.println(Thread.currentThread().getName() + ": In the S3 Plugin, got action execution result");
                return Mono.just(actionExecutionResult);
            })
            .onErrorResume(e -> {
                if(e instanceof AppsmithPluginException) {
                    return Mono.error(e);
                }

                return Mono.error(
                        new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Oops! Something went wrong. Query execution failed in S3 Plugin when executing action: "
                            + s3Action + " : " + e.getMessage()
                        )
                );
            })
            .subscribeOn(scheduler);
        }

        @Override
        public Mono<AmazonS3> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            if(datasourceConfiguration == null) {
                return Mono.error(
                  new AppsmithPluginException(
                          AppsmithPluginError.PLUGIN_ERROR,
                          "Oops! Something went wrong. Appsmith server has encountered an error when reading " +
                          "datasource configuration for S3 plugin. This should not have happened."
                  )
                );
            }

            try {
                Class.forName(S3_DRIVER);
            } catch (ClassNotFoundException e) {
                return Mono.error(
                        new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Oops! Something went wrong. Appsmith server has encountered an error when " +
                            "loading AWS S3 driver class. This should not have happened."
                        )
                );
            }

            List<Property> properties = datasourceConfiguration.getProperties();
            if (properties == null || properties.isEmpty()) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Oops! Something went wrong. Appsmith server has encountered an error when " +
                                "fetching datasource properties. This should not have happened."
                        )
                );
            }

            return Mono.fromCallable(() -> {
                Regions clientRegion = null;
                try {
                    clientRegion = Regions.fromName(properties.get(CLIENT_REGION_PROPERTY_INDEX).getValue());
                } catch (Exception e) {
                    throw Exceptions.propagate(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    "Oops! Something went wrong. Appsmith server has encountered an error when " +
                                    "parsing AWS S3 instance region from the AWS S3 datasource configuration " +
                                    "provided: " + e.getMessage()
                            )
                    );
                }

                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if(authentication == null) {
                    throw Exceptions.propagate(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    "Oops! Something went wrong. Appsmith server has encountered an error when " +
                                    "fetching authentication info from datasource. This should not have happened."
                            )
                    );
                }

                String accessKey = authentication.getUsername();
                String secretKey = authentication.getPassword();
                BasicAWSCredentials awsCreds = null;
                try {
                    awsCreds = new BasicAWSCredentials(accessKey, secretKey);
                } catch (Exception e) {
                    throw Exceptions.propagate(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    "Oops! Something went wrong. Appsmith server has encountered an error when " +
                                    "parsing AWS credentials from datasource: " + e.getMessage()
                            )
                    );
                }

                return AmazonS3ClientBuilder
                                .standard()
                                .withRegion(clientRegion)
                                .withCredentials(new AWSStaticCredentialsProvider(awsCreds))
                                .build();
            })
            .onErrorResume(e -> {
                        if(e instanceof AppsmithPluginException) {
                            return Mono.error(e);
                        }

                        return Mono.error(
                                new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_ERROR,
                                        "Oops! Something went wrong. Appsmith server has encountered an error when " +
                                        "connecting to AWS S3 server: " + e.getMessage()
                                )
                        );
                    }
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
                        System.out.println("In datasourceDestroy function error mode: " + exception);
                        return Mono.empty();
                    })
                    .subscribeOn(scheduler)
                    .subscribe();
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if(datasourceConfiguration == null) {
                invalids.add("Oops! Something went wrong. Appsmith server has encountered an internal error when " +
                        "fetching datasource configuration. This should not have happened.");
            }

            if (datasourceConfiguration.getAuthentication() == null) {
                invalids.add("Oops! Something went wrong. Appsmith server has encountered an internal error when " +
                        "fetching authentication info from datasource configuration. This should not have happened.");
            } else {
                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (org.springframework.util.StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add("Oops! Something went wrong. Mandatory parameter 'Access Key' is empty. Did you " +
                            "forget to edit the 'Access Key' field in the datasource creation form ? You need to fill" +
                            " your AWS Access Key here.");
                }

                if (org.springframework.util.StringUtils.isEmpty(authentication.getPassword())) {
                    invalids.add("Oops! Something went wrong. Mandatory parameter 'Secret Key' is empty. Did you " +
                            "forget to edit the 'Secret Key' field in the datasource creation form ? You need to fill" +
                            " it with your AWS Secret Key.");
                }
            }

            List<Property> properties = datasourceConfiguration.getProperties();
            if(properties == null) {
                invalids.add("Oops! Something went wrong. Appsmith server has encountered an internal error when " +
                        "fetching datasource configuration properties. This should not have happened.");
            }

            if(CollectionUtils.isEmpty(properties)) {
                invalids.add("Oops! Something went wrong. Appsmith server has encountered an internal error " +
                        "when fetching contents of datasource configuration properties. This should not have happened" +
                        ".");
            }
            else {
                String region = properties.get(CLIENT_REGION_PROPERTY_INDEX).getValue();

                if(region == null) {
                    invalids.add("Oops! Something went wrong. Appsmith server has encountered an internal error " +
                            "when fetching Region info from datasource configuration. This should not have happened.");
                }

                if (org.springframework.util.StringUtils.isEmpty(region)) {
                    invalids.add("Oops! Something went wrong. Mandatory parameter 'Region' is empty. Did you forget " +
                            "to edit the 'Region' field in the datasource creation form ? You need to fill it with " +
                            "the region where your AWS instance is hosted");
                }
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            if(datasourceConfiguration == null) {
                return Mono.just(new DatasourceTestResult("Oops! Something went wrong. Appsmith server has " +
                        "encountered an internal error when fetching datasource configuration. This should not have " +
                        "happened."));
            }

            return datasourceCreate(datasourceConfiguration)
                    .map(connection -> {
                        /*
                         * - Please note that as of 28 Jan 2021, the way AmazonS3 client works, creating a connection
                         *   object with wrong credentials does not throw any exception.
                         * - Hence, adding a listBuckets() method call to test the connection.
                         */
                        connection.listBuckets();
                        try {
                            if (connection != null) {
                                connection.shutdown();
                            }
                        } catch (Exception e) {
                            System.out.println("Error closing S3 connection that was made for testing." + e);
                            return new DatasourceTestResult(e.getMessage());
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())))
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<DatasourceStructure> getStructure(AmazonS3 connection, DatasourceConfiguration datasourceConfiguration) {
            /*
             * Not sure if it make sense to list all buckets as part of structure ? Leaving it empty for now.
             */
            return null;
        }
    }
}
