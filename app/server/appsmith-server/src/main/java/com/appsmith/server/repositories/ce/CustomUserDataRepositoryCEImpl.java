package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.projections.UserRecentlyUsedEntitiesProjection;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaUpdate;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Optional;

public class CustomUserDataRepositoryCEImpl extends BaseAppsmithRepositoryImpl<UserData>
        implements CustomUserDataRepositoryCE {

    @Override
    @Transactional
    @Modifying
    public int saveReleaseNotesViewedVersion(String userId, String version) {
        return queryBuilder()
                .criteria(Bridge.equal(UserData.Fields.userId, userId))
                .updateFirst(Bridge.update().set(UserData.Fields.releaseNotesViewedVersion, version));
    }

    @Override
    @Transactional
    @Modifying
    public Optional<Void> removeEntitiesFromRecentlyUsedList(String userId, String workspaceId) {
        /* Move to this piece of code, instead of direct entityManager use.
        BridgeUpdate update = new BridgeUpdate();
        RecentlyUsedEntityDTO recentlyUsedEntityDTO = new RecentlyUsedEntityDTO();
        recentlyUsedEntityDTO.setWorkspaceId(workspaceId);
        update.pull(UserData.Fields.recentlyUsedEntityIds, recentlyUsedEntityDTO);
        return queryBuilder()
                .criteria(Bridge.equal(UserData.Fields.userId, userId))
                .updateFirst(update)
                .then();
        */

        var entityManager = getEntityManager();
        final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        final CriteriaUpdate<UserData> cu = cb.createCriteriaUpdate(UserData.class);
        final Root<UserData> root = cu.getRoot();

        final Path<Expression<?>> recentlyUsedEntityIdsField = root.get(UserData.Fields.recentlyUsedEntityIds);
        cu.set(
                recentlyUsedEntityIdsField,
                cb.function(
                        "jsonb_path_query_array",
                        Object.class,
                        cb.function("coalesce", Object.class, recentlyUsedEntityIdsField, cb.literal("[]")),
                        cb.literal("$[*] ? (@.workspaceId != \"" + workspaceId + "\")")));

        cu.where(cb.equal(root.get(UserData.Fields.userId), userId));

        final int count = entityManager.createQuery(cu).executeUpdate();
        return Optional.empty();
    }

    @Override
    public Optional<String> fetchMostRecentlyUsedWorkspaceId(String userId) {
        return queryBuilder()
                .criteria(Bridge.equal(UserData.Fields.userId, userId))
                .one(UserRecentlyUsedEntitiesProjection.class)
                .map(userData -> {
                    final List<RecentlyUsedEntityDTO> recentlyUsedWorkspaceIds = userData.getRecentlyUsedEntityIds();
                    return CollectionUtils.isEmpty(recentlyUsedWorkspaceIds)
                            ? ""
                            : recentlyUsedWorkspaceIds.get(0).getWorkspaceId();
                });
    }

    @Modifying
    @Transactional
    @Override
    public int updateByUserId(String userId, UserData userData) {
        return queryBuilder()
                .criteria(Bridge.equal(UserData.Fields.userId, userId))
                .updateFirst(userData);
    }
}
