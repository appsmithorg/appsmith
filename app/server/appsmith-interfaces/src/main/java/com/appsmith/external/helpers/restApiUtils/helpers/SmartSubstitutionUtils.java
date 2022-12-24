package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.models.Property;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.apache.commons.collections.CollectionUtils;

import java.util.List;

@NoArgsConstructor
public class SmartSubstitutionUtils {
    public static final int SMART_SUBSTITUTION_INDEX = 0;

    public boolean isSmartSubstitutionEnabled(List<Property> properties) {
        boolean smartSubstitution;
        if (CollectionUtils.isEmpty(properties)) {
            // In case the smart json substitution configuration is missing, default to true
            smartSubstitution = true;

            // Since properties is not empty, we are guaranteed to find the first property.
        } else if (properties.get(SMART_SUBSTITUTION_INDEX) != null) {
            Object ssubValue = properties.get(SMART_SUBSTITUTION_INDEX).getValue();
            if (ssubValue instanceof Boolean) {
                smartSubstitution = (Boolean) ssubValue;
            } else if (ssubValue instanceof String) {
                smartSubstitution = Boolean.parseBoolean((String) ssubValue);
            } else {
                smartSubstitution = true;
            }
        } else {
            smartSubstitution = true;
        }

        return smartSubstitution;
    }
}
