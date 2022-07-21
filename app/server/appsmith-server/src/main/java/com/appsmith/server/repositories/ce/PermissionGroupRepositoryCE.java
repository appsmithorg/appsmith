package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomPermissionGroupRepository;

public interface PermissionGroupRepositoryCE extends BaseRepository<PermissionGroup, String>, CustomPermissionGroupRepository {

}
