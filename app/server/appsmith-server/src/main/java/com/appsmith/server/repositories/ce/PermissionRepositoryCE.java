package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Permission;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomPermissionRepository;

public interface PermissionRepositoryCE extends BaseRepository<Permission, String>, CustomPermissionRepository {

}
