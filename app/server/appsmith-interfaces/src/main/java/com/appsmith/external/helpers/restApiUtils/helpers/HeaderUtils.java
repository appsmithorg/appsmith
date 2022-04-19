package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;

import java.util.List;
import java.util.stream.Collectors;

public class HeaderUtils {
    public static boolean isEncodeParamsToggleEnabled(ActionConfiguration actionConfiguration) {
        /**
         * If encodeParamsToggle is null, then assume it to be true because params are supposed to be
         * encoded by default, unless explicitly prohibited by the user.
         */
        if (actionConfiguration.getEncodeParamsToggle() != null
                && actionConfiguration.getEncodeParamsToggle() == false) {
            return false;
        }

        return true;
    }

    public static void removeEmptyHeaders(ActionConfiguration actionConfiguration) {
        /**
         * We only check for key being empty since an empty value is still a valid header.
         * Ref: https://stackoverflow.com/questions/12130910/how-to-interpret-empty-http-accept-header
         */
        if (actionConfiguration.getHeaders() != null && !actionConfiguration.getHeaders().isEmpty()) {
            List<Property> headerList = actionConfiguration.getHeaders().stream()
                    .filter(header -> !org.springframework.util.StringUtils.isEmpty(header.getKey()))
                    .collect(Collectors.toList());
            actionConfiguration.setHeaders(headerList);
        }
    }
}
