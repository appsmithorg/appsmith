package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface CustomJSLibRepositoryCE extends AppsmithRepository<CustomJSLib> {
    Mono<CustomJSLib> findUniqueCustomJsLib(CustomJSLib customJSLib);

    List<CustomJSLib> findCustomJsLibsInContext(Set<CustomJSLibContextDTO> customJSLibContextDTOS);
}
