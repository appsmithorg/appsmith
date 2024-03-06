package com.appsmith.server.helpers;

import org.springframework.data.mongodb.core.query.Update;

public class ObjectUtils {
    public static void setIfNotEmpty(Update updateObj, String fieldPath, Object value) {
        if (value instanceof String) {
            if (!ValidationUtils.isEmptyParam((String) value)) {
                updateObj.set(fieldPath, value);
            }
        } else if (value != null) {
            updateObj.set(fieldPath, value);
        }
    }
}
