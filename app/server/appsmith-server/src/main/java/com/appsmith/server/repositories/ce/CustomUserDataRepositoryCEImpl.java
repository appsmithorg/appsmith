package com.appsmith.server.repositories.ce;


import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.google.common.collect.Lists;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

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
    public Mono<UpdateResult> saveReleaseNotesViewedVersion(String userId, String version) {
        return mongoOperations.upsert(
                query(where("userId").is(userId)),
                Update.update("releaseNotesViewedVersion", version)
                        .setOnInsert("userId", userId),
                UserData.class);
    }

    @Override
    public Mono<UpdateResult> removeIdFromRecentlyUsedList(
            String userId, String workspaceId, List<String> applicationIds) {
        Update update = new Update().pull("recentlyUsedWorkspaceIds", workspaceId);
        if (!CollectionUtils.isEmpty(applicationIds)) {
            update = update.pullAll("recentlyUsedAppIds", applicationIds.toArray());
        }
        return mongoOperations.updateFirst(
                query(where("userId").is(userId)), update, UserData.class);
    }

    /**
     * Fetches a list of UserData objects from DB where userId matches with the provided a list of userId.
     * The returned UserData objects will have only the userId and photoAssetId fields.
     *
     * @param userId List of userId as a list
     * @return Flux of UserData with only the photoAssetId and userId fields
     */
    @Override
    public Flux<UserData> findPhotoAssetsByUserIds(Iterable<String> userId) {
        // need to convert from Iterable to ArrayList because the "in" method of criteria takes a collection as input
        Criteria criteria = where("userId").in(Lists.newArrayList(userId));
        List<String> fieldsToInclude =
                List.of("profilePhotoAssetId", "userId");
        return queryAll(List.of(criteria), Optional.of(fieldsToInclude), Optional.empty(), Optional.empty());
    }

    @Override
    public Mono<String> fetchMostRecentlyUsedWorkspaceId(String userId) {
        final Query query = query(where("userId").is(userId));

        query.fields().include("recentlyUsedWorkspaceIds");

        return mongoOperations.findOne(query, UserData.class).map(userData -> {
            final List<String> recentlyUsedWorkspaceIds = userData.getRecentlyUsedWorkspaceIds();
            return CollectionUtils.isEmpty(recentlyUsedWorkspaceIds) ? "" : recentlyUsedWorkspaceIds.get(0);
        });
    }
}
