package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.GitDeployKeys;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Mono;

public interface GitDeployKeysRepositoryCE extends BaseRepository<GitDeployKeys, String> {
    Mono<GitDeployKeys> findByEmail(String email);
}
