package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ConfigServiceCE {

    Mono<Config> getByName(String name);

    Mono<Config> getByNames(List<String> names);

    Mono<Config> updateByName(Config config);

    Mono<Config> save(Config config);

    Mono<Config> save(String name, Map<String, Object> config);

    Mono<String> getInstanceId();

    Mono<String> getTemplateWorkspaceId();

    Flux<Application> getTemplateApplications();

    Flux<Datasource> getTemplateDatasources();

    Mono<Void> delete(String name);

    Mono<Config> getByName(String name, AclPermission permission);

    Mono<Config> getByNameAsUser(String name, User user, AclPermission permission);
}
