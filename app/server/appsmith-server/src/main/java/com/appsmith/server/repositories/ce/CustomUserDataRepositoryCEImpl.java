package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.QUserData;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomUserDataRepositoryCEImpl extends BaseAppsmithRepositoryImpl<UserData>
        implements CustomUserDataRepositoryCE {

    public CustomUserDataRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Optional<UpdateResult> saveReleaseNotesViewedVersion(String userId, String version) {
        return Optional.empty(); /*
        return mongoOperations.upsert(
                query(where("userId").is(userId)),
                Update.update("releaseNotesViewedVersion", version).setOnInsert("userId", userId),
                UserData.class);*/
    }

    @Override
    public Optional<UpdateResult> removeIdFromRecentlyUsedList(
            String userId, String workspaceId, List<String> applicationIds) {
        return Optional.empty(); /*
        Update update = new Update().pull("recentlyUsedWorkspaceIds", workspaceId);
        if (!CollectionUtils.isEmpty(applicationIds)) {
            update = update.pullAll("recentlyUsedAppIds", applicationIds.toArray());
        }
        update.pull(
                fieldName(QUserData.userData.recentlyUsedEntityIds),
                new BasicDBObject(fieldName(QRecentlyUsedEntityDTO.recentlyUsedEntityDTO.workspaceId), workspaceId));
        return mongoOperations.updateFirst(
                query(where(fieldName(QUserData.userData.userId)).is(userId)), update, UserData.class);*/
    }

    @Override
    public List<UserData> findPhotoAssetsByUserIds(Iterable<String> userId) {
        // need to convert from Iterable to ArrayList because the "in" method of criteria takes a collection as input
        Criteria criteria = where(fieldName(QUserData.userData.userId)).in(Lists.newArrayList(userId));
        return queryAll()
                .criteria(criteria)
                .fields(fieldName(QUserData.userData.profilePhotoAssetId), fieldName(QUserData.userData.userId))
                .submit();
    }

    @Override
    public Optional<String> fetchMostRecentlyUsedWorkspaceId(String userId) {
        return Optional.empty(); /*
        final Query query = query(where(fieldName(QUserData.userData.userId)).is(userId));

        query.fields().include(fieldName(QUserData.userData.recentlyUsedEntityIds));

        return mongoOperations.findOne(query, UserData.class).map(userData -> {
            final List<RecentlyUsedEntityDTO> recentlyUsedWorkspaceIds = userData.getRecentlyUsedEntityIds();
            return CollectionUtils.isEmpty(recentlyUsedWorkspaceIds)
                    ? ""
                    : recentlyUsedWorkspaceIds.get(0).getWorkspaceId();
        });*/
    }
}
