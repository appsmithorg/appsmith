package com.external.plugins;

import com.amazonaws.HttpMethod;
import com.amazonaws.SdkClientException;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.amazonaws.services.s3.model.Bucket;
import com.amazonaws.services.s3.model.DeleteObjectsRequest;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectListing;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.amazonaws.services.s3.transfer.TransferManager;
import com.amazonaws.services.s3.transfer.TransferManagerBuilder;
import com.amazonaws.util.IOUtils;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.dtos.MultipartFormDataDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Condition;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.UQIDataFilterParams;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.appsmith.external.services.FilterDataService;
import com.external.plugins.constants.AmazonS3Action;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.pf4j.util.StringUtils;
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
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;
import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormDataOrDefault;
import static com.appsmith.external.helpers.PluginUtils.parseList;
import static com.appsmith.external.helpers.PluginUtils.parseWhereClause;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.CREATE_DATATYPE;
import static com.external.plugins.constants.FieldName.CREATE_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_PAGINATE;
import static com.external.plugins.constants.FieldName.LIST_PREFIX;
import static com.external.plugins.constants.FieldName.LIST_SIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_SORT;
import static com.external.plugins.constants.FieldName.LIST_UNSIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_WHERE;
import static com.external.plugins.constants.FieldName.PATH;
import static com.external.plugins.constants.FieldName.READ_USING_BASE64_ENCODING;
import static com.external.utils.TemplateUtils.getTemplates;
import static com.external.utils.DatasourceUtils.getS3ClientBuilder;
import static java.lang.Boolean.TRUE;

public class AmazonS3Plugin extends BasePlugin {

    private static final String S3_DRIVER = "com.amazonaws.services.s3.AmazonS3";
    public static final int S3_SERVICE_PROVIDER_PROPERTY_INDEX = 1;
    public static final int CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX = 2;
    public static final String SMART_SUBSTITUTION = "smartSubstitution";
    public static final int CUSTOM_ENDPOINT_INDEX = 0;
    public static final String DEFAULT_URL_EXPIRY_IN_MINUTES = "5"; // max 7 days is possible
    public static final String YES = "YES";
    public static final String NO = "NO";
    private static final String BASE64_DELIMITER = ";base64,";
    private static final String OTHER_S3_SERVICE_PROVIDER = "other";
    private static final String AWS_S3_SERVICE_PROVIDER = "amazon-s3";
    public static String DEFAULT_FILE_NAME = "MyFile.txt";

    public AmazonS3Plugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class S3PluginExecutor implements PluginExecutor<AmazonS3>, SmartSubstitutionInterface {
        private final Scheduler scheduler = Schedulers.elastic();
        private final FilterDataService filterDataService;

        public S3PluginExecutor() {
            this.filterDataService = FilterDataService.getInstance();
        }

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
            MultipartFormDataDTO multipartFormDataDTO;
            try {
                multipartFormDataDTO = objectMapper.readValue(
                        body,
                        MultipartFormDataDTO.class);
            } catch (IOException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Unable to parse content. Expected to receive an object with `data` and `type`"
                );
            }
            if (multipartFormDataDTO == null) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Could not find any data. Expected to receive an object with `data` and `type`"
                );
            }
            if (Boolean.TRUE.equals(usingFilePicker)) {

                String encodedPayload = (String) multipartFormDataDTO.getData();
                /*
                 * - For files uploaded using Filepicker.xyz.base64, body format is "<content-type>;base64,<actual-
                 *   base64-encoded-payload>".
                 * - Strip off the redundant part in the beginning to get actual payload.
                 */
                if (encodedPayload.contains(BASE64_DELIMITER)) {
                    List<String> bodyArrayList = Arrays.asList(encodedPayload.split(BASE64_DELIMITER));
                    encodedPayload = bodyArrayList.get(bodyArrayList.size() - 1);
                }

                try {
                    payload = Base64.getDecoder().decode(encodedPayload);
                } catch (IllegalArgumentException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "File content is not base64 encoded. File content needs to be base64 encoded when the " +
                                    "'File Data Type: Base64/Text' field is selected 'Yes'."
                    );
                }
            } else {
                payload = ((String) multipartFormDataDTO.getData()).getBytes();
            }

            InputStream inputStream = new ByteArrayInputStream(payload);
            TransferManager transferManager = TransferManagerBuilder.standard().withS3Client(connection).build();
            final ObjectMetadata objectMetadata = new ObjectMetadata();
            // Only add content type if the user has mentioned it in the body
            if (multipartFormDataDTO.getType() != null) {
                objectMetadata.setContentType(multipartFormDataDTO.getType());
            }
            transferManager.upload(bucketName, path, inputStream, objectMetadata).waitForUploadResult();

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
         * - Throws exception on upload failure.
         * - Returns signed url of the created file on success.
         */
        List<String> uploadMultipleFilesFromBody(AmazonS3 connection,
                                                 String bucketName,
                                                 String path,
                                                 String body,
                                                 Boolean usingFilePicker,
                                                 Date expiryDateTime)
                throws InterruptedException, AppsmithPluginException {


            List<MultipartFormDataDTO> multipartFormDataDTOs;
            try {
                multipartFormDataDTOs = Arrays.asList(objectMapper.readValue(
                        body,
                        MultipartFormDataDTO[].class));
            } catch (IOException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Unable to parse content. Expected to receive an object with `data` and `type`"
                );
            }

            ArrayList<String> listOfFiles = new ArrayList<>();
            multipartFormDataDTOs.forEach(multipartFormDataDTO -> {
                final String filePath = path + multipartFormDataDTO.getName();
                byte[] payload;
                if (Boolean.TRUE.equals(usingFilePicker)) {

                    String encodedPayload = (String) multipartFormDataDTO.getData();
                    /*
                     * - For files uploaded using Filepicker.xyz.base64, body format is "<content-type>;base64,<actual-
                     *   base64-encoded-payload>".
                     * - Strip off the redundant part in the beginning to get actual payload.
                     */
                    if (encodedPayload.contains(BASE64_DELIMITER)) {
                        List<String> bodyArrayList = Arrays.asList(encodedPayload.split(BASE64_DELIMITER));
                        encodedPayload = bodyArrayList.get(bodyArrayList.size() - 1);
                    }

                    try {
                        payload = Base64.getDecoder().decode(encodedPayload);
                    } catch (IllegalArgumentException e) {
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "File content is not base64 encoded. File content needs to be base64 encoded when the " +
                                        "'File Data Type: Base64/Text' field is selected 'Yes'."
                        );
                    }
                } else {
                    payload = ((String) multipartFormDataDTO.getData()).getBytes();
                }

                InputStream inputStream = new ByteArrayInputStream(payload);
                TransferManager transferManager = TransferManagerBuilder.standard().withS3Client(connection).build();
                final ObjectMetadata objectMetadata = new ObjectMetadata();
                // Only add content type if the user has mentioned it in the body
                if (multipartFormDataDTO.getType() != null) {
                    objectMetadata.setContentType(multipartFormDataDTO.getType());
                }
                try {
                    transferManager.upload(bucketName, filePath, inputStream, objectMetadata).waitForUploadResult();
                } catch (InterruptedException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "File upload interrupted."
                    );
                }

                listOfFiles.add(filePath);
            });

            return getSignedUrls(connection, bucketName, listOfFiles, expiryDateTime);
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
        public Mono<ActionExecutionResult> execute(AmazonS3 connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }

        @Override
        public Mono<ActionExecutionResult> executeParameterized(AmazonS3 connection,
                                                                ExecuteActionDTO executeActionDTO,
                                                                DatasourceConfiguration datasourceConfiguration,
                                                                ActionConfiguration actionConfiguration) {


            final Map<String, Object> formData = actionConfiguration.getFormData();
            List<Map.Entry<String, String>> parameters = new ArrayList<>();

            Boolean smartJsonSubstitution = TRUE;

            Object smartSubstitutionObject = formData.getOrDefault(SMART_SUBSTITUTION, TRUE);

            if (smartSubstitutionObject instanceof Boolean) {
                smartJsonSubstitution = (Boolean) smartSubstitutionObject;
            } else if (smartSubstitutionObject instanceof String) {
                // Older UI configuration used to set this value as a string which may/may not be castable to a boolean
                // directly. This is to ensure we are backward compatible
                smartJsonSubstitution = Boolean.parseBoolean((String) smartSubstitutionObject);
            }

            try {
                // Smartly substitute in Json fields and replace all the bindings with values.
                if (TRUE.equals(smartJsonSubstitution)) {
                    final String body = actionConfiguration.getBody() != null ? actionConfiguration.getBody() : "";
                    // First extract all the bindings in order
                    List<String> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(body);
                    // Replace all the bindings with a placeholder
                    String updatedValue = MustacheHelper.replaceMustacheWithPlaceholder(body, mustacheKeysInOrder);

                    updatedValue = (String) smartSubstitutionOfBindings(updatedValue,
                            mustacheKeysInOrder,
                            executeActionDTO.getParams(),
                            parameters);

                    actionConfiguration.setBody(updatedValue);

                }
            } catch (AppsmithPluginException e) {
                // Initializing object for error condition
                ActionExecutionResult errorResult = new ActionExecutionResult();
                errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                errorResult.setIsExecutionSuccess(false);
                errorResult.setErrorInfo(e);
                return Mono.just(errorResult);
            }

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            return this.executeCommon(connection, datasourceConfiguration, actionConfiguration);
        }

        private Mono<ActionExecutionResult> executeCommon(AmazonS3 connection,
                                                          DatasourceConfiguration datasourceConfiguration,
                                                          ActionConfiguration actionConfiguration) {

            final String[] query = new String[1];
            Map<String, Object> requestProperties = new HashMap<>();
            List<RequestParamDTO> requestParams = new ArrayList<>();

            return Mono.fromCallable(() -> {

                        /*
                         * - AmazonS3 API collection does not seem to provide any API to test connection validity or staleness.
                         *   Hence, unable to do stale connection check explicitly.
                         * - If connection object is null, then assume stale connection.
                         */
                        if (connection == null) {
                            return Mono.error(new StaleConnectionException());
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

                        Map<String, Object> formData = actionConfiguration.getFormData();

                        String command = (String) getValueSafelyFromFormData(formData, COMMAND);

                        if (StringUtils.isNullOrEmpty(command)) {
                            return Mono.error(
                                    new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                            "Mandatory parameter 'Command' is missing. Did you forget to select one of the commands" +
                                                    " from the Command dropdown ?"
                                    )
                            );
                        }

                        AmazonS3Action s3Action = AmazonS3Action.valueOf(command);
                        query[0] = s3Action.name();

                        requestParams.add(new RequestParamDTO(COMMAND,
                                command, null, null, null));

                        final String bucketName = (s3Action == AmazonS3Action.LIST_BUCKETS) ?
                                null : (String) getValueSafelyFromFormData(formData, BUCKET);

                // If the action_type is LIST_BUCKET, remove the bucket name requirement
                if (s3Action != AmazonS3Action.LIST_BUCKETS
                    && StringUtils.isNullOrEmpty(bucketName)) {
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "Mandatory parameter 'Bucket Name' is missing. Did you forget to edit the 'Bucket " +
                                            "Name' field in the query form ?"
                            )
                    );
                }

                requestProperties.put(BUCKET, bucketName == null ? "" : bucketName);
                requestParams.add(new RequestParamDTO(BUCKET,
                        bucketName, null, null, null));

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

                final String path = actionConfiguration.getPath();
                requestProperties.put(PATH, path == null ? "" : path);

                if ((s3Action == AmazonS3Action.UPLOAD_FILE_FROM_BODY || s3Action == AmazonS3Action.READ_FILE ||
                        s3Action == AmazonS3Action.DELETE_FILE) && StringUtils.isNullOrEmpty(path)) {
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
                        String prefix = (String) getValueSafelyFromFormDataOrDefault(formData, LIST_PREFIX, "");
                        requestParams.add(new RequestParamDTO(LIST_PREFIX,
                                prefix, null, null, null));

                        ArrayList<String> listOfFiles = listAllFilesInBucket(connection, bucketName, prefix);

                        Boolean isSignedUrl = YES.equals(getValueSafelyFromFormData(formData, LIST_SIGNED_URL));

                        if (isSignedUrl) {
                            requestParams.add(new RequestParamDTO(LIST_SIGNED_URL, YES, null,
                                    null, null));

                            int durationInMinutes;

                            try {
                                durationInMinutes = Integer.parseInt((String) getValueSafelyFromFormDataOrDefault(formData,
                                        LIST_EXPIRY, DEFAULT_URL_EXPIRY_IN_MINUTES));
                            } catch (NumberFormatException e) {
                                return Mono.error(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                        "Parameter 'Expiry Duration of Signed URL' is NOT a number. Please ensure that the " +
                                                "input to 'Expiry Duration of Signed URL' field is a valid number - i.e. " +
                                                "any non-negative integer. Please note that the maximum expiry " +
                                                "duration supported by Amazon S3 is 7 days i.e. 10080 minutes."
                                ));
                            }

                            requestParams.add(new RequestParamDTO(LIST_EXPIRY,
                                    durationInMinutes, null, null, null));

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
                            requestParams.add(new RequestParamDTO(LIST_SIGNED_URL,
                                    "", null, null, null));
                            actionResult = new ArrayList<>();
                            for (int i = 0; i < listOfFiles.size(); i++) {
                                HashMap<String, Object> fileInfo = new HashMap<>();
                                fileInfo.put("fileName", listOfFiles.get(i));
                                ((ArrayList<Object>) actionResult).add(fileInfo);
                            }
                        }

                        String isUnsignedUrl = (String) getValueSafelyFromFormData(formData, LIST_UNSIGNED_URL);

                        if (YES.equals(isUnsignedUrl)) {

                            requestParams.add(new RequestParamDTO(LIST_UNSIGNED_URL, YES, null,
                                    null, null));
                            ((ArrayList<Object>) actionResult).stream()
                                    .forEach(item -> ((Map) item)
                                            .put(
                                                    "url", // key
                                                    connection.getUrl(bucketName, (String) ((Map) item).get("fileName")).toString() // value
                                            )
                                    );
                        } else {
                            requestParams.add(new RequestParamDTO(LIST_UNSIGNED_URL, NO, null,
                                    null, null));
                        }

                        // Check if where condition is configured
                        Object whereFormObject = getValueSafelyFromFormData(formData, LIST_WHERE);
                        Condition condition = null;
                        if (whereFormObject != null) {
                            Map<String, Object> whereForm = (Map<String, Object>) whereFormObject;
                            condition = parseWhereClause(whereForm);
                        }

                        List<Map<String, String>> sortBy =
                                (List<Map<String, String>>) getValueSafelyFromFormData(formData, LIST_SORT);

                        Map<String, String> paginateBy =
                                (Map<String, String>) getValueSafelyFromFormData(formData, LIST_PAGINATE);

                        ArrayNode preFilteringResponse = objectMapper.valueToTree(actionResult);
                        actionResult = filterDataService.filterDataNew(preFilteringResponse,
                                new UQIDataFilterParams(condition, null, sortBy, paginateBy));

                        break;
                    case UPLOAD_FILE_FROM_BODY: {
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

                        int durationInMinutes;

                        try {
                            durationInMinutes = Integer.parseInt((String) getValueSafelyFromFormDataOrDefault(formData,
                                    CREATE_EXPIRY, DEFAULT_URL_EXPIRY_IN_MINUTES));
                        } catch (NumberFormatException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "Parameter 'Expiry Duration of Signed URL' is NOT a number. Please ensure that the " +
                                            "input to 'Expiry Duration of Signed URL' field is a valid number - i.e. " +
                                            "any non-negative integer. Please note that the maximum expiry " +
                                            "duration supported by Amazon S3 is 7 days i.e. 10080 minutes."
                            ));
                        }

                        requestProperties.put("expiry duration in minutes", String.valueOf(durationInMinutes));

                        Calendar calendar = Calendar.getInstance();
                        calendar.add(Calendar.MINUTE, durationInMinutes);
                        Date expiryDateTime = calendar.getTime();
                        DateFormat dateTimeFormat = new SimpleDateFormat("dd MMM yyyy HH:mm:ss:SSS z");
                        String expiryDateTimeString = dateTimeFormat.format(expiryDateTime);

                        String signedUrl;

                        String dataType = (String) getValueSafelyFromFormData(formData, CREATE_DATATYPE);

                        if (YES.equals(dataType)) {
                            requestParams.add(new RequestParamDTO(CREATE_DATATYPE, "Base64",
                                    null, null, null));
                            signedUrl = uploadFileFromBody(connection, bucketName, path, body, true, expiryDateTime);
                        } else {
                            requestParams.add(new RequestParamDTO(CREATE_DATATYPE,
                                    "Text / Binary", null, null, null));
                            signedUrl = uploadFileFromBody(connection, bucketName, path, body, false, expiryDateTime);
                        }
                        actionResult = new HashMap<String, Object>();
                        ((HashMap<String, Object>) actionResult).put("signedUrl", signedUrl);
                        ((HashMap<String, Object>) actionResult).put("urlExpiryDate", expiryDateTimeString);

                        requestParams.add(new RequestParamDTO(CREATE_EXPIRY,
                                expiryDateTimeString, null, null, null));
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY, body, null, null, null));
                        break;
                    }
                    case UPLOAD_MULTIPLE_FILES_FROM_BODY: {
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

                        int durationInMinutes;

                        try {
                            durationInMinutes = Integer.parseInt((String) getValueSafelyFromFormDataOrDefault(formData,
                                    CREATE_EXPIRY, DEFAULT_URL_EXPIRY_IN_MINUTES));
                        } catch (NumberFormatException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    "Parameter 'Expiry Duration of Signed URL' is NOT a number. Please ensure that the " +
                                            "input to 'Expiry Duration of Signed URL' field is a valid number - i.e. " +
                                            "any non-negative integer. Please note that the maximum expiry " +
                                            "duration supported by Amazon S3 is 7 days i.e. 10080 minutes."
                            ));
                        }

                        requestProperties.put("expiry duration in minutes", String.valueOf(durationInMinutes));

                        Calendar calendar = Calendar.getInstance();
                        calendar.add(Calendar.MINUTE, durationInMinutes);
                        Date expiryDateTime = calendar.getTime();
                        DateFormat dateTimeFormat = new SimpleDateFormat("dd MMM yyyy HH:mm:ss:SSS z");
                        String expiryDateTimeString = dateTimeFormat.format(expiryDateTime);

                        List<String> signedUrls;

                        String dataType = (String) getValueSafelyFromFormData(formData, CREATE_DATATYPE);

                        if (YES.equals(dataType)) {
                            requestParams.add(new RequestParamDTO(CREATE_DATATYPE, "Base64",
                                    null, null, null));
                            signedUrls = uploadMultipleFilesFromBody(connection, bucketName, path, body, true, expiryDateTime);
                        } else {
                            requestParams.add(new RequestParamDTO(CREATE_DATATYPE,
                                    "Text / Binary", null, null, null));
                            signedUrls = uploadMultipleFilesFromBody(connection, bucketName, path, body, false, expiryDateTime);
                        }
                        actionResult = new HashMap<String, Object>();
                        ((HashMap<String, Object>) actionResult).put("signedUrls", signedUrls);
                        ((HashMap<String, Object>) actionResult).put("urlExpiryDate", expiryDateTimeString);

                        requestParams.add(new RequestParamDTO(CREATE_EXPIRY,
                                expiryDateTimeString, null, null, null));
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY, body, null, null, null));
                        break;
                    }
                    case READ_FILE:
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

                        String result;

                        String isBase64 = (String) getValueSafelyFromFormData(formData, READ_USING_BASE64_ENCODING);

                        if (YES.equals(isBase64)) {
                            requestParams.add(new RequestParamDTO(READ_USING_BASE64_ENCODING,
                                    YES, null, null, null));
                            result = readFile(connection, bucketName, path, true);
                        } else {
                            requestParams.add(new RequestParamDTO(READ_USING_BASE64_ENCODING,
                                    NO, null, null, null));
                            result = readFile(connection, bucketName, path, false);
                        }
                        actionResult = Map.of("fileData", result);
                        break;
                    case DELETE_FILE:
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

                        /*
                         * - If attempting to delete an object that does not exist, Amazon S3 returns a success message
                         *   instead of an error message.
                         */
                        connection.deleteObject(bucketName, path);
                        actionResult = Map.of("status", "File deleted successfully");
                        break;
                    case DELETE_MULTIPLE_FILES:
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

                        deleteMultipleObjects(connection, bucketName, path);
                        actionResult = Map.of("status", "All files deleted successfully");
                        break;
                    /**
                     * Commenting out this code section since we have not decided to expose this action to users
                     * as of now. In the future, if we do decide to expose this action to the users, just uncommenting this
                     * code should take care of gathering the list of buckets. Hence, leaving this commented but
                     * intact for future use.

                     case LIST_BUCKETS:
                        List<String> bucketNames = connection.listBuckets()
                                .stream()
                                .map(Bucket::getName)
                                .collect(Collectors.toList());
                        actionResult = Map.of("bucketList", bucketNames);
                        break;
                    */
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
                        result.setErrorInfo(e);
                        return Mono.just(result);

                    })
                    // Now set the request in the result to be returned to the server
                    .map(actionExecutionResult -> {
                        ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
                        actionExecutionRequest.setQuery(query[0]);
                        actionExecutionRequest.setProperties(requestProperties);
                        actionExecutionRequest.setRequestParams(requestParams);
                        actionExecutionResult.setRequest(actionExecutionRequest);
                        return actionExecutionResult;
                    })
                    .subscribeOn(scheduler);
        }

        private void deleteMultipleObjects(AmazonS3 connection, String bucketName, String path) throws AppsmithPluginException {
            List<String> listOfFiles;
            try {
                listOfFiles = parseList(path);
            } catch (IOException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Appsmith server failed to parse the list of files. Please provide the list of files in the " +
                                "correct format e.g. [\"file1\", \"file2\"]."
                );
            }

            DeleteObjectsRequest deleteObjectsRequest = getDeleteObjectsRequest(bucketName, listOfFiles);
            try {
                connection.deleteObjects(deleteObjectsRequest);
            } catch (SdkClientException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "One or more files could not be deleted. " + e.getMessage()
                );
            }
        }

        private DeleteObjectsRequest getDeleteObjectsRequest(String bucketName, List<String> listOfFiles) {
            DeleteObjectsRequest deleteObjectsRequest = new DeleteObjectsRequest(bucketName);

            /* Ref: https://stackoverflow.com/questions/9863742/how-to-pass-an-arraylist-to-a-varargs-method-parameter */
            return deleteObjectsRequest.withKeys(listOfFiles.toArray(new String[0]));
        }

        @Override
        public Mono<AmazonS3> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

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

            return Mono.fromCallable(() -> getS3ClientBuilder(datasourceConfiguration).build())
                    .flatMap(client -> Mono.just(client))
                    .onErrorResume(e -> {
                                if (e instanceof AppsmithPluginException) {
                                    return Mono.error(e);
                                }

                                return Mono.error(
                                        new AppsmithPluginException(
                                                AppsmithPluginError.PLUGIN_ERROR,
                                                "Appsmith server has encountered an error when " +
                                                        "connecting to your S3 server: " + e.getMessage()
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
                if (StringUtils.isNullOrEmpty(authentication.getUsername())) {
                    invalids.add("Mandatory parameter 'Access Key' is empty. Did you forget to edit the 'Access Key' " +
                            "field in the datasource creation form ? You need to fill it with your AWS Access " +
                            "Key.");
                }

                if (StringUtils.isNullOrEmpty(authentication.getPassword())) {
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
                    || StringUtils.isNullOrEmpty((String) properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue())) {
                invalids.add("Appsmith has failed to fetch the 'S3 Service Provider' field properties. Please " +
                        "reach out to Appsmith customer support to resolve this.");
            }

            final boolean usingAWSS3ServiceProvider =
                    AWS_S3_SERVICE_PROVIDER.equals(properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue());
            if (!usingAWSS3ServiceProvider
                    && (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())
                    || datasourceConfiguration.getEndpoints().get(CUSTOM_ENDPOINT_INDEX) == null
                    || StringUtils.isNullOrEmpty(datasourceConfiguration.getEndpoints().get(CUSTOM_ENDPOINT_INDEX).getHost()))) {
                invalids.add("Required parameter 'Endpoint URL' is empty. Did you forget to edit the 'Endpoint" +
                        " URL' field in the datasource creation form ? You need to fill it with " +
                        "the endpoint URL of your S3 instance.");
            }

            final boolean usingCustomServiceProvider =
                    OTHER_S3_SERVICE_PROVIDER.equals(properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue());
            if (usingCustomServiceProvider
                    && (properties.size() < (CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX + 1)
                    || properties.get(CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX) == null
                    || StringUtils.isNullOrEmpty((String) properties.get(CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX).getValue()))) {
                invalids.add("Required parameter 'Region' is empty. Did you forget to edit the 'Region' field" +
                        " in the datasource creation form ? You need to fill it with the region where " +
                        "your S3 instance is hosted.");
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {

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

        /**
         * Since S3 storage is not like a regular database, this method returns a list of buckets as the datasource
         * structure.
         */
        @Override
        public Mono<DatasourceStructure> getStructure(AmazonS3 connection, DatasourceConfiguration datasourceConfiguration) {

            return Mono.fromSupplier(() -> {
                List<DatasourceStructure.Table> tableList;
                try {
                    tableList = connection.listBuckets()
                            .stream()
                            /* Get name of each bucket */
                            .map(Bucket::getName)
                            /* Get command templates and use it to create Table object */
                            .map(bucketName -> new DatasourceStructure.Table(DatasourceStructure.TableType.BUCKET, "",
                                    bucketName, new ArrayList<>(), new ArrayList<>(), getTemplates(bucketName,
                                    DEFAULT_FILE_NAME)))
                            /* Collect all Table objects in a list */
                            .collect(Collectors.toList());
                } catch (SdkClientException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                            "Appsmith server has failed to fetch list of buckets from database. Please check if " +
                                    "the database credentials are valid and/or you have the required permissions."
                    );
                }

                return new DatasourceStructure(tableList);
            })
                    .subscribeOn(scheduler);
        }

        private String getOneFileNameOrDefault(AmazonS3 connection, String bucketName, String defaultFileName) {
            ArrayList<String> listOfFiles;
            try {
                listOfFiles = listAllFilesInBucket(connection, bucketName, "");
            } catch (AppsmithPluginException e) {
                return defaultFileName;
            }

            return CollectionUtils.isEmpty(listOfFiles) ? defaultFileName : listOfFiles.get(0);
        }

        @Override
        public Object substituteValueInInput(int index,
                                             String binding,
                                             String value,
                                             Object input,
                                             List<Map.Entry<String, String>> insertedParams,
                                             Object... args) {
            String jsonBody = (String) input;
            return DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue(jsonBody, value, insertedParams, null);
        }

    }
}
