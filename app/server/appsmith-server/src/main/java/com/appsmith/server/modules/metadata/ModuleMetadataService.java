package com.appsmith.server.modules.metadata;

import com.appsmith.server.domains.Module;
import reactor.core.publisher.Mono;

public interface ModuleMetadataService {
    Mono<Module> saveLastEditInformation(String moduleId);
}
