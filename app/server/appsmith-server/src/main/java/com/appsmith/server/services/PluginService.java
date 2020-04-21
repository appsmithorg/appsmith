package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.InstallPluginRedisDTO;
import com.appsmith.server.dtos.PluginOrgDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.InputStream;

public interface PluginService extends CrudService<Plugin, String> {

    Flux<Plugin> getDefaultPlugins();

    Mono<Organization> installPlugin(PluginOrgDTO plugin);

    Mono<Organization> uninstallPlugin(PluginOrgDTO plugin);

    Mono<Plugin> findByName(String name);

    Mono<Plugin> findByPackageName(String packageName);

    Mono<Plugin> findById(String id);

    Plugin redisInstallPlugin(InstallPluginRedisDTO installPluginRedisDTO);

    Mono<Object> getFormConfig(String pluginId);

    Mono<InputStream> getPluginResource(String pluginId, String resourcePath);
}
