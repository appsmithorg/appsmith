package com.appsmith.server.repositories;

import com.appsmith.server.domains.Config;
import com.appsmith.server.repositories.ce.ConfigRepositoryCE;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface ConfigRepository extends ConfigRepositoryCE, CustomConfigRepository {
    Flux<Config> findAllByNameIn(List<String> names);
}
