package com.appsmith.server.services;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.InstallPluginRedisDTO;
import com.appsmith.server.dtos.PluginOrgDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface PluginService extends CrudService<Plugin, String> {

    Flux<Plugin> getDefaultPlugins();

    Mono<Organization> installPlugin(PluginOrgDTO plugin);

    Flux<Organization> installDefaultPlugins(List<Plugin> plugins);

    Mono<Organization> uninstallPlugin(PluginOrgDTO plugin);

    Mono<Plugin> findByName(String name);

    Mono<Plugin> findByPackageName(String packageName);

    Mono<Plugin> findById(String id);

    Mono<String> getPluginName(Mono<Datasource> datasourceMono);

    Plugin redisInstallPlugin(InstallPluginRedisDTO installPluginRedisDTO);

    Mono<Map> getFormConfig(String pluginId);

    Flux<Plugin> getAllRemotePlugins();

    Mono<Map> loadPluginResource(String pluginId, String resourcePath);

    Mono<Map> getEditorConfigLabelMap(String pluginId);

    Map loadEditorPluginResourceUqi(Plugin plugin);

    Flux<Plugin> saveAll(Iterable<Plugin> plugins);
}
