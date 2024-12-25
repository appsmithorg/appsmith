package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.artifacts.permissions.ArtifactPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ContextPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

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
public class ImportArtifactPermissionProviderCE {
    @Getter(AccessLevel.NONE)
    private final ArtifactPermission artifactPermission;

    @Getter(AccessLevel.NONE)
    protected final ContextPermission contextPermission;

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

    // all the permission groups of the current user
    private final Set<String> currentUserPermissionGroups;

    /*
    Following fields are flags to indicate whether permission check is required on the corresponding operation.
     */
    // flag to indicate whether permission check is required on the create datasource operation
    private boolean permissionRequiredToCreateDatasource;
    // flag to indicate whether permission check is required on the create page operation
    private boolean permissionRequiredToCreatePage;
    // flag to indicate whether permission check is required on the edit page operation
    protected boolean permissionRequiredToEditContext;
    // flag to indicate whether permission check is required on the create action operation
    protected boolean permissionRequiredToCreateAction;
    // flag to indicate whether permission check is required on the edit action operation
    private boolean permissionRequiredToEditAction;
    // flag to indicate whether permission check is required during the edit datasource operation
    private boolean permissionRequiredToEditDatasource;

    /**
     * Helper method to check whether the provided permission is present in the provided baseDomain's policies.
     * If yes, it checks whether the matched policy has a permission group from the currentUserPermissionGroups.
     *
     * @param permission AclPermission
     * @param baseDomain BaseDomain where the permission is being checked
     * @return True if there is a match, false otherwise
     */
    protected boolean hasPermission(AclPermission permission, BaseDomain baseDomain) {
        if (permission == null) {
            return true;
        }
        return PolicyUtil.isPermissionPresentInPolicies(
                permission.getValue(), baseDomain.getPolicies(), currentUserPermissionGroups);
    }

    public boolean hasEditPermission(NewPage page) {
        if (!permissionRequiredToEditContext) {
            return true;
        }
        return hasPermission(contextPermission.getEditPermission(), page);
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
        return hasPermission(((ApplicationPermission) artifactPermission).getPageCreatePermission(), application);
    }

    public boolean canCreateAction(NewPage page) {
        if (!permissionRequiredToCreateAction) {
            return true;
        }
        return hasPermission(contextPermission.getActionCreatePermission(), page);
    }

    public boolean canCreateDatasource(Workspace workspace) {
        if (!permissionRequiredToCreateDatasource) {
            return true;
        }
        return hasPermission(workspacePermission.getDatasourceCreatePermission(), workspace);
    }
}
