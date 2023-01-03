package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomJSLibRepositoryCE extends AppsmithRepository<CustomJSLib> {
    Mono<CustomJSLib> findByUidString(String uidString);
}