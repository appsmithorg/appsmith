package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

import java.util.Set;

/**
 * This class is used to provide a set of permissions to the import flow.
 * It uses builder pattern to create an instance of this class. Using the builder, we can set 3 types of attributes.
 * <ol>
 *  <li> We should provide the minimum permission required on the target workspace and application.</li>
 *  <li> We should provide whether to check Create and Edit permissions on Datasource, Page, Action.</li>
 *  <li> We should provide the user's permission groups.</li>
 * </ol>
 *
 * <p>
 * For example, let's assume we want to ensure that import flow will check whether user has permission to add a new page before creating a new page.
 * To achieve this, we've to set permissionRequiredToCreatePage to true and provide the user's permission groups using the builder methods.
 * The import flow will call the canCreatePage method with the application object as parameter.
 * As we've set the permissionRequiredToCreatePage to true, canCreatePage method will ensure that the provided
 * policies in the provided application will have a permission group from userPermissionGroups.
 * </p>
 */
@AllArgsConstructor
@Getter
public class ImportApplicationPermissionProvider {
    @Getter(AccessLevel.NONE)
    private final ApplicationPermission applicationPermission;

    @Getter(AccessLevel.NONE)
    private final PagePermission pagePermission;

    @Getter(AccessLevel.NONE)
    private final ActionPermission actionPermission;

    @Getter(AccessLevel.NONE)
    private final DatasourcePermission datasourcePermission;

    @Getter(AccessLevel.NONE)
    private final WorkspacePermission workspacePermission;

    // minimum required permission on the workspace where the application is being imported
    private final AclPermission requiredPermissionOnTargetWorkspace;

    // minimum required permission on the application being updated in the import flow
    private final AclPermission requiredPermissionOnTargetApplication;

    /*
    Following fields are flags to indicate whether permission check is required on the corresponding operation.
     */
    // flag to indicate whether permission check is required on the create datasource operation
    private boolean permissionRequiredToCreateDatasource;

    // flag to indicate whether permission check is required on the create page operation
    private boolean permissionRequiredToCreatePage;
    // flag to indicate whether permission check is required on the edit page operation
    private boolean permissionRequiredToEditPage;

    // flag to indicate whether permission check is required on the create action operation
    private boolean permissionRequiredToCreateAction;
    // flag to indicate whether permission check is required on the edit action operation
    private boolean permissionRequiredToEditAction;

    // flag to indicate whether permission check is required during the edit datasource operation
    private boolean permissionRequiredToEditDatasource;

    // all the permission groups of the current user
    private final Set<String> currentUserPermissionGroups;

    /**
     * Helper method to check whether the provided permission is present in the provided baseDomain's policies.
     * If yes, it checks whether the matched policy has a permission group from the currentUserPermissionGroups.
     *
     * @param permission AclPermission
     * @param baseDomain BaseDomain where the permission is being checked
     * @return True if there is a match, false otherwise
     */
    private boolean hasPermission(AclPermission permission, BaseDomain baseDomain) {
        if (permission == null) {
            return true;
        }
        return PolicyUtil.isPermissionPresentInPolicies(
                permission.getValue(), baseDomain.getPolicies(), currentUserPermissionGroups);
    }

    public boolean hasEditPermission(NewPage page) {
        if (!permissionRequiredToEditPage) {
            return true;
        }
        return hasPermission(pagePermission.getEditPermission(), page);
    }

    public boolean hasEditPermission(NewAction action) {
        if (!permissionRequiredToEditAction) {
            return true;
        }
        return hasPermission(actionPermission.getEditPermission(), action);
    }

    public boolean hasEditPermission(Datasource datasource) {
        if (!permissionRequiredToEditDatasource) {
            return true;
        }
        return hasPermission(datasourcePermission.getEditPermission(), datasource);
    }

    public boolean canCreatePage(Application application) {
        if (!permissionRequiredToCreatePage) {
            return true;
        }
        return hasPermission(applicationPermission.getPageCreatePermission(), application);
    }

    public boolean canCreateAction(NewPage page) {
        if (!permissionRequiredToCreateAction) {
            return true;
        }
        return hasPermission(pagePermission.getActionCreatePermission(), page);
    }

    public boolean canCreateDatasource(Workspace workspace) {
        if (!permissionRequiredToCreateDatasource) {
            return true;
        }
        return hasPermission(workspacePermission.getDatasourceCreatePermission(), workspace);
    }

    public static Builder builder(
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission) {
        return new Builder(
                applicationPermission, pagePermission, actionPermission, datasourcePermission, workspacePermission);
    }

    @Setter
    @Accessors(chain = true, fluent = true)
    public static class Builder {
        private final ApplicationPermission applicationPermission;
        private final PagePermission pagePermission;
        private final ActionPermission actionPermission;
        private final DatasourcePermission datasourcePermission;
        private final WorkspacePermission workspacePermission;

        private AclPermission requiredPermissionOnTargetWorkspace;
        private AclPermission requiredPermissionOnTargetApplication;

        private Set<String> currentUserPermissionGroups;

        private boolean permissionRequiredToCreateDatasource;
        private boolean permissionRequiredToCreatePage;
        private boolean permissionRequiredToEditPage;
        private boolean permissionRequiredToCreateAction;
        private boolean permissionRequiredToEditAction;
        private boolean permissionRequiredToEditDatasource;

        private Builder(
                ApplicationPermission applicationPermission,
                PagePermission pagePermission,
                ActionPermission actionPermission,
                DatasourcePermission datasourcePermission,
                WorkspacePermission workspacePermission) {
            this.applicationPermission = applicationPermission;
            this.pagePermission = pagePermission;
            this.actionPermission = actionPermission;
            this.datasourcePermission = datasourcePermission;
            this.workspacePermission = workspacePermission;
        }

        public Builder allPermissionsRequired() {
            this.permissionRequiredToCreateDatasource = true;
            this.permissionRequiredToCreatePage = true;
            this.permissionRequiredToEditPage = true;
            this.permissionRequiredToCreateAction = true;
            this.permissionRequiredToEditAction = true;
            this.permissionRequiredToEditDatasource = true;
            return this;
        }

        public ImportApplicationPermissionProvider build() {
            // IMPORTANT: make sure that we've added unit tests for all the properties.
            // Otherwise, we may end up passing value of one attribute of same type to another.
            return new ImportApplicationPermissionProvider(
                    applicationPermission,
                    pagePermission,
                    actionPermission,
                    datasourcePermission,
                    workspacePermission,
                    requiredPermissionOnTargetWorkspace,
                    requiredPermissionOnTargetApplication,
                    permissionRequiredToCreateDatasource,
                    permissionRequiredToCreatePage,
                    permissionRequiredToEditPage,
                    permissionRequiredToCreateAction,
                    permissionRequiredToEditAction,
                    permissionRequiredToEditDatasource,
                    currentUserPermissionGroups);
        }
    }
}
