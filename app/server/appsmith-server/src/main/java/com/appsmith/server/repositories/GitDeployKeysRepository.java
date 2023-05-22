/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories;

import com.appsmith.server.domains.GitDeployKeys;
import reactor.core.publisher.Mono;

public interface GitDeployKeysRepository extends BaseRepository<GitDeployKeys, String> {

  Mono<GitDeployKeys> findByEmail(String email);
}
