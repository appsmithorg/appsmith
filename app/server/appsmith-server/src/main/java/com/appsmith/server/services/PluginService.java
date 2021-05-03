package com.appsmith.server.services;

import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.InstallPluginRedisDTO;
import com.appsmith.server.dtos.PluginOrgDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface PluginService extends CrudService<Plugin, String> {

    Flux<Plugin> getDefaultPlugins();

    Mono<Organization> installPlugin(PluginOrgDTO plugin);

    Mono<Organization> uninstallPlugin(PluginOrgDTO plugin);

    Mono<Plugin> findByName(String name);

    Mono<Plugin> findByPackageName(String packageName);

    Mono<Plugin> findById(String id);

    Mono<String> getPluginName(Mono<Datasource> datasourceMono);

    Plugin redisInstallPlugin(InstallPluginRedisDTO installPluginRedisDTO);

    Mono<Map> getFormConfig(String pluginId);

    Mono<Map> loadPluginResource(String pluginId, String resourcePath);

    Mono<Map> getEditorConfigLabelMap(String pluginId);
}
