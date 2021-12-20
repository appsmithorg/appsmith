package com.appsmith.server.solutions.ce;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PluginService;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * This class represents a scheduled task that pings cloud services for any updates in available plugins.
 */
@Slf4j
@RequiredArgsConstructor
public class PluginScheduledTaskCEImpl implements PluginScheduledTaskCE {

    private final ConfigService configService;
    private final PluginService pluginService;
    private final CloudServicesConfig cloudServicesConfig;

    private Instant lastUpdatedAt = null;


    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(initialDelay = 30 * 1000 /* 30 seconds */, fixedRate = 2 * 60 * 60 * 1000 /* two hours */)
    public void updateRemotePlugins() {
        // Get all plugins on this instance
        final Mono<Map<PluginIdentifier, Plugin>> availablePluginsMono =
                pluginService
                        .getAllRemotePlugins()
                        .collect(Collectors.toMap(
                                plugin -> new PluginIdentifier(plugin.getPluginName(), plugin.getVersion()),
                                plugin -> plugin
                        ));

        final Mono<Map<PluginIdentifier, Plugin>> newPluginsMono = getRemotePlugins();

        Mono.zip(availablePluginsMono, newPluginsMono)
                .flatMap(tuple -> {
                    final Map<PluginIdentifier, Plugin> availablePlugins = tuple.getT1();
                    final Map<PluginIdentifier, Plugin> newPlugins = tuple.getT2();
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
                    // then make sure to install to organizations in case the default installation flag changed
                    final Mono<List<Organization>> updatedPluginsOrganizationFlux = pluginService
                            .saveAll(updatablePlugins)
                            .filter(Plugin::getDefaultInstall)
                            .collectList()
                            .flatMapMany(pluginService::installDefaultPlugins)
                            .collectList();

                    // Create plugin,
                    // then install to all organizations if default installation is turned on
                    final Mono<List<Organization>> organizationFlux =
                            Flux.fromIterable(insertablePlugins)
                                    .flatMap(pluginService::create)
                                    .filter(Plugin::getDefaultInstall)
                                    .collectList()
                                    .flatMapMany(pluginService::installDefaultPlugins)
                                    .collectList();

                    return updatedPluginsOrganizationFlux
                            .zipWith(organizationFlux)
                            .then();
                })
                .subscribeOn(Schedulers.single())
                .subscribe();
    }

    private Mono<Map<PluginIdentifier, Plugin>> getRemotePlugins() {

        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (StringUtils.isEmpty(baseUrl)) {
            return Mono.empty();
        }

        return configService.getInstanceId()
                .flatMap(instanceId -> WebClient
                        .create(
                                baseUrl + "/api/v1/plugins?instanceId=" + instanceId
                                        + "&lastUpdatedAt=" + lastUpdatedAt)
                        .get()
                        .exchange()
                        .flatMap(response -> response.bodyToMono(new ParameterizedTypeReference<ResponseDTO<List<Plugin>>>() {
                        }))
                        .map(ResponseDTO::getData)
                        .map(plugins -> {
                            // Set new updated time
                            this.lastUpdatedAt = Instant.now();

                            // Parse plugins into map for easier manipulation
                            return plugins
                                    .stream()
                                    .collect(Collectors.toMap(
                                            plugin -> new PluginIdentifier(plugin.getPluginName(), plugin.getVersion()),
                                            plugin -> plugin
                                    ));
                        }));
    }

    @AllArgsConstructor
    @Getter
    @EqualsAndHashCode
    private static class PluginIdentifier {
        String pluginName;
        String version;
    }
}
