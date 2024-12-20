package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.projections.IdOnly;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final ObservationRegistry observationRegistry;

    @Override
    public Optional<NewPage> findById(
            String id, AclPermission permission, User currentUser, List<String> projectedFields) {
        return queryBuilder()
                .criteria(Bridge.equal(NewPage.Fields.id, id))
                .permission(permission, currentUser)
                .fields(projectedFields)
                .one();
    }

    @Override
    public List<NewPage> findByApplicationId(String applicationId, AclPermission permission, User currentUser) {
        return queryBuilder()
                .criteria(Bridge.equal(NewPage.Fields.applicationId, applicationId))
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public List<NewPage> findByApplicationId(
            String applicationId, AclPermission permission, User currentUser, List<String> includeFields) {
        return queryBuilder()
                .criteria(Bridge.equal(NewPage.Fields.applicationId, applicationId))
                .permission(permission, currentUser)
                .fields(includeFields)
                .all();
    }

    @Override
    public List<NewPage> findByApplicationIdAndNonDeletedEditMode(
            String applicationId, AclPermission permission, User currentUser) {
        BridgeQuery<NewPage> q = Bridge.<NewPage>equal(NewPage.Fields.applicationId, applicationId)
                // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
                // exist. To handle this, only fetch non-deleted pages
                .isNull(NewPage.Fields.unpublishedPage_deletedAt);
        return queryBuilder().criteria(q).permission(permission, currentUser).all();
    }

    @Override
    public Optional<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission permission, User currentUser, Boolean viewMode) {
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
                .permission(permission, currentUser)
                .one();
    }

    @Override
    public Optional<NewPage> findByNameAndViewMode(
            String name, AclPermission permission, User currentUser, Boolean viewMode) {
        final BridgeQuery<NewPage> q = getNameCriterion(name, viewMode);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            q.isNull(NewPage.Fields.unpublishedPage_deletedAt);
        }

        return queryBuilder().criteria(q).permission(permission, currentUser).one();
    }

    @Override
    public Optional<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, Boolean viewMode, AclPermission permission, User currentUser) {
        BridgeQuery<NewPage> q = getNameCriterion(name, viewMode).equal(NewPage.Fields.applicationId, applicationId);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case a page has been deleted in edit mode, but still exists in deployed mode, NewPage object would
            // exist. To handle this, only fetch non-deleted pages
            q.isNull(NewPage.Fields.unpublishedPage_deletedAt);
        }

        return queryBuilder().criteria(q).permission(permission, currentUser).one();
    }

    @Override
    public List<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission permission, User currentUser) {
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
                .permission(permission, currentUser)
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
    public Optional<NewPage> findPageByBranchNameAndBasePageId(
            String branchName,
            String basePageId,
            AclPermission permission,
            User currentUser,
            List<String> projectedFieldNames) {

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
                .permission(permission, currentUser)
                .fields(projectedFieldNames)
                .one()
        /*.name(FETCH_PAGE_FROM_DB)
        .tap(Micrometer.observation(observationRegistry))*/ ;
    }

    public Optional<String> findBranchedPageId(
            String branchName, String defaultPageId, AclPermission permission, User currentUser) {
        final BridgeQuery<NewPage> q =
                // defaultPageIdCriteria
                Bridge.equal(NewPage.Fields.baseId, defaultPageId);
        q.equal(NewPage.Fields.branchName, branchName);

        return queryBuilder()
                .criteria(q)
                .permission(permission, currentUser)
                .one(IdOnly.class)
                .map(IdOnly::id);
    }

    @Override
    public List<NewPage> findAllByApplicationIds(List<String> applicationIds, List<String> includedFields) {
        return queryBuilder()
                .criteria(Bridge.in(NewPage.Fields.applicationId, applicationIds))
                .fields(includedFields)
                .all();
    }

    @Override
    @Modifying
    @Transactional
    public Optional<Void> publishPages(Collection<String> pageIds, AclPermission permission, User currentUser) {
        int count = queryBuilder()
                .permission(permission, currentUser)
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

    @Override
    @Transactional
    @Modifying
    public Optional<Integer> updateDependencyMap(String pageId, Map<String, List<String>> dependencyMap) {
        final BridgeQuery<NewPage> q = Bridge.equal(NewPage.Fields.id, pageId);

        BridgeUpdate update = Bridge.update();
        update.set(NewPage.Fields.unpublishedPage_dependencyMap, dependencyMap);
        return Optional.of(queryBuilder().criteria(q).updateFirst(update));
    }

    @Override
    public List<NewPage> findByApplicationId(String applicationId) {
        final BridgeQuery<NewPage> q = Bridge.equal(NewPage.Fields.applicationId, applicationId);
        return queryBuilder().criteria(q).all();
    }

    @Override
    public Optional<Long> countByDeletedAtNull() {
        final BridgeQuery<NewPage> q = Bridge.notExists(NewPage.Fields.deletedAt);
        return queryBuilder().criteria(q).count();
    }
}
