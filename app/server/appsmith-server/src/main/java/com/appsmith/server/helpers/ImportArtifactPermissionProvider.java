package com.appsmith.server.helpers;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.artifacts.permissions.ArtifactPermission;
import com.appsmith.server.helpers.ce.ImportArtifactPermissionProviderCE;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ContextPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.Setter;
import lombok.experimental.Accessors;

import java.util.Set;

public class ImportArtifactPermissionProvider extends ImportArtifactPermissionProviderCE {

    public ImportArtifactPermissionProvider(
            ArtifactPermission artifactPermission,
            ContextPermission contextPermission,
            ActionPermission actionPermission,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            AclPermission requiredPermissionOnTargetWorkspace,
            AclPermission requiredPermissionOnTargetApplication,
            Set<String> currentUserPermissionGroups,
            boolean permissionRequiredToCreateDatasource,
            boolean permissionRequiredToCreatePage,
            boolean permissionRequiredToEditPage,
            boolean permissionRequiredToCreateAction,
            boolean permissionRequiredToEditAction,
            boolean permissionRequiredToEditDatasource) {
        super(
                artifactPermission,
                contextPermission,
                actionPermission,
                datasourcePermission,
                workspacePermission,
                requiredPermissionOnTargetWorkspace,
                requiredPermissionOnTargetApplication,
                currentUserPermissionGroups,
                permissionRequiredToCreateDatasource,
                permissionRequiredToCreatePage,
                permissionRequiredToEditPage,
                permissionRequiredToCreateAction,
                permissionRequiredToEditAction,
                permissionRequiredToEditDatasource);
    }

    public static Builder builder(
            ArtifactPermission artifactPermission,
            ContextPermission contextPermission,
            ActionPermission actionPermission,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission) {

        return new Builder(
                artifactPermission, contextPermission, actionPermission, datasourcePermission, workspacePermission);
    }

    @Setter
    @Accessors(chain = true, fluent = true)
    public static class Builder {
        private final ArtifactPermission artifactPermission;
        private final ContextPermission contextPermission;
        private final ActionPermission actionPermission;
        private final DatasourcePermission datasourcePermission;
        private final WorkspacePermission workspacePermission;

        private AclPermission requiredPermissionOnTargetWorkspace;
        private AclPermission requiredPermissionOnTargetArtifact;

        private Set<String> currentUserPermissionGroups;

        private boolean permissionRequiredToCreateDatasource;
        private boolean permissionRequiredToCreatePage;
        private boolean permissionRequiredToEditContext;
        private boolean permissionRequiredToCreateAction;
        private boolean permissionRequiredToEditAction;
        private boolean permissionRequiredToEditDatasource;

        private Builder(
                ArtifactPermission artifactPermission,
                ContextPermission contextPermission,
                ActionPermission actionPermission,
                DatasourcePermission datasourcePermission,
                WorkspacePermission workspacePermission) {
            this.artifactPermission = artifactPermission;
            this.contextPermission = contextPermission;
            this.actionPermission = actionPermission;
            this.datasourcePermission = datasourcePermission;
            this.workspacePermission = workspacePermission;
        }

        public Builder allPermissionsRequired() {
            this.permissionRequiredToCreateDatasource = true;
            this.permissionRequiredToCreatePage = true;
            this.permissionRequiredToEditContext = true;
            this.permissionRequiredToCreateAction = true;
            this.permissionRequiredToEditAction = true;
            this.permissionRequiredToEditDatasource = true;
            return this;
        }

        public ImportArtifactPermissionProvider build() {
            // IMPORTANT: make sure that we've added unit tests for all the properties.
            // Otherwise, we may end up passing value of one attribute of same type to another.
            return new ImportArtifactPermissionProvider(
                    artifactPermission,
                    contextPermission,
                    actionPermission,
                    datasourcePermission,
                    workspacePermission,
                    requiredPermissionOnTargetWorkspace,
                    requiredPermissionOnTargetArtifact,
                    currentUserPermissionGroups,
                    permissionRequiredToCreateDatasource,
                    permissionRequiredToCreatePage,
                    permissionRequiredToEditContext,
                    permissionRequiredToCreateAction,
                    permissionRequiredToEditAction,
                    permissionRequiredToEditDatasource);
        }
    }
}
