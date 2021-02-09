package com.external.plugins;

import com.amazonaws.HttpMethod;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectListing;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.amazonaws.services.s3.transfer.TransferManager;
import com.amazonaws.services.s3.transfer.TransferManagerBuilder;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
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
import java.net.URL;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class AmazonS3Plugin extends BasePlugin {

    private static final String S3_DRIVER = "com.amazonaws.services.s3.AmazonS3";
    private static final int ACTION_PROPERTY_INDEX = 0;
    private static final int BUCKET_NAME_PROPERTY_INDEX = 1;
    private static final int GET_SIGNED_URL_PROPERTY_INDEX = 2;
    private static final int URL_EXPIRY_DURATION_PROPERTY_INDEX = 3;
    private static final int PREFIX_PROPERTY_INDEX = 4;
    private static final int CLIENT_REGION_PROPERTY_INDEX = 0;
    private static final String YES = "YES";

    public AmazonS3Plugin(PluginWrapper wrapper) {
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
                        "Appsmith server has encountered an unexpected error when fetching file " +
                        "content from AWS S3 server. Please reach out to Appsmith customer support to resolve this"
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
        ArrayList<String> listAllFilesInBucket(AmazonS3 connection,
                                               String bucketName,
                                               String prefix) throws AppsmithPluginException {
            if(connection == null) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith server has encountered an unexpected error when establishing " +
                        "connection with AWS S3 server. Please reach out to Appsmith customer support to resolve this."
                );
            }

            if(bucketName == null) {
                /*
                 * - bucketName is NOT expected to be null at this program point. A null check has been added in the
                 *  execute function already.
                 */
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith has encountered an unexpected error when getting bucket name. Please reach out to " +
                        "Appsmith customer support to resolve this."
                );
            }

            if(prefix == null) {
                /*
                 * - prefix is NOT expected to be null at this program point. A null check has been added in the
                 *  execute function already.
                 */
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith has encountered an unexpected error when getting path prefix. Please reach out to " +
                        "Appsmith customer support to resolve this."
                );
            }

            ArrayList<String> fileList = new ArrayList<>();
            ObjectListing result = connection.listObjects(bucketName, prefix);
            fileList.addAll(getFilenamesFromObjectListing(result));

            while(result.isTruncated()) {
                result = connection.listNextBatchOfObjects(result);
                fileList.addAll(getFilenamesFromObjectListing(result));
            }

            return fileList;
        }

        ArrayList<String> getSignedUrls(AmazonS3 connection,
                                        String bucketName,
                                        ArrayList<String> listOfFiles,
                                        int durationInMilliseconds) {
            Date expiration = new java.util.Date();
            long expTimeMillis = expiration.getTime();
            expTimeMillis += durationInMilliseconds;
            expiration.setTime(expTimeMillis);

            ArrayList<String> urlList = new ArrayList<>();
            for(String filePath : listOfFiles) {
                GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(bucketName,
                                                                                                          filePath)
                                                                              .withMethod(HttpMethod.GET)
                                                                              .withExpiration(expiration);
                URL url = connection.generatePresignedUrl(generatePresignedUrlRequest);
                urlList.add(url.toString());
            }

            return urlList;
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
            S3Object fullObject = connection.getObject(bucketName, path);
            S3ObjectInputStream content = fullObject.getObjectContent();

            String result = "";
            String line = null;
            BufferedReader reader = new BufferedReader(new InputStreamReader(content));
            while ((line = reader.readLine()) != null) {
                result += line + "\n";
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
             * - AmazonS3 API collection does not seem to provide any API to test connection validity or staleness.
             *   Hence, unable to do stale connection check explicitly.
             * - If connection object is null, then assume stale connection.
             */
            if(connection == null) {
                return Mono.error(new StaleConnectionException());
            }

            if(datasourceConfiguration == null) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "At least one of the mandatory fields in S3 datasource creation form is empty - " +
                                "'Access Key'/'Secret Key'/'Region'. Please fill all the mandatory fields and try again."
                        )
                );
            }

            if(actionConfiguration == null) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "At least one of the mandatory fields in S3 query creation form is empty - 'Action'/" +
                                "'Bucket Name'/'File Path'/'Content'. Please fill all the mandatory fields and try " +
                                "again."
                        )
                );
            }

            final String path = actionConfiguration.getPath();
            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            if(CollectionUtils.isEmpty(properties)) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "Mandatory parameters 'Action' and 'Bucket Name' are missing. Did you forget to edit " +
                                "the 'Action' and 'Bucket Name' fields in the query form ?"
                        )
                );
            }

            if(properties.get(ACTION_PROPERTY_INDEX) == null) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "Mandatory parameter 'Action' is missing. Did you forget to select one of the actions" +
                                " from the Action dropdown ?"
                        )
                );
            }

            AmazonS3Action s3Action = AmazonS3Action.valueOf(properties.get(ACTION_PROPERTY_INDEX).getValue());
            if (s3Action == null) {
                return Mono.error(
                        new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Appsmith server has encountered an unexpected error when parsing query" +
                            " action. Please reach out to Appsmith customer support to resolve this."
                        )
                );
            }

            if ((s3Action == AmazonS3Action.UPLOAD_FILE_FROM_BODY || s3Action == AmazonS3Action.READ_FILE ||
                 s3Action == AmazonS3Action.DELETE_FILE) && StringUtils.isBlank(path)) {
                return Mono.error(
                        new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Required parameter 'File Path' is missing. Did you forget to edit the 'File Path' field " +
                            "in the query form ? This field cannot be left empty with the chosen action."
                        )
                );
            }

            if(properties.size() < (1+BUCKET_NAME_PROPERTY_INDEX)
               || properties.get(BUCKET_NAME_PROPERTY_INDEX) == null) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "Mandatory parameter 'Bucket Name' is missing. Did you forget to edit the 'Bucket " +
                                "Name' field in the query form ?"
                        )
                );
            }

            final String bucketName = properties.get(BUCKET_NAME_PROPERTY_INDEX).getValue();
            if(StringUtils.isEmpty(bucketName)) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "Mandatory parameter 'Bucket Name' is missing. Did you forget to edit the 'Bucket " +
                                "Name' field in the query form ?"
                        )
                );
            }

            /*
             * - Allow users to upload empty file. Hence, only check for null value.
             */
            final String body = actionConfiguration.getBody();
            if(s3Action == AmazonS3Action.UPLOAD_FILE_FROM_BODY && body == null) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "Mandatory parameter 'Content' is missing. Did you forget to edit the 'Content' " +
                                "field in the query form ?"
                        )
                );
            }

            return Mono.fromCallable(() -> {
                Object actionResult;
                switch (s3Action) {
                    case LIST:
                        String prefix = "";
                        if(properties.size() > PREFIX_PROPERTY_INDEX
                           && properties.get(PREFIX_PROPERTY_INDEX) != null
                           && properties.get(PREFIX_PROPERTY_INDEX).getValue() != null) {
                            prefix = properties.get(PREFIX_PROPERTY_INDEX).getValue();
                        }

                        ArrayList<String> listOfFiles = listAllFilesInBucket(connection, bucketName, prefix);

                        if(properties.size() > GET_SIGNED_URL_PROPERTY_INDEX
                           && properties.get(GET_SIGNED_URL_PROPERTY_INDEX) != null
                           && properties.get(GET_SIGNED_URL_PROPERTY_INDEX).getValue().equals(YES)) {

                            if(properties.size() < (1+URL_EXPIRY_DURATION_PROPERTY_INDEX)
                               || properties.get(URL_EXPIRY_DURATION_PROPERTY_INDEX) == null
                               || StringUtils.isEmpty(properties.get(URL_EXPIRY_DURATION_PROPERTY_INDEX).getValue())) {
                                throw new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                        "Required parameter 'URL Expiry Duration' is missing. Did you forget to" +
                                        " edit the 'URL Expiry Duration' field ?"
                                );
                            }

                            int durationInMilliseconds = 0;
                            try {
                                durationInMilliseconds = Integer
                                                             .parseInt(
                                                                     properties
                                                                     .get(URL_EXPIRY_DURATION_PROPERTY_INDEX)
                                                                     .getValue()
                                                             );
                            } catch (NumberFormatException e) {
                                throw new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                        "Parameter 'URL Expiry Duration' is NOT a number. Please ensure that the " +
                                        "input to 'URL Expiry Duration' field is a valid number - i.e. any non-negative integer."
                                );
                            }

                            ArrayList<String> listOfSignedUrls = getSignedUrls(connection,
                                                                               bucketName,
                                                                               listOfFiles,
                                                                               durationInMilliseconds);
                            if(listOfFiles.size() != listOfSignedUrls.size()) {
                                throw new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_ERROR,
                                        "Appsmith server has encountered an unexpected error when getting " +
                                        "list of files from AWS S3 server. Please reach out to Appsmith customer " +
                                        "support to resolve this."
                                );
                            }

                            ArrayList<ArrayList<String>> listOfFilesAndUrls = new ArrayList<>();
                            for(int i=0; i<listOfFiles.size(); i++) {
                                ArrayList<String> fileUrlPair = new ArrayList<>();
                                fileUrlPair.add(listOfFiles.get(i));
                                fileUrlPair.add(listOfSignedUrls.get(i));
                                listOfFilesAndUrls.add(fileUrlPair);
                            }

                            actionResult = Map.of("List of Files", listOfFilesAndUrls);
                        }
                        else {
                            actionResult = Map.of("List of Files", listOfFiles);
                        }
                        break;
                    case UPLOAD_FILE_FROM_BODY:
                        uploadFileFromBody(connection, bucketName, path, body);
                        actionResult = Map.of("Status", "File uploaded successfully");
                        break;
                    case READ_FILE:
                        final String result = readFile(connection, bucketName, path);
                        actionResult = result;
                        break;
                    case DELETE_FILE:
                        connection.deleteObject(bucketName, path);
                        actionResult = Map.of("Status", "File deleted successfully");
                        break;
                    default:
                        throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "It seems that the query has requested an unsupported action: " + s3Action +
                            ". Please reach out to Appsmith customer support to resolve this."
                        );
                }
                return actionResult;
            })
            .flatMap(result -> {
                ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
                actionExecutionResult.setBody(result);
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
                            "Query execution failed in S3 Plugin when executing action: "
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
                          AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                          "Mandatory fields 'Access Key', 'Secret Key', 'Region' missing. Did you forget to edit " +
                          "the 'Access Key'/'Secret Key'/'Region' fields in the datasource creation form ?"
                  )
                );
            }

            try {
                Class.forName(S3_DRIVER);
            } catch (ClassNotFoundException e) {
                return Mono.error(
                        new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Appsmith server has failed to load AWS S3 driver class. Please reach out to Appsmith " +
                            "customer support to resolve this."
                        )
                );
            }

            return (Mono<AmazonS3>) Mono.fromCallable(() -> {
                List<Property> properties = datasourceConfiguration.getProperties();
                if(properties == null || properties.get(CLIENT_REGION_PROPERTY_INDEX) == null) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Mandatory parameter 'Region' is empty. Did you forget to edit the 'Region' field" +
                                    " in the datasource creation form ? You need to fill it with the region where " +
                                    "your AWS instance is hosted."
                            )
                    );
                }

                final String region = properties.get(CLIENT_REGION_PROPERTY_INDEX).getValue();
                if(StringUtils.isEmpty(region)) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Mandatory parameter 'Region' is empty. Did you forget to edit the 'Region' field" +
                                    " in the datasource creation form ? You need to fill it with the region where " +
                                    "your AWS instance is hosted."
                            )
                    );
                }

                final Regions clientRegion;
                try {
                    clientRegion = Regions.fromName(region);
                } catch (IllegalArgumentException e) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Appsmith server has encountered an error when " +
                                    "parsing AWS S3 instance region from the AWS S3 datasource configuration " +
                                    "provided: " + e.getMessage()
                            )
                    );
                }

                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if(authentication == null
                   || StringUtils.isEmpty(authentication.getUsername())
                   || StringUtils.isEmpty(authentication.getPassword())) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Mandatory parameters 'Access Key' and/or 'Secret Key' are missing. Did you " +
                                    "forget to edit the 'Access Key'/'Secret Key' fields in the datasource creation form ?"
                            )
                    );
                }

                String accessKey = authentication.getUsername();
                String secretKey = authentication.getPassword();
                BasicAWSCredentials awsCreds = null;
                try {
                    awsCreds = new BasicAWSCredentials(accessKey, secretKey);
                } catch (IllegalArgumentException e) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Appsmith server has encountered an error when " +
                                    "parsing AWS credentials from datasource: " + e.getMessage()
                            )
                    );
                }

                return Mono.just(AmazonS3ClientBuilder
                                .standard()
                                .withRegion(clientRegion)
                                .withCredentials(new AWSStaticCredentialsProvider(awsCreds))
                                .build());

            })
            .flatMap(obj -> obj)
            .onErrorResume(e -> {
                        if(e instanceof AppsmithPluginException) {
                            return Mono.error(e);
                        }

                        return Mono.error(
                                new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_ERROR,
                                        "Appsmith server has encountered an error when " +
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
                        System.out.println("Error closing S3 connection: " + exception);
                        return Mono.empty();
                    })
                    .subscribeOn(scheduler)
                    .subscribe();
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (datasourceConfiguration == null || datasourceConfiguration.getAuthentication() == null) {
                invalids.add("At least one of the mandatory fields in S3 datasource creation form is empty - " +
                             "'Access Key'/'Secret Key'/'Region'. Please fill all the mandatory fields and try again.");
            } else {
                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (StringUtils.isBlank(authentication.getUsername())) {
                    invalids.add("Mandatory parameter 'Access Key' is empty. Did you forget to edit the 'Access Key' " +
                                 "field in the datasource creation form ? You need to fill it with your AWS Access " +
                                 "Key.");
                }

                if (StringUtils.isBlank(authentication.getPassword())) {
                    invalids.add("Mandatory parameter 'Secret Key' is empty. Did you forget to edit the 'Secret Key' " +
                                 "field in the datasource creation form ? You need to fill it with your AWS Secret " +
                                 "Key.");
                }
            }

            List<Property> properties = datasourceConfiguration.getProperties();
            try {
                if(StringUtils.isBlank(properties.get(CLIENT_REGION_PROPERTY_INDEX).getValue())) {
                    invalids.add("Mandatory parameter 'Region' is empty. Did you forget to edit the 'Region' field in" +
                                 " the datasource creation form ? You need to fill it with the region where your AWS " +
                                 "instance is hosted.");
                }
            } catch (Exception e) {
                invalids.add("Mandatory parameter 'Region' is empty. Did you forget to edit the 'Region' field in" +
                             " the datasource creation form ? You need to fill it with the region where your AWS " +
                             "instance is hosted.");
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            if(datasourceConfiguration == null) {
                return Mono.just(
                        new DatasourceTestResult(
                    "At least one of the mandatory fields in S3 datasource creation form is empty - " +
                            "'Access Key'/'Secret Key'/'Region'. Please fill all the mandatory fields and try again."
                        )
                );
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
            return Mono.empty();
        }
    }
}
