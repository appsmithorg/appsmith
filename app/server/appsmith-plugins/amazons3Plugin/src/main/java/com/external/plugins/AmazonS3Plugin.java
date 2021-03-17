package com.external.plugins;

import com.amazonaws.HttpMethod;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectListing;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.amazonaws.services.s3.transfer.TransferManager;
import com.amazonaws.services.s3.transfer.TransferManagerBuilder;
import com.amazonaws.util.IOUtils;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Calendar;
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
    private static final int READ_WITH_BASE64_ENCODING_PROPERTY_INDEX = 5;
    private static final int USING_FILEPICKER_FOR_UPLOAD_PROPERTY_INDEX = 6;
    private static final int URL_EXPIRY_DURATION_FOR_UPLOAD_PROPERTY_INDEX = 7;
    private static final int AWS_S3_REGION_PROPERTY_INDEX = 0;
    private static final int S3_SERVICE_PROVIDER_PROPERTY_INDEX = 1;
    private static final int CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX = 2;
    private static final int CUSTOM_ENDPOINT_INDEX = 0;
    private static final int DEFAULT_URL_EXPIRY_IN_MINUTES = 5; // max 7 days is possible
    private static final String YES = "YES";
    private static final String BASE64_DELIMITER = ";base64,";
    private static final String AMAZON_S3_SERVICE_PROVIDER = "amazon-s3";

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
            if (objectListing == null) {
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
            if (connection == null) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith server has encountered an unexpected error when establishing " +
                                "connection with AWS S3 server. Please reach out to Appsmith customer support to resolve this."
                );
            }

            if (bucketName == null) {
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

            if (prefix == null) {
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

            ObjectListing result = connection.listObjects(bucketName, prefix);
            ArrayList<String> fileList = new ArrayList<>(getFilenamesFromObjectListing(result));

            while (result.isTruncated()) {
                result = connection.listNextBatchOfObjects(result);
                fileList.addAll(getFilenamesFromObjectListing(result));
            }

            return fileList;
        }

        ArrayList<String> getSignedUrls(AmazonS3 connection,
                                        String bucketName,
                                        ArrayList<String> listOfFiles,
                                        Date expiryDateTime) {
            ArrayList<String> urlList = new ArrayList<>();

            for (String filePath : listOfFiles) {
                GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(bucketName,
                        filePath)
                        .withMethod(HttpMethod.GET)
                        .withExpiration(expiryDateTime);

                URL url = connection.generatePresignedUrl(generatePresignedUrlRequest);
                urlList.add(url.toString());
            }

            return urlList;
        }

        /*
         * - Throws exception on upload failure.
         * - Returns signed url of the created file on success.
         */
        String uploadFileFromBody(AmazonS3 connection,
                                  String bucketName,
                                  String path,
                                  String body,
                                  Boolean usingFilePicker,
                                  Date expiryDateTime)
                throws InterruptedException, AppsmithPluginException {

            byte[] payload;
            if (Boolean.TRUE.equals(usingFilePicker)) {
                String encodedPayload = body;
                /*
                 * - For files uploaded using Filepicker.xyz.base64, body format is "<content-type>;base64,<actual-
                 *   base64-encoded-payload>".
                 * - Strip off the redundant part in the beginning to get actual payload.
                 */
                if (body.contains(BASE64_DELIMITER)) {
                    List<String> bodyArrayList = Arrays.asList(body.split(BASE64_DELIMITER));
                    encodedPayload = bodyArrayList.get(bodyArrayList.size() - 1);
                }

                try {
                    payload = Base64.getDecoder().decode(encodedPayload);
                } catch (IllegalArgumentException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "File content is not base64 encoded. File content needs to be base64 encoded when the " +
                                    "'File Data Type: Base64/Text' field is selected 'Yes'."
                    );
                }
            } else {
                payload = body.getBytes();
            }

            InputStream inputStream = new ByteArrayInputStream(payload);
            TransferManager transferManager = TransferManagerBuilder.standard().withS3Client(connection).build();
            transferManager.upload(bucketName, path, inputStream, new ObjectMetadata()).waitForUploadResult();

            ArrayList<String> listOfFiles = new ArrayList<>();
            listOfFiles.add(path);
            ArrayList<String> listOfUrls = getSignedUrls(connection, bucketName, listOfFiles, expiryDateTime);
            if (listOfUrls.size() != 1) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith has encountered an unexpected error when fetching url from AmazonS3 after file " +
                                "creation. Please reach out to Appsmith customer support to resolve this."
                );
            }
            String signedUrl = listOfUrls.get(0);

            return signedUrl;
        }

        /*
         * - Exception thrown here needs to be handled by the caller.
         */
        String readFile(AmazonS3 connection, String bucketName, String path, Boolean encodeContent) throws IOException {
            S3Object fullObject = connection.getObject(bucketName, path);
            S3ObjectInputStream content = fullObject.getObjectContent();
            byte[] bytes = IOUtils.toByteArray(content);

            String result;
            if (Boolean.TRUE.equals(encodeContent)) {
                result = new String(Base64.getEncoder().encode(bytes));
            } else {
                result = new String(bytes);
            }

            return result;
        }

        @Override
        public Mono<ActionExecutionResult> execute(AmazonS3 connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            final String[] query = new String[1];
            Map<String, Object> requestProperties = new HashMap<>();


            return Mono.fromCallable(() -> {

                /*
                 * - AmazonS3 API collection does not seem to provide any API to test connection validity or staleness.
                 *   Hence, unable to do stale connection check explicitly.
                 * - If connection object is null, then assume stale connection.
                 */
                if (connection == null) {
                    return Mono.error(new StaleConnectionException());
                }

                if (datasourceConfiguration == null) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "At least one of the mandatory fields in S3 datasource creation form is empty - " +
                                            "'Access Key'/'Secret Key'/'Region'. Please fill all the mandatory fields and try again."
                            )
                    );
                }

                if (actionConfiguration == null) {
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
                requestProperties.put("path", path == null ? "" : path);

                final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
                if (CollectionUtils.isEmpty(properties)) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "Mandatory parameters 'Action' and 'Bucket Name' are missing. Did you forget to edit " +
                                            "the 'Action' and 'Bucket Name' fields in the query form ?"
                            )
                    );
                }

                if (properties.get(ACTION_PROPERTY_INDEX) == null) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "Mandatory parameter 'Action' is missing. Did you forget to select one of the actions" +
                                            " from the Action dropdown ?"
                            )
                    );
                }


                AmazonS3Action s3Action = AmazonS3Action.valueOf(properties.get(ACTION_PROPERTY_INDEX).getValue());
                query[0] = s3Action.name();

                if (properties.size() < (1 + BUCKET_NAME_PROPERTY_INDEX)
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
                requestProperties.put("bucket", bucketName == null ? "" : bucketName);

                if (StringUtils.isEmpty(bucketName)) {
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
                requestProperties.put("content", body == null ? "null" : body);

                if (s3Action == AmazonS3Action.UPLOAD_FILE_FROM_BODY && body == null) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "Mandatory parameter 'Content' is missing. Did you forget to edit the 'Content' " +
                                            "field in the query form ?"
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


                Object actionResult;
                switch (s3Action) {
                    case LIST:
                        String prefix = "";
                        if (properties.size() > PREFIX_PROPERTY_INDEX
                                && properties.get(PREFIX_PROPERTY_INDEX) != null
                                && properties.get(PREFIX_PROPERTY_INDEX).getValue() != null) {
                            prefix = properties.get(PREFIX_PROPERTY_INDEX).getValue();
                        }

                        ArrayList<String> listOfFiles = listAllFilesInBucket(connection, bucketName, prefix);

                        if (properties.size() > GET_SIGNED_URL_PROPERTY_INDEX
                                && properties.get(GET_SIGNED_URL_PROPERTY_INDEX) != null
                                && properties.get(GET_SIGNED_URL_PROPERTY_INDEX).getValue().equals(YES)) {

                            int durationInMinutes;
                            if (properties.size() < (1 + URL_EXPIRY_DURATION_PROPERTY_INDEX)
                                    || properties.get(URL_EXPIRY_DURATION_PROPERTY_INDEX) == null
                                    || StringUtils.isEmpty(properties.get(URL_EXPIRY_DURATION_PROPERTY_INDEX).getValue())) {
                                durationInMinutes = DEFAULT_URL_EXPIRY_IN_MINUTES;
                            } else {
                                try {
                                    durationInMinutes = Integer
                                            .parseInt(
                                                    properties
                                                            .get(URL_EXPIRY_DURATION_PROPERTY_INDEX)
                                                            .getValue()
                                            );
                                } catch (NumberFormatException e) {
                                    return Mono.error(new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                            "Parameter 'Expiry Duration of Signed URL' is NOT a number. Please ensure that the " +
                                                    "input to 'Expiry Duration of Signed URL' field is a valid number - i.e. " +
                                                    "any non-negative integer. Please note that the maximum expiry " +
                                                    "duration supported by Amazon S3 is 7 days i.e. 10080 minutes."
                                    ));
                                }
                            }

                            Calendar calendar = Calendar.getInstance();
                            calendar.add(Calendar.MINUTE, durationInMinutes);
                            Date expiryDateTime = calendar.getTime();
                            DateFormat dateTimeFormat = new SimpleDateFormat("dd MMM yyyy HH:mm:ss:SSS z");
                            String expiryDateTimeString = dateTimeFormat.format(expiryDateTime);

                            ArrayList<String> listOfSignedUrls = getSignedUrls(connection,
                                    bucketName,
                                    listOfFiles,
                                    expiryDateTime);
                            if (listOfFiles.size() != listOfSignedUrls.size()) {
                                return Mono.error(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_ERROR,
                                        "Appsmith server has encountered an unexpected error when getting " +
                                                "list of files from AWS S3 server. Please reach out to Appsmith customer " +
                                                "support to resolve this."
                                ));
                            }

                            actionResult = new ArrayList<>();
                            for (int i = 0; i < listOfFiles.size(); i++) {
                                HashMap<String, Object> fileInfo = new HashMap<>();
                                fileInfo.put("fileName", listOfFiles.get(i));
                                fileInfo.put("signedUrl", listOfSignedUrls.get(i));
                                fileInfo.put("urlExpiryDate", expiryDateTimeString);
                                ((ArrayList<Object>) actionResult).add(fileInfo);
                            }
                        } else {
                            actionResult = new ArrayList<>();
                            for (int i = 0; i < listOfFiles.size(); i++) {
                                HashMap<String, Object> fileInfo = new HashMap<>();
                                fileInfo.put("fileName", listOfFiles.get(i));
                                ((ArrayList<Object>) actionResult).add(fileInfo);
                            }
                        }
                        break;
                    case UPLOAD_FILE_FROM_BODY:
                        int durationInMinutes;
                        if (properties.size() < (1 + URL_EXPIRY_DURATION_FOR_UPLOAD_PROPERTY_INDEX)
                                || properties.get(URL_EXPIRY_DURATION_FOR_UPLOAD_PROPERTY_INDEX) == null
                                || StringUtils.isEmpty(properties.get(URL_EXPIRY_DURATION_FOR_UPLOAD_PROPERTY_INDEX).getValue())) {
                            durationInMinutes = DEFAULT_URL_EXPIRY_IN_MINUTES;
                        } else {
                            try {
                                durationInMinutes = Integer
                                        .parseInt(
                                                properties
                                                        .get(URL_EXPIRY_DURATION_FOR_UPLOAD_PROPERTY_INDEX)
                                                        .getValue()
                                        );
                            } catch (NumberFormatException e) {
                                return Mono.error(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                        "Parameter 'Expiry Duration of Signed URL' is NOT a number. Please ensure that the " +
                                                "Expiry Duration of Signed URL' field is a valid number - i.e. any " +
                                                "non-negative integer. Please note that the maximum expiry duration supported" +
                                                " by Amazon S3 is 7 days i.e. 10080 minutes."
                                ));
                            }
                        }
                        requestProperties.put("expiry duration in minutes", String.valueOf(durationInMinutes));

                        Calendar calendar = Calendar.getInstance();
                        calendar.add(Calendar.MINUTE, durationInMinutes);
                        Date expiryDateTime = calendar.getTime();
                        DateFormat dateTimeFormat = new SimpleDateFormat("dd MMM yyyy HH:mm:ss:SSS z");
                        String expiryDateTimeString = dateTimeFormat.format(expiryDateTime);

                        String signedUrl;
                        if (properties.size() > USING_FILEPICKER_FOR_UPLOAD_PROPERTY_INDEX
                                && properties.get(USING_FILEPICKER_FOR_UPLOAD_PROPERTY_INDEX) != null
                                && properties.get(USING_FILEPICKER_FOR_UPLOAD_PROPERTY_INDEX).getValue().equals(YES)) {
                            signedUrl = uploadFileFromBody(connection, bucketName, path, body, true, expiryDateTime);
                        } else {
                            signedUrl = uploadFileFromBody(connection, bucketName, path, body, false, expiryDateTime);
                        }
                        actionResult = new HashMap<String, Object>();
                        ((HashMap<String, Object>) actionResult).put("signedUrl", signedUrl);
                        ((HashMap<String, Object>) actionResult).put("urlExpiryDate", expiryDateTimeString);
                        break;
                    case READ_FILE:
                        String result;
                        if (properties.size() > READ_WITH_BASE64_ENCODING_PROPERTY_INDEX
                                && properties.get(READ_WITH_BASE64_ENCODING_PROPERTY_INDEX) != null
                                && properties.get(READ_WITH_BASE64_ENCODING_PROPERTY_INDEX).getValue().equals(YES)) {
                            result = readFile(connection, bucketName, path, true);
                        } else {
                            result = readFile(connection, bucketName, path, false);
                        }
                        actionResult = Map.of("fileData", result);
                        break;
                    case DELETE_FILE:
                        /*
                         * - If attempting to delete an object that does not exist, Amazon S3 returns a success message
                         *   instead of an error message.
                         */
                        connection.deleteObject(bucketName, path);
                        actionResult = Map.of("status", "File deleted successfully");
                        break;
                    default:
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "It seems that the query has requested an unsupported action: " + query[0] +
                                        ". Please reach out to Appsmith customer support to resolve this."
                        ));
                }
                return Mono.just(actionResult);
            })
                    .flatMap(obj -> obj)
                    .flatMap(result -> {
                        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
                        actionExecutionResult.setBody(result);
                        actionExecutionResult.setIsExecutionSuccess(true);
                        System.out.println(Thread.currentThread().getName() + ": In the S3 Plugin, got action execution result");
                        return Mono.just(actionExecutionResult);
                    })
                    // Transform AmazonS3Exception to AppsmithPluginException
                    .onErrorResume(e -> {
                        if (e instanceof AmazonS3Exception) {
                            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e.getMessage()));
                        }
                        return Mono.error(e);
                    })
                    .onErrorResume(e -> {
                        if (e instanceof StaleConnectionException) {
                            return Mono.error(e);
                        }
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        result.setBody(e.getMessage());
                        if (e instanceof AppsmithPluginException) {
                            result.setStatusCode(((AppsmithPluginException) e).getAppErrorCode().toString());
                        }
                        return Mono.just(result);

                    })
                    // Now set the request in the result to be returned back to the server
                    .map(actionExecutionResult -> {
                        ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
                        actionExecutionRequest.setQuery(query[0]);
                        actionExecutionRequest.setProperties(requestProperties);
                        actionExecutionResult.setRequest(actionExecutionRequest);
                        return actionExecutionResult;
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<AmazonS3> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            if (datasourceConfiguration == null) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                "Mandatory fields 'Access Key', 'Secret Key', 'Region' missing. Did you forget to edit " +
                                        "the 'Access Key'/'Secret Key'/'Region' fields in the datasource creation form?"
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

                /*
                 * - Ideally, properties must never be null because the fields contained in the properties list have a
                 *   default value defined.
                 * - Ideally, properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) must never be null/empty, because the
                 *   `S3 Service Provider` dropdown has a default value.
                 */
                if (properties == null
                        || properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) == null
                        || StringUtils.isEmpty(properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue())) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Appsmith has failed to fetch the 'S3 Service Provider' field properties. Please " +
                                            "reach out to Appsmith customer support to resolve this."
                            )
                    );
                }

                final boolean usingCustomEndpoint =
                        !AMAZON_S3_SERVICE_PROVIDER.equals(properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue());

                if (!usingCustomEndpoint
                        && (properties.size() < (AWS_S3_REGION_PROPERTY_INDEX + 1)
                        || properties.get(AWS_S3_REGION_PROPERTY_INDEX) == null
                        || StringUtils.isEmpty(properties.get(AWS_S3_REGION_PROPERTY_INDEX).getValue()))) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Required parameter 'Region' is empty. Did you forget to edit the 'Region' field" +
                                            " in the datasource creation form ? You need to fill it with the region where " +
                                            "your AWS S3 instance is hosted."
                            )
                    );
                }

                if (usingCustomEndpoint
                        && (datasourceConfiguration.getEndpoints() == null
                        || CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())
                        || datasourceConfiguration.getEndpoints().get(CUSTOM_ENDPOINT_INDEX) == null
                        || StringUtils.isEmpty(datasourceConfiguration.getEndpoints().get(CUSTOM_ENDPOINT_INDEX).getHost()))) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Required parameter 'Endpoint URL' is empty. Did you forget to edit the 'Endpoint" +
                                            " URL' field in the datasource creation form ? You need to fill it with " +
                                            "the endpoint URL of your S3 instance."
                            )
                    );
                }

                if (usingCustomEndpoint
                        && (properties.size() < (CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX + 1)
                        || properties.get(CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX) == null
                        || StringUtils.isEmpty(properties.get(CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX).getValue()))) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Required parameter 'Region' is empty. Did you forget to edit the 'Region' field" +
                                            " in the datasource creation form ? You need to fill it with the region where " +
                                            "your S3 instance is hosted."
                            )
                    );
                }

                final String region = usingCustomEndpoint ?
                        properties.get(CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX).getValue() :
                        properties.get(AWS_S3_REGION_PROPERTY_INDEX).getValue();

                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (authentication == null
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

                BasicAWSCredentials awsCreds;
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

                AmazonS3ClientBuilder s3ClientBuilder = AmazonS3ClientBuilder
                        .standard()
                        .withCredentials(new AWSStaticCredentialsProvider(awsCreds));

                if (!usingCustomEndpoint) {
                    Regions clientRegion = null;

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

                    s3ClientBuilder = s3ClientBuilder.withRegion(clientRegion);
                } else {
                    String endpoint = datasourceConfiguration.getEndpoints().get(CUSTOM_ENDPOINT_INDEX).getHost();
                    s3ClientBuilder = s3ClientBuilder
                            .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(endpoint, region));
                }

                return Mono.just(s3ClientBuilder.build());

            })
                    .flatMap(obj -> obj)
                    .onErrorResume(e -> {
                                if (e instanceof AppsmithPluginException) {
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

            /*
             * - Ideally, properties must never be null because the fields contained in the properties list have a
             *   default value defined.
             * - Ideally, properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) must never be null/empty, because the
             *   `S3 Service Provider` dropdown has a default value.
             */
            if (properties == null
                    || properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) == null
                    || StringUtils.isEmpty(properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue())) {
                invalids.add("Appsmith has failed to fetch the 'S3 Service Provider' field properties. Please " +
                        "reach out to Appsmith customer support to resolve this.");
            }
            final boolean usingCustomEndpoint =
                    !AMAZON_S3_SERVICE_PROVIDER.equals(properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue());

            if (!usingCustomEndpoint
                    && (properties.size() < (AWS_S3_REGION_PROPERTY_INDEX + 1)
                    || properties.get(AWS_S3_REGION_PROPERTY_INDEX) == null
                    || StringUtils.isEmpty(properties.get(AWS_S3_REGION_PROPERTY_INDEX).getValue()))) {
                invalids.add("Required parameter 'Region' is empty. Did you forget to edit the 'Region' field" +
                        " in the datasource creation form ? You need to fill it with the region where " +
                        "your AWS S3 instance is hosted.");
            }

            if (usingCustomEndpoint
                    && (datasourceConfiguration.getEndpoints() == null
                    || CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())
                    || datasourceConfiguration.getEndpoints().get(CUSTOM_ENDPOINT_INDEX) == null
                    || StringUtils.isEmpty(datasourceConfiguration.getEndpoints().get(CUSTOM_ENDPOINT_INDEX).getHost()))) {
                invalids.add("Required parameter 'Endpoint URL' is empty. Did you forget to edit the 'Endpoint" +
                        " URL' field in the datasource creation form ? You need to fill it with " +
                        "the endpoint URL of your S3 instance.");
            }

            if (usingCustomEndpoint
                    && (properties.size() < (CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX + 1)
                    || properties.get(CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX) == null
                    || StringUtils.isEmpty(properties.get(CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX).getValue()))) {
                invalids.add("Required parameter 'Region' is empty. Did you forget to edit the 'Region' field" +
                        " in the datasource creation form ? You need to fill it with the region where " +
                        "your S3 instance is hosted.");
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            if (datasourceConfiguration == null) {
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
                            connection.shutdown();
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
