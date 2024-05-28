package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Set;

public interface CustomPluginRepositoryCE extends AppsmithRepository<Plugin> {
    Flux<Plugin> findDefaultPluginIcons();

    Flux<Plugin> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields);
}
