package com.external.plugins.enums;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.plugins.exceptions.WorkflowPluginError;
import lombok.Getter;

@Getter
public enum WorkflowPluginTriggerRequestType {
    WORKFLOW_SELECTOR("WORKFLOW_SELECTOR"),
    ;

    private final String value;

    WorkflowPluginTriggerRequestType(String value) {
        this.value = value;
    }

    public static WorkflowPluginTriggerRequestType getTriggerRequestType(String stringType) {
        for (WorkflowPluginTriggerRequestType enumConstant : WorkflowPluginTriggerRequestType.values()) {
            if (enumConstant.value.equals(stringType)) {
                return enumConstant;
            }
        }
        throw new AppsmithPluginException(WorkflowPluginError.ILLEGAL_WORKFLOW_TRIGGER_REQUEST, stringType);
    }
}
