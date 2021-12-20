package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import reactor.core.publisher.Mono;


public interface AuthenticationValidatorCE {

    Mono<Datasource> validateAuthentication(Datasource datasource);

}
