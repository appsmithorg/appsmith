package com.appsmith.server.repositories;

import com.appsmith.server.domains.GitDeployKeys;

import java.util.Optional;

public interface GitDeployKeysRepository extends BaseRepository<GitDeployKeys, String> {
    Optional<GitDeployKeys> findByEmail(String email);
}
