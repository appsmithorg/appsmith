package com.appsmith.server.exceptions.util;

import lombok.extern.slf4j.Slf4j;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class DuplicateKeyExceptionUtils {
    private final static Pattern pattern = Pattern.compile("dup key: \\{ .*:(.*)}'");

    public static String extractConflictingObjectName(String duplicateKeyErrorMessage) {
        Matcher matcher = pattern.matcher(duplicateKeyErrorMessage);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        log.warn("DuplicateKeyException regex needs attention. It's unable to extract object name from the error message. Possible reason: the underlying library may have changed the format of the error message.");
        /*
            [Fallback strategy]
            AppsmithError.DUPLICATE_KEY has a placeholder where it expects the name of the object that conflicts with the existing names.
            In case the execution reaches here we don't want to render `null` rather the string returned as below will yet make the message look good.
         */
        return "that you provided";
    }
}
