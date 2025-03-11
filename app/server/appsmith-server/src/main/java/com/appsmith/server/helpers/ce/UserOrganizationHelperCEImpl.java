package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import static com.appsmith.server.constants.FieldName.DEFAULT;

@Slf4j
public class UserOrganizationHelperCEImpl implements UserOrganizationHelperCE {

    private final OrganizationRepository organizationRepository;
    private final InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper;

    public UserOrganizationHelperCEImpl(
            OrganizationRepository organizationRepository,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper) {
        this.organizationRepository = organizationRepository;
        this.inMemoryCacheableRepositoryHelper = inMemoryCacheableRepositoryHelper;
    }

    @Override
    public Mono<String> getCurrentUserOrganizationId() {
        return getDefaultOrganizationId();
    }

    private Mono<String> getDefaultOrganizationId() {
        // If the value exists in cache, return it as is
        if (StringUtils.hasLength(inMemoryCacheableRepositoryHelper.getDefaultOrganizationId())) {
            return Mono.just(inMemoryCacheableRepositoryHelper.getDefaultOrganizationId());
        }
        return organizationRepository
                .findBySlug(DEFAULT)
                .map(Organization::getId)
                .map(organizationId -> {
                    // Set the cache value before returning.
                    inMemoryCacheableRepositoryHelper.setDefaultOrganizationId(organizationId);
                    return organizationId;
                });
    }
}
