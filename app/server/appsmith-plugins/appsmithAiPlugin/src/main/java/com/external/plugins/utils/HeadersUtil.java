package com.external.plugins.utils;

import com.appsmith.external.dtos.ExecuteActionDTO;

import static com.external.plugins.constants.AppsmithAiConstants.ACTION_ID;
import static com.external.plugins.constants.AppsmithAiConstants.DATASOURCE_ID;
import static com.external.plugins.constants.AppsmithAiConstants.INSTANCE_ID;
import static com.external.plugins.constants.AppsmithAiConstants.WORKSPACE_ID;

public class HeadersUtil {
    public static final String COLON = ":";
    public static final String SEMI_COLON = ";";

    /**
     * Get plugin metadata details in `k1:v1;k2:v2` format
     */
    public static String createSourceDetailsHeader(ExecuteActionDTO executeActionDTO) {
        return ACTION_ID
                + COLON
                + executeActionDTO.getActionId()
                + SEMI_COLON
                + DATASOURCE_ID
                + COLON
                + executeActionDTO.getDatasourceId()
                + SEMI_COLON
                + WORKSPACE_ID
                + COLON
                + executeActionDTO.getWorkspaceId()
                + SEMI_COLON
                + INSTANCE_ID
                + COLON
                + executeActionDTO.getInstanceId();
    }
}
