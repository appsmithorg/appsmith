package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.models.Property;
import org.apache.commons.collections.CollectionUtils;

import java.util.List;

public class SmartSubstitutionUtils {
    public static final int SMART_JSON_SUBSTITUTION_INDEX = 0;

    public static boolean isJsonSmartSubstitutionEnabled(List<Property> properties) {
        boolean smartJsonSubstitution;
        if (CollectionUtils.isEmpty(properties)) {
            // In case the smart json substitution configuration is missing, default to true
            smartJsonSubstitution = true;

            // Since properties is not empty, we are guaranteed to find the first property.
        } else if (properties.get(SMART_JSON_SUBSTITUTION_INDEX) != null) {
            Object ssubValue = properties.get(SMART_JSON_SUBSTITUTION_INDEX).getValue();
            if (ssubValue instanceof Boolean) {
                smartJsonSubstitution = (Boolean) ssubValue;
            } else if (ssubValue instanceof String) {
                smartJsonSubstitution = Boolean.parseBoolean((String) ssubValue);
            } else {
                smartJsonSubstitution = true;
            }
        } else {
            smartJsonSubstitution = true;
        }

        return smartJsonSubstitution;
    }
}
