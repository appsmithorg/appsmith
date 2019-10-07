package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationPlugin;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.InstallPluginRedisDTO;
import com.appsmith.server.dtos.OrganizationPluginStatus;
import com.appsmith.server.dtos.PluginOrgDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PluginRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.segment.analytics.Analytics;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.io.File;
import java.net.URL;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class PluginServiceImpl extends BaseService<PluginRepository, Plugin, String> implements PluginService {

    private final ApplicationContext applicationContext;
    private final OrganizationService organizationService;
    private final PluginManager pluginManager;
    private final ReactiveRedisTemplate<String, String> reactiveTemplate;
    private final ChannelTopic topic;
    private final ObjectMapper objectMapper;

    private static final int CONNECTION_TIMEOUT = 10000;
    private static final int READ_TIMEOUT = 10000;

    @Autowired
    public PluginServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             PluginRepository repository,
                             ApplicationContext applicationContext,
                             OrganizationService organizationService,
                             Analytics analytics,
                             SessionUserService sessionUserService, PluginManager pluginManager,
                             ReactiveRedisTemplate<String, String> reactiveTemplate,
                             ChannelTopic topic, ObjectMapper objectMapper) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analytics, sessionUserService);
        this.applicationContext = applicationContext;
        this.organizationService = organizationService;
        this.pluginManager = pluginManager;
        this.reactiveTemplate = reactiveTemplate;
        this.topic = topic;
        this.objectMapper = objectMapper;
    }

    public OldPluginExecutor getPluginExecutor(PluginType pluginType, String className) {
        Class<?> clazz;
        try {
            clazz = Class.forName(className);
            return (OldPluginExecutor) applicationContext.getBean(clazz);
        } catch (ClassNotFoundException e) {
            log.error("Unable to find class {}. ", className, e);
        }
        return null;
    }

    @Override
    public Mono<Plugin> create(Plugin plugin) {
        if (plugin.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }

        Mono<User> userMono = super.sessionUserService.getCurrentUser();

        plugin.setDeleted(false);
        return repository
                .save(plugin)
                .flatMap(this::segmentTrackCreate);
    }

    @Override
    public Mono<Organization> installPlugin(PluginOrgDTO pluginOrgDTO) {
        if (pluginOrgDTO.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }

        return Mono.just(pluginOrgDTO)
                .flatMap(plugin -> storeOrganizationPlugin(plugin, pluginOrgDTO.getStatus()))
                .switchIfEmpty(Mono.empty());
    }

    @Override
    public Mono<Organization> uninstallPlugin(PluginOrgDTO pluginDTO) {
        if (pluginDTO.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }

        //Find the organization using id and plugin id -> This is to find if the organization has the plugin installed
        Mono<User> userMono = super.sessionUserService.getCurrentUser();
        Mono<Organization> organizationMono = userMono.flatMap(user ->
                organizationService.findByIdAndPluginsPluginId(user.getOrganizationId(), pluginDTO.getPluginId()));

        return organizationMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.PLUGIN_NOT_INSTALLED, pluginDTO.getPluginId())))
                //In case the plugin is not found for the organization, the organizationMono would not emit and the rest of the flow would stop
                //i.e. the rest of the code flow would only happen when there is a plugin found for the organization that can
                //be uninstalled.
                .map(organization -> {
                    List<OrganizationPlugin> organizationPluginList = organization.getPlugins();
                    organizationPluginList.removeIf(listPlugin -> listPlugin.getPluginId().equals(pluginDTO.getPluginId()));
                    organization.setPlugins(organizationPluginList);
                    return organization;
                })
                .flatMap(organizationService::save);
    }

    private Mono<Organization> storeOrganizationPlugin(PluginOrgDTO pluginDTO, OrganizationPluginStatus status) {

        //Find the organization using id and plugin id -> This is to find if the organization already has the plugin installed
        Mono<User> userMono = super.sessionUserService.getCurrentUser();
        Mono<Organization> pluginInOrganizationMono = userMono.flatMap(user ->
                organizationService.findByIdAndPluginsPluginId(user.getOrganizationId(), pluginDTO.getPluginId()));


        //If plugin is already present for the organization, just return the organization, else install and return organization
        return pluginInOrganizationMono
                .switchIfEmpty(Mono.defer(() -> {
                    log.debug("Plugin not already installed. Running the switch if empty code block");
                    //If the plugin is not found in the organization, its not installed already. Install now.
                    return repository
                            .findById(pluginDTO.getPluginId())
                            .zipWith(userMono, (plugin, user) -> {

                                log.debug("Before publishing to the redis queue");
                                //Publish the event to the pub/sub queue
                                InstallPluginRedisDTO installPluginRedisDTO = new InstallPluginRedisDTO();
                                installPluginRedisDTO.setOrganizationId(user.getOrganizationId());
                                installPluginRedisDTO.setPluginOrgDTO(pluginDTO);
                                String jsonString;
                                try {
                                    jsonString = objectMapper.writeValueAsString(installPluginRedisDTO);
                                } catch (JsonProcessingException e) {
                                    log.error("", e);
                                    return Mono.error(e);
                                }
                                return reactiveTemplate
                                        .convertAndSend(topic.getTopic(), jsonString)
                                        .subscribe();
                            })
                            //Now that the plugin jar has been successfully downloaded, go on and add the plugin to the organization
                            .then(userMono)
                            .flatMap(user -> organizationService.findById(user.getOrganizationId()))
                            .map(organization -> {

                                List<OrganizationPlugin> organizationPluginList = organization.getPlugins();
                                if (organizationPluginList == null) {
                                    organizationPluginList = new ArrayList<OrganizationPlugin>();
                                }

                                OrganizationPlugin organizationPlugin = new OrganizationPlugin();
                                organizationPlugin.setPluginId(pluginDTO.getPluginId());
                                organizationPlugin.setStatus(status);
                                organizationPluginList.add(organizationPlugin);
                                organization.setPlugins(organizationPluginList);

                                log.debug("Going to save the organization with install plugin. This means that installation has been successful");

                                return organization;
                            })
                            .flatMap(organizationService::save);
                }));
    }

    public Mono<Plugin> findByName(String name) {
        return repository.findByName(name);
    }

    @Override
    public Mono<Plugin> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Plugin redisInstallPlugin(InstallPluginRedisDTO installPluginRedisDTO) {
        Mono<Plugin> pluginMono = repository.findById(installPluginRedisDTO.getPluginOrgDTO().getPluginId());
        return pluginMono
                .flatMap(plugin -> downloadAndStartPlugin(installPluginRedisDTO.getOrganizationId(), plugin))
                .switchIfEmpty(Mono.defer(() -> {
                    log.debug("During redisInstallPlugin, no plugin with plugin id {} found. Returning without download and install", installPluginRedisDTO.getPluginOrgDTO().getPluginId());
                    return Mono.just(new Plugin());
                })).block();
    }

    private Mono<Plugin> downloadAndStartPlugin(String organizationId, Plugin plugin) {
        if (plugin.getJarLocation() == null) {
            // Plugin jar location not set. Must be local
            /** TODO
             * In future throw an error if jar location is not set
             */
            log.debug("plugin jarLocation is null. Not downloading and starting. Returning now");
            return Mono.just(plugin);
        }

        String baseUrl = "../dist/plugins/";
        String pluginJar = plugin.getName() + "-" + organizationId + ".jar";
        log.debug("Going to download plugin jar with name : {}", baseUrl+pluginJar);

        try {
            FileUtils.copyURLToFile(
                    new URL(plugin.getJarLocation()),
                    new File(baseUrl, pluginJar),
                    CONNECTION_TIMEOUT,
                    READ_TIMEOUT);
        } catch (Exception e) {
            log.error("",e);
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_INSTALLATION_FAILED_DOWNLOAD_ERROR));
        }

        //Now that the plugin has been downloaded, load and restart the plugin
        pluginManager.loadPlugin(Path.of(baseUrl + pluginJar));
        //The following only starts plugins which have been loaded but hasn't been started yet.
        pluginManager.startPlugins();

        return Mono.just(plugin);
    }
}
