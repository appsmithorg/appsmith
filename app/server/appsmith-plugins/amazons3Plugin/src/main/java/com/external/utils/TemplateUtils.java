package com.external.utils;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure.Template;
import com.external.plugins.AmazonS3Action;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;

public class TemplateUtils {

    public static String TEST_FILE_NAME = "TestFile.txt";
    public static String FILE_PICKER_DATA_EXPRESSION = "{{FilePicker1.files[0].data}}";
    public static String LIST_FILES_TEMPLATE_NAME = "List files";
    public static String READ_FILE_TEMPLATE_NAME = "Read file";
    public static String CREATE_FILE_TEMPLATE_NAME = "Create file";
    public static String DELETE_FILE_TEMPLATE_NAME = "Delete file";

    /**
     * This method adds templates for the following actions:
     *   o List files in a bucket
     *   o Read file content
     *   o Create new file
     *   o Delete file
     *
     * @param bucketName : name of S3 bucket
     * @return : list of templates.
     */
    public static List<Template> getTemplates(String bucketName) {
        List<Template> templates = new ArrayList<>();

        /* Template to list files in a bucket */
        templates.add(getListFilesTemplate(bucketName));

        /* Template to read a file's content */
        templates.add(getReadFileTemplate(bucketName));

        /* Template to create a new file in a bucket */
        templates.add(getCreateFileTemplate(bucketName));

        /* Template to delete a file in a bucket */
        templates.add(getDeleteFileTemplate(bucketName));

        return templates;
    }

    private static Template getDeleteFileTemplate(String bucketName) {
        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.DELETE_FILE.name());
        setValueSafelyInFormData(configMap, BUCKET, bucketName);

        /**
         * Since S3 uses UQI interface, a config map is used to indicate the required template. However, some
         * properties like `actionConfiguration.path` cannot be configured via the config map since the config map only
         * models the bodyFormData attribute. Such properties are configured via ActionConfiguration object.
         */
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath(TEST_FILE_NAME);

        return new Template(DELETE_FILE_TEMPLATE_NAME, configMap, actionConfiguration);
    }

    private static Template getReadFileTemplate(String bucketName) {
        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.READ_FILE.name());
        setValueSafelyInFormData(configMap, BUCKET, bucketName);


        /**
         * Since S3 uses UQI interface, a config map is used to indicate the required template. However, some
         * properties like `actionConfiguration.path` cannot be configured via the config map since the config map only
         * models the bodyFormData attribute. Such properties are configured via ActionConfiguration object.
         */
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath(TEST_FILE_NAME);

        return new Template(READ_FILE_TEMPLATE_NAME, configMap, actionConfiguration);
    }

    private static Template getCreateFileTemplate(String bucketName) {
        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.UPLOAD_FILE_FROM_BODY.name());
        setValueSafelyInFormData(configMap, BUCKET, bucketName);


        /**
         * Since S3 uses UQI interface, a config map is used to indicate the required template. However, some
         * properties like `actionConfiguration.path` cannot be configured via the config map since the config map only
         * models the bodyFormData attribute. Such properties are configured via ActionConfiguration object.
         */
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath(TEST_FILE_NAME);
        actionConfiguration.setBody(FILE_PICKER_DATA_EXPRESSION);

        return new Template(CREATE_FILE_TEMPLATE_NAME, configMap, actionConfiguration);
    }

    private static Template getListFilesTemplate(String bucketName) {
        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, BUCKET, bucketName);

        return new Template(LIST_FILES_TEMPLATE_NAME, configMap, new ActionConfiguration());
    }
}
