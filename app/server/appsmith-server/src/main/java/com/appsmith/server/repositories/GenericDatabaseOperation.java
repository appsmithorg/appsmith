package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.helpers.CollectionUtils;

import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

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
        } else {
            return domain.getDefaultResources() != null && StringUtils.isNotEmpty(domain.getDefaultResources().getBranchName());
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
                            return mongoOperations.updateMulti(Query.query(Criteria.where(getBranchResourceIdKey(obj)).is(((Application)obj).getGitApplicationMetadata().getDefaultApplicationId())), Update.update("policies", policies), clazz)
                                    .then(inheritPoliciesForBranchedOnlyPagesFromApplication((Application) obj))
                                    .thenReturn(1L);
                        // If it is a page, then inherit policies from Page to invisible the actions
                        } else if(obj instanceof NewPage) {
                            return mongoOperations.updateMulti(Query.query(Criteria.where(getBranchResourceIdKey(obj)).is(obj.getDefaultResources().getPageId())), Update.update("policies", policies), clazz)
                                    .then(inheritPoliciesForBranchedOnlyActionsFromPage(((NewPage) obj)))
                                    .then(inheritPoliciesForBranchedOnlyActionCollectionsFromPage(((NewPage) obj)))
                                    .thenReturn(1L);
                        } else if(obj instanceof NewAction) {
                            return mongoOperations.updateMulti(Query.query(Criteria.where(getBranchResourceIdKey(obj)).is(obj.getDefaultResources().getActionId())), Update.update("policies", policies), clazz)
                                    .then(Mono.just(1L));
                        } else if(obj instanceof ActionCollection) {
                            return mongoOperations.updateMulti(Query.query(Criteria.where(getBranchResourceIdKey(obj)).is(obj.getDefaultResources().getCollectionId())), Update.update("policies", policies), clazz)
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
}
