package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;


public interface ExamplesOrganizationClonerCE {

    Mono<Organization> cloneExamplesOrganization();

    Mono<Organization> cloneOrganizationForUser(
            String templateOrganizationId,
            User user,
            Flux<Application> applicationFlux,
            Flux<Datasource> datasourceFlux
    );

    Mono<List<String>> cloneApplications(String toOrganizationId, Flux<Application> applicationFlux);

    Mono<List<String>> cloneApplications(
            String toOrganizationId,
            Flux<Application> applicationFlux,
            Flux<Datasource> datasourceFlux
    );

    Mono<Datasource> cloneDatasource(String datasourceId, String toOrganizationId);

    void makePristine(BaseDomain domain);

}
