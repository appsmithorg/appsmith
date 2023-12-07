package com.appsmith.server.newactions.helpers;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.modules.helpers.ModuleUtils;
import com.appsmith.server.workflows.helpers.WorkflowUtils;
import org.springframework.stereotype.Component;

@Component
public class NewActionHelper extends NewActionHelperCE {

    @Override
    public void validateCreatorId(ActionDTO action) {
        if (ModuleUtils.isModuleContext(action)) {
            if (action.getModuleId() == null || action.getModuleId().isBlank()) {
                throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.MODULE_ID);
            }
        } else if (WorkflowUtils.isWorkflowContext(action)) {
            if (action.getWorkflowId() == null || action.getWorkflowId().isBlank()) {
                throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKFLOW_ID);
            }
        } else {
            super.validateCreatorId(action);
        }
    }
}
