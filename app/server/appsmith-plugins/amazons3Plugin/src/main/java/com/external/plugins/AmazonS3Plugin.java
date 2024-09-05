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
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.UQIDataFilterParams;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.appsmith.external.services.FilterDataService;
import com.external.plugins.constants.AmazonS3Action;
import com.external.plugins.exceptions.S3ErrorMessages;
import com.external.plugins.exceptions.S3PluginError;
import com.external.utils.AmazonS3ErrorUtils;
import com.fasterxml.jackson.core.type.TypeReference;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_NULL_ERROR_MSG;
import static com.appsmith.external.helpers.PluginUtils.OBJECT_TYPE;
import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.parseList;
import static com.appsmith.external.helpers.PluginUtils.parseWhereClause;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.CREATE_DATATYPE;
import static com.external.plugins.constants.FieldName.CREATE_EXPIRY;
import static com.external.plugins.constants.FieldName.KEY_BUCKET;
import static com.external.plugins.constants.FieldName.KEY_DATA;
import static com.external.plugins.constants.FieldName.LIST_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_PAGINATE;
import static com.external.plugins.constants.FieldName.LIST_PREFIX;
import static com.external.plugins.constants.FieldName.LIST_SIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_SORT;
import static com.external.plugins.constants.FieldName.LIST_UNSIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_WHERE;
import static com.external.plugins.constants.FieldName.PATH;
import static com.external.plugins.constants.FieldName.READ_DATATYPE;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.constants.S3PluginConstants.ACCESS_DENIED_ERROR_CODE;
import static com.external.plugins.constants.S3PluginConstants.AWS_S3_SERVICE_PROVIDER;
import static com.external.plugins.constants.S3PluginConstants.BASE64_DELIMITER;
import static com.external.plugins.constants.S3PluginConstants.CUSTOM_ENDPOINT_INDEX;
import static com.external.plugins.constants.S3PluginConstants.DEFAULT_BUCKET_PROPERTY_INDEX;
import static com.external.plugins.constants.S3PluginConstants.DEFAULT_FILE_NAME;
import static com.external.plugins.constants.S3PluginConstants.DEFAULT_URL_EXPIRY_IN_MINUTES;
import static com.external.plugins.constants.S3PluginConstants.GOOGLE_CLOUD_SERVICE_PROVIDER;
import static com.external.plugins.constants.S3PluginConstants.NO;
import static com.external.plugins.constants.S3PluginConstants.S3_DRIVER;
import static com.external.plugins.constants.S3PluginConstants.S3_SERVICE_PROVIDER_PROPERTY_INDEX;
import static com.external.plugins.constants.S3PluginConstants.YES;
import static com.external.utils.DatasourceUtils.getS3ClientBuilder;
import static com.external.utils.TemplateUtils.getTemplates;
import static java.lang.Boolean.TRUE;
import static org.apache.commons.collections.CollectionUtils.isEmpty;

@Slf4j
public class AmazonS3Plugin extends BasePlugin {

    public AmazonS3Plugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class S3PluginExecutor implements PluginExecutor<AmazonS3>, SmartSubstitutionInterface {
        private final Scheduler scheduler = Schedulers.boundedElastic();
        private final FilterDataService filterDataService;
        private static final AmazonS3ErrorUtils amazonS3ErrorUtils;

        static {
            try {
                amazonS3ErrorUtils = AmazonS3ErrorUtils.getInstance();
            } catch (InstantiationException e) {
                throw new RuntimeException(e);
            }
        }

        public S3PluginExecutor() {
            this.filterDataService = FilterDataService.getInstance();
        }

        /*
         * - Exception thrown by this method is expected to be handled by the caller.
         */
        ArrayList<String> getFilenamesFromObjectListing(ObjectListing objectListing) throws AppsmithPluginException {
            if (objectListing == null) {
                throw new AppsmithPluginException(
                        S3PluginError.AMAZON_S3_QUERY_EXECUTION_FAILED,
                        S3ErrorMessages.FILE_CONTENT_FETCHING_ERROR_MSG);
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
        ArrayList<String> listAllFilesInBucket(AmazonS3 connection, String bucketName, String prefix)
                throws AppsmithPluginException {
            if (connection == null) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, S3ErrorMessages.CONNECTIVITY_ERROR_MSG);
            }

            if (bucketName == null) {
                /*
                 * - bucketName is NOT expected to be null at this program point. A null check has been added in the
                 *  execute function already.
                 */
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, S3ErrorMessages.EMPTY_BUCKET_ERROR_MSG);
            }

            if (prefix == null) {
                /*
                 * - prefix is NOT expected to be null at this program point. A null check has been added in the
                 *  execute function already.
                 */
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, S3ErrorMessages.EMPTY_PREFIX_ERROR_MSG);
            }

            ObjectListing result = connection.listObjects(bucketName, prefix);
            ArrayList<String> fileList = new ArrayList<>(getFilenamesFromObjectListing(result));

            while (result.isTruncated()) {
                result = connection.listNextBatchOfObjects(result);
                fileList.addAll(getFilenamesFromObjectListing(result));
            }

            return fileList;
        }

        ArrayList<String> getSignedUrls(
                AmazonS3 connection, String bucketName, ArrayList<String> listOfFiles, Date expiryDateTime) {
            ArrayList<String> urlList = new ArrayList<>();

            for (String filePath : listOfFiles) {
                GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(
                                bucketName, filePath)
                        .withMethod(HttpMethod.GET)
                        .withExpiration(expiryDateTime);

                URL url = connection.generatePresignedUrl(generatePresignedUrlRequest);
                urlList.add(url.toString());
            }

            return urlList;
        }

        /**
         * This function returns the unsigned file urls for the files present in the body
         */
        ArrayList<String> createFileUrlsFromBody(AmazonS3 connection, String bucketName, String path, String body)
                throws AppsmithPluginException {
            List<MultipartFormDataDTO> multipartFormDataDTOs;
            ArrayList<String> urlList = new ArrayList<>();
            try {
                multipartFormDataDTOs = Arrays.asList(objectMapper.readValue(body, MultipartFormDataDTO[].class));
            } catch (IOException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        S3ErrorMessages.UNPARSABLE_CONTENT_ERROR_MSG,
                        e.getMessage());
            }
            multipartFormDataDTOs.forEach(multipartFormDataDTO -> {
                final String filePath = path + multipartFormDataDTO.getName();

                urlList.add(connection.getUrl(bucketName, filePath).toString());
            });
            return urlList;
        }

        /**
         * This function returns the unsigned file url for the file path
         */
        String createFileUrl(AmazonS3 connection, String bucketName, String path) {
            return connection.getUrl(bucketName, path).toString();
        }

        /*
         * - Throws exception on upload failure.
         * - Returns signed url of the created file on success.
         */
        String uploadFileFromBody(
                AmazonS3 connection,
                String bucketName,
                String path,
                String body,
                Boolean usingFilePicker,
                Date expiryDateTime)
                throws InterruptedException, AppsmithPluginException {

            byte[] payload;
            MultipartFormDataDTO multipartFormDataDTO;
            try {
                multipartFormDataDTO = objectMapper.readValue(body, MultipartFormDataDTO.class);
            } catch (IOException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        S3ErrorMessages.UNPARSABLE_CONTENT_ERROR_MSG,
                        e.getMessage());
            }
            if (multipartFormDataDTO == null) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        S3ErrorMessages.UNPARSABLE_CONTENT_ERROR_MSG);
            }
            if (Boolean.TRUE.equals(usingFilePicker)) {

                String encodedPayload = getEncodedPayloadFromMultipartDTO(multipartFormDataDTO);

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
                            S3ErrorMessages.UNEXPECTED_ENCODING_IN_FILE_CONTENT_ERROR_MSG);
                }
            } else {
                payload =
                        getEncodedPayloadFromMultipartDTO(multipartFormDataDTO).getBytes();
            }

            uploadFileInS3(payload, connection, multipartFormDataDTO, bucketName, path);
            ArrayList<String> listOfFiles = new ArrayList<>();
            listOfFiles.add(path);
            ArrayList<String> listOfUrls = getSignedUrls(connection, bucketName, listOfFiles, expiryDateTime);
            if (listOfUrls.size() != 1) {
                throw new AppsmithPluginException(
                        S3PluginError.AMAZON_S3_QUERY_EXECUTION_FAILED, S3ErrorMessages.SIGNED_URL_FETCHING_ERROR_MSG);
            }
            String signedUrl = listOfUrls.get(0);

            return signedUrl;
        }

        /*
         * - Throws exception on upload failure.
         * - Returns signed url of the created file on success.
         */
        List<String> uploadMultipleFilesFromBody(
                AmazonS3 connection,
                String bucketName,
                String path,
                String body,
                Boolean usingFilePicker,
                Date expiryDateTime)
                throws AppsmithPluginException {

            List<MultipartFormDataDTO> multipartFormDataDTOs;
            try {
                multipartFormDataDTOs = Arrays.asList(objectMapper.readValue(body, MultipartFormDataDTO[].class));
            } catch (IOException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        S3ErrorMessages.UNPARSABLE_CONTENT_ERROR_MSG,
                        e.getMessage());
            }

            ArrayList<String> listOfFiles = new ArrayList<>();
            multipartFormDataDTOs.forEach(multipartFormDataDTO -> {
                final String filePath = path + multipartFormDataDTO.getName();
                byte[] payload;
                if (Boolean.TRUE.equals(usingFilePicker)) {

                    String encodedPayload = getEncodedPayloadFromMultipartDTO(multipartFormDataDTO);
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
                                S3ErrorMessages.UNEXPECTED_ENCODING_IN_FILE_CONTENT_ERROR_MSG,
                                e.getMessage());
                    }
                } else {
                    payload = getEncodedPayloadFromMultipartDTO(multipartFormDataDTO)
                            .getBytes();
                }

                try {
                    uploadFileInS3(payload, connection, multipartFormDataDTO, bucketName, filePath);
                } catch (InterruptedException e) {
                    throw new AppsmithPluginException(
                            S3PluginError.AMAZON_S3_QUERY_EXECUTION_FAILED,
                            S3ErrorMessages.FILE_UPLOAD_INTERRUPTED_ERROR_MSG,
                            e.getMessage());
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
        public Mono<ActionExecutionResult> execute(
                AmazonS3 connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(
                    S3PluginError.AMAZON_S3_QUERY_EXECUTION_FAILED, "Unsupported Operation"));
        }

        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                AmazonS3 connection,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            String printMessage =
                    Thread.currentThread().getName() + ": executeParameterized() called for AmazonS3 plugin.";
            System.out.println(printMessage);
            final Map<String, Object> formData = actionConfiguration.getFormData();
            List<Map.Entry<String, String>> parameters = new ArrayList<>();

            Boolean smartJsonSubstitution = TRUE;

            Object smartSubstitutionObject =
                    getDataValueSafelyFromFormData(formData, SMART_SUBSTITUTION, OBJECT_TYPE, TRUE);

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
                    final String body = getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE, "");
                    // First extract all the bindings in order
                    List<MustacheBindingToken> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(body);
                    // Replace all the bindings with a placeholder
                    String updatedValue = MustacheHelper.replaceMustacheWithPlaceholder(body, mustacheKeysInOrder);

                    updatedValue = (String) smartSubstitutionOfBindings(
                            updatedValue, mustacheKeysInOrder, executeActionDTO.getParams(), parameters);

                    setDataValueSafelyInFormData(formData, BODY, updatedValue);
                }
            } catch (AppsmithPluginException e) {
                // Initializing object for error condition
                ActionExecutionResult errorResult = new ActionExecutionResult();
                errorResult.setIsExecutionSuccess(false);
                errorResult.setErrorInfo(e);
                return Mono.just(errorResult);
            }

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            return this.executeCommon(connection, datasourceConfiguration, actionConfiguration);
        }

        private Mono<ActionExecutionResult> executeCommon(
                AmazonS3 connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            String printMessage = Thread.currentThread().getName() + ": executeCommon() called for AmazonS3 plugin.";
            System.out.println(printMessage);
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
                            return Mono.error(new StaleConnectionException(CONNECTION_NULL_ERROR_MSG));
                        }

                        if (actionConfiguration == null) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    S3ErrorMessages.MANDATORY_FIELD_MISSING_ERROR_MSG));
                        }

                        Map<String, Object> formData = actionConfiguration.getFormData();
                        String command = getDataValueSafelyFromFormData(formData, COMMAND, STRING_TYPE);

                        if (StringUtils.isNullOrEmpty(command)) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    S3ErrorMessages.MANDATORY_PARAMETER_COMMAND_MISSING_ERROR_MSG));
                        }

                        AmazonS3Action s3Action = AmazonS3Action.valueOf(command);
                        query[0] = s3Action.name();

                        requestParams.add(new RequestParamDTO(COMMAND, command, null, null, null));

                        final String bucketName = (s3Action == AmazonS3Action.LIST_BUCKETS)
                                ? null
                                : getDataValueSafelyFromFormData(formData, BUCKET, STRING_TYPE);

                        // If the action_type is LIST_BUCKET, remove the bucket name requirement
                        if (s3Action != AmazonS3Action.LIST_BUCKETS && StringUtils.isNullOrEmpty(bucketName)) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    S3ErrorMessages.MANDATORY_PARAMETER_BUCKET_MISSING_ERROR_MSG));
                        }

                        requestProperties.put(BUCKET, bucketName == null ? "" : bucketName);
                        requestParams.add(new RequestParamDTO(BUCKET, bucketName, null, null, null));

                        /*
                         * - Allow users to upload empty file. Hence, only check for null value.
                         */
                        final String body = getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE);
                        requestProperties.put("content", body == null ? "null" : body);

                        if (s3Action == AmazonS3Action.UPLOAD_FILE_FROM_BODY && body == null) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    S3ErrorMessages.MANDATORY_PARAMETER_CONTENT_MISSING_ERROR_MSG));
                        }

                        final String path = getDataValueSafelyFromFormData(formData, PATH, STRING_TYPE, "");
                        requestProperties.put(PATH, path);

                        if ((s3Action == AmazonS3Action.UPLOAD_FILE_FROM_BODY
                                        || s3Action == AmazonS3Action.READ_FILE
                                        || s3Action == AmazonS3Action.DELETE_FILE)
                                && StringUtils.isNullOrEmpty(path)) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    S3ErrorMessages.MANDATORY_PARAMETER_FILE_PATH_MISSING_ERROR_MSG));
                        }
                        Object actionResult;
                        switch (s3Action) {
                            case LIST:
                                System.out.println(
                                        Thread.currentThread().getName() + ": LIST action called for AmazonS3 plugin.");
                                String prefix = getDataValueSafelyFromFormData(formData, LIST_PREFIX, STRING_TYPE, "");
                                requestParams.add(new RequestParamDTO(LIST_PREFIX, prefix, null, null, null));

                                ArrayList<String> listOfFiles = listAllFilesInBucket(connection, bucketName, prefix);

                                Boolean isSignedUrl = YES.equals(
                                        getDataValueSafelyFromFormData(formData, LIST_SIGNED_URL, STRING_TYPE));

                                if (isSignedUrl) {
                                    requestParams.add(new RequestParamDTO(LIST_SIGNED_URL, YES, null, null, null));

                                    int durationInMinutes;

                                    try {
                                        durationInMinutes = Integer.parseInt(getDataValueSafelyFromFormData(
                                                formData, LIST_EXPIRY, STRING_TYPE, DEFAULT_URL_EXPIRY_IN_MINUTES));
                                    } catch (NumberFormatException e) {
                                        return Mono.error(new AppsmithPluginException(
                                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                                S3ErrorMessages.EXPIRY_DURATION_NOT_A_NUMBER_ERROR_MSG,
                                                e.getMessage()));
                                    }

                                    requestParams.add(
                                            new RequestParamDTO(LIST_EXPIRY, durationInMinutes, null, null, null));

                                    Calendar calendar = Calendar.getInstance();
                                    calendar.add(Calendar.MINUTE, durationInMinutes);
                                    Date expiryDateTime = calendar.getTime();
                                    DateFormat dateTimeFormat = new SimpleDateFormat("dd MMM yyyy HH:mm:ss:SSS z");
                                    String expiryDateTimeString = dateTimeFormat.format(expiryDateTime);

                                    ArrayList<String> listOfSignedUrls =
                                            getSignedUrls(connection, bucketName, listOfFiles, expiryDateTime);
                                    if (listOfFiles.size() != listOfSignedUrls.size()) {
                                        return Mono.error(new AppsmithPluginException(
                                                S3PluginError.AMAZON_S3_QUERY_EXECUTION_FAILED,
                                                S3ErrorMessages.ACTION_LIST_OF_FILE_FETCHING_ERROR_MSG));
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
                                    requestParams.add(new RequestParamDTO(LIST_SIGNED_URL, "", null, null, null));
                                    actionResult = new ArrayList<>();
                                    for (int i = 0; i < listOfFiles.size(); i++) {
                                        HashMap<String, Object> fileInfo = new HashMap<>();
                                        fileInfo.put("fileName", listOfFiles.get(i));
                                        ((ArrayList<Object>) actionResult).add(fileInfo);
                                    }
                                }

                                String isUnsignedUrl =
                                        getDataValueSafelyFromFormData(formData, LIST_UNSIGNED_URL, STRING_TYPE);

                                if (YES.equals(isUnsignedUrl)) {

                                    requestParams.add(new RequestParamDTO(LIST_UNSIGNED_URL, YES, null, null, null));
                                    ((ArrayList<Object>) actionResult).stream().forEach(item -> ((Map) item)
                                            .put(
                                                    "url", // key
                                                    connection
                                                            .getUrl(bucketName, (String) ((Map) item).get("fileName"))
                                                            .toString() // value
                                                    ));
                                } else {
                                    requestParams.add(new RequestParamDTO(LIST_UNSIGNED_URL, NO, null, null, null));
                                }

                                // Check if where condition is configured
                                Object whereFormObject =
                                        getDataValueSafelyFromFormData(formData, LIST_WHERE, OBJECT_TYPE);
                                Condition condition = null;

                                if (whereFormObject != null) {
                                    Map<String, Object> whereForm = (Map<String, Object>) whereFormObject;
                                    condition = parseWhereClause(whereForm);
                                }

                                List<Map<String, String>> sortBy = getDataValueSafelyFromFormData(
                                        formData, LIST_SORT, new TypeReference<List<Map<String, String>>>() {});

                                Map<String, String> paginateBy = getDataValueSafelyFromFormData(
                                        formData, LIST_PAGINATE, new TypeReference<Map<String, String>>() {});

                                ArrayNode preFilteringResponse = objectMapper.valueToTree(actionResult);
                                actionResult = filterDataService.filterDataNew(
                                        preFilteringResponse,
                                        new UQIDataFilterParams(condition, null, sortBy, paginateBy));

                                break;
                            case UPLOAD_FILE_FROM_BODY: {
                                System.out.println(Thread.currentThread().getName()
                                        + ": UPLOAD_FILE_FROM_BODY action called for AmazonS3 plugin.");
                                requestParams.add(
                                        new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

                                int durationInMinutes;

                                try {
                                    durationInMinutes = Integer.parseInt(getDataValueSafelyFromFormData(
                                            formData, CREATE_EXPIRY, STRING_TYPE, DEFAULT_URL_EXPIRY_IN_MINUTES));
                                } catch (NumberFormatException e) {
                                    return Mono.error(new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                            S3ErrorMessages.EXPIRY_DURATION_NOT_A_NUMBER_ERROR_MSG,
                                            e.getMessage()));
                                }

                                requestProperties.put("expiry duration in minutes", String.valueOf(durationInMinutes));

                                Calendar calendar = Calendar.getInstance();
                                calendar.add(Calendar.MINUTE, durationInMinutes);
                                Date expiryDateTime = calendar.getTime();
                                DateFormat dateTimeFormat = new SimpleDateFormat("dd MMM yyyy HH:mm:ss:SSS z");
                                String expiryDateTimeString = dateTimeFormat.format(expiryDateTime);

                                String signedUrl;

                                String dataType =
                                        getDataValueSafelyFromFormData(formData, CREATE_DATATYPE, STRING_TYPE);

                                if (YES.equals(dataType)) {
                                    requestParams.add(new RequestParamDTO(CREATE_DATATYPE, "Base64", null, null, null));
                                    signedUrl = uploadFileFromBody(
                                            connection, bucketName, path, body, true, expiryDateTime);
                                } else {
                                    requestParams.add(
                                            new RequestParamDTO(CREATE_DATATYPE, "Text / Binary", null, null, null));
                                    signedUrl = uploadFileFromBody(
                                            connection, bucketName, path, body, false, expiryDateTime);
                                }
                                // gets the unsigned url for the file
                                String url = createFileUrl(connection, bucketName, path);
                                actionResult = new HashMap<String, Object>();
                                ((HashMap<String, Object>) actionResult).put("signedUrl", signedUrl);
                                ((HashMap<String, Object>) actionResult).put("urlExpiryDate", expiryDateTimeString);
                                ((HashMap<String, Object>) actionResult).put("url", url);
                                requestParams.add(
                                        new RequestParamDTO(CREATE_EXPIRY, expiryDateTimeString, null, null, null));
                                requestParams.add(
                                        new RequestParamDTO(ACTION_CONFIGURATION_BODY, body, null, null, null));
                                break;
                            }
                            case UPLOAD_MULTIPLE_FILES_FROM_BODY: {
                                System.out.println(Thread.currentThread().getName()
                                        + ": UPLOAD_MULTIPLE_FILES_FROM_BODY action called for AmazonS3 plugin.");
                                requestParams.add(
                                        new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

                                int durationInMinutes;

                                try {
                                    durationInMinutes = Integer.parseInt(getDataValueSafelyFromFormData(
                                            formData, CREATE_EXPIRY, STRING_TYPE, DEFAULT_URL_EXPIRY_IN_MINUTES));
                                } catch (NumberFormatException e) {
                                    return Mono.error(new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                            S3ErrorMessages.EXPIRY_DURATION_NOT_A_NUMBER_ERROR_MSG,
                                            e.getMessage()));
                                }

                                requestProperties.put("expiry duration in minutes", String.valueOf(durationInMinutes));

                                Calendar calendar = Calendar.getInstance();
                                calendar.add(Calendar.MINUTE, durationInMinutes);
                                Date expiryDateTime = calendar.getTime();
                                DateFormat dateTimeFormat = new SimpleDateFormat("dd MMM yyyy HH:mm:ss:SSS z");
                                String expiryDateTimeString = dateTimeFormat.format(expiryDateTime);

                                List<String> signedUrls;

                                String dataType =
                                        getDataValueSafelyFromFormData(formData, CREATE_DATATYPE, STRING_TYPE);

                                if (YES.equals(dataType)) {
                                    requestParams.add(new RequestParamDTO(CREATE_DATATYPE, "Base64", null, null, null));
                                    signedUrls = uploadMultipleFilesFromBody(
                                            connection, bucketName, path, body, true, expiryDateTime);
                                } else {
                                    requestParams.add(
                                            new RequestParamDTO(CREATE_DATATYPE, "Text / Binary", null, null, null));
                                    signedUrls = uploadMultipleFilesFromBody(
                                            connection, bucketName, path, body, false, expiryDateTime);
                                }
                                actionResult = new HashMap<String, Object>();
                                ((HashMap<String, Object>) actionResult).put("signedUrls", signedUrls);
                                ((HashMap<String, Object>) actionResult).put("urlExpiryDate", expiryDateTimeString);
                                // Adds the unsigned urls in the response
                                ((HashMap<String, Object>) actionResult)
                                        .put("urls", createFileUrlsFromBody(connection, bucketName, path, body));

                                requestParams.add(
                                        new RequestParamDTO(CREATE_EXPIRY, expiryDateTimeString, null, null, null));
                                requestParams.add(
                                        new RequestParamDTO(ACTION_CONFIGURATION_BODY, body, null, null, null));
                                break;
                            }
                            case READ_FILE:
                                System.out.println(Thread.currentThread().getName()
                                        + ": READ_FILE action called for AmazonS3 plugin.");
                                requestParams.add(
                                        new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

                                String result;

                                String isBase64 = getDataValueSafelyFromFormData(formData, READ_DATATYPE, STRING_TYPE);

                                if (YES.equals(isBase64)) {
                                    requestParams.add(new RequestParamDTO(READ_DATATYPE, YES, null, null, null));
                                    result = readFile(connection, bucketName, path, true);
                                } else {
                                    requestParams.add(new RequestParamDTO(READ_DATATYPE, NO, null, null, null));
                                    result = readFile(connection, bucketName, path, false);
                                }
                                actionResult = Map.of("fileData", result);
                                break;
                            case DELETE_FILE:
                                System.out.println(Thread.currentThread().getName()
                                        + ": DELETE_FILE action called for AmazonS3 plugin.");
                                requestParams.add(
                                        new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

                                /*
                                 * - If attempting to delete an object that does not exist, Amazon S3 returns a success message
                                 *   instead of an error message.
                                 */
                                connection.deleteObject(bucketName, path);
                                actionResult = Map.of("status", "File deleted successfully");
                                break;
                            case DELETE_MULTIPLE_FILES:
                                System.out.println(Thread.currentThread().getName()
                                        + ": DELETE_MULTIPLE_FILES action called for AmazonS3 plugin.");
                                requestParams.add(
                                        new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));

                                List<Property> properties = datasourceConfiguration.getProperties();
                                String s3Provider = (String) properties
                                        .get(S3_SERVICE_PROVIDER_PROPERTY_INDEX)
                                        .getValue();

                                deleteMultipleObjects(s3Provider, connection, bucketName, path);
                                actionResult = Map.of("status", "All files deleted successfully");
                                break;
                                /**
                                 * Commenting out this code section since we have not decided to expose this action to users
                                 * as of now. In the future, if we do decide to expose this action to the users, just uncommenting this
                                 * code should take care of gathering the list of buckets. Hence, leaving this commented but
                                 * intact for future use.
                                 *
                                 * case LIST_BUCKETS:
                                 * List<String> bucketNames = connection.listBuckets()
                                 * .stream()
                                 * .map(Bucket::getName)
                                 * .collect(Collectors.toList());
                                 * actionResult = Map.of("bucketList", bucketNames);
                                 * break;
                                 */
                            default:
                                return Mono.error(new AppsmithPluginException(
                                        S3PluginError.AMAZON_S3_QUERY_EXECUTION_FAILED,
                                        String.format(S3ErrorMessages.UNSUPPORTED_ACTION_ERROR_MSG, query[0])));
                        }
                        return Mono.just(actionResult);
                    })
                    .onErrorMap(IllegalStateException.class, error -> new StaleConnectionException(error.getMessage()))
                    .flatMap(obj -> obj)
                    .flatMap(result -> {
                        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
                        actionExecutionResult.setBody(result);
                        actionExecutionResult.setIsExecutionSuccess(true);
                        System.out.println("In the S3 Plugin, got action execution result");
                        return Mono.just(actionExecutionResult);
                    })
                    .onErrorResume(e -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        if (e instanceof StaleConnectionException) {
                            return Mono.error(e);
                        } else if (!(e instanceof AppsmithPluginException)) {
                            e = new AppsmithPluginException(
                                    e,
                                    S3PluginError.AMAZON_S3_QUERY_EXECUTION_FAILED,
                                    S3ErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG);
                        }
                        result.setErrorInfo(e, amazonS3ErrorUtils);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned to the server
                    .map(actionExecutionResult -> {
                        System.out.println(Thread.currentThread().getName()
                                + ": Setting the actionExecutionResult for AmazonS3 plugin.");
                        ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
                        actionExecutionRequest.setQuery(query[0]);
                        actionExecutionRequest.setProperties(requestProperties);
                        actionExecutionRequest.setRequestParams(requestParams);
                        actionExecutionResult.setRequest(actionExecutionRequest);
                        return actionExecutionResult;
                    })
                    .subscribeOn(scheduler);
        }

        private void deleteMultipleObjects(String s3Provider, AmazonS3 connection, String bucketName, String path)
                throws AppsmithPluginException {
            List<String> listOfFiles;
            try {
                listOfFiles = parseList(path);
            } catch (IOException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        S3ErrorMessages.LIST_OF_FILE_PARSING_ERROR_MSG,
                        e.getMessage());
            }

            DeleteObjectsRequest deleteObjectsRequest = getDeleteObjectsRequest(bucketName, listOfFiles);
            try {
                if (GOOGLE_CLOUD_SERVICE_PROVIDER.equals(s3Provider)) {
                    for (String filePath : listOfFiles) {
                        connection.deleteObject(bucketName, filePath);
                    }
                } else {
                    connection.deleteObjects(deleteObjectsRequest);
                }
            } catch (SdkClientException e) {
                throw new AppsmithPluginException(
                        S3PluginError.AMAZON_S3_QUERY_EXECUTION_FAILED,
                        S3ErrorMessages.FILE_CANNOT_BE_DELETED_ERROR_MSG,
                        e.getMessage());
            }
        }

        private DeleteObjectsRequest getDeleteObjectsRequest(String bucketName, List<String> listOfFiles) {
            DeleteObjectsRequest deleteObjectsRequest = new DeleteObjectsRequest(bucketName);

            /* Ref: https://stackoverflow.com/questions/9863742/how-to-pass-an-arraylist-to-a-varargs-method-parameter */
            return deleteObjectsRequest.withKeys(listOfFiles.toArray(new String[0]));
        }

        @Override
        public Mono<AmazonS3> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": datasourceCreate() called for AmazonS3 plugin.";
            System.out.println(printMessage);
            try {
                Class.forName(S3_DRIVER);
            } catch (ClassNotFoundException e) {
                return Mono.error(new AppsmithPluginException(
                        S3PluginError.AMAZON_S3_QUERY_EXECUTION_FAILED,
                        S3ErrorMessages.S3_DRIVER_LOADING_ERROR_MSG,
                        e.getMessage()));
            }

            return Mono.fromCallable(
                            () -> getS3ClientBuilder(datasourceConfiguration).build())
                    .flatMap(client -> Mono.just(client))
                    .onErrorResume(e -> {
                        if (e instanceof AppsmithPluginException) {
                            return Mono.error(e);
                        }

                        return Mono.error(new AppsmithPluginException(
                                S3PluginError.AMAZON_S3_QUERY_EXECUTION_FAILED,
                                S3ErrorMessages.CONNECTIVITY_ERROR_MSG,
                                e.getMessage()));
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(AmazonS3 connection) {
            String printMessage =
                    Thread.currentThread().getName() + ": datasourceDestroy() called for AmazonS3 plugin.";
            System.out.println(printMessage);
            if (connection != null) {
                Mono.fromCallable(() -> {
                            connection.shutdown();
                            return connection;
                        })
                        .onErrorResume(exception -> {
                            System.out.println("Error closing S3 connection.");
                            exception.printStackTrace();
                            return Mono.empty();
                        })
                        .subscribeOn(scheduler)
                        .subscribe();
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            String printMessage =
                    Thread.currentThread().getName() + ": validateDatasource() called for AmazonS3 plugin.";
            System.out.println(printMessage);
            Set<String> invalids = new HashSet<>();

            if (datasourceConfiguration == null || datasourceConfiguration.getAuthentication() == null) {
                invalids.add(S3ErrorMessages.DS_AT_LEAST_ONE_MANDATORY_PARAMETER_MISSING_ERROR_MSG);
            } else {
                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (StringUtils.isNullOrEmpty(authentication.getUsername())) {
                    invalids.add(S3ErrorMessages.DS_MANDATORY_PARAMETER_ACCESS_KEY_MISSING_ERROR_MSG);
                }

                if (StringUtils.isNullOrEmpty(authentication.getPassword())) {
                    invalids.add(S3ErrorMessages.DS_MANDATORY_PARAMETER_SECRET_KEY_MISSING_ERROR_MSG);
                }
            }

            List<Property> properties = datasourceConfiguration.getProperties();

            /*
             * - Ideally, properties must never be null because the fields contained in the properties list have a
             *   default value defined.
             * - Ideally, properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) must never be null/empty, because the
             *   `S3 service provider` dropdown has a default value.
             */
            if (properties == null
                    || properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) == null
                    || StringUtils.isNullOrEmpty((String)
                            properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue())) {
                invalids.add(S3ErrorMessages.DS_S3_SERVICE_PROVIDER_PROPERTIES_FETCHING_ERROR_MSG);
            }
            boolean usingAWSS3ServiceProvider = false;
            if (properties != null && properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX) != null) {
                usingAWSS3ServiceProvider = AWS_S3_SERVICE_PROVIDER.equals(
                        properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue());
            }
            if (!usingAWSS3ServiceProvider
                    && (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())
                            || datasourceConfiguration.getEndpoints().get(CUSTOM_ENDPOINT_INDEX) == null
                            || StringUtils.isNullOrEmpty(datasourceConfiguration
                                    .getEndpoints()
                                    .get(CUSTOM_ENDPOINT_INDEX)
                                    .getHost()))) {
                invalids.add(S3ErrorMessages.DS_MANDATORY_PARAMETER_ENDPOINT_URL_MISSING_ERROR_MSG);
            }

            if (datasourceConfiguration != null) {
                String serviceProvider = (String)
                        properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue();
                if (GOOGLE_CLOUD_SERVICE_PROVIDER.equals(serviceProvider)) {
                    String defaultBucket = (String)
                            properties.get(DEFAULT_BUCKET_PROPERTY_INDEX).getValue();
                    if (StringUtils.isNullOrEmpty(defaultBucket)) {
                        invalids.add(S3ErrorMessages.DS_MANDATORY_PARAMETER_DEFAULT_BUCKET_MISSING_ERROR_MSG);
                    }
                }
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": testDatasource() called for AmazonS3 plugin.";
            System.out.println(printMessage);
            if (datasourceConfiguration == null) {
                return Mono.just(new DatasourceTestResult(
                        S3ErrorMessages.DS_AT_LEAST_ONE_MANDATORY_PARAMETER_MISSING_ERROR_MSG));
            }

            List<Property> properties = datasourceConfiguration.getProperties();
            String s3Provider =
                    (String) properties.get(S3_SERVICE_PROVIDER_PROPERTY_INDEX).getValue();

            // Handle Google Cloud Storage in a separate method if necessary
            if (GOOGLE_CLOUD_SERVICE_PROVIDER.equals(s3Provider)) {
                return testGoogleCloudStorage(datasourceConfiguration);
            }

            // For Amazon S3 or other providers, perform a standard test by listing buckets in Amazon S3
            return datasourceCreate(datasourceConfiguration)
                    .flatMap(connection -> Mono.fromCallable(() -> {
                                /*
                                 * - Please note that as of 28 Jan 2021, the way AmazonS3 client works, creating a connection
                                 *   object with wrong credentials does not throw any exception.
                                 * - Hence, adding a listBuckets() method call to test the connection.
                                 */
                                System.out.println(Thread.currentThread().getName()
                                        + ": listBuckets() called for AmazonS3 plugin.");
                                connection.listBuckets();
                                return new DatasourceTestResult();
                            })
                            .onErrorResume(error -> {
                                if (error instanceof AmazonS3Exception
                                        && ACCESS_DENIED_ERROR_CODE.equals(
                                                ((AmazonS3Exception) error).getErrorCode())) {
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

                                return Mono.just(new DatasourceTestResult(amazonS3ErrorUtils.getReadableError(error)));
                            })
                            .doFinally(signalType -> connection.shutdown()))
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())))
                    .subscribeOn(scheduler);
        }

        private Mono<DatasourceTestResult> testGoogleCloudStorage(DatasourceConfiguration datasourceConfiguration) {
            List<Property> properties = datasourceConfiguration.getProperties();
            String defaultBucket =
                    (String) properties.get(DEFAULT_BUCKET_PROPERTY_INDEX).getValue();
            if (StringUtils.isNullOrEmpty(defaultBucket)) {
                return Mono.just(new DatasourceTestResult(
                        S3ErrorMessages.DS_MANDATORY_PARAMETER_DEFAULT_BUCKET_MISSING_ERROR_MSG));
            }

            return datasourceCreate(datasourceConfiguration)
                    .flatMap(connection -> Mono.fromCallable(() -> {
                                connection.listObjects(defaultBucket);
                                System.out.println(Thread.currentThread().getName()
                                        + ": connection.listObjects() called for AmazonS3 plugin.");
                                return new DatasourceTestResult();
                            })
                            .onErrorResume(error -> {
                                if (error instanceof AmazonS3Exception
                                        && ((AmazonS3Exception) error).getStatusCode() == 404) {
                                    return Mono.just(
                                            new DatasourceTestResult(S3ErrorMessages.NON_EXITED_BUCKET_ERROR_MSG));
                                } else {
                                    return Mono.just(
                                            new DatasourceTestResult(amazonS3ErrorUtils.getReadableError(error)));
                                }
                            })
                            .doFinally(signalType -> connection.shutdown()))
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())))
                    .subscribeOn(scheduler);
        }

        /**
         * Since S3 storage is not like a regular database, this method returns a list of buckets as the datasource
         * structure.
         */
        @Override
        public Mono<DatasourceStructure> getStructure(
                AmazonS3 connection, DatasourceConfiguration datasourceConfiguration) {

            String printMessage = Thread.currentThread().getName() + ": getStructure() called for AmazonS3 plugin.";
            System.out.println(printMessage);
            return Mono.fromSupplier(() -> {
                        List<DatasourceStructure.Table> tableList;
                        try {
                            System.out.println(Thread.currentThread().getName()
                                    + ": connection.listBuckets() called for AmazonS3 plugin.");
                            tableList = connection.listBuckets().stream()
                                    /* Get name of each bucket */
                                    .map(Bucket::getName)
                                    /* Get command templates and use it to create Table object */
                                    .map(bucketName -> new DatasourceStructure.Table(
                                            DatasourceStructure.TableType.BUCKET,
                                            "",
                                            bucketName,
                                            new ArrayList<>(),
                                            new ArrayList<>(),
                                            getTemplates(bucketName, DEFAULT_FILE_NAME)))
                                    /* Collect all Table objects in a list */
                                    .collect(Collectors.toList());
                        } catch (SdkClientException e) {
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                    S3ErrorMessages.LIST_OF_BUCKET_FETCHING_ERROR_MSG,
                                    e.getMessage());
                        } catch (IllegalStateException e) {
                            throw new StaleConnectionException(e.getMessage());
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
        public Object substituteValueInInput(
                int index,
                String binding,
                String value,
                Object input,
                List<Map.Entry<String, String>> insertedParams,
                Object... args) {
            String jsonBody = (String) input;
            Param param = (Param) args[0];
            String printMessage =
                    Thread.currentThread().getName() + ": substituteValueInInput() called for AmazonS3 plugin.";
            System.out.println(printMessage);
            return DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue(
                    jsonBody, value, null, insertedParams, null, param);
        }

        private String getEncodedPayloadFromMultipartDTO(MultipartFormDataDTO multipartFormDataDTO) {
            String encodedPayload;
            if (multipartFormDataDTO.getData() instanceof LinkedHashMap) {
                encodedPayload = ((LinkedHashMap<?, ?>) multipartFormDataDTO.getData())
                        .get("data")
                        .toString();
            } else {
                encodedPayload = (String) multipartFormDataDTO.getData();
            }
            return encodedPayload;
        }

        void uploadFileInS3(
                byte[] payload,
                AmazonS3 connection,
                MultipartFormDataDTO multipartFormDataDTO,
                String bucketName,
                String path)
                throws InterruptedException {
            InputStream inputStream = new ByteArrayInputStream(payload);
            TransferManager transferManager =
                    TransferManagerBuilder.standard().withS3Client(connection).build();
            final ObjectMetadata objectMetadata = new ObjectMetadata();
            // Only add content type if the user has mentioned it in the body
            if (multipartFormDataDTO.getType() != null) {
                objectMetadata.setContentType(multipartFormDataDTO.getType());
            }
            transferManager
                    .upload(bucketName, path, inputStream, objectMetadata)
                    .waitForUploadResult();
        }

        /**
         * This method is supposed to provide help with any update required to template queries that are used to create
         * the actual select, updated, insert etc. queries as part of the generate CRUD page feature. Any plugin that
         * needs special handling should override this method. e.g. in case of the S3 plugin some special handling is
         * required because (a) it uses UQI config form (b) it has concept of bucket instead of table.
         */
        @Override
        public Mono<Void> sanitizeGenerateCRUDPageTemplateInfo(
                List<ActionConfiguration> actionConfigurationList, Object... args) {
            String printMessage = Thread.currentThread().getName()
                    + ": sanitizeGenerateCRUDPageTemplateInfo() called for AmazonS3 plugin.";
            System.out.println(printMessage);
            if (isEmpty(actionConfigurationList)) {
                return Mono.empty();
            }

            /* Add mapping to replace template bucket name with user chosen bucket everywhere in the template */
            Map<String, String> mappedColumnsAndTableName = (Map<String, String>) args[0];
            final String userSelectedBucketName = (String) args[1];
            Map<String, Object> formData = actionConfigurationList.get(0).getFormData();
            mappedColumnsAndTableName.put(
                    (String) ((Map<?, ?>) formData.get(KEY_BUCKET)).get(KEY_DATA), userSelectedBucketName);

            return Mono.empty();
        }
    }
}
