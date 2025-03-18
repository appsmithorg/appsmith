package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.UserOrganizationHelperCEImpl;
import com.appsmith.server.repositories.OrganizationRepository;
import org.springframework.stereotype.Component;

@Component
public class UserOrganizationHelperImpl extends UserOrganizationHelperCEImpl implements UserOrganizationHelper {
    public UserOrganizationHelperImpl(
            OrganizationRepository organizationRepository,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper) {
        super(organizationRepository, inMemoryCacheableRepositoryHelper);
    }
}
