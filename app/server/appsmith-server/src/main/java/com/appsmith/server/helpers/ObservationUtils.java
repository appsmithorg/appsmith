package com.appsmith.server.helpers;

import com.appsmith.server.domains.ApplicationMode;

import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CONSOLIDATED_API_PREFIX;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.EDIT;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.VIEW;

public class ObservationUtils {
    public static String getQualifiedSpanName(String spanName, ApplicationMode mode) {
        return CONSOLIDATED_API_PREFIX + (ApplicationMode.PUBLISHED.equals(mode) ? VIEW : EDIT) + spanName;
    }
}
