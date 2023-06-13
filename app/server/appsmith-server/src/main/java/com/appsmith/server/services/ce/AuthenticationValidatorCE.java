/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorage;
import reactor.core.publisher.Mono;

public interface AuthenticationValidatorCE {

    Mono<DatasourceStorage> validateAuthentication(DatasourceStorage datasourceStorage);
}
