package com.appsmith.server.helpers;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.ActionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.PageRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;

@Component
public class PolicyUtils {

    private final PolicyGenerator policyGenerator;
    private final ApplicationRepository applicationRepository;
    private final PageRepository pageRepository;
    private final ActionRepository actionRepository;
    private final DatasourceRepository datasourceRepository;

    public PolicyUtils(PolicyGenerator policyGenerator,
                       ApplicationRepository applicationRepository,
                       PageRepository pageRepository,
                       ActionRepository actionRepository,
                       DatasourceRepository datasourceRepository) {
        this.policyGenerator = policyGenerator;
        this.applicationRepository = applicationRepository;
        this.pageRepository = pageRepository;
        this.actionRepository = actionRepository;
        this.datasourceRepository = datasourceRepository;
    }

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

    public Map<String, Policy> generateChildrenPoliciesFromOrganizationPolicies(Map<String, Policy> orgPolicyMap, User user, Class destinationEntity) {
        Set<Policy> extractedInterestingPolicySet = new HashSet<>(orgPolicyMap.values())
                .stream()
                .filter(policy -> policy.getPermission().equals(ORGANIZATION_MANAGE_APPLICATIONS.getValue())
                        || policy.getPermission().equals(ORGANIZATION_READ_APPLICATIONS.getValue()))
                .collect(Collectors.toSet());

        return policyGenerator.getAllChildPolicies(extractedInterestingPolicySet, Organization.class, destinationEntity)
                .stream()
                .collect(Collectors.toMap(Policy::getPermission, Function.identity()));
    }

    public Flux<Datasource> updateWithNewPoliciesToDatasourcesByOrgId(String orgId, Map<String, Policy> newPoliciesMap, boolean addPolicyToObject) {

        return datasourceRepository
                .findAllByOrganizationId(orgId, AclPermission.MANAGE_DATASOURCES)
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

    public Flux<Application> updateWithNewPoliciesToApplicationsByOrgId(String orgId, Map<String, Policy> newAppPoliciesMap, boolean addPolicyToObject) {

        return applicationRepository
                .findByOrganizationId(orgId, AclPermission.MANAGE_APPLICATIONS)
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

    public Map<String, Policy> generatePagePoliciesFromApplicationPolicies(Map<String, Policy> applicationPolicyMap, User user) {
        Set<Policy> extractedInterestingPolicySet = new HashSet<>(applicationPolicyMap.values())
                .stream()
                .filter(policy -> policy.getPermission().equals(MANAGE_APPLICATIONS.getValue())
                        || policy.getPermission().equals(READ_APPLICATIONS.getValue()))
                .collect(Collectors.toSet());

        return policyGenerator.getAllChildPolicies(extractedInterestingPolicySet, Application.class, Page.class)
                .stream()
                .collect(Collectors.toMap(Policy::getPermission, Function.identity()));
    }

    public Flux<Page> updateWithApplicationPermissionsToAllItsPages(String applicationId, Map<String, Policy> newPagePoliciesMap, boolean addPolicyToObject) {

        return pageRepository
                .findByApplicationId(applicationId, AclPermission.MANAGE_PAGES)
                .switchIfEmpty(Mono.empty())
                .map(page -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newPagePoliciesMap, page);
                    } else {
                        return removePoliciesFromExistingObject(newPagePoliciesMap, page);
                    }
                })
                .collectList()
                .flatMapMany(updatedPages -> pageRepository.saveAll(updatedPages));
    }

    public Map<String, Policy> generateActionPoliciesFromPagePolicies(Map<String, Policy> pagePolicyMap, User user) {
        Set<Policy> extractedInterestingPolicySet = new HashSet<>(pagePolicyMap.values())
                .stream()
                .filter(policy -> policy.getPermission().equals(MANAGE_PAGES.getValue())
                        || policy.getPermission().equals(READ_PAGES.getValue()))
                .collect(Collectors.toSet());

        return policyGenerator.getAllChildPolicies(extractedInterestingPolicySet, Page.class, Action.class)
                .stream()
                .collect(Collectors.toMap(Policy::getPermission, Function.identity()));
    }

    public Flux<Action> updateWithPagePermissionsToAllItsActions(String pageId, Map<String, Policy> newActionPoliciesMap, boolean addPolicyToObject) {

        return actionRepository
                .findByPageId(pageId, AclPermission.MANAGE_ACTIONS)
                .switchIfEmpty(Mono.empty())
                .map(action -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(newActionPoliciesMap, action);
                    } else {
                        return removePoliciesFromExistingObject(newActionPoliciesMap, action);
                    }
                })
                .map(action -> {
                    if (action.getDatasource() == null) {
                        action.setDatasource(new Datasource());
                    }
                    return action;
                })
                .collectList()
                .flatMapMany(updatedActions -> actionRepository.saveAll(updatedActions));
    }
}
