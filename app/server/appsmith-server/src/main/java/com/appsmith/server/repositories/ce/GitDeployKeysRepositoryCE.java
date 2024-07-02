package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.GitDeployKeys;
import com.appsmith.server.repositories.BaseRepository;

import java.util.Optional;

public interface GitDeployKeysRepositoryCE extends BaseRepository<GitDeployKeys, String> {
    Optional<GitDeployKeys> findByEmail(String email);
}
