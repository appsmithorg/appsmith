package com.external.utils;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure.Template;
import com.external.plugins.constants.AmazonS3Action;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.external.plugins.AmazonS3Plugin.DEFAULT_URL_EXPIRY_IN_MINUTES;
import static com.external.plugins.AmazonS3Plugin.NO;
import static com.external.plugins.AmazonS3Plugin.YES;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.CREATE_DATATYPE;
import static com.external.plugins.constants.FieldName.CREATE_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_SIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_UNSIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_WHERE;
import static com.external.plugins.constants.FieldName.READ_EXPIRY;
import static com.external.plugins.constants.FieldName.READ_USING_BASE64_ENCODING;

public class TemplateUtils {

    public static String FILE_PICKER_DATA_EXPRESSION = "{{FilePicker1.files[0]}}";
    public static String FILE_PICKER_MULTIPLE_FILES_DATA_EXPRESSION = "{{FilePicker1.files}}";
    public static String LIST_FILES_TEMPLATE_NAME = "List files";
    public static String READ_FILE_TEMPLATE_NAME = "Read file";
    public static String CREATE_FILE_TEMPLATE_NAME = "Create file";
    public static String CREATE_MULTIPLE_FILES_TEMPLATE_NAME = "Create multiple files";
    public static String DELETE_FILE_TEMPLATE_NAME = "Delete file";
    public static String DELETE_MULTIPLE_FILES_TEMPLATE_NAME = "Delete multiple files";
    public static final String LIST_OF_FILES_STRING = "[\"file1.ext\", \"file2.ext\"]";
    public static final String DEFAULT_DIR = "path/to/files";

    /**
     * This method adds templates for the following actions:
     *   o List files in a bucket
     *   o Read file content
     *   o Create new file
     *   o Delete file
     *
     * @param bucketName : name of S3 bucket
     * @param fileName
     * @return : list of templates.
     */
    public static List<Template> getTemplates(String bucketName, String fileName) {
        List<Template> templates = new ArrayList<>();

        /* Template to list files in a bucket */
        templates.add(getListFilesTemplate(bucketName));

        /* Template to read a file's content */
        templates.add(getReadFileTemplate(bucketName, fileName));

        /* Template to create a new file in a bucket */
        templates.add(getCreateFileTemplate(bucketName, fileName));

        /* Template to create multiple new files in a bucket */
        templates.add(getCreateMultipleFilesTemplate(bucketName));

        /* Template to delete a file in a bucket */
        templates.add(getDeleteFileTemplate(bucketName, fileName));

        /* Template to delete multiple files in a bucket */
        templates.add(getDeleteMultipleFilesTemplate(bucketName));

        return templates;
    }

    private static Template getDeleteMultipleFilesTemplate(String bucketName) {
        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.DELETE_MULTIPLE_FILES.name());
        setValueSafelyInFormData(configMap, BUCKET, bucketName);

        /**
         * Since S3 uses UQI interface, a config map is used to indicate the required template. However, some
         * properties like `actionConfiguration.path` cannot be configured via the config map since the config map only
         * models the formData attribute. Such properties are configured via ActionConfiguration object.
         */
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath(LIST_OF_FILES_STRING);

        return new Template(DELETE_MULTIPLE_FILES_TEMPLATE_NAME, configMap, actionConfiguration);
    }

    private static Template getDeleteFileTemplate(String bucketName, String fileName) {
        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.DELETE_FILE.name());
        setValueSafelyInFormData(configMap, BUCKET, bucketName);

        /**
         * Since S3 uses UQI interface, a config map is used to indicate the required template. However, some
         * properties like `actionConfiguration.path` cannot be configured via the config map since the config map only
         * models the formData attribute. Such properties are configured via ActionConfiguration object.
         */
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath(fileName);

        return new Template(DELETE_FILE_TEMPLATE_NAME, configMap, actionConfiguration);
    }

    private static Template getReadFileTemplate(String bucketName, String fileName) {
        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.READ_FILE.name());
        setValueSafelyInFormData(configMap, BUCKET, bucketName);
        setValueSafelyInFormData(configMap, READ_USING_BASE64_ENCODING, YES);
        setValueSafelyInFormData(configMap, READ_EXPIRY, DEFAULT_URL_EXPIRY_IN_MINUTES);

        /**
         * Since S3 uses UQI interface, a config map is used to indicate the required template. However, some
         * properties like `actionConfiguration.path` cannot be configured via the config map since the config map only
         * models the formData attribute. Such properties are configured via ActionConfiguration object.
         */
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath(fileName);

        return new Template(READ_FILE_TEMPLATE_NAME, configMap, actionConfiguration);
    }

    private static Template getCreateFileTemplate(String bucketName, String fileName) {
        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.UPLOAD_FILE_FROM_BODY.name());
        setValueSafelyInFormData(configMap, BUCKET, bucketName);
        setValueSafelyInFormData(configMap, CREATE_DATATYPE, YES);
        setValueSafelyInFormData(configMap, CREATE_EXPIRY, DEFAULT_URL_EXPIRY_IN_MINUTES);

        /**
         * Since S3 uses UQI interface, a config map is used to indicate the required template. However, some
         * properties like `actionConfiguration.path` cannot be configured via the config map since the config map only
         * models the formData attribute. Such properties are configured via ActionConfiguration object.
         */
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath(fileName);
        actionConfiguration.setBody(FILE_PICKER_DATA_EXPRESSION);

        return new Template(CREATE_FILE_TEMPLATE_NAME, configMap, actionConfiguration);
    }

    private static Template getCreateMultipleFilesTemplate(String bucketName) {
        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.UPLOAD_MULTIPLE_FILES_FROM_BODY.name());
        setValueSafelyInFormData(configMap, BUCKET, bucketName);
        setValueSafelyInFormData(configMap, CREATE_DATATYPE, YES);
        setValueSafelyInFormData(configMap, CREATE_EXPIRY, DEFAULT_URL_EXPIRY_IN_MINUTES);

        /**
         * Since S3 uses UQI interface, a config map is used to indicate the required template. However, some
         * properties like `actionConfiguration.path` cannot be configured via the config map since the config map only
         * models the formData attribute. Such properties are configured via ActionConfiguration object.
         */
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath(DEFAULT_DIR);
        actionConfiguration.setBody(FILE_PICKER_MULTIPLE_FILES_DATA_EXPRESSION);

        return new Template(CREATE_MULTIPLE_FILES_TEMPLATE_NAME, configMap, actionConfiguration);
    }

    private static Template getListFilesTemplate(String bucketName) {
        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.LIST.name());
        setValueSafelyInFormData(configMap, BUCKET, bucketName);
        setValueSafelyInFormData(configMap, LIST_SIGNED_URL, NO);
        setValueSafelyInFormData(configMap, LIST_UNSIGNED_URL, YES);
        setValueSafelyInFormData(configMap, LIST_WHERE, new HashMap<String, Object>() {{put("condition", "AND");}});

        return new Template(LIST_FILES_TEMPLATE_NAME, configMap, new ActionConfiguration());
    }
}
