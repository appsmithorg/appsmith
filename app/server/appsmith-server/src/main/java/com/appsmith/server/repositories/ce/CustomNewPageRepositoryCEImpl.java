package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.QBranchAwareDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.QLayout;
import com.appsmith.server.domains.QNewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.WriteModel;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomNewPageRepositoryCEImpl extends BaseAppsmithRepositoryImpl<NewPage>
        implements CustomNewPageRepositoryCE {

    private final MongoTemplate mongoTemplate;

    public CustomNewPageRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            MongoTemplate mongoTemplate) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Flux<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission) {
        Criteria applicationIdCriteria =
                where(fieldName(QNewPage.newPage.applicationId)).is(applicationId);
        return queryAll(List.of(applicationIdCriteria), aclPermission);
    }

    @Override
    public Flux<NewPage> findByApplicationId(String applicationId, Optional<AclPermission> permission) {
        Criteria applicationIdCriteria =
                where(fieldName(QNewPage.newPage.applicationId)).is(applicationId);
        return queryAll(List.of(applicationIdCriteria), permission);
    }

    @Override
    public Flux<NewPage> findByApplicationIdAndNonDeletedEditMode(String applicationId, AclPermission aclPermission) {
        Criteria applicationIdCriteria =
                where(fieldName(QNewPage.newPage.applicationId)).is(applicationId);
        // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would exist.
        // To handle this, only fetch non-deleted pages
        Criteria activeEditModeCriteria = where(fieldName(QNewPage.newPage.unpublishedPage) + "."
                        + fieldName(QNewPage.newPage.unpublishedPage.deletedAt))
                .is(null);
        return queryAll(List.of(applicationIdCriteria, activeEditModeCriteria), aclPermission);
    }

    @Override
    public Mono<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission aclPermission, Boolean viewMode) {
        String layoutsIdKey;
        String layoutsKey;

        List<Criteria> criteria = new ArrayList<>();
        Criteria idCriterion = getIdCriteria(id);
        criteria.add(idCriterion);

        if (Boolean.TRUE.equals(viewMode)) {
            layoutsKey =
                    fieldName(QNewPage.newPage.publishedPage) + "." + fieldName(QNewPage.newPage.publishedPage.layouts);
        } else {
            layoutsKey = fieldName(QNewPage.newPage.unpublishedPage) + "."
                    + fieldName(QNewPage.newPage.unpublishedPage.layouts);

            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            Criteria deletedCriterion = where(fieldName(QNewPage.newPage.unpublishedPage) + "."
                            + fieldName(QNewPage.newPage.unpublishedPage.deletedAt))
                    .is(null);
            criteria.add(deletedCriterion);
        }
        layoutsIdKey = layoutsKey + "." + fieldName(QLayout.layout.id);

        Criteria layoutCriterion = where(layoutsIdKey).is(layoutId);
        criteria.add(layoutCriterion);

        return queryOne(criteria, aclPermission);
    }

    @Override
    public Mono<NewPage> findByNameAndViewMode(String name, AclPermission aclPermission, Boolean viewMode) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria nameCriterion = getNameCriterion(name, viewMode);
        criteria.add(nameCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            Criteria deletedCriterion = where(fieldName(QNewPage.newPage.unpublishedPage) + "."
                            + fieldName(QNewPage.newPage.unpublishedPage.deletedAt))
                    .is(null);
            criteria.add(deletedCriterion);
        }

        return queryOne(criteria, aclPermission);
    }

    @Override
    public Mono<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, AclPermission aclPermission, Boolean viewMode) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria nameCriterion = getNameCriterion(name, viewMode);
        criteria.add(nameCriterion);

        Criteria applicationIdCriterion =
                where(fieldName(QNewPage.newPage.applicationId)).is(applicationId);
        criteria.add(applicationIdCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            Criteria deletedCriteria = where(fieldName(QNewPage.newPage.unpublishedPage) + "."
                            + fieldName(QNewPage.newPage.unpublishedPage.deletedAt))
                    .is(null);
            criteria.add(deletedCriteria);
        }

        return queryOne(criteria, aclPermission);
    }

    @Override
    public Flux<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission aclPermission) {
        ArrayList<String> includedFields = new ArrayList<>(List.of(
                FieldName.APPLICATION_ID,
                FieldName.DEFAULT_RESOURCES,
                fieldName(QNewPage.newPage.policies),
                (fieldName(QNewPage.newPage.unpublishedPage) + "." + fieldName(QNewPage.newPage.unpublishedPage.name)),
                (fieldName(QNewPage.newPage.unpublishedPage) + "." + fieldName(QNewPage.newPage.unpublishedPage.icon)),
                (fieldName(QNewPage.newPage.unpublishedPage) + "."
                        + fieldName(QNewPage.newPage.unpublishedPage.isHidden)),
                (fieldName(QNewPage.newPage.unpublishedPage) + "." + fieldName(QNewPage.newPage.unpublishedPage.slug)),
                (fieldName(QNewPage.newPage.unpublishedPage) + "."
                        + fieldName(QNewPage.newPage.unpublishedPage.customSlug)),
                (fieldName(QNewPage.newPage.publishedPage) + "." + fieldName(QNewPage.newPage.unpublishedPage.name)),
                (fieldName(QNewPage.newPage.publishedPage) + "." + fieldName(QNewPage.newPage.unpublishedPage.icon)),
                (fieldName(QNewPage.newPage.publishedPage) + "."
                        + fieldName(QNewPage.newPage.unpublishedPage.isHidden)),
                (fieldName(QNewPage.newPage.publishedPage) + "." + fieldName(QNewPage.newPage.unpublishedPage.slug)),
                (fieldName(QNewPage.newPage.publishedPage) + "."
                        + fieldName(QNewPage.newPage.unpublishedPage.customSlug))));

        Criteria idsCriterion = where("id").in(ids);

        return this.queryAll(new ArrayList<>(List.of(idsCriterion)), includedFields, aclPermission, null);
    }

    private Criteria getNameCriterion(String name, Boolean viewMode) {
        String nameKey;

        if (Boolean.TRUE.equals(viewMode)) {
            nameKey = fieldName(QNewPage.newPage.publishedPage) + "." + fieldName(QNewPage.newPage.publishedPage.name);
        } else {
            nameKey = fieldName(QNewPage.newPage.unpublishedPage) + "."
                    + fieldName(QNewPage.newPage.unpublishedPage.name);
        }
        return where(nameKey).is(name);
    }

    @Override
    public Mono<String> getNameByPageId(String pageId, boolean isPublishedName) {
        return mongoOperations
                .query(NewPage.class)
                .matching(Query.query(
                        Criteria.where(fieldName(QNewPage.newPage.id)).is(pageId)))
                .one()
                .map(p -> {
                    PageDTO page = (isPublishedName ? p.getPublishedPage() : p.getUnpublishedPage());
                    if (page != null) {
                        return page.getName();
                    }
                    // If the page hasn't been published, just send the unpublished page name
                    return p.getUnpublishedPage().getName();
                });
    }

    @Override
    public Mono<NewPage> findPageByBranchNameAndDefaultPageId(
            String branchName, String defaultPageId, AclPermission permission) {
        final String defaultResources = fieldName(QNewPage.newPage.defaultResources);
        Criteria defaultPageIdCriteria =
                where(defaultResources + "." + FieldName.PAGE_ID).is(defaultPageId);
        Criteria branchCriteria =
                where(defaultResources + "." + FieldName.BRANCH_NAME).is(branchName);
        return queryOne(List.of(defaultPageIdCriteria, branchCriteria), permission);
    }

    @Override
    public Flux<NewPage> findSlugsByApplicationIds(List<String> applicationIds, AclPermission aclPermission) {
        Criteria applicationIdCriteria =
                where(fieldName(QNewPage.newPage.applicationId)).in(applicationIds);
        String unpublishedSlugFieldPath = String.format(
                "%s.%s", fieldName(QNewPage.newPage.unpublishedPage), fieldName(QNewPage.newPage.unpublishedPage.slug));
        String unpublishedCustomSlugFieldPath = String.format(
                "%s.%s",
                fieldName(QNewPage.newPage.unpublishedPage), fieldName(QNewPage.newPage.unpublishedPage.customSlug));
        String publishedSlugFieldPath = String.format(
                "%s.%s", fieldName(QNewPage.newPage.publishedPage), fieldName(QNewPage.newPage.publishedPage.slug));
        String publishedCustomSlugFieldPath = String.format(
                "%s.%s",
                fieldName(QNewPage.newPage.publishedPage), fieldName(QNewPage.newPage.publishedPage.customSlug));
        String applicationIdFieldPath = fieldName(QNewPage.newPage.applicationId);

        return queryAll(
                List.of(applicationIdCriteria),
                List.of(
                        unpublishedSlugFieldPath,
                        unpublishedCustomSlugFieldPath,
                        publishedSlugFieldPath,
                        publishedCustomSlugFieldPath,
                        applicationIdFieldPath),
                aclPermission,
                null);
    }

    @Override
    public Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, Optional.ofNullable(permission));
    }

    @Override
    public Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        final String defaultResources = fieldName(QBranchAwareDomain.branchAwareDomain.defaultResources);
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        Criteria gitSyncIdCriteria = where(FieldName.GIT_SYNC_ID).is(gitSyncId);
        return queryFirst(List.of(defaultAppIdCriteria, gitSyncIdCriteria), permission);
    }

    @Override
    public Mono<List<BulkWriteResult>> publishPages(Collection<String> pageIds, AclPermission permission) {
        Criteria applicationIdCriteria = where(fieldName(QNewPage.newPage.id)).in(pageIds);

        Mono<Set<String>> permissionGroupsMono =
                getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(permission));

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
                                .addField(fieldName(QNewPage.newPage.publishedPage))
                                .withValueOf(Fields.field(fieldName(QNewPage.newPage.unpublishedPage)))
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
    public Mono<List<BulkWriteResult>> bulkUpdate(List<NewPage> newPages) {
        if (CollectionUtils.isEmpty(newPages)) {
            return Mono.just(Collections.emptyList());
        }

        // convert the list of new pages to a list of DBObjects
        List<WriteModel<Document>> dbObjects = newPages.stream()
                .map(newPage -> {
                    assert newPage.getId() != null;
                    Document document = new Document();
                    mongoOperations.getConverter().write(newPage, document);
                    document.remove("_id");
                    return (WriteModel<Document>) new UpdateOneModel<Document>(
                            new Document("_id", new ObjectId(newPage.getId())), new Document("$set", document));
                })
                .collect(Collectors.toList());

        return mongoOperations
                .getCollection(mongoOperations.getCollectionName(NewPage.class))
                .flatMapMany(documentMongoCollection -> documentMongoCollection.bulkWrite(dbObjects))
                .collectList();
    }

    @Override
    public Flux<NewPage> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        Criteria applicationCriteria = Criteria.where(FieldName.APPLICATION_ID).in(applicationIds);
        return queryAll(List.of(applicationCriteria), includeFields, null, null, NO_RECORD_LIMIT);
    }
}
