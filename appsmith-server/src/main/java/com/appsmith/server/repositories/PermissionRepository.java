package com.appsmith.server.repositories;

import com.appsmith.server.domains.Permission;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends BaseRepository<Permission, String>, CustomPermissionRepository {
}
