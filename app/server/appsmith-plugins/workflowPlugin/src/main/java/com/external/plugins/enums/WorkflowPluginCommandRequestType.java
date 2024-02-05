package com.external.plugins.enums;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.plugins.exceptions.WorkflowPluginError;
import lombok.Getter;

@Getter
public enum WorkflowPluginCommandRequestType {
    GET_REQUESTS("GET_REQUESTS"),
    TRIGGER_WORKFLOW("TRIGGER_WORKFLOW"),
    RESOLVE_REQUESTS("RESOLVE_REQUESTS"),
    ;

    private final String value;

    WorkflowPluginCommandRequestType(String value) {
        this.value = value;
    }

    public static WorkflowPluginCommandRequestType getRequestType(String stringType) {
        for (WorkflowPluginCommandRequestType enumConstant : WorkflowPluginCommandRequestType.values()) {
            if (enumConstant.value.equals(stringType)) {
                return enumConstant;
            }
        }
        throw new AppsmithPluginException(WorkflowPluginError.ILLEGAL_WORKFLOW_COMMAND_REQUEST, stringType);
    }
}
