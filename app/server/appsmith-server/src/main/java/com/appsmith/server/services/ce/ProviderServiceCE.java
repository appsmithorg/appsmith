/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.services.ce;

import com.appsmith.external.models.Provider;
import com.appsmith.server.services.CrudService;
import java.util.List;
import reactor.core.publisher.Mono;

public interface ProviderServiceCE extends CrudService<Provider, String> {

  public Mono<List<String>> getAllCategories();
}
