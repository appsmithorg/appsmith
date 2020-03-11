package com.appsmith.server.services;

import com.appsmith.external.models.Provider;
import reactor.core.publisher.Flux;

public interface ProviderService extends CrudService<Provider, String> {
    public Flux<String> getAllCategories();
}
