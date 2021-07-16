package com.appsmith.server.helpers;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.solutions.UserChangedHandler;
import lombok.AllArgsConstructor;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;

@Component
@AllArgsConstructor
public class PolicyUtils {

    private final PolicyGenerator policyGenerator;
    private final ApplicationRepository applicationRepository;
    private final DatasourceRepository datasourceRepository;
    private final NewPageRepository newPageRepository;
    private final NewActionRepository newActionRepository;
    private final UserChangedHandler userChangedHandler;
    private final CommentThreadRepository commentThreadRepository;

    public <T extends BaseDomain> T addPoliciesToExistingObject(Map<String, Policy> policyMap, T obj) {
        // Making a deep copy here so we don't modify the `policyMap` object.
        // TODO: Investigate a solution without using deep-copy.
        final Map<String, Policy> policyMap1 = new HashMap<>();
        for (Map.Entry<String, Policy> entry : policyMap.entrySet()) {
            policyMap1.put(entry.getKey(), entry.getValue());
        }

        // Append the user to the existing permission policy if it already exists.
        for (Policy policy : obj.getPolicies()) {
            String permission = policy.getPermission();
            if (policyMap1.containsKey(permission)) {
                policy.getUsers().addAll(policyMap1.get(permission).getUsers());
                if (policy.getGroups() == null) {
                    policy.setGroups(new HashSet<>());
                }
                if (policyMap1.get(permission).getGroups() != null) {
                    policy.getGroups().addAll(policyMap1.get(permission).getGroups());
                }
                // Remove this permission from the policyMap as this has been accounted for in the above code
                policyMap1.remove(permission);
            }
        }

        obj.getPolicies().addAll(policyMap1.values());
        return obj;
    }

    public <T extends BaseDomain> T removePoliciesFromExistingObject(Map<String, Policy> policyMap, T obj) {
        // Making a deep copy here so we don't modify the `policyMap` object.
        // TODO: Investigate a solution without using deep-copy.
        final Map<String, Policy> policyMap1 = new HashMap<>();
        for (Map.Entry<String, Policy> entry : policyMap.entrySet()) {
            policyMap1.put(entry.getKey(), entry.getValue());
        }

        // Remove the user from the existing permission policy if it exists.
        for (Policy policy : obj.getPolicies()) {
            String permission = policy.getPermission();
            if (policyMap1.containsKey(permission)) {
                policy.getUsers().removeAll(policyMap1.get(permission).getUsers());
                if (policy.getGroups() == null) {
                    policy.setGroups(new HashSet<>());
                }
                if (policyMap1.get(permission).getGroups() != null) {
                    policy.getGroups().removeAll(policyMap1.get(permission).getGroups());
                }
                // Remove this permission from the policyMap as this has been accounted for in the above code
                policyMap1.remove(permission);
            }
        }

        return obj;
    }

    /**
     * Given a set of AclPermissions, generate all policies (including policies from lateral permissions) for the user.
     *
     * @param permissions
     * @param user
     * @return
     */
    public Map<String, Policy> generatePolicyFromPermission(Set<AclPermission> permissions, User user) {
        return permissions.stream()
                .map(perm -> {
                    // Create a policy for the invited user using the permission as per the role
                    Policy policyWithCurrentPermission = Policy.builder().permission(perm.getValue())
                            .users(Set.of(user.getUsername())).build();
                    // Generate any and all lateral policies that might come with the current permission
                    Set<Policy> policiesForUser = policyGenerator.getLateralPolicies(perm, Set.of(user.getUsername()), null);
                    policiesForUser.add(policyWithCurrentPermission);
                    return policiesForUser;
                })
                .flatMap(Collection::stream)
                .collect(Collectors.toMap(Policy::getPermission, Function.identity()));
    }

    public Map<String, Policy> generatePolicyFromPermissionForMultipleUsers(Set<AclPermission> permissions, List<User> users) {
        Set<String> usernames = users.stream().map(user -> user.getUsername()).collect(Collectors.toSet());

        return permissions.stream()
                .map(perm -> {
                    // Create a policy for the invited user using the permission as per the role
                    Policy policyWithCurrentPermission = Policy.builder().permission(perm.getValue())
                            .users(usernames).build();
                    // Generate any and all lateral policies that might come with the current permission
                    Set<Policy> policiesForUser = policyGenerator.getLateralPolicies(perm, usernames, null);
                    policiesForUser.add(policyWithCurrentPermission);
                    return policiesForUser;
                })
                .flatMap(Collection::stream)
                .collect(Collectors.toMap(Policy::getPermission, Function.identity()));
    }

    public Flux<Datasource> updateWithNewPoliciesToDatasourcesByOrgId(String orgId, Map<String, Policy> newPoliciesMap, boolean addPolicyToObject) {

        return datasourceRepository
                // fetch datasources with execute permissions so that app viewers can invite other app viewers
                .findAllByOrganizationId(orgId, AclPermission.EXECUTE_DATASOURCES)
                // In case we have come across a datasource for this organization that the current user is not allowed to manage, move on.
                .switchIfEmpty(Mono.empty())
                .map(datasource -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newPoliciesMap, datasource);
                    } else {
                        return removePoliciesFromExistingObject(newPoliciesMap, datasource);
                    }
                })
                .collectList()
                .flatMapMany(updatedDatasources -> datasourceRepository.saveAll(updatedDatasources));
    }

    public Flux<Datasource> updateWithNewPoliciesToDatasourcesByDatasourceIds(Set<String> ids, Map<String, Policy> datasourcePolicyMap, boolean addPolicyToObject) {

        return datasourceRepository
                .findAllByIds(ids, MANAGE_DATASOURCES)
                // In case we have come across a datasource the current user is not allowed to manage, move on.
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

    public Flux<Application> updateWithNewPoliciesToApplicationsByOrgId(String orgId, Map<String, Policy> newAppPoliciesMap, boolean addPolicyToObject) {

        return applicationRepository
                // fetch applications with read permissions so that app viewers can invite other app viewers
                .findByOrganizationId(orgId, AclPermission.READ_APPLICATIONS)
                // In case we have come across an application for this organization that the current user is not allowed to manage, move on.
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

    public Flux<NewPage> updateWithApplicationPermissionsToAllItsPages(String applicationId, Map<String, Policy> newPagePoliciesMap, boolean addPolicyToObject) {

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
                        return addPoliciesToExistingObject(newPagePoliciesMap, page);
                    } else {
                        return removePoliciesFromExistingObject(newPagePoliciesMap, page);
                    }
                })
                .collectList()
                .flatMapMany(updatedPages -> newPageRepository
                        .saveAll(updatedPages));
    }

    public Flux<CommentThread> updateWithApplicationPermissionsToAllItsCommentThreads(String applicationId, Map<String, Policy> commentThreadPolicyMap, boolean addPolicyToObject) {

        return
                // fetch comment threads with read permissions
                commentThreadRepository.findByApplicationId(applicationId, AclPermission.READ_THREAD)
                .switchIfEmpty(Mono.empty())
                .map(thread -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(commentThreadPolicyMap, thread);
                    } else {
                        return removePoliciesFromExistingObject(commentThreadPolicyMap, thread);
                    }
                })
                .collectList()
                .flatMapMany(commentThreads -> commentThreadRepository.saveAll(commentThreads));
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
    public Flux<NewAction> updateWithPagePermissionsToAllItsActions(String applicationId, Map<String, Policy> newActionPoliciesMap, boolean addPolicyToObject) {

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
                .flatMapMany(updatedActions -> newActionRepository.saveAll(updatedActions));
    }

    public Map<String, Policy> generateInheritedPoliciesFromSourcePolicies(Map<String, Policy> sourcePolicyMap,
                                                                           Class<? extends BaseDomain> sourceEntity,
                                                                           Class<? extends BaseDomain> destinationEntity) {
        Set<Policy> extractedInterestingPolicySet = new HashSet<>(sourcePolicyMap.values());

        return policyGenerator.getAllChildPolicies(extractedInterestingPolicySet, sourceEntity, destinationEntity)
                .stream()
                .collect(Collectors.toMap(Policy::getPermission, Function.identity()));
    }

    public Boolean isPermissionPresentForUser(Set<Policy> policies, String permission, String username) {

        if (policies == null || policies.isEmpty()) {
            return false;
        }

        Optional<Policy> requestedPermissionPolicyOptional = policies.stream().filter(policy -> {
            if (policy.getPermission().equals(permission)) {
                Set<String> users = policy.getUsers();
                if (users.contains(username)) {
                    return true;
                }
            }
            return false;
        }).findFirst();

        if (requestedPermissionPolicyOptional.isPresent()) {
            return true;
        }

        return false;
    }

    public Set<String> findUsernamesWithPermission(Set<Policy> policies, AclPermission permission) {
        if (CollectionUtils.isNotEmpty(policies) && permission != null) {
            final String permissionString = permission.getValue();
            for (Policy policy : policies) {
                if (permissionString.equals(policy.getPermission())) {
                    return policy.getUsers();
                }
            }
        }

        return Collections.emptySet();
    }

}
