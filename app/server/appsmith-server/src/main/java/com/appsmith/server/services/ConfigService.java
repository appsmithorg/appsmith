package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.Datasource;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ConfigService extends CrudService<Config, String> {
    Mono<Config> getByName(String name);

    Mono<Config> updateByName(String name, Config config);

    Mono<String> getInstanceId();

    Mono<String> getTemplateOrganizationId();

    Flux<Application> getTemplateApplications();

    Flux<Datasource> getTemplateDatasources();
}
