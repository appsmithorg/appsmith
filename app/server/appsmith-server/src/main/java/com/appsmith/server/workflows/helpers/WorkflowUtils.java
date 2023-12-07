package com.appsmith.server.workflows.helpers;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;

import java.util.Objects;

import static java.lang.Boolean.FALSE;

public class WorkflowUtils {
    public static boolean isWorkflowContext(ActionDTO action) {
        if (Objects.isNull(action)) {
            return FALSE;
        }
        return CreatorContextType.WORKFLOW.equals(action.getContextType());
    }
}
