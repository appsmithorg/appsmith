package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface ConfigServiceCE {

    Mono<Config> getByName(String name);

    Mono<Config> updateByName(Config config);

    Mono<Config> save(Config config);

    Mono<Config> save(String name, Map<String, Object> config);

    Mono<String> getInstanceId();

    Mono<String> getTemplateOrganizationId();

    Flux<Application> getTemplateApplications();

    Flux<Datasource> getTemplateDatasources();

}
