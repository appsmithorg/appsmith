package com.appsmith.server.services.ce;

import com.appsmith.server.repositories.PermissionGroupRepository;


public class PermissionGroupServiceCEImpl implements PermissionGroupServiceCE {

    private final PermissionGroupRepository repository;

    public PermissionGroupServiceCEImpl(PermissionGroupRepository repository) {
        this.repository = repository;
    }
}
