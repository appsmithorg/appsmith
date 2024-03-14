package com.appsmith.external.enums;

import java.util.Objects;

public enum WorkspaceResourceContext {
    APPLICATIONS,
    WORKFLOWS,
    PACKAGES,
    ;

    // Default to APPLICATIONS
    public static boolean isApplicationContext(WorkspaceResourceContext context) {
        return Objects.isNull(context) || APPLICATIONS.equals(context);
    }

    public static boolean isWorkflowContext(WorkspaceResourceContext context) {
        return WORKFLOWS.equals(context);
    }

    public static boolean isPackageContext(WorkspaceResourceContext context) {
        return PACKAGES.equals(context);
    }
}
