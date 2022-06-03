package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserGroupRepository;

public interface UserGroupRepositoryCE extends BaseRepository<UserGroup, String>, CustomUserGroupRepository {
}
