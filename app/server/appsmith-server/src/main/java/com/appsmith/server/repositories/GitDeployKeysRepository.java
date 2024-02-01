package com.appsmith.server.repositories;

import com.appsmith.server.domains.GitDeployKeys;

import java.util.Optional;
import java.util.List;

public interface GitDeployKeysRepository extends BaseRepository<GitDeployKeys, String> {
    Optional<GitDeployKeys> findByEmail(String email);
}
