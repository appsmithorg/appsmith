package com.appsmith.server.helpers.ce;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.ce.PluginScheduledTaskCEImpl;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
public class PluginScheduledTaskUtilsCEImpl implements PluginScheduledTaskUtilsCE {

    private final ConfigService configService;
    private final CloudServicesConfig cloudServicesConfig;
    protected final PluginService pluginService;

    private Mono<Map<PluginScheduledTaskCEImpl.PluginIdentifier, Plugin>> getRemotePlugins(Instant lastUpdatedAt) {
        return this.fetchPluginsFromCS(lastUpdatedAt, "/api/v1/plugins");
    }

    protected Mono<Map<PluginScheduledTaskCEImpl.PluginIdentifier, Plugin>> fetchPluginsFromCS(
            Instant lastUpdatedAt, String csApiPath) {
        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (!StringUtils.hasLength(baseUrl)) {
            return Mono.empty();
        }
        String lastUpdatedAtParam = lastUpdatedAt != null ? "&lastUpdatedAt=" + lastUpdatedAt : "";
        return configService.getInstanceId().flatMap(instanceId -> WebClientUtils.create(
                        baseUrl + csApiPath + "?instanceId=" + instanceId + lastUpdatedAtParam)
                .get()
                .exchangeToMono(clientResponse ->
                        clientResponse.bodyToMono(new ParameterizedTypeReference<ResponseDTO<List<Plugin>>>() {}))
                .map(listResponseDTO -> {
                    if (listResponseDTO.getData() == null) {
                        log.error(
                                "Error fetching plugins from cloud-services. Error: {}",
                                listResponseDTO.getErrorDisplay());
                        return Collections.<Plugin>emptyList();
                    }
                    return listResponseDTO.getData();
                })
                .map(plugins -> {

                    // Parse plugins into map for easier manipulation
                    return plugins.stream()
                            .collect(Collectors.toMap(
                                    plugin -> new PluginScheduledTaskCEImpl.PluginIdentifier(
                                            plugin.getPluginName(), plugin.getVersion()),
                                    plugin -> plugin));
                }));
    }

    protected Mono<Void> updatePlugins(
            Mono<Map<PluginScheduledTaskCEImpl.PluginIdentifier, Plugin>> availablePluginsMono,
            Mono<Map<PluginScheduledTaskCEImpl.PluginIdentifier, Plugin>> newPluginsMono) {
        return Mono.zip(availablePluginsMono, newPluginsMono).flatMap(tuple -> {
            final Map<PluginScheduledTaskCEImpl.PluginIdentifier, Plugin> availablePlugins = tuple.getT1();
            final Map<PluginScheduledTaskCEImpl.PluginIdentifier, Plugin> newPlugins = tuple.getT2();
            final List<Plugin> updatablePlugins = new ArrayList<>();
            final List<Plugin> insertablePlugins = new ArrayList<>();
            newPlugins.forEach((k, v) -> {
                if (availablePlugins.containsKey(k)) {
                    v.setId(availablePlugins.get(k).getId());
                    updatablePlugins.add(v);
                } else {
                    v.setId(null);
                    insertablePlugins.add(v);
                }
            });

            // Save new data for this plugin,
            // then make sure to install to workspaces in case the default installation flag changed
            final Mono<List<Workspace>> updatedPluginsWorkspaceFlux = pluginService
                    .saveAll(updatablePlugins)
                    .filter(Plugin::getDefaultInstall)
                    .collectList()
                    .flatMapMany(pluginService::installDefaultPlugins)
                    .collectList();

            // Create plugin,
            // then install to all workspaces if default installation is turned on
            final Mono<List<Workspace>> workspaceFlux = Flux.fromIterable(insertablePlugins)
                    .flatMap(pluginService::create)
                    .filter(Plugin::getDefaultInstall)
                    .collectList()
                    .flatMapMany(pluginService::installDefaultPlugins)
                    .collectList();

            return updatedPluginsWorkspaceFlux.zipWith(workspaceFlux).then();
        });
    }

    @Override
    public Mono<Void> fetchAndUpdateRemotePlugins(Instant lastUpdatedAt) {
        // Get all plugins on this instance
        final Mono<Map<PluginScheduledTaskCEImpl.PluginIdentifier, Plugin>> availablePluginsMono = pluginService
                .getAllRemotePlugins()
                .collect(Collectors.toMap(
                        plugin -> new PluginScheduledTaskCEImpl.PluginIdentifier(
                                plugin.getPluginName(), plugin.getVersion()),
                        plugin -> plugin));

        final Mono<Map<PluginScheduledTaskCEImpl.PluginIdentifier, Plugin>> newPluginsMono =
                getRemotePlugins(lastUpdatedAt);

        return updatePlugins(availablePluginsMono, newPluginsMono);
    }
}
