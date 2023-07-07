package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserGroup;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.Set;

@Repository
public interface UserGroupRepository extends BaseRepository<UserGroup, String>, CustomUserGroupRepository {

    Flux<UserGroup> findAllByUsersIn(Set<String> userIds);
}
