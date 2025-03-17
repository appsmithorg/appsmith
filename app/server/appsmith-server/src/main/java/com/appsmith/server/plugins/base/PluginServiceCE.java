package com.appsmith.server.plugins.base;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InstallPluginRedisDTO;
import com.appsmith.server.dtos.PluginWorkspaceDTO;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface PluginServiceCE extends CrudService<Plugin, String> {

    Flux<Plugin> getInWorkspace(String workspaceId);

    Flux<Plugin> getDefaultPlugins();

    Flux<Plugin> getDefaultPluginIcons();

    Mono<Workspace> installPlugin(PluginWorkspaceDTO plugin);

    Flux<Workspace> installDefaultPlugins(List<Plugin> plugins);

    Mono<Plugin> findByName(String name);

    Mono<Plugin> findByPackageName(String packageName);

    Mono<Plugin> findById(String id);

    Mono<String> getPluginName(Mono<Datasource> datasourceMono);

    Plugin redisInstallPlugin(InstallPluginRedisDTO installPluginRedisDTO);

    Mono<Map<?, ?>> getFormConfig(String pluginId);

    Flux<Plugin> getAllRemotePlugins();

    Mono<Map<?, ?>> loadPluginResource(String pluginId, String resourcePath);

    Mono<Map> getEditorConfigLabelMap(String pluginId);

    Map loadEditorPluginResourceUqi(Plugin plugin);

    Flux<Plugin> saveAll(Iterable<Plugin> plugins);

    Flux<Plugin> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields);

    Mono<Map<String, Plugin>> findAllPluginsInWorkspace(String workspaceId);

    Flux<Plugin> getPluginsByType(PluginType pluginType);
}
