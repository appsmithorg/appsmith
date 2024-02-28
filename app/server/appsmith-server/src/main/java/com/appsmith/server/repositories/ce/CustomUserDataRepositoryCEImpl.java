package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.BasicDBObject;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.helpers.ce.bridge.Bridge.bridge;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

public class CustomUserDataRepositoryCEImpl extends BaseAppsmithRepositoryImpl<UserData>
        implements CustomUserDataRepositoryCE {

    public CustomUserDataRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<Void> saveReleaseNotesViewedVersion(String userId, String version) {
        return mongoOperations
                .upsert(
                        query(where(UserData.Fields.userId).is(userId)),
                        Update.update(UserData.Fields.releaseNotesViewedVersion, version)
                                .setOnInsert(UserData.Fields.userId, userId),
                        UserData.class)
                .then();
    }

    @Override
    public Mono<Void> removeIdFromRecentlyUsedList(String userId, String workspaceId, List<String> applicationIds) {
        Update update = new Update().pull(UserData.Fields.recentlyUsedWorkspaceIds, workspaceId);
        if (!CollectionUtils.isEmpty(applicationIds)) {
            update = update.pullAll(UserData.Fields.recentlyUsedAppIds, applicationIds.toArray());
        }
        update.pull(
                UserData.Fields.recentlyUsedEntityIds,
                new BasicDBObject(RecentlyUsedEntityDTO.Fields.workspaceId, workspaceId));
        return queryBuilder()
                .criteria(bridge().equal(UserData.Fields.userId, userId))
                .updateFirst(update)
                .then();
    }

    @Override
    public Mono<String> fetchMostRecentlyUsedWorkspaceId(String userId) {
        return queryBuilder()
                .criteria(bridge().equal(UserData.Fields.userId, userId))
                .fields(UserData.Fields.recentlyUsedEntityIds)
                .one()
                .map(userData -> {
                    final List<RecentlyUsedEntityDTO> recentlyUsedWorkspaceIds = userData.getRecentlyUsedEntityIds();
                    return CollectionUtils.isEmpty(recentlyUsedWorkspaceIds)
                            ? ""
                            : recentlyUsedWorkspaceIds.get(0).getWorkspaceId();
                });
    }
}
