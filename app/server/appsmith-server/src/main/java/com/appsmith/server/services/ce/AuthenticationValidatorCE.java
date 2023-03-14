package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import reactor.core.publisher.Mono;


public interface AuthenticationValidatorCE {

    Mono<Datasource> validateAuthentication(Datasource datasource);

    /**
     *
     * @param datasource - The datasource which is about to be tested
     * @param environmentId - environmentId, Id of the environment on which the datasource is getting validated,
     *                         this variable is unused in the CE version of the code.
     * @return Mono<Datasource> - a validated datasource with updated refresh token if applicable
     */
    Mono<Datasource> validateAuthentication(Datasource datasource, String environmentId);

}
