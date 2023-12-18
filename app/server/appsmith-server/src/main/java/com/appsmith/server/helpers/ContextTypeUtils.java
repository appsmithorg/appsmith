package com.appsmith.server.helpers;

import com.appsmith.external.models.CreatorContextType;

public class ContextTypeUtils {
    public static CreatorContextType getDefaultContextIfNull(CreatorContextType contextType) {
        if (contextType == null) {
            return CreatorContextType.PAGE;
        }
        return contextType;
    }

    public static boolean isPageContext(CreatorContextType contextType) {
        return CreatorContextType.PAGE.equals(getDefaultContextIfNull(contextType));
    }

    public static boolean isModuleContext(CreatorContextType contextType) {
        return CreatorContextType.MODULE.equals(getDefaultContextIfNull(contextType));
    }

    public static boolean isWorkflowContext(CreatorContextType contextType) {
        return CreatorContextType.WORKFLOW.equals(getDefaultContextIfNull(contextType));
    }

    public static boolean isApplicationContext(CreatorContextType contextType) {
        return CreatorContextType.APPLICATION.equals(getDefaultContextIfNull(contextType));
    }

    public static boolean isPackageContext(CreatorContextType contextType) {
        return CreatorContextType.PACKAGE.equals(getDefaultContextIfNull(contextType));
    }
}
