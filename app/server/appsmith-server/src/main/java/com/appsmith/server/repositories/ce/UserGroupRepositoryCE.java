package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserGroupRepository;
import reactor.core.publisher.Flux;

import java.util.Set;

public interface UserGroupRepositoryCE extends BaseRepository<UserGroup, String>, CustomUserGroupRepository {

    Flux<UserGroup> findAllById(Set<String> ids);

}
