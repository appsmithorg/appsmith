package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.projections.IdOnly;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.constants.spans.ce.PageSpanCE.FETCH_PAGE_FROM_DB;
import static com.appsmith.external.helpers.StringUtils.dotted;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@RequiredArgsConstructor
public class CustomNewPageRepositoryCEImpl extends BaseAppsmithRepositoryImpl<NewPage>
        implements CustomNewPageRepositoryCE {

    private final MongoTemplate mongoTemplate;
    private final ObservationRegistry observationRegistry;

    @Override
    public Mono<NewPage> findById(String id, AclPermission permission, List<String> projectedFields) {
        return queryBuilder()
                .criteria(Bridge.equal(NewPage.Fields.id, id))
                .permission(permission)
                .fields(projectedFields)
                .one();
    }

    @Override
    public Flux<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(Bridge.equal(NewPage.Fields.applicationId, applicationId))
                .permission(aclPermission)
                .all();
    }

    @Override
    public Flux<NewPage> findByApplicationId(
            String applicationId, AclPermission aclPermission, List<String> includeFields) {
        return queryBuilder()
                .criteria(Bridge.equal(NewPage.Fields.applicationId, applicationId))
                .permission(aclPermission)
                .fields(includeFields)
                .all();
    }

    @Override
    public Flux<NewPage> findByApplicationIdAndNonDeletedEditMode(String applicationId, AclPermission aclPermission) {
        BridgeQuery<NewPage> q = Bridge.<NewPage>equal(NewPage.Fields.applicationId, applicationId)
                // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
                // exist. To handle this, only fetch non-deleted pages
                .isNull(NewPage.Fields.unpublishedPage_deletedAt);
        return queryBuilder().criteria(q).permission(aclPermission).all();
    }

    @Override
    public Mono<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission aclPermission, Boolean viewMode) {
        final String layoutsKey;

        final BridgeQuery<NewPage> q = Bridge.equal(NewPage.Fields.id, id);

        if (Boolean.TRUE.equals(viewMode)) {
            layoutsKey = NewPage.Fields.publishedPage_layouts;
        } else {
            layoutsKey = NewPage.Fields.unpublishedPage_layouts;

            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            q.isNull(NewPage.Fields.unpublishedPage_deletedAt);
        }

        q.equal(dotted(layoutsKey, Layout.Fields.id), layoutId);

        return queryBuilder().criteria(q).permission(aclPermission).one();
    }

    @Override
    public Mono<NewPage> findByNameAndViewMode(String name, AclPermission aclPermission, Boolean viewMode) {
        final BridgeQuery<NewPage> q = getNameCriterion(name, viewMode);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            q.isNull(NewPage.Fields.unpublishedPage_deletedAt);
        }

        return queryBuilder().criteria(q).permission(aclPermission).one();
    }

    @Override
    public Mono<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, AclPermission aclPermission, Boolean viewMode) {
        BridgeQuery<NewPage> q = getNameCriterion(name, viewMode).equal(NewPage.Fields.applicationId, applicationId);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            q.isNull(NewPage.Fields.unpublishedPage_deletedAt);
        }

        return queryBuilder().criteria(q).permission(aclPermission).one();
    }

    @Override
    public Flux<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission aclPermission) {
        List<String> includedFields = List.of(
                NewPage.Fields.applicationId,
                NewPage.Fields.baseId,
                NewPage.Fields.branchName,
                NewPage.Fields.policyMap,
                NewPage.Fields.unpublishedPage_name,
                NewPage.Fields.unpublishedPage_icon,
                NewPage.Fields.unpublishedPage_isHidden,
                NewPage.Fields.unpublishedPage_slug,
                NewPage.Fields.unpublishedPage_customSlug,
                NewPage.Fields.publishedPage_name,
                NewPage.Fields.publishedPage_icon,
                NewPage.Fields.publishedPage_isHidden,
                NewPage.Fields.publishedPage_slug,
                NewPage.Fields.publishedPage_customSlug);

        return this.queryBuilder()
                .criteria(Bridge.in(NewPage.Fields.id, ids))
                .fields(includedFields)
                .permission(aclPermission)
                .all();
    }

    private BridgeQuery<NewPage> getNameCriterion(String name, Boolean viewMode) {
        return Bridge.equal(
                Boolean.TRUE.equals(viewMode) ? NewPage.Fields.publishedPage_name : NewPage.Fields.unpublishedPage_name,
                name);
    }

    @Override
    public Mono<String> getNameByPageId(String pageId, boolean isPublishedName) {
        return queryBuilder().byId(pageId).one().map(p -> {
            PageDTO page = (isPublishedName ? p.getPublishedPage() : p.getUnpublishedPage());
            if (page != null) {
                return page.getName();
            }
            // If the page hasn't been published, just send the unpublished page name
            return p.getUnpublishedPage().getName();
        });
    }

    @Override
    public Mono<NewPage> findPageByBranchNameAndBasePageId(
            String branchName, String basePageId, AclPermission permission, List<String> projectedFieldNames) {

        final BridgeQuery<NewPage> q =
                // defaultPageIdCriteria
                Bridge.equal(NewPage.Fields.baseId, basePageId);

        if (branchName != null) {
            // branchCriteria
            q.equal(NewPage.Fields.branchName, branchName);
        } else {
            q.isNull(NewPage.Fields.branchName);
        }

        return queryBuilder()
                .criteria(q)
                .permission(permission)
                .fields(projectedFieldNames)
                .one()
                .name(FETCH_PAGE_FROM_DB)
                .tap(Micrometer.observation(observationRegistry));
    }

    public Mono<String> findBranchedPageId(String branchName, String defaultPageId, AclPermission permission) {
        final BridgeQuery<NewPage> q =
                // defaultPageIdCriteria
                Bridge.equal(NewPage.Fields.baseId, defaultPageId);
        q.equal(NewPage.Fields.branchName, branchName);

        return queryBuilder()
                .criteria(q)
                .permission(permission)
                .one(IdOnly.class)
                .map(IdOnly::id);
    }

    @Override
    public Flux<NewPage> findAllByApplicationIds(List<String> applicationIds, List<String> includedFields) {
        return queryBuilder()
                .criteria(Bridge.in(NewPage.Fields.applicationId, applicationIds))
                .fields(includedFields)
                .all();
    }

    @Override
    public Mono<Void> publishPages(Collection<String> pageIds, AclPermission permission) {
        Criteria applicationIdCriteria = where(NewPage.Fields.id).in(pageIds);

        Mono<Set<String>> permissionGroupsMono = getCurrentUserPermissionGroupsIfRequired(permission);

        return permissionGroupsMono.flatMap(permissionGroups -> {
            return Mono.fromCallable(() -> {
                        AggregationOperation matchAggregationWithPermission = null;
                        if (permission == null) {
                            matchAggregationWithPermission =
                                    Aggregation.match(new Criteria().andOperator(notDeleted()));
                        } else {
                            matchAggregationWithPermission = Aggregation.match(
                                    new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission)));
                        }
                        AggregationOperation matchAggregation = Aggregation.match(applicationIdCriteria);
                        AggregationOperation wholeProjection = Aggregation.project(NewPage.class);
                        AggregationOperation addFieldsOperation = Aggregation.addFields()
                                .addField(NewPage.Fields.publishedPage)
                                .withValueOf(Fields.field(NewPage.Fields.unpublishedPage))
                                .build();
                        Aggregation combinedAggregation = Aggregation.newAggregation(
                                matchAggregation, matchAggregationWithPermission, wholeProjection, addFieldsOperation);
                        return mongoTemplate.aggregate(combinedAggregation, NewPage.class, NewPage.class);
                    })
                    .subscribeOn(Schedulers.boundedElastic())
                    .flatMap(updatedResults -> bulkUpdate(updatedResults.getMappedResults()));
        });
    }

    @Override
    public Flux<NewPage> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        return queryBuilder()
                .criteria(Bridge.in(FieldName.APPLICATION_ID, applicationIds))
                .fields(includeFields)
                .all();
    }

    @Override
    public Mono<Integer> updateDependencyMap(String pageId, Map<String, List<String>> dependencyMap) {
        final BridgeQuery<NewPage> q = Bridge.equal(NewPage.Fields.id, pageId);

        BridgeUpdate update = Bridge.update();
        update.set(NewPage.Fields.unpublishedPage_dependencyMap, dependencyMap);
        return queryBuilder().criteria(q).updateFirst(update);
    }

    @Override
    public Flux<NewPage> findByApplicationId(String applicationId) {
        final BridgeQuery<NewPage> q = Bridge.equal(NewPage.Fields.applicationId, applicationId);
        return queryBuilder().criteria(q).all();
    }

    @Override
    public Mono<Long> countByDeletedAtNull() {
        final BridgeQuery<NewPage> q = Bridge.notExists(NewPage.Fields.deletedAt);
        return queryBuilder().criteria(q).count();
    }
}
