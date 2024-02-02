package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Config;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomConfigRepository;

import java.util.Optional;

public interface ConfigRepositoryCE extends BaseRepository<Config, String>, CustomConfigRepository {

    Optional<Config> findByName(String name);
}
