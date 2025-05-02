package com.appsmith.server.plugins.base;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.InstallPluginRedisDTO;
import com.appsmith.server.dtos.PluginWorkspaceDTO;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.LoadShifter;
import com.appsmith.server.plugins.solutions.PluginTransformationSolution;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.util.WebClientUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.Validator;
import lombok.Data;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.util.StreamUtils;
import org.springframework.util.StringUtils;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
public class PluginServiceCEImpl extends BaseService<PluginRepository, Plugin, String> implements PluginServiceCE {

    public static final String UQI_DB_EDITOR_FORM = "UQIDbEditorForm";
    protected final WorkspaceService workspaceService;
    private final PluginManager pluginManager;
    private final ReactiveRedisTemplate<String, String> reactiveTemplate;
    private final ChannelTopic topic;
    private final ObjectMapper objectMapper;
    private final CloudServicesConfig cloudServicesConfig;

    private final PluginTransformationSolution pluginTransformationSolution;

    private final Map<String, Mono<Map<?, ?>>> formCache = new HashMap<>();
    private final Map<String, Mono<Map<String, String>>> templateCache = new HashMap<>();
    private final Map<String, Mono<Map>> labelCache = new HashMap<>();

    private static final int CONNECTION_TIMEOUT = 10000;
    private static final int READ_TIMEOUT = 10000;

    private static final String UQI_QUERY_EDITOR_BASE_FOLDER = "editor";
    private static final String UQI_QUERY_EDITOR_ROOT_FILE = "root.json";

    private static final String KEY_EDITOR = "editor";
    private static final String KEY_CONFIG_PROPERTY = "configProperty";
    private static final String KEY_LABEL = "label";
    private static final String KEY_INTERNAL_LABEL = "internalLabel";
    private static final String KEY_CHILDREN = "children";
    private static final String DEFAULT_LABEL = "Query";
    public static final String KEY_CONTROL_TYPE = "controlType";
    public static final String KEY_COMMENT = "_comment";
    public static final String KEY_FILES = "files";

    private final ConfigService configService;

    @Autowired
    public PluginServiceCEImpl(
            Validator validator,
            PluginRepository repository,
            AnalyticsService analyticsService,
            WorkspaceService workspaceService,
            PluginManager pluginManager,
            ReactiveRedisTemplate<String, String> reactiveTemplate,
            ChannelTopic topic,
            ObjectMapper objectMapper,
            CloudServicesConfig cloudServicesConfig,
            ConfigService configService,
            PluginTransformationSolution pluginTransformationSolution) {
        super(validator, repository, analyticsService);
        this.workspaceService = workspaceService;
        this.pluginManager = pluginManager;
        this.reactiveTemplate = reactiveTemplate;
        this.topic = topic;
        this.objectMapper = objectMapper;
        this.cloudServicesConfig = cloudServicesConfig;
        this.configService = configService;
        this.pluginTransformationSolution = pluginTransformationSolution;
    }

    @Override
    public Mono<Map<String, Plugin>> findAllPluginsInWorkspace(String workspaceId) {
        return getAllPlugins(workspaceId).collectMap(Plugin::getId);
    }

    @Override
    public Flux<Plugin> getInWorkspace(@NonNull String workspaceId) {
        return getAllPlugins(workspaceId)
                .flatMap(plugin ->
                        getTemplates(plugin).doOnSuccess(plugin::setTemplates).thenReturn(plugin));
    }

    @Override
    public Mono<Plugin> create(Plugin plugin) {
        if (plugin.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }

        return super.create(plugin);
    }

    @Override
    public Flux<Plugin> getDefaultPlugins() {
        return repository.findByDefaultInstall(true);
    }

    @Override
    public Flux<Plugin> getDefaultPluginIcons() {
        return repository.findDefaultPluginIcons();
    }

    @Override
    public Mono<Workspace> installPlugin(PluginWorkspaceDTO pluginOrgDTO) {
        if (pluginOrgDTO.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
        }
        if (pluginOrgDTO.getWorkspaceId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        return storeWorkspacePlugin(pluginOrgDTO, pluginOrgDTO.getStatus()).switchIfEmpty(Mono.empty());
    }

    @Override
    public Flux<Workspace> installDefaultPlugins(List<Plugin> plugins) {
        final List<WorkspacePlugin> newWorkspacePlugins = plugins.stream()
                .filter(plugin -> Boolean.TRUE.equals(plugin.getDefaultInstall()))
                .map(plugin -> {
                    return new WorkspacePlugin(plugin.getId(), WorkspacePluginStatus.ACTIVATED);
                })
                .collect(Collectors.toList());

        if (newWorkspacePlugins.isEmpty()) {
            return Flux.empty();
        }
        // used retrieveAll() as it does not need user session context
        return workspaceService.retrieveAll().flatMap(workspace -> {
            // Only perform a DB op if plugins associated to this org have changed
            if (workspace.getPlugins().containsAll(newWorkspacePlugins)) {
                return Mono.just(workspace);
            } else {
                workspace.getPlugins().addAll(newWorkspacePlugins);
                return workspaceService.save(workspace);
            }
        });
    }

    private Mono<Workspace> storeWorkspacePlugin(PluginWorkspaceDTO pluginDTO, WorkspacePluginStatus status) {

        Mono<Workspace> pluginInWorkspaceMono =
                workspaceService.findByIdAndPluginsPluginId(pluginDTO.getWorkspaceId(), pluginDTO.getPluginId());

        // If plugin is already present for the workspace, just return the workspace, else install and return workspace
        return pluginInWorkspaceMono.switchIfEmpty(Mono.defer(() -> {
            log.debug("Plugin {} not already installed. Installing now", pluginDTO.getPluginId());
            // If the plugin is not found in the workspace, its not installed already. Install now.
            return repository
                    .findById(pluginDTO.getPluginId())
                    .map(plugin -> {
                        log.debug("Before publishing to the redis queue");
                        // Publish the event to the pub/sub queue
                        InstallPluginRedisDTO installPluginRedisDTO = new InstallPluginRedisDTO();
                        installPluginRedisDTO.setWorkspaceId(pluginDTO.getWorkspaceId());
                        installPluginRedisDTO.setPluginWorkspaceDTO(pluginDTO);
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
                    // Now that the plugin jar has been successfully downloaded, go on and add the plugin to the
                    // workspace
                    .then(workspaceService.getById(pluginDTO.getWorkspaceId()))
                    .flatMap(workspace -> {
                        Set<WorkspacePlugin> workspacePluginList = workspace.getPlugins();
                        if (workspacePluginList == null) {
                            workspacePluginList = new HashSet<>();
                        }

                        WorkspacePlugin workspacePlugin = new WorkspacePlugin();
                        workspacePlugin.setPluginId(pluginDTO.getPluginId());
                        workspacePlugin.setStatus(status);
                        workspacePluginList.add(workspacePlugin);
                        workspace.setPlugins(workspacePluginList);

                        log.debug(
                                "Going to save the workspace with install plugin. This means that installation has been successful");

                        return workspaceService.save(workspace);
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
    public Mono<String> getPluginName(Mono<Datasource> datasourceMono) {
        return datasourceMono.flatMap(datasource -> this.findById(datasource.getPluginId())
                .map(plugin -> plugin.getPluginName() == null ? plugin.getPackageName() : plugin.getPluginName()));
    }

    @Override
    public Plugin redisInstallPlugin(InstallPluginRedisDTO installPluginRedisDTO) {
        Mono<Plugin> pluginMono = repository.findById(
                installPluginRedisDTO.getPluginWorkspaceDTO().getPluginId());
        return pluginMono
                .flatMap(plugin -> downloadAndStartPlugin(installPluginRedisDTO.getWorkspaceId(), plugin))
                .switchIfEmpty(Mono.defer(() -> {
                    log.debug(
                            "During redisInstallPlugin, no plugin with plugin id {} found. Returning without download and install",
                            installPluginRedisDTO.getPluginWorkspaceDTO().getPluginId());
                    return Mono.just(new Plugin());
                }))
                .block();
    }

    private Mono<Plugin> downloadAndStartPlugin(String workspaceId, Plugin plugin) {
        if (plugin.getJarLocation() == null) {
            // Plugin jar location not set. Must be local
            /** TODO
             * In future throw an error if jar location is not set
             */
            log.debug("plugin jarLocation is null. Not downloading and starting. Returning now");
            return Mono.just(plugin);
        }

        String baseUrl = "../dist/plugins/";
        String pluginJar = plugin.getName() + "-" + workspaceId + ".jar";
        log.debug("Going to download plugin jar with name : {}", baseUrl + pluginJar);

        try {
            FileUtils.copyURLToFile(
                    new URL(plugin.getJarLocation()), new File(baseUrl, pluginJar), CONNECTION_TIMEOUT, READ_TIMEOUT);
        } catch (Exception e) {
            log.error("", e);
            return Mono.error(new AppsmithException(AppsmithError.PLUGIN_INSTALLATION_FAILED_DOWNLOAD_ERROR));
        }

        // Now that the plugin has been downloaded, load and restart the plugin
        pluginManager.loadPlugin(Path.of(baseUrl + pluginJar));
        // The following only starts plugins which have been loaded but hasn't been started yet.
        pluginManager.startPlugins();

        return Mono.just(plugin);
    }

    @Override
    public Mono<Map<?, ?>> getFormConfig(String pluginId) {
        if (!formCache.containsKey(pluginId)) {
            final Mono<Map<?, ?>> formMono = loadPluginResource(pluginId, "form.json")
                    .doOnError(throwable ->
                            // Remove this pluginId from the cache so it is tried again next time.
                            formCache.remove(pluginId))
                    .onErrorMap(Exceptions::unwrap)
                    .cache();
            final Mono<Map<?, ?>> editorMono = loadPluginResource(pluginId, "editor.json")
                    .doOnError(throwable ->
                            // Remove this pluginId from the cache so it is tried again next time.
                            formCache.remove(pluginId))
                    .onErrorReturn(new HashMap<>())
                    .cache();
            final Mono<Map<?, ?>> settingMono = loadPluginResource(pluginId, "setting.json")
                    .doOnError(throwable ->
                            // Remove this pluginId from the cache so it is tried again next time.
                            formCache.remove(pluginId))
                    .onErrorReturn(new HashMap<>())
                    .cache();
            final Mono<Map<?, ?>> dependencyMono = loadPluginResource(pluginId, "dependency.json")
                    .doOnError(throwable ->
                            // Remove this pluginId from the cache so it is tried again next time.
                            formCache.remove(pluginId))
                    .onErrorReturn(new HashMap<>())
                    .cache();

            Mono<Map<?, ?>> resourceMono = Mono.zip(formMono, editorMono, settingMono, dependencyMono)
                    .map(tuple -> {
                        Map<?, ?> formMap = tuple.getT1();
                        Map editorMap = tuple.getT2();
                        Map settingMap = tuple.getT3();
                        Map dependencyMap = tuple.getT4();

                        formMap.putAll(editorMap);
                        formMap.putAll(settingMap);
                        formMap.putAll(dependencyMap);

                        return formMap;
                    });

            formCache.put(pluginId, resourceMono);
        }

        return formCache.get(pluginId).flatMap(input -> pluginTransformationSolution.transform(pluginId, input));
    }

    @Override
    public Mono<Map> getEditorConfigLabelMap(String pluginId) {
        if (labelCache.containsKey(pluginId)) {
            return labelCache.get(pluginId);
        }

        Mono<Map<?, ?>> formConfig = getFormConfig(pluginId);

        if (formConfig == null) {
            return Mono.just(new HashMap());
        }

        Mono<Map> labelMapMono = formConfig.flatMap(formMap -> {
            Map<String, String> labelMap = new LinkedHashMap(); // need to keep the key value pairs in order
            List editorMap = (List) formMap.get(KEY_EDITOR);
            if (editorMap == null) {
                return Mono.just(new HashMap());
            }

            editorMap.stream()
                    .filter(item -> {
                        if (((Map) item).get(KEY_CHILDREN) == null) {
                            return false;
                        }
                        return true;
                    })
                    .map(item -> ((Map) item).get(KEY_CHILDREN))
                    .forEach(item -> ((List<Map>) item).stream().forEach(queryField -> {
                        /*
                         * - First check for "label" key.
                         * - If "label" key has empty value, then get the value against
                         * "internalLabel" key.
                         */
                        String label = StringUtils.isEmpty(queryField.get(KEY_LABEL))
                                ? (StringUtils.isEmpty(queryField.get(KEY_INTERNAL_LABEL))
                                        ? DEFAULT_LABEL
                                        : (String) queryField.get(KEY_INTERNAL_LABEL))
                                : (String) queryField.get(KEY_LABEL);
                        String configProperty = (String) queryField.get(KEY_CONFIG_PROPERTY);
                        labelMap.put(configProperty, label);
                    }));

            return Mono.just(labelMap);
        });

        labelCache.put(pluginId, labelMapMono);

        return labelMapMono;
    }

    private Mono<Map<String, String>> getTemplates(Plugin plugin) {
        final String pluginId = plugin.getId();

        if (!templateCache.containsKey(pluginId)) {
            final Mono<Map<String, String>> mono = Mono.fromSupplier(() -> loadTemplatesFromPlugin(plugin))
                    .onErrorResume(
                            throwable -> throwable.getCause() instanceof FileNotFoundException,
                            throwable -> Mono.just(Collections.emptyMap()))
                    .doOnError(throwable ->
                            // Remove this pluginId from the cache so it is tried again next time.
                            templateCache.remove(pluginId))
                    // It's okay if the templates folder is not present, we just return empty templates collection.
                    .onErrorMap(throwable -> {
                        log.error("Error loading templates for plugin {}.", plugin.getPackageName(), throwable);
                        return new AppsmithException(
                                AppsmithError.PLUGIN_LOAD_TEMPLATES_FAIL,
                                Exceptions.unwrap(throwable).getMessage());
                    })
                    .cache();

            /*
             * The method loadTemplatesFromPlugin is reads a file from the system, and this is a blocking process.
             * Since, we need to keep the nioEventLoop thread pool free, we are shifting the subscription to elastic
             * thread pool and then publishing the result on the parallel thread pool.
             */
            templateCache.put(
                    pluginId, LoadShifter.subscribeOnElasticPublishOnParallel(mono, "loadTemplatesFromPlugin"));
        }

        return templateCache.get(pluginId);
    }

    private Map<String, String> loadTemplatesFromPlugin(Plugin plugin) {
        final PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver(
                pluginManager.getPlugin(plugin.getPackageName()).getPluginClassLoader());

        final PluginTemplatesMeta pluginTemplatesMeta;
        try {
            pluginTemplatesMeta = objectMapper.readValue(
                    resolver.getResource("templates/meta.json").getInputStream(), PluginTemplatesMeta.class);

        } catch (IOException e) {
            log.error("Error loading templates metadata in plugin {}", plugin.getPackageName());
            throw Exceptions.propagate(e);
        }

        if (pluginTemplatesMeta.getTemplates() == null) {
            log.warn("Missing templates key in plugin templates meta.");
            return Collections.emptyMap();
        }

        final Map<String, String> templates = new LinkedHashMap<>();

        for (final PluginTemplate template : pluginTemplatesMeta.getTemplates()) {
            final String filename = template.getFile();

            if (filename == null) {
                log.warn("Empty or missing file for a template in plugin {}.", plugin.getPackageName());
                continue;
            }

            final Resource resource = resolver.getResource("templates/" + filename);
            final String title = StringUtils.isEmpty(template.getTitle())
                    ? filename.replaceFirst("\\.\\w+$", "")
                    : template.getTitle();

            try {
                templates.put(title, StreamUtils.copyToString(resource.getInputStream(), Charset.defaultCharset()));

            } catch (IOException e) {
                log.error("Error loading template {} for plugin {}", filename, plugin.getId());
                throw Exceptions.propagate(e);
            }
        }

        return templates;
    }

    InputStream getConfigInputStream(Plugin plugin, String fileName) throws IOException {
        String resourcePath = UQI_QUERY_EDITOR_BASE_FOLDER + "/" + fileName;

        return pluginManager
                .getPlugin(plugin.getPackageName())
                .getPluginClassLoader()
                .getResourceAsStream(resourcePath);
    }

    /**
     * This function reads from the folder editor/ starting with file root.json. root.json declares all the combination
     * of commands that would be present as well as the files from which the action types should be loaded.
     * @return Map of the editor in the format expected by the client for displaying all the UI fields with conditionals
     */
    @Override
    public Map<?, ?> loadEditorPluginResourceUqi(Plugin plugin) {
        String resourcePath = UQI_QUERY_EDITOR_BASE_FOLDER + "/" + UQI_QUERY_EDITOR_ROOT_FILE;

        ObjectNode rootTree;

        try (InputStream resourceAsStream = getConfigInputStream(plugin, UQI_QUERY_EDITOR_ROOT_FILE)) {

            if (resourceAsStream == null) {
                throw new AppsmithException(
                        AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL,
                        plugin.getPackageName(),
                        "form resource " + resourcePath + " not found");
            }

            // Read the root.json content.
            rootTree = objectMapper.readValue(resourceAsStream, ObjectNode.class);
        } catch (IOException e) {
            log.error(
                    "Error loading resource JSON for plugin {} and resourcePath {}",
                    plugin.getPackageName(),
                    resourcePath,
                    e);
            throw new AppsmithException(
                    AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL, plugin.getPackageName(), e.getMessage());
        }

        /*
         * Generate the top level section which would hold all the command templates read from files
         * It has the following format:
         * {
         *   "controlType": "SECTION",
         *   "_comment": "This section holds all the templates",
         *   "children": []
         * }
         */
        ObjectNode uiSectionNode = objectMapper.createObjectNode();
        uiSectionNode.put(KEY_CONTROL_TYPE, "SECTION");
        uiSectionNode.put(KEY_COMMENT, "This section holds all the templates");
        final ArrayNode templateChildrenNode = objectMapper.createArrayNode();
        uiSectionNode.set(KEY_CHILDREN, templateChildrenNode);

        // From root tree, fetch the key "files" which contains the declaration for all the template files
        ArrayNode filesArray = (ArrayNode) rootTree.get(KEY_FILES);

        // Adding a section to hold all the template configurations
        ArrayNode editorArray = (ArrayNode) rootTree.get(KEY_EDITOR);
        editorArray.add(uiSectionNode);

        if (filesArray != null) {
            for (JsonNode fileName : filesArray) {

                String path = fileName.asText();
                try {
                    final JsonNode templateConfig = loadPluginResourceGivenPluginAsJsonNode(plugin, path);
                    templateChildrenNode.add(templateConfig);
                } catch (AppsmithException e) {
                    // Either the file doesn't exist or malformed JSON was found. Ignore the command template
                    log.error(
                            "Error loading resource JSON for plugin {} and resourcePath {} : ",
                            plugin.getPackageName(),
                            resourcePath,
                            e);
                }
            }
        }

        ObjectNode topLevel = objectMapper.createObjectNode();
        topLevel.set("editor", editorArray);

        return objectMapper.convertValue(topLevel, new TypeReference<Map<String, Object>>() {});
    }

    @Override
    public Flux<Plugin> saveAll(Iterable<Plugin> plugins) {
        return repository.saveAll(plugins);
    }

    @Override
    public Flux<Plugin> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        return repository.findAllByIdsWithoutPermission(ids, includeFields);
    }

    @Override
    public Flux<Plugin> getAllRemotePlugins() {
        return repository.findByType(PluginType.REMOTE);
    }

    @Override
    public Flux<Plugin> getPluginsByType(PluginType pluginType) {
        return repository.findByType(pluginType);
    }

    private Map<?, ?> loadPluginResourceGivenPluginAsMap(Plugin plugin, String resourcePath) {
        try (InputStream resourceAsStream = pluginManager
                .getPlugin(plugin.getPackageName())
                .getPluginClassLoader()
                .getResourceAsStream(resourcePath)) {

            if (resourceAsStream == null) {
                throw new AppsmithException(
                        AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL,
                        plugin.getPackageName(),
                        "form resource " + resourcePath + " not found");
            }

            return objectMapper.readValue(resourceAsStream, Map.class);
        } catch (IOException e) {
            log.error(
                    "[{}] : Error loading resource JSON for resourcePath {}", plugin.getPackageName(), resourcePath, e);
            throw new AppsmithException(
                    AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL, plugin.getPackageName(), e.getMessage());
        }
    }

    private JsonNode loadPluginResourceGivenPluginAsJsonNode(Plugin plugin, String resourcePath) {
        try (InputStream resourceAsStream = getConfigInputStream(plugin, resourcePath)) {

            if (resourceAsStream == null) {
                throw new AppsmithException(
                        AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL,
                        plugin.getPackageName(),
                        "form resource " + resourcePath + " not found");
            }

            return objectMapper.readTree(resourceAsStream);
        } catch (IOException e) {
            log.error(
                    "[{}] : Error loading resource JSON for resourcePath {}", plugin.getPackageName(), resourcePath, e);
            throw new AppsmithException(
                    AppsmithError.PLUGIN_LOAD_FORM_JSON_FAIL, plugin.getPackageName(), e.getMessage());
        }
    }

    @Override
    public Mono<Map<?, ?>> loadPluginResource(String pluginId, String resourcePath) {
        return findById(pluginId).flatMap(plugin -> {
            if ("editor.json".equals(resourcePath)) {
                // UI config will be available if this plugin is sourced from the cloud
                if (plugin.getActionUiConfig() != null) {
                    return Mono.just(plugin.getActionUiConfig());
                }
                // For UQI, use another format of loading the config
                if (UQI_DB_EDITOR_FORM.equals(plugin.getUiComponent())) {
                    return Mono.just(loadEditorPluginResourceUqi(plugin));
                }
            }
            if ("form.json".equals(resourcePath)) {
                // UI config will be available if this plugin is sourced from the cloud
                if (plugin.getDatasourceUiConfig() != null) {
                    return Mono.just(plugin.getDatasourceUiConfig());
                }
            }
            /*
             * The method loadPluginResourceGivenPluginAsMap is reads a file from the system, and this is a blocking
             * process. Since, we need to keep the nioEventLoop thread pool free, we are shifting the subscription to
             * elastic thread pool and then publishing the result on the parallel thread pool.
             */
            Mono<? extends Map<?, ?>> pluginResourceMono =
                    Mono.fromCallable(() -> loadPluginResourceGivenPluginAsMap(plugin, resourcePath));

            return LoadShifter.subscribeOnElasticPublishOnParallel(pluginResourceMono, "pluginResourceMono");
        });
    }

    public Flux<Plugin> getAllPlugins(String workspaceId) {
        // TODO : Think about the various scenarios where this plugin api is called and then decide on permissions.
        Mono<Workspace> workspaceMono = workspaceService.getById(workspaceId);

        return workspaceMono.flatMapMany(workspace -> {
            if (workspace.getPlugins() == null) {
                log.debug("Null installed plugins found for workspace: {}. Return empty plugins", workspace.getName());
                return Flux.empty();
            }

            Set<String> pluginIds = workspace.getPlugins().stream()
                    .map(WorkspacePlugin::getPluginId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toUnmodifiableSet());

            return repository.findAllById(pluginIds).flatMap(plugin -> {
                if (Objects.nonNull(plugin.getActionUiConfig())) {
                    return pluginTransformationSolution
                            .transform(plugin.getId(), plugin.getActionUiConfig())
                            .flatMap(transformedActionUiConfig -> {
                                plugin.setActionUiConfig(transformedActionUiConfig);
                                return Mono.just(plugin);
                            });
                }
                return Mono.just(plugin);
            });
        });
    }

    @Override
    public Mono<List<Map<String, String>>> getUpcomingIntegrations() {
        log.debug("Fetching upcoming integrations from external API");

        return configService.getInstanceId().flatMap(instanceId -> {
            String apiUrl = cloudServicesConfig.getBaseUrl()
                    + "/api/v1/config/external-saas/upcoming-integrations?instanceId=" + instanceId;
            return WebClientUtils.create()
                    .get()
                    .uri(apiUrl)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .flatMap(response -> {
                        // Extract the integrations list from the response
                        if (response.containsKey("data")) {
                            List<Map<String, String>> integrations = new ArrayList<>();
                            List<?> data = (List<?>) response.get("data");
                            for (Object item : data) {
                                if (item instanceof Map) {
                                    integrations.add((Map<String, String>) item);
                                }
                            }
                            return Mono.just(integrations);
                        } else if (response.containsKey("responseMeta")) {
                            Map<String, Object> responseMeta = (Map<String, Object>) response.get("responseMeta");
                            if (responseMeta.containsKey("error")) {
                                Map<String, Object> error = (Map<String, Object>) responseMeta.get("error");
                                if (error.containsKey("message")) {
                                    String errorMessage = (String) error.get("message");
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.INSTANCE_REGISTRATION_FAILURE, errorMessage));
                                }
                            }
                            return Mono.error(new RuntimeException("Unknown error in response metadata"));
                        }
                        return Mono.just(List.<Map<String, String>>of());
                    })
                    .onErrorResume(error -> {
                        if (error instanceof AppsmithException) {
                            return Mono.error(error);
                        }
                        log.warn(
                                "Error retrieving upcoming integrations from external service: {}", error.getMessage());
                        return Mono.error(
                                new RuntimeException("Error retrieving upcoming integrations: " + error.getMessage()));
                    });
        });
    }

    @Data
    static class PluginTemplatesMeta {
        List<PluginTemplate> templates;
    }

    @Data
    static class PluginTemplate {
        String file;
        String title = null;
    }
}
