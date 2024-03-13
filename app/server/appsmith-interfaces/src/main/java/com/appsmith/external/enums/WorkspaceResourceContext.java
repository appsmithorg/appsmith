package com.appsmith.external.enums;

public enum WorkspaceResourceContext {
    APPLICATIONS,
    WORKFLOWS,
    PACKAGES,
    ;

    public static boolean isApplicationContext(WorkspaceResourceContext context) {
        return context == null || context == APPLICATIONS;
    }

    public static boolean isWorkflowContext(WorkspaceResourceContext context) {
        return context == WORKFLOWS;
    }

    public static boolean isPackageContext(WorkspaceResourceContext context) {
        return context == PACKAGES;
    }
}
