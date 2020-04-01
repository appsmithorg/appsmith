package com.appsmith.server.repositories;

import com.appsmith.external.models.Provider;
import reactor.core.publisher.Flux;

public interface ProviderRepository extends BaseRepository<Provider, String>, CustomProviderRepository {
    Flux<Provider> findByName(String name);
}
