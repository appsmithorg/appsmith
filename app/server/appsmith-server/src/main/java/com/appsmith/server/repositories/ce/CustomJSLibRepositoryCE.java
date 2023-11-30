package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomJSLibRepositoryCE extends AppsmithRepository<CustomJSLib> {
    Mono<CustomJSLib> findUniqueCustomJsLib(CustomJSLib customJSLib);

    Flux<CustomJSLib> findCustomJsLibsInContext(
            Set<String> uidStrings, String referenceId, CreatorContextType contextType);
}
