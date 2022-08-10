package com.appsmith.server.helpers;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.ThemeRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;

@Component
@AllArgsConstructor
@Slf4j
public class PolicyUtils {

    private final PolicyGenerator policyGenerator;
    private final ApplicationRepository applicationRepository;
    private final DatasourceRepository datasourceRepository;
    private final NewPageRepository newPageRepository;
    private final NewActionRepository newActionRepository;
    private final CommentThreadRepository commentThreadRepository;
    private final ActionCollectionRepository actionCollectionRepository;
    private final ThemeRepository themeRepository;

    /**
     * This method will add a Set of policies to the given domain.
     * @param domain The domain to which the policies will be added
     * @param policySet The policies to be added to the domain
     */
    public <T extends BaseDomain> T addPoliciesToExistingObject(Set<Policy> policySet, T domain) {
        // If policies set is null initialize it with empty set
        if(domain.getPolicies() == null) {
            domain.setPolicies(new HashSet<>());
        }
        
        // Create a map of permission to policy set on obj
        Map<String, Policy> policiesMap = domain.getPolicies().stream().collect(Collectors.toMap(
            policy -> policy.getPermission(),
            policy -> {
                // If permission groups Set is null initialize it with empty set
                if(policy.getPermissionGroups() == null) {
                    policy.setPermissionGroups(new HashSet<>());
                }
                return policy;
            },
            //Function to merge another policy if exist with the same permission
            //This should not happen so warn about it
            (policy1, policy2) -> {
                log.warn("Duplicate policy found for permission {} for ObjectId {} of type {} in addPoliciesToExistingObject",
                    policy1.getPermission(), domain.getId(), domain.getClass().getSimpleName());
                // merge the two policies by adding the permission groups to the existing policy
                policy1.getPermissionGroups().addAll(policy2.getPermissionGroups());
                return policy1;
            },
            HashMap::new));

        policySet.forEach(policy -> {
            if (policiesMap.containsKey(policy.getPermission())) {
                // If permission exists in the map, merge the permission groups
                policiesMap.get(policy.getPermission()).getPermissionGroups().addAll(policy.getPermissionGroups());
            } else {
                // If permission does not exist in the map, add the new policy to the map
                policiesMap.put(policy.getPermission(), Policy.builder().permission(policy.getPermission()).permissionGroups(new HashSet<>(policy.getPermissionGroups())).build());
            }
        });

        // Set the new policies to the object by creating a new Set of values from the map
        domain.setPolicies(policiesMap.values()
                .stream()
                // Remove the policies with no permission groups
                // This filter is probably not required here
                // but since added logic to initialize null permission groups in the policy with empty set
                // this is here for safety
                .filter(policy -> !policy.getPermissionGroups().isEmpty())
                // Convert the policies to a HashSet
                .collect(Collectors.toCollection(HashSet::new))
        );
        
        // Return the object with the new policies
        return domain;
    }

    /**
     * This method will remove a Set of policies from the given domain.
     * @param domain The domain from which the policies will be removed
     * @param policySet The policies to be removed from the domain
     */
    public <T extends BaseDomain> T removePoliciesFromExistingObject(Set<Policy> policySet, T domain) {
        // If policies set is null initialize it with empty set
        if(domain.getPolicies() == null) {
            domain.setPolicies(new HashSet<>());
        }

        // Create a map of permission to policy
        Map<String, Policy> policiesMap = domain.getPolicies().stream().collect(Collectors.toMap(
            policy -> policy.getPermission(),
            policy -> {
                if(policy.getPermissionGroups() == null) {
                    // If permission groups Set is null initialize it with empty set
                    policy.setPermissionGroups(new HashSet<>());
                }
                return policy;
            },
            //Function to merge another policy if exist with the same permission
            //This should not happen so warn about it
            (policy1, policy2) -> {
                log.warn("Duplicate policy found for permission {} for ObjectId {} of type {} in removePoliciesFromExistingObject",
                    policy1.getPermission(), domain.getId(), domain.getClass().getSimpleName());
                // merge the two policies by adding the permission groups to the existing policy
                policy1.getPermissionGroups().addAll(policy2.getPermissionGroups());
                return policy1;
            },
            HashMap::new));

        // Remove the permission groups from matching policies
        policySet.forEach(policy -> {
            if (policiesMap.containsKey(policy.getPermission())) {
                policiesMap.get(policy.getPermission()).getPermissionGroups().removeAll(policy.getPermissionGroups());
            }
        });

        // Set the new policies to the object by creating a new Set of values in the map
        // drop the policies with no permission groups
        domain.setPolicies(policiesMap.values()
                .stream()
                // Remove the policies with no permission groups
                .filter(policy -> !policy.getPermissionGroups().isEmpty())
                // Convert the policies to a HashSet
                .collect(Collectors.toCollection(HashSet::new))
        );
        
        // Return the object with the new policies
        return domain;
    }

    /**
     * This method will generate the Set of policies for the given domainId using Permissions
     * in the given PermissionGroup. This includes lateral policies.
     * @param permissionGroup The PermissionGroup to be used to generate the policies
     * @param domainId The domainId for which the policies will be generated
     */
    public Set<Policy> generatePolicyFromPermissionGroupForObject(PermissionGroup permissionGroup, String objectId) {
        Set<Permission> permissions = permissionGroup.getPermissions();
        return permissions.stream()
                .filter(perm -> perm.getDocumentId().equals(objectId))
                .map(perm -> {

                    Policy policyWithCurrentPermission = Policy.builder().permission(perm.getAclPermission().getValue())
                            .permissionGroups(Set.of(permissionGroup.getId()))
                            .build();
                    // Generate any and all lateral policies that might come with the current permission
                    Set<Policy> policiesForPermissionGroup = policyGenerator.getLateralPolicies(perm.getAclPermission(), Set.of(permissionGroup.getId()), null);
                    policiesForPermissionGroup.add(policyWithCurrentPermission);
                    return policiesForPermissionGroup;
                })
                .flatMap(Collection::stream)
                .collect(Collectors.toSet());
    }

    /**
     * This method will generate the Set of policies providing the given permission for the given permissionGroupId
     * This includes lateral policies.
     * @param permission The Permission to be used to generate the policies
     * @param permissionGroupId The permissionGroupId to which the permission will be given
     */
    public Set<Policy> generatePolicyFromPermissionWithPermissionGroup(AclPermission permission, String permissionGroupId) {

        Policy policyWithCurrentPermission = Policy.builder().permission(permission.getValue())
                .permissionGroups(Set.of(permissionGroupId))
                .build();
        // Generate any and all lateral policies that might come with the current permission
        Set<Policy> policiesForPermission = policyGenerator.getLateralPolicies(permission, Set.of(permissionGroupId), null);
        policiesForPermission.add(policyWithCurrentPermission);
        return policiesForPermission;
    }

    public Flux<Datasource> updateWithNewPoliciesToDatasourcesByWorkspaceId(String workspaceId, Set<Policy> newPolicySet, boolean addPolicyToObject) {

        return datasourceRepository
                // fetch datasources with execute permissions so that app viewers can invite other app viewers
                .findAllByWorkspaceId(workspaceId, AclPermission.EXECUTE_DATASOURCES)
                // In case we have come across a datasource for this workspace that the current user is not allowed to manage, move on.
                .switchIfEmpty(Mono.empty())
                .map(datasource -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newPolicySet, datasource);
                    } else {
                        return removePoliciesFromExistingObject(newPolicySet, datasource);
                    }
                })
                .collectList()
                .flatMapMany(updatedDatasources -> datasourceRepository.saveAll(updatedDatasources));
    }

    public Flux<Datasource> updateWithNewPoliciesToDatasourcesByDatasourceIds(Set<String> ids, Set<Policy> datasourcePolicySet, boolean addPolicyToObject) {

        return datasourceRepository
                .findAllByIds(ids, MANAGE_DATASOURCES)
                // In case we have come across a datasource the current user is not allowed to manage, move on.
                .switchIfEmpty(Mono.empty())
                .flatMap(datasource -> {
                    Datasource updatedDatasource;
                    if (addPolicyToObject) {
                        updatedDatasource = addPoliciesToExistingObject(datasourcePolicySet, datasource);
                    } else {
                        updatedDatasource = removePoliciesFromExistingObject(datasourcePolicySet, datasource);
                    }

                    return Mono.just(updatedDatasource);
                })
                .collectList()
                .flatMapMany(datasources -> datasourceRepository.saveAll(datasources));
    }

    public Flux<Application> updateWithNewPoliciesToApplicationsByWorkspaceId(String workspaceId, Set<Policy> newAppPoliciesSet, boolean addPolicyToObject) {

        return applicationRepository
                // fetch applications with read permissions so that app viewers can invite other app viewers
                .findByWorkspaceId(workspaceId, AclPermission.READ_APPLICATIONS)
                // In case we have come across an application for this workspace that the current user is not allowed to manage, move on.
                .switchIfEmpty(Mono.empty())
                .map(application -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newAppPoliciesSet, application);
                    } else {
                        return removePoliciesFromExistingObject(newAppPoliciesSet, application);
                    }
                })
                .collectList()
                .flatMapMany(updatedApplications -> applicationRepository.saveAll(updatedApplications));
    }

    public Flux<NewPage> updateWithApplicationPermissionsToAllItsPages(String applicationId, Set<Policy> newPagePoliciesSet, boolean addPolicyToObject) {

        // Instead of fetching pages from the application object, we fetch pages from the page repository. This ensures that all the published
        // AND the unpublished pages are updated with the new policy change [This covers the edge cases where a page may exist
        // in published app but has been deleted in the edit mode]. This means that we don't have to do any special treatment
        // during deployment of the application to handle edge cases.
        return newPageRepository
                // fetch pages with read permissions so that app viewers can invite other app viewers
                .findByApplicationId(applicationId, AclPermission.READ_PAGES)
                .switchIfEmpty(Mono.empty())
                .map(page -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newPagePoliciesSet, page);
                    } else {
                        return removePoliciesFromExistingObject(newPagePoliciesSet, page);
                    }
                })
                .collectList()
                .flatMapMany(updatedPages -> newPageRepository
                        .saveAll(updatedPages));
    }

    public Flux<Theme> updateThemePolicies(Application application, Set<Policy> themePolicySet, boolean addPolicyToObject) {
        Flux<Theme> applicationThemes = themeRepository.getApplicationThemes(application.getId(), READ_THEMES);
        if(StringUtils.hasLength(application.getEditModeThemeId())) {
            applicationThemes = applicationThemes.concatWith(
                    themeRepository.findById(application.getEditModeThemeId(), READ_THEMES)
            );
        }
        if(StringUtils.hasLength(application.getPublishedModeThemeId())) {
            applicationThemes = applicationThemes.concatWith(
                    themeRepository.findById(application.getPublishedModeThemeId(), READ_THEMES)
            );
        }
        return applicationThemes
                .filter(theme -> !theme.isSystemTheme()) // skip the system themes
                .map(theme -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(themePolicySet, theme);
                    } else {
                        return removePoliciesFromExistingObject(themePolicySet, theme);
                    }
                })
                .collectList()
                .flatMapMany(themeRepository::saveAll);
    }

    public Flux<CommentThread> updateCommentThreadPermissions(
            String applicationId, Set<Policy> commentThreadPolicySet, String username, boolean addPolicyToObject) {

        return
                // fetch comment threads with read permissions
                commentThreadRepository.findByApplicationId(applicationId, AclPermission.READ_THREADS)
                .switchIfEmpty(Mono.empty())
                .map(thread -> {
                    if(!Boolean.TRUE.equals(thread.getIsPrivate())) {
                        if (addPolicyToObject) {
                            return addPoliciesToExistingObject(commentThreadPolicySet, thread);
                        } else {
                            if(CollectionUtils.isNotEmpty(thread.getSubscribers())) {
                                thread.getSubscribers().remove(username);
                            }
                            return removePoliciesFromExistingObject(commentThreadPolicySet, thread);
                        }
                    }
                    return thread;
                })
                .collectList()
                .flatMapMany(commentThreadRepository::saveAll);
    }

    /**
     * Instead of fetching actions by pageId, fetch actions by applicationId and then update the action policies
     * using the new ActionPoliciesMap. This ensures the following :
     * 1. Instead of bulk updating actions page wise, we do bulk update of actions in one go for the entire application.
     * 2. If the action is associated with different pages (in published/unpublished page due to movement of action), fetching
     * actions by applicationId ensures that we update ALL the actions and don't have to do special handling for the same.
     *
     * @param applicationId
     * @param newActionPoliciesSet
     * @param addPolicyToObject
     * @return
     */
    public Flux<NewAction> updateWithPagePermissionsToAllItsActions(String applicationId, Set<Policy> newActionPoliciesSet, boolean addPolicyToObject) {

        return newActionRepository
                .findByApplicationId(applicationId)
                .switchIfEmpty(Mono.empty())
                .map(action -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newActionPoliciesSet, action);
                    } else {
                        return removePoliciesFromExistingObject(newActionPoliciesSet, action);
                    }
                })
                .collectList()
                .flatMapMany(newActionRepository::saveAll);
    }

    public Flux<ActionCollection> updateWithPagePermissionsToAllItsActionCollections(String applicationId, Set<Policy> newActionPoliciesSet, boolean addPolicyToObject) {

        return actionCollectionRepository
                .findByApplicationId(applicationId)
                .switchIfEmpty(Mono.empty())
                .map(action -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newActionPoliciesSet, action);
                    } else {
                        return removePoliciesFromExistingObject(newActionPoliciesSet, action);
                    }
                })
                .collectList()
                .flatMapMany(actionCollectionRepository::saveAll);
    }

    public Set<Policy> generateInheritedPoliciesFromSourcePolicies(Set<Policy> sourcePolicySet,
                                                                           Class<? extends BaseDomain> sourceEntity,
                                                                           Class<? extends BaseDomain> destinationEntity) {
        Set<Policy> extractedInterestingPolicySet = new HashSet<>(sourcePolicySet);

        return policyGenerator.getAllChildPolicies(extractedInterestingPolicySet, sourceEntity, destinationEntity);
    }
}
