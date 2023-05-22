package com.appsmith.server.helpers.ce;

import com.appsmith.server.acl.AclPermission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Optional;

@Builder(builderClassName = "Builder", toBuilder = true)
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ImportApplicationPermissionProvider {
    private Optional<AclPermission> existingPagesPermission = Optional.empty();
    private Optional<AclPermission> existingActionsPermission = Optional.empty();
    private Optional<AclPermission> existingActionCollectionsPermission = Optional.empty();
    private Optional<AclPermission> existingDatasourcesPermission = Optional.empty();
    private Optional<AclPermission> workspacePermission = Optional.empty();
    private Optional<AclPermission> applicationPermission = Optional.empty();

    private boolean checkPermissionToAddPage; // false by default
    private boolean checkPermissionToAddAction; // false by default
    private boolean checkPermissionToAddActionCollection; // false by default

    public boolean hasPermissionToAddPage() {
        return checkPermissionToAddPage;
    }

    public boolean hasPermissionToAddAction() {
        return checkPermissionToAddAction;
    }

    public boolean hasPermissionToAddActionCollection() {
        return checkPermissionToAddActionCollection;
    }
}
