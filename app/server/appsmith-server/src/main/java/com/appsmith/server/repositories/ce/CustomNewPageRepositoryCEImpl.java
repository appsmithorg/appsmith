package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.QNewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.appsmith.server.helpers.ce.bridge.Bridge.bridge;
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
    public List<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(bridge().equal("applicationId", applicationId))
                .permission(aclPermission)
                .all();
    }

    @Override
    public List<NewPage> findByApplicationId(String applicationId, Optional<AclPermission> permission) {
        return queryBuilder()
                .criteria(bridge().equal("applicationId", applicationId))
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public List<NewPage> findByApplicationIdAndNonDeletedEditMode(String applicationId, AclPermission aclPermission) {
        throw new ex.Marker("findByApplicationIdAndNonDeletedEditMode"); /*
        Criteria applicationIdCriteria =
                where("applicationId").is(applicationId);
        // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would exist.
        // To handle this, only fetch non-deleted pages
        Criteria activeEditModeCriteria = where("unpublishedPage" + "."
                        + "deletedAt")
                .is(null);
        return queryBuilder()
                .criteria(applicationIdCriteria, activeEditModeCriteria)
                .permission(aclPermission)
                .all(); //*/
    }

    @Override
    public Optional<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission aclPermission, Boolean viewMode) {
        final boolean isViewMode = Boolean.TRUE.equals(viewMode);

        final Specification<BaseDomain> specFn = (root, cq, cb) -> {
            final List<Predicate> predicates = new ArrayList<>();

            try {
                predicates.add(cb.isTrue(cb.function(
                        "jsonb_path_exists",
                        Boolean.class,
                        root.get((isViewMode ? "publishedPage" : "unpublishedPage")),
                        cb.literal("$.layouts[*] ? (@.id == $id)"),
                        cb.literal(new ObjectMapper().writeValueAsString(Map.of("id", layoutId))))));
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }

            if (!isViewMode) {
                // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
                // exist. To handle this, only fetch non-deleted pages
                predicates.add(cb.isNull(cb.function(
                        "jsonb_extract_path", String.class, root.get("unpublishedPage"), cb.literal("deletedAt"))));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return queryBuilder()
                .byId(id)
                .criteria(specFn)
                .permission(aclPermission)
                .one();
    }

    @Override
    public Optional<NewPage> findByNameAndViewMode(String name, AclPermission aclPermission, Boolean viewMode) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria nameCriterion = getNameCriterion(name, viewMode);
        criteria.add(nameCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            Criteria deletedCriterion =
                    where("unpublishedPage" + "." + "deletedAt").is(null);
            criteria.add(deletedCriterion);
        }

        return queryBuilder().criteria(criteria).permission(aclPermission).one();
    }

    @Override
    public Optional<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, AclPermission aclPermission, Boolean viewMode) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria nameCriterion = getNameCriterion(name, viewMode);
        criteria.add(nameCriterion);

        Criteria applicationIdCriterion = where("applicationId").is(applicationId);
        criteria.add(applicationIdCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            Criteria deletedCriteria =
                    where("unpublishedPage" + "." + "deletedAt").is(null);
            criteria.add(deletedCriteria);
        }

        return queryBuilder().criteria(criteria).permission(aclPermission).one();
    }

    @Override
    public List<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission aclPermission) {
        throw new ex.Marker("an emptyList"); /*
        ArrayList<String> includedFields = new ArrayList<>(List.of(
                FieldName.APPLICATION_ID,
                FieldName.DEFAULT_RESOURCES,
                "policies",
                ("unpublishedPage" + "." + "name"),
                ("unpublishedPage" + "." + "icon"),
                ("unpublishedPage" + "."
                        + "isHidden"),
                ("unpublishedPage" + "." + "slug"),
                ("unpublishedPage" + "."
                        + "customSlug"),
                ("publishedPage" + "." + "name"),
                ("publishedPage" + "." + "icon"),
                ("publishedPage" + "."
                        + "isHidden"),
                ("publishedPage" + "." + "slug"),
                ("publishedPage" + "."
                        + "customSlug")));

        Criteria idsCriterion = where("id").in(ids);

        return this.queryBuilder()
                .criteria(idsCriterion)
                .fields(includedFields)
                .permission(aclPermission)
                .all(); //*/
    }

    private Criteria getNameCriterion(String name, Boolean viewMode) {
        String nameKey;

        if (Boolean.TRUE.equals(viewMode)) {
            nameKey = "publishedPage" + "." + "name";
        } else {
            nameKey = "unpublishedPage" + "." + "name";
        }
        return where(nameKey).is(name);
    }

    @Override
    public Optional<String> getNameByPageId(String pageId, boolean isPublishedName) {
        return mongoOperations
                .query(NewPage.class)
                .matching(Query.query(Criteria.where("id").is(pageId)))
                .one()
                .map(p -> {
                    PageDTO page = (isPublishedName ? p.getPublishedPage() : p.getUnpublishedPage());
                    if (page != null) {
                        return page.getName();
                    }
                    // If the page hasn't been published, just send the unpublished page name
                    return p.getUnpublishedPage().getName();
                })
                .blockOptional();
    }

    @Override
    public Optional<NewPage> findPageByBranchNameAndDefaultPageId(
            String branchName, String defaultPageId, AclPermission permission) {
        final String defaultResources = "defaultResources";
        Criteria defaultPageIdCriteria =
                where(defaultResources + "." + FieldName.PAGE_ID).is(defaultPageId);
        Criteria branchCriteria =
                where(defaultResources + "." + FieldName.BRANCH_NAME).is(branchName);
        return queryBuilder()
                .criteria(defaultPageIdCriteria, branchCriteria)
                .permission(permission)
                .one();
    }

    @Override
    public List<NewPage> findSlugsByApplicationIds(List<String> applicationIds, AclPermission aclPermission) {
        throw new ex.Marker("an emptyList"); /*
        Criteria applicationIdCriteria =
                where("applicationId").in(applicationIds);
        String unpublishedSlugFieldPath = String.format(
                "%s.%s", "unpublishedPage", "slug");
        String unpublishedCustomSlugFieldPath = String.format(
                "%s.%s",
                "unpublishedPage", "customSlug");
        String publishedSlugFieldPath = String.format(
                "%s.%s", "publishedPage", "slug");
        String publishedCustomSlugFieldPath = String.format(
                "%s.%s",
                "publishedPage", "customSlug");
        String applicationIdFieldPath = "applicationId";

        return queryBuilder()
                .criteria(applicationIdCriteria)
                .fields(
                        unpublishedSlugFieldPath,
                        unpublishedCustomSlugFieldPath,
                        publishedSlugFieldPath,
                        publishedCustomSlugFieldPath,
                        applicationIdFieldPath)
                .permission(aclPermission)
                .all(); //*/
    }

    @Override
    public Optional<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, Optional.ofNullable(permission));
    }

    @Override
    public Optional<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        final String defaultResources = "defaultResources";
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        Criteria gitSyncIdCriteria = where(FieldName.GIT_SYNC_ID).is(gitSyncId);
        return queryBuilder()
                .criteria(defaultAppIdCriteria, gitSyncIdCriteria)
                .permission(permission.orElse(null))
                .first();
    }

    @Override
    @Modifying
    @Transactional
    public Optional<Void> publishPages(Collection<String> pageIds, AclPermission permission) {
        int count = queryBuilder()
                .permission(permission)
                .criteria(bridge().in(fieldName(QNewPage.newPage.id), pageIds))
                .updateAll(Bridge.update().set(QNewPage.newPage.publishedPage, QNewPage.newPage.unpublishedPage)); // */

        return Optional.empty();
    }

    @Override
    public List<NewPage> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        return queryBuilder()
                .criteria(bridge().in(FieldName.APPLICATION_ID, applicationIds))
                .fields(includeFields)
                .all();
    }
}
