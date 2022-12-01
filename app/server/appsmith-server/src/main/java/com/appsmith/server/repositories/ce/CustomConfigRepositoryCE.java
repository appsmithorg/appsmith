package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomConfigRepositoryCE extends AppsmithRepository<Config> {
    Mono<Config> findByName(String name, AclPermission permission);

    Mono<Config> findByNameAsUser(String name, User user, AclPermission permission);
}
