package com.appsmith.server.repositories;

import org.springframework.stereotype.Repository;

import com.appsmith.server.domains.UserGroup;

@Repository
public interface UserGroupRepository extends BaseRepository<UserGroup, String>, CustomUserGroupRepository {
    
}
