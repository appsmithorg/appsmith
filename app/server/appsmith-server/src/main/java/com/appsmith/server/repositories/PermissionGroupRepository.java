package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.PermissionGroupRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionGroupRepository extends PermissionGroupRepositoryCE, CustomPermissionGroupRepository {}
