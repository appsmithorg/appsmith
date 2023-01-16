package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;

import java.text.MessageFormat;
import java.util.regex.Pattern;

public interface BasePluginError {
     Integer getHttpErrorCode();

     String getAppErrorCode();

     String getMessage(Object...args);

     String getTitle();

     AppsmithErrorAction getErrorAction();

     String getErrorType();

     String getDownstreamErrorMessage(Object...args);

     String getDownstreamErrorCode(Object...args);

     Pattern errorPlaceholderPattern = Pattern.compile("\\{\\d+\\}");

     default String replacePlaceholderWithValue(String origin, Object...args) {
         if (origin == null) {
             return null;
         }
         String formattedErrorCode = new MessageFormat(origin).format(args);
         if (errorPlaceholderPattern.matcher(formattedErrorCode).matches()) {
             return null;
         }
         return formattedErrorCode;
     }
}
