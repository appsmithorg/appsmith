package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.PolicyUtils;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Set;

@Builder(builderClassName = "Builder")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ImportApplicationPermissionProvider {
    private AclPermission editPagePermission;
    private AclPermission createPagePermission;

    private AclPermission editActionPermission;
    private AclPermission createActionPermission;

    private AclPermission editActionCollectionPermission;
    private AclPermission createActionCollectionPermission;

    private AclPermission editDatasourcePermission;
    private AclPermission createDatasourcePermission;

    private AclPermission workspacePermission;
    private AclPermission applicationPermission;

    private Set<String> userPermissionGroups;

    private boolean hasPermission(AclPermission permission, BaseDomain baseDomain) {
        if(permission == null) {
            return true;
        }
        return PolicyUtils.isPermissionPresentInPolicies(permission.getValue(), baseDomain.getPolicies(), userPermissionGroups);
    }

    public boolean hasEditPermission(NewPage page) {
        return hasPermission(editPagePermission, page);
    }

    public boolean hasEditPermission(NewAction action) {
        return hasPermission(editActionPermission, action);
    }

    public boolean hasEditPermission(ActionCollection actionCollection) {
        return hasPermission(editActionCollectionPermission, actionCollection);
    }

    public boolean hasEditPermission(Datasource datasource) {
        return hasPermission(editDatasourcePermission, datasource);
    }

    public boolean canCreatePage(Application application) {
        return hasPermission(createPagePermission, application);
    }

    public boolean canCreateAction(NewPage page) {
        return hasPermission(createActionPermission, page);
    }

    public boolean canCreateActionCollection(NewPage page) {
        return hasPermission(createActionCollectionPermission, page);
    }

    public boolean canCreateDatasource(Workspace workspace) {
        return hasPermission(createDatasourcePermission, workspace);
    }
}
