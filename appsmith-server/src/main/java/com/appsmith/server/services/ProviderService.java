package com.appsmith.server.services;

import com.appsmith.external.models.Provider;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ProviderService extends CrudService<Provider, String> {
    public Mono<List<String>> getAllCategories();
}
