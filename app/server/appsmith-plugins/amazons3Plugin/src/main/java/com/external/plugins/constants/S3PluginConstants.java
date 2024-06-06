package com.external.plugins.constants;

public class S3PluginConstants {
    public static final String S3_DRIVER = "com.amazonaws.services.s3.AmazonS3";
    public static final int S3_SERVICE_PROVIDER_PROPERTY_INDEX = 1;
    public static final int CUSTOM_ENDPOINT_REGION_PROPERTY_INDEX = 2;

    public static final int DEFAULT_BUCKET_PROPERTY_INDEX = 3;
    public static final int CUSTOM_ENDPOINT_INDEX = 0;
    public static final String DEFAULT_URL_EXPIRY_IN_MINUTES = "5"; // max 7 days is possible
    public static final String YES = "YES";
    public static final String NO = "NO";
    public static final String BASE64_DELIMITER = ";base64,";
    public static final String AWS_S3_SERVICE_PROVIDER = "amazon-s3";
    public static String DEFAULT_FILE_NAME = "MyFile.txt";
    public static final String ACCESS_DENIED_ERROR_CODE = "AccessDenied";
    public static final String GOOGLE_CLOUD_SERVICE_PROVIDER = "google-cloud-storage";
    public static final String AUTO = "auto";
}
