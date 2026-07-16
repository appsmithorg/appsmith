package com.external.plugins.constants;

public class AppsmithAiErrorMessages {
    public static final String QUERY_FAILED_TO_EXECUTE = "Your query failed to execute";

    // Rendered with String.format(fileName, detectedContentType).
    public static final String FILE_TYPE_NOT_SUPPORTED =
            "File \"%s\" was rejected because its detected content type \"%s\" is not supported. "
                    + "Only PDF, plain text, and markdown files can be uploaded.";
}
