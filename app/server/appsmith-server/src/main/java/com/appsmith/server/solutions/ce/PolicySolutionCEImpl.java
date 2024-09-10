package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_THEMES;

@AllArgsConstructor
@Slf4j
public class PolicySolutionCEImpl implements PolicySolutionCE {

    private final PolicyGenerator policyGenerator;
    private final ApplicationRepository applicationRepository;
    private final DatasourceRepository datasourceRepository;
    private final NewPageRepository newPageRepository;
    private final NewActionRepository newActionRepository;
    private final ActionCollectionRepository actionCollectionRepository;
    private final ThemeRepository themeRepository;
    private final DatasourcePermission datasourcePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;

    @Override
    public <T extends BaseDomain> T addPoliciesToExistingObject(@NonNull Map<String, Policy> policyMap, T obj) {
        // Making a deep copy here so we don't modify the `policyMap` object.
        // TODO: Investigate a solution without using deep-copy.
        // TODO: Do we need to return the domain object?
        final Map<String, Policy> policyMap1 = new HashMap<>();
        for (Map.Entry<String, Policy> entry : policyMap.entrySet()) {
            Policy entryValue = entry.getValue();
            Policy policy = Policy.builder()
                    .permission(entryValue.getPermission())
                    .permissionGroups(new HashSet<>(entryValue.getPermissionGroups()))
                    .build();
            policyMap1.put(entry.getKey(), policy);
        }

        Set<Policy> existingPolicies = obj.getPolicies();
        final Set<Policy> policies = new HashSet<>(existingPolicies == null ? Set.of() : existingPolicies);

        // Append the user to the existing permission policy if it already exists.
        for (Policy policy : policies) {
            String permission = policy.getPermission();
            if (policyMap1.containsKey(permission)) {
                Set<String> permissionGroups = new HashSet<>();
                if (policy.getPermissionGroups() != null) {
                    permissionGroups.addAll(policy.getPermissionGroups());
                }
                if (policyMap1.get(permission).getPermissionGroups() != null) {
                    permissionGroups.addAll(policyMap1.get(permission).getPermissionGroups());
                }
                policy.setPermissionGroups(permissionGroups);
                // Remove this permission from the policyMap as this has been accounted for in the above code
                policyMap1.remove(permission);
            }
        }

        policies.addAll(policyMap1.values());
        obj.setPolicies(policies);
        return obj;
    }

    @Override
    public <T extends BaseDomain> T removePoliciesFromExistingObject(Map<String, Policy> policyMap, T obj) {
        // Making a deep copy here so we don't modify the `policyMap` object.
        // TODO: Investigate a solution without using deep-copy.
        final Map<String, Policy> policyMap1 = new HashMap<>();
        for (Map.Entry<String, Policy> entry : policyMap.entrySet()) {
            policyMap1.put(entry.getKey(), entry.getValue());
        }

        Set<Policy> existingPolicies = obj.getPolicies();
        final Set<Policy> policies = new HashSet<>(existingPolicies == null ? Set.of() : existingPolicies);
        // Remove the user from the existing permission policy if it exists.
        for (Policy policy : policies) {
            String permission = policy.getPermission();
            if (policyMap1.containsKey(permission)) {
                if (policy.getPermissionGroups() == null) {
                    policy.setPermissionGroups(new HashSet<>());
                }
                if (policyMap1.get(permission).getPermissionGroups() != null) {
                    policy.getPermissionGroups()
                            .removeAll(policyMap1.get(permission).getPermissionGroups());
                }
                // Remove this permission from the policyMap as this has been accounted for in the above code
                policyMap1.remove(permission);
            }
        }
        obj.setPolicies(policies);
        return obj;
    }

    @Override
    public Map<String, Policy> generatePolicyFromPermissionGroupForObject(
            PermissionGroup permissionGroup, String objectId) {
        Set<Permission> permissions = permissionGroup.getPermissions();
        return permissions.stream()
                .filter(perm -> perm.getDocumentId().equals(objectId))
                .map(perm -> {
                    Policy policyWithCurrentPermission = Policy.builder()
                            .permission(perm.getAclPermission().getValue())
                            .permissionGroups(Set.of(permissionGroup.getId()))
                            .build();
                    // Generate any and all lateral policies that might come with the current permission
                    Set<Policy> policiesForPermissionGroup = policyGenerator.getLateralPolicies(
                            perm.getAclPermission(), Set.of(permissionGroup.getId()), null);
                    policiesForPermissionGroup.add(policyWithCurrentPermission);
                    return policiesForPermissionGroup;
                })
                .flatMap(Collection::stream)
                .collect(Collectors.toMap(Policy::getPermission, Function.identity(), (policy1, policy2) -> policy1));
    }

    @Override
    public Map<String, Policy> generatePolicyFromPermissionWithPermissionGroup(
            AclPermission permission, String permissionGroupId) {

        Policy policyWithCurrentPermission = Policy.builder()
                .permission(permission.getValue())
                .permissionGroups(Set.of(permissionGroupId))
                .build();
        // Generate any and all lateral policies that might come with the current permission
        Set<Policy> policiesForPermission =
                policyGenerator.getLateralPolicies(permission, Set.of(permissionGroupId), null);
        policiesForPermission.add(policyWithCurrentPermission);
        return policiesForPermission.stream().collect(Collectors.toMap(Policy::getPermission, Function.identity()));
    }

    @Override
    public Flux<Datasource> updateWithNewPoliciesToDatasourcesByDatasourceIdsWithoutPermission(
            Set<String> ids, Map<String, Policy> datasourcePolicyMap, boolean addPolicyToObject) {

        // Find all the datasources without permission to update the policies.
        return datasourceRepository
                .findByIdIn(List.copyOf(ids))
                .switchIfEmpty(Mono.empty())
                .flatMap(datasource -> {
                    Datasource updatedDatasource;
                    if (addPolicyToObject) {
                        updatedDatasource = addPoliciesToExistingObject(datasourcePolicyMap, datasource);
                    } else {
                        updatedDatasource = removePoliciesFromExistingObject(datasourcePolicyMap, datasource);
                    }

                    return Mono.just(updatedDatasource);
                })
                .collectList()
                .flatMapMany(datasources -> datasourceRepository.saveAll(datasources));
    }

    public Flux<Application> updateWithNewPoliciesToApplicationsByWorkspaceId(
            String workspaceId, Map<String, Policy> newAppPoliciesMap, boolean addPolicyToObject) {

        return applicationRepository
                // fetch applications with read permissions so that app viewers can invite other app viewers
                .findByWorkspaceId(workspaceId, applicationPermission.getReadPermission())
                // In case we have come across an application for this workspace that the current user is not allowed to
                // manage, move on.
                .switchIfEmpty(Mono.empty())
                .map(application -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newAppPoliciesMap, application);
                    } else {
                        return removePoliciesFromExistingObject(newAppPoliciesMap, application);
                    }
                })
                .collectList()
                .flatMapMany(updatedApplications -> applicationRepository.saveAll(updatedApplications));
    }

    @Override
    public Flux<NewPage> updateWithApplicationPermissionsToAllItsPages(
            String applicationId, Map<String, Policy> newPagePoliciesMap, boolean addPolicyToObject) {

        // Instead of fetching pages from the application object, we fetch pages from the page repository. This ensures
        // that all the published
        // AND the unpublished pages are updated with the new policy change [This covers the edge cases where a page may
        // exist
        // in published app but has been deleted in the edit mode]. This means that we don't have to do any special
        // treatment
        // during deployment of the application to handle edge cases.
        return newPageRepository
                // fetch pages with read permissions so that app viewers can invite other app viewers
                .findByApplicationId(applicationId, pagePermission.getReadPermission())
                .switchIfEmpty(Mono.empty())
                .map(page -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newPagePoliciesMap, page);
                    } else {
                        return removePoliciesFromExistingObject(newPagePoliciesMap, page);
                    }
                })
                .collectList()
                .flatMapMany(updatedPages -> newPageRepository.saveAll(updatedPages));
    }

    @Override
    public Flux<Theme> updateThemePolicies(
            Application application, Map<String, Policy> themePolicyMap, boolean addPolicyToObject) {
        Flux<Theme> applicationThemes = themeRepository.getApplicationThemes(application.getId(), READ_THEMES);
        if (StringUtils.hasLength(application.getEditModeThemeId())) {
            applicationThemes = applicationThemes.concatWith(
                    themeRepository.findById(application.getEditModeThemeId(), READ_THEMES));
        }
        if (StringUtils.hasLength(application.getPublishedModeThemeId())) {
            applicationThemes = applicationThemes.concatWith(
                    themeRepository.findById(application.getPublishedModeThemeId(), READ_THEMES));
        }
        return applicationThemes
                .filter(theme -> !theme.isSystemTheme()) // skip the system themes
                .map(theme -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(themePolicyMap, theme);
                    } else {
                        return removePoliciesFromExistingObject(themePolicyMap, theme);
                    }
                })
                .collectList()
                .flatMapMany(themeRepository::saveAll);
    }

    /**
     * Instead of fetching actions by pageId, fetch actions by applicationId and then update the action policies
     * using the new ActionPoliciesMap. This ensures the following :
     * 1. Instead of bulk updating actions page wise, we do bulk update of actions in one go for the entire application.
     * 2. If the action is associated with different pages (in published/unpublished page due to movement of action), fetching
     * actions by applicationId ensures that we update ALL the actions and don't have to do special handling for the same.
     *
     * @param applicationId
     * @param newActionPoliciesMap
     * @param addPolicyToObject
     * @return
     */
    @Override
    public Flux<NewAction> updateWithPagePermissionsToAllItsActions(
            String applicationId, Map<String, Policy> newActionPoliciesMap, boolean addPolicyToObject) {

        return newActionRepository
                .findByApplicationId(applicationId)
                .switchIfEmpty(Mono.empty())
                .map(action -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newActionPoliciesMap, action);
                    } else {
                        return removePoliciesFromExistingObject(newActionPoliciesMap, action);
                    }
                })
                .collectList()
                .flatMapMany(newActionRepository::saveAll);
    }

    @Override
    public Flux<ActionCollection> updateWithPagePermissionsToAllItsActionCollections(
            String applicationId, Map<String, Policy> newActionPoliciesMap, boolean addPolicyToObject) {

        return actionCollectionRepository
                .findByApplicationId(applicationId)
                .switchIfEmpty(Mono.empty())
                .map(action -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newActionPoliciesMap, action);
                    } else {
                        return removePoliciesFromExistingObject(newActionPoliciesMap, action);
                    }
                })
                .collectList()
                .flatMapMany(actionCollectionRepository::saveAll);
    }

    @Override
    public Map<String, Policy> generateInheritedPoliciesFromSourcePolicies(
            Map<String, Policy> sourcePolicyMap,
            Class<? extends BaseDomain> sourceEntity,
            Class<? extends BaseDomain> destinationEntity) {
        Set<Policy> extractedInterestingPolicySet = new HashSet<>(sourcePolicyMap.values());

        return policyGenerator
                .getAllChildPolicies(extractedInterestingPolicySet, sourceEntity, destinationEntity)
                .stream()
                .collect(Collectors.toMap(Policy::getPermission, Function.identity()));
    }
}
