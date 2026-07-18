package com.external.plugins.constants;

public class AppsmithAiErrorMessages {
    public static final String QUERY_FAILED_TO_EXECUTE = "Your query failed to execute";

    // Rendered with String.format(fileName, detectedContentType).
    public static final String FILE_TYPE_NOT_SUPPORTED =
            "File \"%s\" was rejected because its detected content type \"%s\" is not supported. "
                    + "Only PDF, plain text, and markdown files can be uploaded.";

    // Rendered with String.format(fileName, maxSizeInMb).
    public static final String FILE_TOO_LARGE =
            "File \"%s\" was rejected because it exceeds the maximum allowed upload size of %d MB.";

    // Rendered with String.format(fileName).
    public static final String FILE_IS_MARKUP_DOCUMENT =
            "File \"%s\" was rejected because it is a disallowed markup document (e.g. an SVG, HTML or XML "
                    + "document). Only PDF, plain text, and markdown files can be uploaded.";
}
