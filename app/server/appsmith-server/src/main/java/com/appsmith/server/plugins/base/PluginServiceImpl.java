package com.appsmith.server.plugins.base;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.PluginDTO;
import com.appsmith.server.dtos.RemotePluginWorkspaceDTO;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class PluginServiceImpl extends PluginServiceCEImpl implements PluginService {

    private final AirgapInstanceConfig airgapInstanceConfig;

    // Stores list of plugins that are out of scope for multiple environments today
    Set<String> oosPluginIds = new HashSet<>();
    private final Set<String> oosPluginsPackageNames = Set.of("saas-plugin", "google-sheets-plugin");

    public PluginServiceImpl(
            Validator validator,
            PluginRepository repository,
            AnalyticsService analyticsService,
            WorkspaceService workspaceService,
            PluginManager pluginManager,
            ReactiveRedisTemplate<String, String> reactiveTemplate,
            ChannelTopic topic,
            ObjectMapper objectMapper,
            AirgapInstanceConfig airgapInstanceConfig) {
        super(
                validator,
                repository,
                analyticsService,
                workspaceService,
                pluginManager,
                reactiveTemplate,
                topic,
                objectMapper);

        this.airgapInstanceConfig = airgapInstanceConfig;
    }

    /**
     * This method is only available to EE for now, since the interface to install a plugin selectively is exposed via
     * an Appsmith app only in the SaaS Integration Creator app
     *
     * @param plugin The DTO that contains plugin information along with workspace id
     * @return A Void Mono on success
     */
    @Override
    public Mono<Void> installRemotePlugin(RemotePluginWorkspaceDTO plugin) {
        final Plugin remotePlugin = plugin.getPlugin();
        remotePlugin.setId(null);
        // Look for an existing definition of this plugin
        final Mono<WorkspacePlugin> workspacePluginMono = this.findUniqueRemotePlugin(remotePlugin)
                .switchIfEmpty(Mono.just(remotePlugin))
                .flatMap(retrievedPlugin -> {
                    remotePlugin.setId(retrievedPlugin.getId());
                    // To ensure that the latest plugin configurations are immediately available for use,
                    // lets also save the plugin now instead of waiting for the scheduled sync job
                    return repository.save(remotePlugin);
                })
                .map(savedPlugin -> new WorkspacePlugin(savedPlugin.getId(), WorkspacePluginStatus.ACTIVATED));

        // Look for the workspace that the plugin needs to be installed in
        final Mono<Workspace> workspaceMono = Mono.justOrEmpty(plugin.getOrganizationId())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID)))
                .flatMap(this.workspaceService::retrieveById)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION_ID, plugin.getOrganizationId())));
        return workspacePluginMono
                .zipWith(workspaceMono)
                .flatMap(tuple -> {
                    final Workspace workspace = tuple.getT2();
                    final WorkspacePlugin workspacePlugin = tuple.getT1();
                    workspace.getPlugins().add(workspacePlugin);
                    return this.workspaceService.save(workspace);
                })
                .then();
    }

    private Mono<Plugin> findUniqueRemotePlugin(Plugin remotePlugin) {
        return this.repository.findByPluginNameAndPackageNameAndVersion(
                remotePlugin.getPluginName(), remotePlugin.getPackageName(), remotePlugin.getVersion());
    }

    public Mono<List<PluginDTO>> getAllPluginIconLocation() {
        return this.repository.findAll().map(this::makePluginDTO).collectList();
    }

    public Mono<PluginDTO> getPluginIconLocation(String pluginId) {
        return this.repository.findById(pluginId).map(this::makePluginDTO);
    }

    @Override
    public Mono<Boolean> isOosPluginForME(String pluginId) {
        if (pluginId == null) {
            return Mono.just(false);
        }

        Mono<Set<String>> oosPluginIdsMono = Mono.just(this.oosPluginIds);
        if (oosPluginIds.isEmpty()) {
            oosPluginIdsMono = repository
                    .findAll()
                    .filter(plugin -> oosPluginsPackageNames.contains(plugin.getPackageName()))
                    .map(plugin -> plugin.getId())
                    .collect(Collectors.toUnmodifiableSet())
                    .doOnNext(pluginIds -> oosPluginIds = pluginIds);
        }

        return oosPluginIdsMono.map(pluginIds -> pluginIds.contains(pluginId));
    }

    @Override
    public Flux<Plugin> get(MultiValueMap<String, String> params) {

        Flux<Plugin> pluginFlux = super.get(params);
        // Filter out unsupported plugins for air-gap instance
        if (airgapInstanceConfig.isAirgapEnabled()) {
            return pluginFlux.filter(Plugin::isSupportedForAirGap);
        }
        return pluginFlux;
    }

    private PluginDTO makePluginDTO(Plugin plugin) {
        PluginDTO pluginDTO = new PluginDTO();
        pluginDTO.setType(plugin.getType());
        pluginDTO.setName(plugin.getName());
        pluginDTO.populateTransientFields(plugin);
        return pluginDTO;
    }
}
