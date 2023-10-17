package com.appsmith.server.helpers;

import com.appsmith.external.models.ActionDTO;

public class ModuleUtils {
    public static boolean isModuleContext(ActionDTO action) {
        return action.getContext() == ActionDTO.ActionContext.MODULE;
    }
}
