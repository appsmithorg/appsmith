package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationPlugin;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.dtos.InstallPluginRedisDTO;
import com.appsmith.server.dtos.OrganizationPluginStatus;
import com.appsmith.server.dtos.PluginOrgDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PluginRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StreamUtils;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.Charset;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class PluginServiceImpl extends BaseService<PluginRepository, Plugin, String> implements PluginService {

    private final OrganizationService organizationService;
    private final PluginManager pluginManager;
    private final ReactiveRedisTemplate<String, String> reactiveTemplate;
    private final ChannelTopic topic;
    private final ObjectMapper objectMapper;

    private final Map<String, Mono<Map>> formCache = new HashMap<>();
    private final Map<String, Mono<Map<String, String>>> templateCache = new HashMap<>();

    private static final int CONNECTION_TIMEOUT = 10000;
    private static final int READ_TIMEOUT = 10000;

    @Autowired
    public PluginServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             PluginRepository repository,
                             AnalyticsService analyticsService,
                             OrganizationService organizationService,
                             PluginManager pluginManager,
                             ReactiveRedisTemplate<String, String> reactiveTemplate,
                             ChannelTopic topic,
                             ObjectMapper objectMapper) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.organizationService = organizationService;
        this.pluginManager = pluginManager;
        this.reactiveTemplate = reactiveTemplate;
        this.topic = topic;
        this.objectMapper = objectMapper;
    }

    @Override
    public Flux<Plugin> get(MultiValueMap<String, String> params) {

        String organizationId = params.getFirst(FieldName.ORGANIZATION_ID);
        if (organizationId == null) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
        }

        // TODO : Think about the various scenarios where this plugin api is called and then decide on permissions.
        Mono<Organization> organizationMono = organizationService.getById(organizationId);

        return organizationMono
                .flatMapMany(org -> {
                    log.debug("Fetching plugins by params: {} for org: {}", params, org.getName());
                    if (org.getPlugins() == null) {
                        log.debug("Null installed plugins found for org: {}. Return empty plugins", org.getName());
                        return Flux.empty();
                    }

                    List<String> pluginIds = org.getPlugins()
                            .stream()
                            .map(OrganizationPlugin::getPluginId)
                            .collect(Collectors.toList());
                    Query query = new Query();
                    query.addCriteria(Criteria.where(FieldName.ID).in(pluginIds));

                    if (params.getFirst(FieldName.TYPE) != null) {
                        try {
                            PluginType pluginType = PluginType.valueOf(params.getFirst(FieldName.TYPE));
                            query.addCriteria(Criteria.where(FieldName.TYPE).is(pluginType));
                        } catch (IllegalArgumentException e) {
                            log.error("No plugins for type : {}", params.getFirst(FieldName.TYPE));
                            return Flux.empty();
                        }
                    }

                    return mongoTemplate.find(query, Plugin.class);
                })
                .flatMap(plugin ->
                        getTemplates(plugin)
                                .doOnSuccess(plugin::setTemplates)
                                .thenReturn(plugin)
                );
    }

    @Override
    public Mono<Plugin> create(Plugin plugin) {
        if (plugin.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }

        plugin.setDeleted(false);
        return super.create(plugin);
    }

    @Override
    public Flux<Plugin> getDefaultPlugins() {
        return repository.findByDefaultInstall(true);
    }

    @Override
    public Mono<Organization> installPlugin(PluginOrgDTO pluginOrgDTO) {
        if (pluginOrgDTO.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }
        if (pluginOrgDTO.getOrganizationId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
        }

        return storeOrganizationPlugin(pluginOrgDTO, pluginOrgDTO.getStatus())
                .switchIfEmpty(Mono.empty());
    }

    @Override
    public Mono<Organization> uninstallPlugin(PluginOrgDTO pluginDTO) {
        if (pluginDTO.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }
        if (pluginDTO.getOrganizationId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
        }

        //Find the organization using id and plugin id -> This is to find if the organization has the plugin installed
        Mono<Organization> organizationMono = organizationService.findByIdAndPluginsPluginId(pluginDTO.getOrganizationId(),
                pluginDTO.getPluginId());

        return organizationMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.PLUGIN_NOT_INSTALLED, pluginDTO.getPluginId())))
                //In case the plugin is not found for the organization, the organizationMono would not emit and the rest of the flow would stop
                //i.e. the rest of the code flow would only happen when there is a plugin found for the organization that can
                //be uninstalled.
                .flatMap(organization -> {
                    List<OrganizationPlugin> organizationPluginList = organization.getPlugins();
                    organizationPluginList.removeIf(listPlugin -> listPlugin.getPluginId().equals(pluginDTO.getPluginId()));
                    organization.setPlugins(organizationPluginList);
                    return organizationService.save(organization);
                });
    }

    private Mono<Organization> storeOrganizationPlugin(PluginOrgDTO pluginDTO, OrganizationPluginStatus status) {

        Mono<Organization> pluginInOrganizationMono = organizationService
                .findByIdAndPluginsPluginId(pluginDTO.getOrganizationId(), pluginDTO.getPluginId());


        //If plugin is already present for the organization, just return the organization, else install and return organization
        return pluginInOrganizationMono
                .switchIfEmpty(Mono.defer(() -> {
                    log.debug("Plugin {} not already installed. Installing now", pluginDTO.getPluginId());
                    //If the plugin is not found in the organization, its not installed already. Install now.
                    return repository
                            .findById(pluginDTO.getPluginId())
                            .map(plugin -> {

                                log.debug("Before publishing to the redis queue");
                                //Publish the event to the pub/sub queue
                                InstallPluginRedisDTO installPluginRedisDTO = new InstallPluginRedisDTO();
                                installPluginRedisDTO.setOrganizationId(pluginDTO.getOrganizationId());
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
                            .then(organizationService.getById(pluginDTO.getOrganizationId()))
                            .flatMap(organization -> {

                                List<OrganizationPlugin> organizationPluginList = organization.getPlugins();
                                if (organizationPluginList == null) {
                                    organizationPluginList = new ArrayList<>();
                                }

                                OrganizationPlugin organizationPlugin = new OrganizationPlugin();
                                organizationPlugin.setPluginId(pluginDTO.getPluginId());
                                organizationPlugin.setStatus(status);
                                organizationPluginList.add(organizationPlugin);
                                organization.setPlugins(organizationPluginList);

                                log.debug("Going to save the organization with install plugin. This means that installation has been successful");

                                return organizationService.save(organization);
                            });
                }));
    }

    public Mono<Plugin> findByName(String name) {
        return repository.findByName(name);
    }

    public Mono<Plugin> findByPackageName(String packageName) {
        return repository.findByPackageName(packageName);
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
        log.debug("Going to download plugin jar with name : {}", baseUrl + pluginJar);

        try {
            FileUtils.copyURLToFile(
                    new URL(plugin.getJarLocation()),
                    new File(baseUrl, pluginJar),
                    CONNECTION_TIMEOUT,
                    READ_TIMEOUT);
        } catch (Exception e) {
            log.error("", e);
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_INSTALLATION_FAILED_DOWNLOAD_ERROR));
        }

        //Now that the plugin has been downloaded, load and restart the plugin
        pluginManager.loadPlugin(Path.of(baseUrl + pluginJar));
        //The following only starts plugins which have been loaded but hasn't been started yet.
        pluginManager.startPlugins();

        return Mono.just(plugin);
    }

    @Override
    public Mono<Map> getFormConfig(String pluginId) {
        if (!formCache.containsKey(pluginId)) {
            final Mono<Map> formMono = loadPluginResource(pluginId, "form.json")
                    .doOnError(throwable ->
                            // Remove this pluginId from the cache so it is tried again next time.
                            formCache.remove(pluginId)
                    )
                    .onErrorMap(Exceptions::unwrap)
                    .cache();
            final Mono<Map> editorMono = loadPluginResource(pluginId, "editor.json")
                    .doOnError(throwable ->
                            // Remove this pluginId from the cache so it is tried again next time.
                            formCache.remove(pluginId)
                    )
                    .onErrorMap(Exceptions::unwrap)
                    .cache();

            Mono<Map> resourceMono = Mono.zip(formMono, editorMono)
                    .map(tuple -> {
                        Map formMap = tuple.getT1();
                        Map editorMap = tuple.getT2();
                        formMap.putAll(editorMap);
                        return formMap;
                    });

            formCache.put(pluginId, resourceMono);
        }

        return formCache.get(pluginId);
    }

    private Mono<Map<String, String>> getTemplates(Plugin plugin) {
        final String pluginId = plugin.getId();

        if (!templateCache.containsKey(pluginId)) {
            final Mono<Map<String, String>> mono = Mono.fromSupplier(() -> loadTemplatesFromPlugin(plugin))
                    .onErrorReturn(FileNotFoundException.class, Collections.emptyMap())
                    .doOnError(throwable ->
                            // Remove this pluginId from the cache so it is tried again next time.
                            templateCache.remove(pluginId)
                    )
                    // It's okay if the templates folder is not present, we just return empty templates collection.
                    .onErrorMap(throwable -> new AppsmithException(
                            AppsmithError.PLUGIN_LOAD_TEMPLATES_FAIL, Exceptions.unwrap(throwable).getMessage())
                    )
                    .cache();

            templateCache.put(pluginId, mono);
        }

        return templateCache.get(pluginId);
    }

    private Map<String, String> loadTemplatesFromPlugin(Plugin plugin) {
        final PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver(
                pluginManager
                        .getPlugin(plugin.getPackageName())
                        .getPluginClassLoader()
        );

        final Map<String, String> templates = new HashMap<>();

        Resource[] resources;
        try {
            resources = resolver.getResources("templates/*");
        } catch (IOException e) {
            log.error("Error resolving templates in plugin for id: " + plugin.getId());
            throw Exceptions.propagate(e);
        }

        for (final Resource resource : resources) {
            final String filename = resource.getFilename();
            try {
                final String templateContent = StreamUtils.copyToString(
                        resource.getInputStream(), Charset.defaultCharset());
                if (filename != null) {
                    templates.put(filename.replaceFirst("\\.\\w+$", ""), templateContent);
                }
            } catch (IOException e) {
                log.error("Error loading template {} for plugin {}", filename, plugin.getId());
                throw Exceptions.propagate(e);
            }
        }

        return templates;
    }

    @Override
    public Mono<Map> loadPluginResource(String pluginId, String resourcePath) {
        return findById(pluginId)
                .flatMap(plugin -> {
                    InputStream resourceAsStream = pluginManager
                            .getPlugin(plugin.getPackageName())
                            .getPluginClassLoader()
                            .getResourceAsStream(resourcePath);

                    if (resourceAsStream == null) {
                        return Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL, "Form Resource not found"));
                    }

                    try {
                        Map resourceMap = objectMapper.readValue(resourceAsStream, Map.class);
                        return Mono.just(resourceMap);
                    } catch (IOException e) {
                        log.error("Error loading resource JSON for pluginId {} and resourcePath {}", pluginId, resourcePath, e);
                        return Mono.error(new AppsmithException(AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL, e.getMessage()));
                    }
                });
    }
}
