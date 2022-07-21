package com.appsmith.server.services.ce;

import com.appsmith.external.models.Provider;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ProviderServiceCE extends CrudService<Provider, String> {

    public Mono<List<String>> getAllCategories();

}
