package com.external.utils;

import com.appsmith.external.models.DatasourceStructure.Template;
import com.external.plugins.constants.AmazonS3Action;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.AmazonS3Plugin.DEFAULT_URL_EXPIRY_IN_MINUTES;
import static com.external.plugins.AmazonS3Plugin.NO;
import static com.external.plugins.AmazonS3Plugin.YES;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.CREATE_DATATYPE;
import static com.external.plugins.constants.FieldName.CREATE_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_SIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_UNSIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_WHERE;
import static com.external.plugins.constants.FieldName.PATH;
import static com.external.plugins.constants.FieldName.READ_DATATYPE;
import static com.external.plugins.constants.FieldName.READ_EXPIRY;

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
        setDataValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.DELETE_MULTIPLE_FILES.name());
        setDataValueSafelyInFormData(configMap, BUCKET, bucketName);
        setDataValueSafelyInFormData(configMap, PATH, LIST_OF_FILES_STRING);

        return new Template(DELETE_MULTIPLE_FILES_TEMPLATE_NAME, configMap);
    }

    private static Template getDeleteFileTemplate(String bucketName, String fileName) {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.DELETE_FILE.name());
        setDataValueSafelyInFormData(configMap, BUCKET, bucketName);
        setDataValueSafelyInFormData(configMap, PATH, fileName);

        return new Template(DELETE_FILE_TEMPLATE_NAME, configMap);
    }

    private static Template getReadFileTemplate(String bucketName, String fileName) {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.READ_FILE.name());
        setDataValueSafelyInFormData(configMap, BUCKET, bucketName);
        setDataValueSafelyInFormData(configMap, READ_DATATYPE, YES);
        setDataValueSafelyInFormData(configMap, READ_EXPIRY, DEFAULT_URL_EXPIRY_IN_MINUTES);
        setDataValueSafelyInFormData(configMap, PATH, fileName);

        return new Template(READ_FILE_TEMPLATE_NAME, configMap);
    }

    private static Template getCreateFileTemplate(String bucketName, String fileName) {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.UPLOAD_FILE_FROM_BODY.name());
        setDataValueSafelyInFormData(configMap, BUCKET, bucketName);
        setDataValueSafelyInFormData(configMap, CREATE_DATATYPE, YES);
        setDataValueSafelyInFormData(configMap, CREATE_EXPIRY, DEFAULT_URL_EXPIRY_IN_MINUTES);
        setDataValueSafelyInFormData(configMap, PATH, fileName);
        setDataValueSafelyInFormData(configMap, BODY, FILE_PICKER_DATA_EXPRESSION);

        return new Template(CREATE_FILE_TEMPLATE_NAME, configMap);
    }

    private static Template getCreateMultipleFilesTemplate(String bucketName) {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.UPLOAD_MULTIPLE_FILES_FROM_BODY.name());
        setDataValueSafelyInFormData(configMap, BUCKET, bucketName);
        setDataValueSafelyInFormData(configMap, CREATE_DATATYPE, YES);
        setDataValueSafelyInFormData(configMap, CREATE_EXPIRY, DEFAULT_URL_EXPIRY_IN_MINUTES);
        setDataValueSafelyInFormData(configMap, PATH, DEFAULT_DIR);
        setDataValueSafelyInFormData(configMap, BODY, FILE_PICKER_MULTIPLE_FILES_DATA_EXPRESSION);

        return new Template(CREATE_MULTIPLE_FILES_TEMPLATE_NAME, configMap);
    }

    private static Template getListFilesTemplate(String bucketName) {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, AmazonS3Action.LIST.name());
        setDataValueSafelyInFormData(configMap, BUCKET, bucketName);
        setDataValueSafelyInFormData(configMap, LIST_SIGNED_URL, NO);
        setDataValueSafelyInFormData(configMap, LIST_UNSIGNED_URL, YES);
        setDataValueSafelyInFormData(configMap, LIST_WHERE, new HashMap<String, Object>() {{
            put("condition", "AND");
        }});

        return new Template(LIST_FILES_TEMPLATE_NAME, configMap);
    }
}
