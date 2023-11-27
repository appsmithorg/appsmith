package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserDataRepository;

import java.util.Optional;
import java.util.List;

public interface UserDataRepositoryCE extends BaseRepository<UserData, String>, CustomUserDataRepository {

    Optional<UserData> findByUserId(String userId);
}
