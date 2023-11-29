package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Set;
import java.util.Optional;

public interface CustomPluginRepositoryCE extends AppsmithRepository<Plugin> {
    List<Plugin> findDefaultPluginIcons();

    List<Plugin> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields);
}
