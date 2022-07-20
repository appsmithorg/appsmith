package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.appsmith.server.dtos.RemotePluginWorkspaceDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ce.PluginServiceCEImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class PluginServiceImpl extends PluginServiceCEImpl implements PluginService {

    public PluginServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             PluginRepository repository,
                             AnalyticsService analyticsService,
                             WorkspaceService workspaceService,
                             PluginManager pluginManager,
                             ReactiveRedisTemplate<String, String> reactiveTemplate,
                             ChannelTopic topic,
                             ObjectMapper objectMapper) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                workspaceService, pluginManager, reactiveTemplate, topic, objectMapper);
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
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID)))
                .flatMap(this.workspaceService::retrieveById)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION_ID, plugin.getOrganizationId())));
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
        return this.repository
                .findByPluginNameAndPackageNameAndVersion(
                        remotePlugin.getPluginName(),
                        remotePlugin.getPackageName(),
                        remotePlugin.getVersion());
    }

}
