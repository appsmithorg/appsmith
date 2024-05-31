package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.projections.UserRecentlyUsedEntitiesProjection;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.util.List;

public class CustomUserDataRepositoryCEImpl extends BaseAppsmithRepositoryImpl<UserData>
        implements CustomUserDataRepositoryCE {

    @Override
    public Mono<Integer> saveReleaseNotesViewedVersion(String userId, String version) {
        return queryBuilder()
                .criteria(Bridge.equal(UserData.Fields.userId, userId))
                .updateFirst(Bridge.update().set(UserData.Fields.releaseNotesViewedVersion, version));
    }

    @Override
    public Mono<Void> removeEntitiesFromRecentlyUsedList(String userId, String workspaceId) {
        BridgeUpdate update = new BridgeUpdate();
        RecentlyUsedEntityDTO recentlyUsedEntityDTO = new RecentlyUsedEntityDTO();
        recentlyUsedEntityDTO.setWorkspaceId(workspaceId);
        update.pull(UserData.Fields.recentlyUsedEntityIds, recentlyUsedEntityDTO);
        return queryBuilder()
                .criteria(Bridge.equal(UserData.Fields.userId, userId))
                .updateFirst(update)
                .then();
    }

    @Override
    public Mono<String> fetchMostRecentlyUsedWorkspaceId(String userId) {
        return queryBuilder()
                .criteria(Bridge.equal(UserData.Fields.userId, userId))
                .one(UserRecentlyUsedEntitiesProjection.class)
                .map(userData -> {
                    final List<RecentlyUsedEntityDTO> recentlyUsedWorkspaceIds = userData.recentlyUsedEntityIds();
                    return CollectionUtils.isEmpty(recentlyUsedWorkspaceIds)
                            ? ""
                            : recentlyUsedWorkspaceIds.get(0).getWorkspaceId();
                });
    }
}
