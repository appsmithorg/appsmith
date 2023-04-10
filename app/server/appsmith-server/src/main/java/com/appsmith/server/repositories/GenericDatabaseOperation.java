package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.helpers.CollectionUtils;

import com.mongodb.client.result.UpdateResult;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.isPermissionForEntity;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.notDeleted;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class GenericDatabaseOperation {

    protected final ReactiveMongoOperations mongoOperations;
    protected final PolicyGenerator policyGenerator;

    public GenericDatabaseOperation(ReactiveMongoOperations mongoOperations, PolicyGenerator policyGenerator) {
        this.mongoOperations = mongoOperations;
        this.policyGenerator = policyGenerator;
    }

    /**
     * The method is responsible for flowing the policies present for the application to all the themes which
     * are related to all the branched applications.
     * @param application
     * @return
     */
    public Mono<Long> inheritPoliciesFromApplicationForAllRelatedThemes(Application application) {
        Set<Policy> inheritedThemePolicies = policyGenerator.getAllChildPolicies(application.getPolicies(), Application.class, Theme.class);
        Flux<Application> allBranchedApplicationFlux = mongoOperations.query(Application.class)
                .matching(getBranchedApplicationQuery(application))
                .all();
        return allBranchedApplicationFlux
                .collectList()
                .flatMap(allBranchedApplications -> {
                    Set<String> applicationIds = allBranchedApplications.stream()
                            .map(Application::getId)
                            .filter(StringUtils::isNotEmpty).collect(Collectors.toSet());
                    Set<String> editModeThemeIds = allBranchedApplications.stream()
                            .map(Application::getEditModeThemeId)
                            .filter(StringUtils::isNotEmpty).collect(Collectors.toSet());
                    Set<String> publishedModeModeThemeIds = allBranchedApplications.stream()
                            .map(Application::getPublishedModeThemeId)
                            .filter(StringUtils::isNotEmpty).collect(Collectors.toSet());

                    List<Criteria> themeIdCriteriaList = new ArrayList<>();
                    themeIdCriteriaList.add(Criteria.where("applicationId").in(applicationIds));
                    if (StringUtils.isNotEmpty(application.getPublishedModeThemeId())) {
                        themeIdCriteriaList.add(Criteria.where("id").in(publishedModeModeThemeIds));
                    }
                    if (StringUtils.isNotEmpty(application.getEditModeThemeId())) {
                        themeIdCriteriaList.add(Criteria.where("id").in(editModeThemeIds));
                    }
                    Criteria isNotSystemTheme = Criteria.where("isSystemTheme").is(false);

                    Criteria themeOrOperatorCriteria = new Criteria().orOperator(themeIdCriteriaList);
                    Criteria requiredThemeCriteria = new Criteria().andOperator(themeOrOperatorCriteria, notDeleted(), isNotSystemTheme);
                    return mongoOperations.updateMulti(Query.query(requiredThemeCriteria),
                                    Update.update("policies", inheritedThemePolicies),
                                    Theme.class)
                            .thenReturn(1L);
                });
    }

    /**
     * This function is used to inherit policies to invisible action collections if page in main branch is updated
     * @param page - Page object from which to inherit policies
     */
    public Mono<Long> inheritPoliciesForBranchedOnlyActionCollectionsFromPage(NewPage page) {
        // Get set of actions from the page
        Mono<List<String>> actionCollectionIdsMono = mongoOperations.query(ActionCollection.class)
            .matching(
                new Criteria().andOperator(
                    Criteria.where("unpublishedCollection.pageId").is(page.getId()),
                    new Criteria().norOperator(
                        Criteria.where("deleted").is(true),
                        Criteria.where("deletedAt").ne(null)
                    )
                )
            )
            .all()
            .map(actionCollection -> actionCollection.getDefaultResources().getCollectionId())
            .collectList();

        // Get only action collections which are in feature branch
        Flux<ActionCollection> actionCollectionsFlux = actionCollectionIdsMono.flatMapMany(actionCollectionIds -> {
            return mongoOperations.query(ActionCollection.class)
                    .matching(
                            new Criteria().andOperator(
                                    Criteria.where("defaultResources.collectionId").not().in(actionCollectionIds),
                                    Criteria.where("unpublishedCollection.defaultResources.pageId").is(page.getDefaultResources().getPageId()),
                                    new Criteria().norOperator(
                                            Criteria.where("deleted").is(true),
                                            Criteria.where("deletedAt").ne(null)
                                    )
                            )
                    )
                    .all();
        });

        Set<Policy> inheritedActionCollectionPolicies = policyGenerator.getAllChildPolicies(page.getPolicies(), Page.class, Action.class);

        return actionCollectionsFlux.flatMap(actionCollection -> {
            actionCollection.setPolicies(inheritedActionCollectionPolicies);
            return mongoOperations.save(actionCollection);
        })
        .then()
        .thenReturn(1L);
    }

    /**
     * This function is used to inherit policies to invisible actions if page in main branch is updated
     * @param page - Page object from which to inherit policies
     */
    public Mono<Long> inheritPoliciesForBranchedOnlyActionsFromPage(NewPage page) {
        // Get set of actions from the page
        Mono<List<String>> actionIdsMono = mongoOperations.query(NewAction.class)
            .matching(
                new Criteria().andOperator(
                    Criteria.where("unpublishedAction.pageId").is(page.getId()),
                    new Criteria().norOperator(
                        Criteria.where("deleted").is(true),
                        Criteria.where("deletedAt").ne(null)
                    )
                )
            )
            .all()
            .map(actionCollection -> actionCollection.getDefaultResources().getActionId())
            .collectList();

        // Get only actions which are in feature branch
        Flux<NewAction> actionsFlux = actionIdsMono.flatMapMany(actionIdList -> {
            return mongoOperations.query(NewAction.class)
                    .matching(
                        new Criteria().andOperator(
                            Criteria.where("defaultResources.actionId").not().in(actionIdList),
                            Criteria.where("unpublishedAction.defaultResources.pageId").is(page.getDefaultResources().getPageId()),
                            new Criteria().norOperator(
                                Criteria.where("deleted").is(true),
                                Criteria.where("deletedAt").ne(null)
                            )
                        )
                    )
                    .all();
        });

        Set<Policy> inheritedActionPolicies = policyGenerator.getAllChildPolicies(page.getPolicies(), Page.class, Action.class);

        return actionsFlux.flatMap(action -> {
            action.setPolicies(inheritedActionPolicies);
            return mongoOperations.save(action);
        })
        .then()
        .thenReturn(1L);
    }

    /**
     * Get all the pageIds from the branches for this specific page
     * For Example if the page 1 of default branch is passed as input, we get all the pageIds of the specific branches
     * @param page
     * @return
     */
    private Mono<List<String>> getBranchedPageIdList(NewPage page) {
        Mono<List<String>> pageIdsMono = mongoOperations.query(NewPage.class)
                .matching(
                        new Criteria().andOperator(
                                Criteria.where("defaultResources.pageId").is(page.getDefaultResources().getPageId()),
                                new Criteria().norOperator(
                                        Criteria.where("deleted").is(true),
                                        Criteria.where("deletedAt").ne(null))
                        )
                )
                .all()
                .map(BaseDomain::getId)
                .collectList();
        return pageIdsMono;
    }

    /**
     * This function is used to inherit policies to invisible pages and their childerens if application in main branch is updated
     * @param application - Application object from which to inherit policies
     */
    public Mono<Long> inheritPoliciesForBranchedOnlyPagesFromApplication(Application application) {
        // Get only pages which are in feature branch
        Flux<NewPage> pages = mongoOperations.query(NewPage.class)
                            .matching(
                                new Criteria().andOperator(
                                    Criteria.where("defaultResources.pageId").not().in(application.getPages().stream().map(page -> page.getDefaultPageId()).collect(Collectors.toList())),
                                    Criteria.where("defaultResources.applicationId").is(application.getId()),
                                    new Criteria().norOperator(
                                        Criteria.where("deleted").is(true),
                                        Criteria.where("deletedAt").ne(null)
                                    )
                                )
                            )
                            .all();

        // Get policies to be applied to pages that exits only in feature branch
        Set<Policy> inheritedPagePolicies = policyGenerator.getAllChildPolicies(application.getPolicies(), Application.class, Page.class);
        Set<Policy> inheritedActionPolicies = policyGenerator.getAllChildPolicies(inheritedPagePolicies, Page.class, Action.class);

        return pages.flatMap(page -> {
                    page.setPolicies(inheritedPagePolicies);
                    return mongoOperations.save(page);
                })
                .map(NewPage::getId)
                .collectList()
                .flatMap(pageIds -> {
                    // If a page policy is updated, inherit to actions
                    return mongoOperations.updateMulti(Query.query(Criteria.where("unpublishedAction.pageId").in(pageIds)), Update.update("policies", inheritedActionPolicies), NewAction.class)
                            .thenReturn(pageIds);
                })
                .flatMap(pageIds -> {
                    // If a page policy is updated, inherit to action collections
                    return mongoOperations.updateMulti(Query.query(Criteria.where("unpublishedCollection.pageId").in(pageIds)), Update.update("policies", inheritedActionPolicies), ActionCollection.class);
                })
                .then(Mono.just(1L));
    }

    /**
     * This function checks if the given resource is branchable i.e. can be connected to git
     * @param domain - Domain object to check
     * @return - true if the resource is branchable, false otherwise
     */
    private boolean isBranchableResouce(BaseDomain domain) {
        return StringUtils.isNotEmpty(getBranchResourceIdKey(domain));
    }

    /**
     * This function checks if the given resource is branched i.e. connected to git
     * @param domain
     * @return true if the resource is branched, false otherwise
     */
    private boolean isConnectedToGit(BaseDomain domain) {
        if(domain instanceof Application) {
            return ((Application) domain).getGitApplicationMetadata() != null && StringUtils.isNotEmpty(((Application) domain).getGitApplicationMetadata().getDefaultApplicationId());
        } else if (domain instanceof BranchAwareDomain) {
            BranchAwareDomain branchAwareDomain = (BranchAwareDomain) domain;
            return branchAwareDomain.getDefaultResources() != null && StringUtils.isNotEmpty(branchAwareDomain.getDefaultResources().getBranchName());
        } else {
            return false;
        }
    }

    /**
     * This function returns the field name that contains default resources id
     * i.e. field name that contains id of resource in default branch
     * @param domain - Domain object to check
     * @return - Field name that contains default resources id
     */
    private String getBranchResourceIdKey(BaseDomain domain) {
        if(domain instanceof Application) {
            return "gitApplicationMetadata.defaultApplicationId";
        } else if(domain instanceof NewPage) {
            return "defaultResources.pageId";
        } else if(domain instanceof NewAction) {
            return "defaultResources.actionId";
        } else if(domain instanceof ActionCollection) {
            return "defaultResources.collectionId";
        } else {
            return null;
        }
    }

    public Mono<Long> updatePolicies(String objectId, String permissionGroupId, List<AclPermission> added, List<AclPermission> removed, Class<?> clazz) {

        Query readQuery = new Query();
        readQuery.addCriteria(where("id").is(objectId));
        return mongoOperations.findOne(readQuery, clazz)
                .flatMap(result -> {
                    BaseDomain obj = (BaseDomain) result;
                    Set<Policy> policies = obj.getPolicies();
                    if (!CollectionUtils.isNullOrEmpty(added)) {
                        added.stream()
                                .filter(aclPermission -> isPermissionForEntity(aclPermission, clazz))
                                .forEach(aclPermission -> {
                                    Optional<Policy> interestedPolicyOptional = policies.stream().filter(policy -> policy.getPermission().equals(aclPermission.getValue()))
                                            .findFirst();

                                    if (interestedPolicyOptional.isPresent()) {
                                        interestedPolicyOptional.get().getPermissionGroups().add(permissionGroupId);
                                    } else {
                                        Policy policy = Policy.builder()
                                                .permission(aclPermission.getValue())
                                                .permissionGroups(Set.of(permissionGroupId))
                                                .build();

                                        policies.add(policy);
                                    }
                                });
                    }

                    if (!CollectionUtils.isNullOrEmpty(removed)) {
                        removed.stream()
                                .filter(aclPermission -> isPermissionForEntity(aclPermission, clazz))
                                .forEach(aclPermission -> {
                                    Optional<Policy> interestedPolicyOptional = policies.stream().filter(policy -> policy.getPermission().equals(aclPermission.getValue()))
                                            .findFirst();

                                    if (interestedPolicyOptional.isPresent()) {
                                        interestedPolicyOptional.get().getPermissionGroups().remove(permissionGroupId);
                                    }
                                    // Nothing to do if the permission itself isn't present.
                                });
                    }

                    obj.setPolicies(policies);

                    // Update across all the branches if it is a branchable object and connected to git
                    if(isBranchableResouce(obj) && isConnectedToGit(obj)) {

                        // If it is a application, then inherit policies from Application to invisible the pages
                        if(obj instanceof Application) {
                            Mono<UpdateResult> updateBranchedApplicationPolicies = mongoOperations.updateMulti(getBranchedApplicationQuery((Application) obj),
                                    Update.update("policies", policies), clazz);
                            Mono<Long> inheritPoliciesForInvisibleBranchedPages = inheritPoliciesForBranchedOnlyPagesFromApplication((Application) obj);
                            Mono<Long> inheritPoliciesFromApplicationForAllRelatedThemes = inheritPoliciesFromApplicationForAllRelatedThemes((Application) obj);
                            return Mono.when(updateBranchedApplicationPolicies, inheritPoliciesForInvisibleBranchedPages, inheritPoliciesFromApplicationForAllRelatedThemes)
                                    .thenReturn(1L);
                        // If it is a page, then inherit policies from Page to invisible the actions
                        } else if(obj instanceof NewPage) {
                            Mono<UpdateResult> updateBranchedPagePolicies = mongoOperations.updateMulti(getBranchedPageQuery((NewPage) obj), Update.update("policies", policies), clazz);
                            Mono<Long> inheritPoliciesForInvisibleActions = inheritPoliciesForBranchedOnlyActionsFromPage(((NewPage) obj));
                            Mono<Long> inheritPoliciesForInvisibleActionCollection = inheritPoliciesForBranchedOnlyActionCollectionsFromPage(((NewPage) obj));
                            return Mono.when(updateBranchedPagePolicies, inheritPoliciesForInvisibleActions, inheritPoliciesForInvisibleActionCollection)
                                    .thenReturn(1L);
                        } else if(obj instanceof NewAction) {
                            return mongoOperations.updateMulti(getBranchedActionQuery((NewAction) obj), Update.update("policies", policies), clazz)
                                    .then(Mono.just(1L));
                        } else if(obj instanceof ActionCollection) {
                            return mongoOperations.updateMulti(getBranchedActionCollectionQuery((ActionCollection) obj), Update.update("policies", policies), clazz)
                                    .then(Mono.just(1L));
                        }
                    }

                    return mongoOperations.save(obj)
                            .thenReturn(1L);
                });

        // TODO : Make the atomic update working instead of reading the document, and then manually updating the policies.

//        if (added.size() > 0) {
//            Query query = new Query();
//            query.addCriteria(where("id").is(objectId));
//
//            Update update = new Update();
//
//            Set<Criteria> criteriaList = new HashSet<>();
//
//            added.stream()
//                    .forEach(aclPermission -> {
//                        String permission = aclPermission.getValue();
//                        Criteria criteria1 = where("policies").elemMatch(where("permission").is(permission));
//                        criteriaList.add(criteria1);
//                    });
//
//            query.addCriteria(new Criteria().orOperator(criteriaList));
//
//            update.addToSet("policies.$.permissionGroups", permissionGroupId);
//
//            return mongoOperations.updateMulti(query, update, clazz)
//                    .map(result -> result.getModifiedCount());
//        }
//
//        if (removed.size() > 0) {
//            Query query = new Query();
//            query.addCriteria(where("id").is(objectId));
//
//            Update update = new Update();
//
//            Set<String> permissionsRemoved = removed.stream()
//                    .map(aclPermission -> aclPermission.getValue())
//                    .collect(Collectors.toSet());
//
//            query.addCriteria(
//                    Criteria.where("policies").elemMatch(Criteria.where("permission").in(permissionsRemoved))
//            );
//
//            update.pull("policies.$.permissionGroups", permissionGroupId);
//
//            return mongoOperations.updateFirst(query, update, clazz)
//                    .map(result -> result.getModifiedCount());
//        }
//
//        return Mono.just(0L);
    }

    private Query getBranchedApplicationQuery(Application application) {
        Criteria branchedApplicationCriteria = where(getBranchResourceIdKey(application))
                .is(application.getGitApplicationMetadata().getDefaultApplicationId());
        Criteria criteria = new Criteria().andOperator(branchedApplicationCriteria, notDeleted());
        return Query.query(criteria);
    }

    private Query getBranchedPageQuery(NewPage newPage) {
        Criteria branchedApplicationCriteria = where(getBranchResourceIdKey(newPage))
                .is(newPage.getDefaultResources().getPageId());
        Criteria criteria = new Criteria().andOperator(branchedApplicationCriteria, notDeleted());
        return Query.query(criteria);
    }

    private Query getBranchedActionQuery(NewAction newAction) {
        Criteria branchedApplicationCriteria = where(getBranchResourceIdKey(newAction))
                .is(newAction.getDefaultResources().getActionId());
        Criteria criteria = new Criteria().andOperator(branchedApplicationCriteria, notDeleted());
        return Query.query(criteria);
    }

    private Query getBranchedActionCollectionQuery(ActionCollection actionCollection) {
        Criteria branchedApplicationCriteria = where(getBranchResourceIdKey(actionCollection))
                .is(actionCollection.getDefaultResources().getCollectionId());
        Criteria criteria = new Criteria().andOperator(branchedApplicationCriteria, notDeleted());
        return Query.query(criteria);
    }
}
