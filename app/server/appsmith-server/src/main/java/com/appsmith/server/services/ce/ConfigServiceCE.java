package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface ConfigServiceCE {

    Mono<Config> getByName(String name);

    Mono<Config> updateByName(Config config);

    Mono<Config> save(Config config);

    Mono<Config> save(String name, Map<String, Object> config);

    Mono<String> getInstanceId();

    Mono<Void> delete(String name);

    Mono<Config> getByName(String name, AclPermission permission);

    Mono<Config> getByNameAsUser(String name, User user, AclPermission permission);
}
