package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.Modifying;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
public class CustomNewPageRepositoryCEImpl extends BaseAppsmithRepositoryImpl<NewPage>
        implements CustomNewPageRepositoryCE {

    private final MongoTemplate mongoTemplate;

    @Override
    public List<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(Bridge.equal(NewPage.Fields.applicationId, applicationId))
                .permission(aclPermission)
                .all();
    }

    @Override
    public List<NewPage> findByApplicationId(String applicationId, Optional<AclPermission> permission) {
        return queryBuilder()
                .criteria(Bridge.equal(NewPage.Fields.applicationId, applicationId))
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public List<NewPage> findByApplicationIdAndNonDeletedEditMode(String applicationId, AclPermission aclPermission) {
        BridgeQuery<NewPage> q = Bridge.<NewPage>equal(NewPage.Fields.applicationId, applicationId)
                // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
                // exist. To handle this, only fetch non-deleted pages
                .isNull(NewPage.Fields.unpublishedPage_deletedAt);
        return queryBuilder().criteria(q).permission(aclPermission).all();
    }

    @Override
    public Optional<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission aclPermission, Boolean viewMode) {
        // TODO(Shri): Why is this method's code different from that in `release` branch.

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
        final BridgeQuery<NewPage> q = getNameCriterion(name, viewMode);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            q.isNull(NewPage.Fields.unpublishedPage_deletedAt);
        }

        return queryBuilder().criteria(q).permission(aclPermission).one();
    }

    @Override
    public Optional<NewPage> findByNameAndApplicationIdAndViewMode(
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
    public List<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission aclPermission) {
        List<String> includedFields = List.of(
                FieldName.APPLICATION_ID,
                FieldName.DEFAULT_RESOURCES,
                NewPage.Fields.policies,
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
    public Optional<String> getNameByPageId(String pageId, boolean isPublishedName) {
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
    public Optional<NewPage> findPageByBranchNameAndDefaultPageId(
            String branchName, String defaultPageId, AclPermission permission) {
        final String defaultResources = NewPage.Fields.defaultResources;

        final BridgeQuery<NewPage> q =
                // defaultPageIdCriteria
                Bridge.<NewPage>equal(defaultResources + "." + FieldName.PAGE_ID, defaultPageId);

        if (branchName != null) {
            // branchCriteria
            q.equal(defaultResources + "." + FieldName.BRANCH_NAME, branchName);
        } else {
            q.isNull(defaultResources + "." + FieldName.BRANCH_NAME);
        }

        return queryBuilder().criteria(q).permission(permission).one();
    }

    @Override
    public List<NewPage> findSlugsByApplicationIds(List<String> applicationIds, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(Bridge.in(NewPage.Fields.applicationId, applicationIds))
                .fields(
                        NewPage.Fields.unpublishedPage_slug,
                        NewPage.Fields.unpublishedPage_customSlug,
                        NewPage.Fields.publishedPage_slug,
                        NewPage.Fields.publishedPage_customSlug,
                        NewPage.Fields.applicationId)
                .permission(aclPermission)
                .all();
    }

    @Override
    public Optional<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, Optional.ofNullable(permission));
    }

    @Override
    public Optional<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        final String defaultResources = BranchAwareDomain.Fields.defaultResources;

        // defaultAppIdCriteria
        final BridgeQuery<NewPage> q =
                Bridge.equal(defaultResources + "." + NewPage.Fields.applicationId, defaultApplicationId);

        if (gitSyncId != null) {
            // gitSyncIdCriteria
            q.equal(NewPage.Fields.gitSyncId, gitSyncId);
        } else {
            q.isNull(NewPage.Fields.gitSyncId);
        }

        return queryBuilder().criteria(q).permission(permission.orElse(null)).first();
    }

    @Override
    @Modifying
    @Transactional
    public Optional<Void> publishPages(Collection<String> pageIds, AclPermission permission) {
        int count = queryBuilder()
                .permission(permission)
                .criteria(Bridge.in(NewPage.Fields.id, pageIds))
                .updateAll(Bridge.update()
                        .setToValueFromField(NewPage.Fields.publishedPage, NewPage.Fields.unpublishedPage));

        return Optional.empty();
    }

    @Override
    public List<NewPage> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        return queryBuilder()
                .criteria(Bridge.in(FieldName.APPLICATION_ID, applicationIds))
                .fields(includeFields)
                .all();
    }
}
