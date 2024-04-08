package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.projections.UserDataProfilePhotoProjection;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserDataRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

public interface UserDataRepositoryCE extends BaseRepository<UserData, String>, CustomUserDataRepository {

    Mono<UserData> findByUserId(String userId);

    /**
     * Fetches a list of UserData objects from DB where userId matches with the provided a list of userId.
     * The returned UserData objects will have only the userId and photoAssetId fields.
     *
     * @param userIds Collection of userId strings
     * @return Flux of UserData with only the photoAssetId and userId fields
     */
    Flux<UserDataProfilePhotoProjection> findByUserIdIn(Collection<String> userIds);
}
