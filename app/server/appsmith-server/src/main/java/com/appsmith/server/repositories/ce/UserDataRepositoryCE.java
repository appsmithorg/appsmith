package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.projections.UserDataProfilePhotoProjection;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserDataRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserDataRepositoryCE extends BaseRepository<UserData, String>, CustomUserDataRepository {

    Optional<UserData> findByUserId(String userId, EntityManager entityManager);

    /**
     * Fetches a list of UserData objects from DB where userId matches with the provided a list of userId.
     * The returned UserData objects will have only the userId and photoAssetId fields.
     *
     * @param userIds List of userId strings
     * @return Flux of UserData with only the photoAssetId and userId fields
     */
    List<UserDataProfilePhotoProjection> findByUserIdIn(Collection<String> userIds, EntityManager entityManager);
}
