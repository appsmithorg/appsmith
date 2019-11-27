package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.InstallPluginRedisDTO;
import com.appsmith.server.dtos.PluginOrgDTO;
import reactor.core.publisher.Mono;

public interface PluginService extends CrudService<Plugin, String> {

    Mono<Organization> installPlugin(PluginOrgDTO plugin);

    Mono<Organization> uninstallPlugin(PluginOrgDTO plugin);

    Mono<Plugin> findByName(String name);

    Mono<Plugin> findById(String id);

    Plugin redisInstallPlugin(InstallPluginRedisDTO installPluginRedisDTO);
}
