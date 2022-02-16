package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Provider;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomProviderRepository;
import reactor.core.publisher.Flux;

public interface ProviderRepositoryCE extends BaseRepository<Provider, String>, CustomProviderRepository {
    Flux<Provider> findByName(String name);
}
