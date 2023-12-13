package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import reactor.core.publisher.Flux;

import java.util.Map;
import java.util.Set;

public interface PolicySolutionCE {
    <T extends BaseDomain> T addPoliciesToExistingObject(Map<String, Policy> policyMap, T obj);

    <T extends BaseDomain> T removePoliciesFromExistingObject(Map<String, Policy> policyMap, T obj);

    Map<String, Policy> generatePolicyFromPermissionGroupForObject(PermissionGroup permissionGroup, String objectId);

    Map<String, Policy> generatePolicyFromPermissionWithPermissionGroup(
            AclPermission permission, String permissionGroupId);

    Flux<Datasource> updateWithNewPoliciesToDatasourcesByDatasourceIdsWithoutPermission(
            Set<String> ids, Map<String, Policy> datasourcePolicyMap, boolean addPolicyToObject);

    Flux<NewPage> updateWithApplicationPermissionsToAllItsPages(
            String applicationId, Map<String, Policy> newPagePoliciesMap, boolean addPolicyToObject);

    Flux<Theme> updateThemePolicies(
            Application application, Map<String, Policy> themePolicyMap, boolean addPolicyToObject);

    Flux<NewAction> updateWithPagePermissionsToAllItsActions(
            String applicationId, Map<String, Policy> newActionPoliciesMap, boolean addPolicyToObject);

    Flux<ActionCollection> updateWithPagePermissionsToAllItsActionCollections(
            String applicationId, Map<String, Policy> newActionPoliciesMap, boolean addPolicyToObject);

    Map<String, Policy> generateInheritedPoliciesFromSourcePolicies(
            Map<String, Policy> sourcePolicyMap,
            Class<? extends BaseDomain> sourceEntity,
            Class<? extends BaseDomain> destinationEntity);
}
