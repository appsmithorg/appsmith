package com.appsmith.server.services;

import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.ce.PermissionGroupServiceCEImpl;
import org.springframework.stereotype.Service;

@Service
public class PermissionGroupServiceImpl extends PermissionGroupServiceCEImpl implements PermissionGroupService {

    public PermissionGroupServiceImpl(PermissionGroupRepository repository) {
        super(repository);
    }
}
