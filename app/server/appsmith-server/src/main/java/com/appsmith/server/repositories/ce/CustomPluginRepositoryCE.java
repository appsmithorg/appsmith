package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;

public interface CustomPluginRepositoryCE extends AppsmithRepository<Plugin> {
    Flux<Plugin> findDefaultPluginIcons();
}
