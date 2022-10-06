package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomUserRepositoryCE;
import reactor.core.publisher.Flux;

public interface CustomUserRepository extends CustomUserRepositoryCE {

    Flux<String> getAllUserEmail(String defaultTenantId);

}
