package com.appsmith.server.helpers.ce;

import com.appsmith.server.repositories.AppsmithRepository;

public interface RepositoryFactoryCE {
    AppsmithRepository<?> getRepositoryObjectFromEntityType(Object object);
}
