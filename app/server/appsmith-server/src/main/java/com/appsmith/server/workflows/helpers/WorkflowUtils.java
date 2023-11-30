package com.appsmith.server.workflows.helpers;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;

public class WorkflowUtils {
    public static boolean isWorkflowContext(ActionDTO action) {
        return action.getContextType() == CreatorContextType.WORKFLOW;
    }
}
