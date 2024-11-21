package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.AppsmithRepository;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Set;

public interface CustomPluginRepositoryCE extends AppsmithRepository<Plugin> {
    List<Plugin> findDefaultPluginIcons(EntityManager entityManager);

    List<Plugin> findAllByIdsWithoutPermission(
            Set<String> ids, List<String> includeFields, EntityManager entityManager);
}
