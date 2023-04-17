package com.appsmith.server.solutions.ce;

import static java.lang.Boolean.TRUE;
import static org.mockito.ArgumentMatchers.isNotNull;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.transaction.reactive.TransactionalOperator;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.interfaces.PublishableDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportExportHelper;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.interfaces.PublishableResource;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.services.CustomJSLibService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.ExamplesWorkspaceCloner;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
public class ImportExportApplicationServiceCEImplV2 implements ImportExportApplicationServiceCE {

    private final DatasourceService datasourceService;
    private final SessionUserService sessionUserService;
    private final NewActionRepository newActionRepository;
    private final DatasourceRepository datasourceRepository;
    private final PluginRepository pluginRepository;
    private final WorkspaceService workspaceService;
    private final ApplicationService applicationService;
    private final NewPageService newPageService;
    private final ApplicationPageService applicationPageService;
    private final NewPageRepository newPageRepository;
    private final NewActionService newActionService;
    private final SequenceService sequenceService;
    private final ExamplesWorkspaceCloner examplesWorkspaceCloner;
    private final ActionCollectionRepository actionCollectionRepository;
    private final ActionCollectionService actionCollectionService;
    private final ThemeService themeService;
    private final AnalyticsService analyticsService;
    private final CustomJSLibService customJSLibService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspacePermission workspacePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;
    private final Gson gson;
    private final TransactionalOperator transactionalOperator;
    private final ApplicationSnapshotService applicationSnapshotService;
    private final ImportExportHelper importExportHelper;

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";

    /**
     * This function processed Theme object for export
     * @param theme theme object
     * @return Theme object
     */
    public Theme processThemeForExport(Theme theme) {
        if(theme.isSystemTheme()) {
            // for system theme, we only need theme name and isSystemTheme properties so set null to others
            theme.setProperties(null);
            theme.setConfig(null);
            theme.setStylesheet(null);
        }
        return theme;
    }

    /**
     * This function fixes the references for export
     * @param pages list of pages
     * @param collections list of action collections
     * @param actions list of actions
     * @param plugins list of plugins
     * @param datasources list of datasources
     */
    public void fixReferencesForExport(Application application, List<NewPage> pages, List<ActionCollection> collections, List<NewAction> actions, List<Plugin> plugins, List<Datasource> datasources, ResourceModes resourceMode) {
        // Calculate pageId to name map
        Map<String, PageDTO> pageIdToPageDTOMap = ImportExportUtils.computePageIdToPageDTOMap(pages.stream().collect(Collectors.toList()), resourceMode);
        // Calculate pluginId to name map
        Map<String, Plugin> pluginIdToPluginMap = ImportExportUtils.computePluginIdToPluginMap(plugins);
        // Calculate collectionId to name map
        Map<String, ActionCollectionDTO> collectionIdToCollectionDTOMap = ImportExportUtils.computeCollectionIdToCollectionDTOMap(collections, resourceMode);
        // Calculate datasourceId to name map
        Map<String, Datasource> datasourceIdToDatasourceMap = ImportExportUtils.computeDatasourceIdToDatasourceMap(datasources);
        // Calculate actionId to name map
        Map<String, ActionDTO> actionIdToActionMap = ImportExportUtils.computeActionIdToActionDTOMap(actions, resourceMode);

        // Fix references for action collections
        collections.stream()
                .forEach(collection -> {
                    ActionCollectionDTO collectionDTO = collection.select(resourceMode);
                    collectionDTO.setPageId(pageIdToPageDTOMap.get(collectionDTO.getPageId()).getName());
                    collectionDTO.setPluginId(ImportExportUtils.getPluginReference(pluginIdToPluginMap.get(collectionDTO.getPluginId())));
                });

        // Fix references for actions
        actions.stream()
                .forEach(action -> {
                    ActionDTO actionDTO = action.select(resourceMode);
                    actionDTO.setPageId(pageIdToPageDTOMap.get(actionDTO.getPageId()).getName());
                    if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                            && collectionIdToCollectionDTOMap.containsKey(actionDTO.getCollectionId())) {
                                actionDTO.setCollectionId(collectionIdToCollectionDTOMap.get(actionDTO.getCollectionId()).getName());
                    }
                    Datasource ds = actionDTO.getDatasource();
                    if(ds != null) {
                        
                        if(ds.getId() != null) {
                            //TODO investigate this
                            Datasource datasource = datasourceIdToDatasourceMap.get(ds.getId());
                            ds.setId(datasource != null ? datasource.getName() : null);
                        }
                        if (ds.getPluginId() != null) {
                            ds.setPluginId(pluginIdToPluginMap.get(ds.getPluginId()).getName());
                        }
                    }
                    action.setPluginId(pluginIdToPluginMap.get(action.getPluginId()).getName());
                    action.setId(actionDTO.getName());
                });

        application.getPages()
                .forEach(page -> {
                    page.setId(pageIdToPageDTOMap.get(page.getId()).getName());
                });

        pages.forEach(page -> {
            PageDTO pageDTO = page.select(resourceMode);
            if (!CollectionUtils.isEmpty(pageDTO.getLayouts())) {
                pageDTO.getLayouts().forEach(layout -> {
                    layout.setId(pageDTO.getName());
                    if(!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
                        layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(actionDTO -> {
                                if (actionIdToActionMap.containsKey(actionDTO.getId())) {
                                    actionDTO.setId(actionIdToActionMap.get(actionDTO.getId()).getName());
                                }
                                if (collectionIdToCollectionDTOMap.containsKey(actionDTO.getCollectionId())) {
                                    actionDTO.setCollectionId(collectionIdToCollectionDTOMap.get(actionDTO.getCollectionId()).getName());
                                }
                            })
                        );
                    }
                });
            }
        });

        datasources.forEach(datasource -> {
            datasource.setPluginId(ImportExportUtils.getPluginReference(pluginIdToPluginMap.get(datasource.getPluginId())));
        });
    }

    /**
     * This will be used to dehydrate sensitive fields from the datasource while exporting the application
     *
     * @param datasource entity from which sensitive fields need to be dehydrated
     * @return sensitive fields which then will be deserialized and exported in JSON file
     */
    private DecryptedSensitiveFields getDecryptedFields(Datasource datasource) {

        if(datasource.getDatasourceConfiguration() == null || datasource.getDatasourceConfiguration().getAuthentication() == null) {
            return null;
        }

        AuthenticationDTO authentication = datasource.getDatasourceConfiguration().getAuthentication();

        DecryptedSensitiveFields dsDecryptedFields = null;

        if(authentication.getAuthenticationResponse() != null && authentication.getAuthenticationResponse() != null) {
            dsDecryptedFields = new DecryptedSensitiveFields(authentication.getAuthenticationResponse());
        } else {

            dsDecryptedFields = new DecryptedSensitiveFields();
        }

        if (authentication instanceof DBAuth auth) {
            dsDecryptedFields.setPassword(auth.getPassword());
            dsDecryptedFields.setDbAuth(auth);

        } else if (authentication instanceof OAuth2 auth) {
            dsDecryptedFields.setPassword(auth.getClientSecret());
            dsDecryptedFields.setOpenAuth2(auth);

        } else if (authentication instanceof BasicAuth auth) {
            dsDecryptedFields.setPassword(auth.getPassword());
            dsDecryptedFields.setBasicAuth(auth);

        } else if (authentication instanceof BearerTokenAuth auth) {
            dsDecryptedFields.setBearerTokenAuth(auth);
        }

        dsDecryptedFields.setAuthType(authentication.getClass().getName());
        return dsDecryptedFields;
    }

    List<Datasource> processDatasourceConfigurationForExport(ApplicationJson applicationJson, Application application, List<Datasource> datasources, SerialiseApplicationObjective serialiseFor) {
        if (TRUE.equals(application.getExportWithConfiguration()) && SerialiseApplicationObjective.SHARE.equals(serialiseFor)) {
            // Save decrypted fields for datasources
            Map<String, DecryptedSensitiveFields> decryptedFields = new HashMap<>();
            datasources.forEach(datasource -> {
                decryptedFields.put(datasource.getName(), getDecryptedFields(datasource));
            });
            applicationJson.setDecryptedFields(decryptedFields);
            return datasources;
        }
        return datasources.stream()
                // Remove the datasourceConfiguration object as user will configure it once imported to other instance
                .peek(datasource -> datasource.setDatasourceConfiguration(null))
                .collect(Collectors.toList());
    }

     /**
     * Here we will be rehydrating the sensitive fields like password, secrets etc. in datasource while importing the application
     *
     * @param datasource      for which sensitive fields should be rehydrated
     * @param decryptedFields sensitive fields
     * @return updated datasource with rehydrated sensitive fields
     */
    private Datasource updateAuthenticationDTO(Datasource datasource, DecryptedSensitiveFields decryptedFields) {

        DatasourceConfiguration dsConfig = datasource.getDatasourceConfiguration();
        if(dsConfig == null) {
            dsConfig = new DatasourceConfiguration();
            datasource.setDatasourceConfiguration(dsConfig);
        }
        String authType = decryptedFields.getAuthType();
        if (dsConfig == null || authType == null) {
            return datasource;
        }

        if (StringUtils.equals(authType, DBAuth.class.getName())) {
            final DBAuth dbAuth = decryptedFields.getDbAuth();
            dbAuth.setPassword(decryptedFields.getPassword());
            datasource.getDatasourceConfiguration().setAuthentication(dbAuth);
        } else if (StringUtils.equals(authType, BasicAuth.class.getName())) {
            final BasicAuth basicAuth = decryptedFields.getBasicAuth();
            basicAuth.setPassword(decryptedFields.getPassword());
            datasource.getDatasourceConfiguration().setAuthentication(basicAuth);
        } else if (StringUtils.equals(authType, OAuth2.class.getName())) {
            OAuth2 auth2 = decryptedFields.getOpenAuth2();
            AuthenticationResponse authResponse = new AuthenticationResponse();
            auth2.setClientSecret(decryptedFields.getPassword());
            authResponse.setToken(decryptedFields.getToken());
            authResponse.setRefreshToken(decryptedFields.getRefreshToken());
            authResponse.setTokenResponse(decryptedFields.getTokenResponse());
            authResponse.setExpiresAt(Instant.now());
            auth2.setAuthenticationResponse(authResponse);
            datasource.getDatasourceConfiguration().setAuthentication(auth2);
        } else if (StringUtils.equals(authType, BearerTokenAuth.class.getName())) {
            BearerTokenAuth auth = new BearerTokenAuth();
            auth.setBearerToken(decryptedFields.getBearerTokenAuth().getBearerToken());
            datasource.getDatasourceConfiguration().setAuthentication(auth);
        }
        return datasource;
    }

    List<Datasource> processDatasourceConfigurationForImport(ApplicationJson applicationJson, List<Datasource> datasources) {
        datasources.stream()
                .forEach(datasource -> {
                    if (applicationJson.getDecryptedFields() != null
                            && applicationJson.getDecryptedFields().get(datasource.getName()) != null) {

                        DecryptedSensitiveFields decryptedFields =
                        applicationJson.getDecryptedFields().get(datasource.getName());

                        updateAuthenticationDTO(datasource, decryptedFields);
                    }
                });
        return datasources;
    }

    boolean shouldIncludeResourceForExport(PublishableResource resource, ResourceModes resourceMode) {
        return !ImportExportUtils.isResourceDeleted(resource.select(resourceMode));
    }

    /**
     * This function will give the application resource to rebuild the application in import application flow
     *
     * @param applicationId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationJson> exportApplicationById(String applicationId, SerialiseApplicationObjective serialiseFor, ResourceModes resourceMode) {

        // Start the stopwatch to log the execution time
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.EXPORT.getEventName());

        if (applicationId == null || applicationId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();

        Mono<ApplicationAndPagesDTO> applicationMono = importExportHelper.fetchApplication(applicationId, true, serialiseFor)
                .map(application -> {
                    List<String> unPublishedPages = application.getPages().stream().map(ApplicationPage::getId)
                            .collect(Collectors.toList());
                    return new ApplicationAndPagesDTO(application, unPublishedPages);
                })
                .cache();

        /**
         * Since we are exporting for git, we only consider unpublished JS libraries
         * Ref: https://theappsmith.slack.com/archives/CGBPVEJ5C/p1672225134025919
         */
        Flux<CustomJSLib> allCustomJSLibListFlux = applicationMono
                .flatMapMany(applicationAndPagesDTO -> importExportHelper.getAllCustomJSLibsForApplication(applicationAndPagesDTO.getApplication().getId()))
                .cache();

        Mono<Theme> editModeThemeMono = applicationMono
                .flatMap(applicationAndPagesDTO -> importExportHelper.getApplicationEditModeThemeOrDefault(applicationAndPagesDTO.getApplication()));

        Mono<Theme> publishedThemeMono = applicationMono
                .flatMap(applicationAndPagesDTO -> importExportHelper.getAplicationPublishedThemeOrDefault(applicationAndPagesDTO.getApplication()));

        Flux<NewPage> pagesFlux = applicationMono
                .flatMapMany(applicationAndPagesDTO -> importExportHelper.fetchPagesForApplication(applicationAndPagesDTO.getPageIds(), true,serialiseFor))
                // Filter out pages which are deleted or does not exist
                .filter(page -> shouldIncludeResourceForExport(page, resourceMode))
                .cache();

        Flux<ActionCollection> collectionFlux = applicationMono
                .flatMapMany(applicationAndPagesDTO -> importExportHelper.fetchCollectionsForApplication(applicationAndPagesDTO.getPageIds(), true, serialiseFor))
                // Filter out action collections which are deleted or does not exist
                .filter(collection -> shouldIncludeResourceForExport(collection, resourceMode))
                .cache();

        Flux<NewAction> actionFlux = applicationMono
                .flatMapMany(applicationAndPagesDTO -> importExportHelper.fetchActionsForApplication(applicationAndPagesDTO.getPageIds(), true, serialiseFor))
                // Filter out actions which are deleted or does not exist
                .filter(action -> shouldIncludeResourceForExport(action, resourceMode))
                .cache();

        Flux<Plugin> pluginFlux = pluginRepository.findAll();

        Flux<Datasource> datasourceFlux = applicationMono
                .flatMapMany(applicationAndPagesDTO -> importExportHelper.fetchDatasourcesForWorkspace(applicationAndPagesDTO.getApplication().getWorkspaceId(), true, serialiseFor))
                .cache();

        return Mono.zip(
                allCustomJSLibListFlux.collectList(),
                pluginFlux.collectList(),
                editModeThemeMono,
                publishedThemeMono,
                applicationMono,
                pagesFlux.collectList(),
                collectionFlux.collectList(),
                Mono.zip(
                        actionFlux.collectList(),
                        datasourceFlux.collectList(),
                        currentUserMono)
                )
                .map(tuple -> {
                    // Unwrap all the values from the tuple
                    List<CustomJSLib> allCustomJSLibs = tuple.getT1();
                    List<Plugin> plugins = tuple.getT2();
                    Theme editModeTheme = tuple.getT3();
                    Theme publishedTheme = tuple.getT4();
                    Application application = tuple.getT5().getApplication();
                    List<NewPage> pages = tuple.getT6();
                    List<ActionCollection> collections = tuple.getT7();
                    List<NewAction> actions = tuple.getT8().getT1();
                    List<Datasource> datasources = tuple.getT8().getT2();
                    User currentUser = tuple.getT8().getT3();

                    // Map to store the set of updated resource ids
                    Map<String, Set<String>> updatedResources = new HashMap<>();

                    ApplicationJson applicationJson = new ApplicationJson();

                    // Set json schema version which will be used to check the compatibility while importing the JSON
                    applicationJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
                    applicationJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);

                    // Populate custom JS libs with set of updated ids
                    applicationJson.setCustomJSLibList(allCustomJSLibs);
                    updatedResources.put(FieldName.CUSTOM_JS_LIB_LIST, ImportExportUtils.getUpdatedCustomJSLibsForApplication(application, allCustomJSLibs));

                    // Populate edit mode and published mode theme
                    processThemeForExport(editModeTheme);
                    processThemeForExport(publishedTheme);
                    applicationJson.setEditModeTheme(editModeTheme);
                    applicationJson.setPublishedTheme(publishedTheme);

                    // Populate application
                    applicationJson.setExportedApplication(application);

                    // Populate pages with set of updated ids
                    applicationJson.setPageList(pages);
                    updatedResources.put(FieldName.PAGE_LIST, ImportExportUtils.getUpdatedPagesForApplication(application, pages, resourceMode));

                    // Populate action collections with set of updated ids
                    applicationJson.setActionCollectionList(collections);
                    updatedResources.put(FieldName.ACTION_COLLECTION_LIST, ImportExportUtils.getUpdatedCollectionsForApplication(application, collections, resourceMode));

                    // Populate actions with set of updated ids
                    applicationJson.setActionList(actions);
                    updatedResources.put(FieldName.ACTION_LIST, ImportExportUtils.getUpdatedActionsForApplication(application, actions, resourceMode));

                    // Populate datasources
                    Set<String> datasourceIds = actions.stream()
                            .map(action -> action.select(resourceMode).getDatasource().getId())
                            .filter(StringUtils::isNotBlank)
                            .collect(Collectors.toSet());

                    datasources = datasources.stream()
                            .filter(datasource -> datasourceIds.contains(datasource.getId()))
                            .collect(Collectors.toList());

                    datasources = processDatasourceConfigurationForExport(applicationJson, application, datasources, serialiseFor);

                    applicationJson.setDatasourceList(datasources);

                    // Fix references, this basically replaces the ids of resources and the reference fields with curresponding name
                    // of the resource
                    fixReferencesForExport(application, pages, collections, actions, plugins, datasources, resourceMode);

                    // Set the updated resources
                    applicationJson.setUpdatedResources(updatedResources);

                    return Tuples.of(applicationJson, currentUser);
                }).flatMap(tuple -> {

                    ApplicationJson applicationJson = tuple.getT1();
                    User currentUser = tuple.getT2();

                    // When we land here, we have the applicationJson object with all the resources populated.
                    // So we will stop the timer and send the analytics event
                    stopwatch.stopTimer();
                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID, applicationId,
                            "pageCount", applicationJson.getPageList().size(),
                            "actionCount", applicationJson.getActionList().size(),
                            "JSObjectCount", applicationJson.getActionCollectionList().size(),
                            FieldName.FLOW_NAME, stopwatch.getFlow(),
                            "executionTime", stopwatch.getExecutionTime()
                    );
                    return analyticsService.sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), currentUser.getUsername(), data)
                            .thenReturn(applicationJson);
                });
    }

    public Mono<ApplicationJson> exportApplicationById(String applicationId, String branchName) {
        return applicationService.findBranchedApplicationId(branchName, applicationId, applicationPermission.getExportPermission())
                .flatMap(branchedAppId -> exportApplicationById(branchedAppId, SerialiseApplicationObjective.SHARE));
    }

    public Mono<ExportFileDTO> getApplicationFile(String applicationId, String branchName) {
        return this.exportApplicationById(applicationId, branchName)
                .map(applicationJson -> {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.setSerializationInclusion(Include.NON_NULL);
                    String stringifiedFile = "";
                    try {
                        stringifiedFile = mapper.writerWithView(Views.ExportUnpublished.class).writeValueAsString(applicationJson);
                    } catch (JsonProcessingException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                    }
                    String applicationName = applicationJson.getExportedApplication().getName();

                    HttpHeaders responseHeaders = new HttpHeaders();
                    ContentDisposition contentDisposition = ContentDisposition
                            .builder("attachment")
                            .filename(applicationName + ".json", StandardCharsets.UTF_8)
                            .build();
                    responseHeaders.setContentDisposition(contentDisposition);
                    responseHeaders.setContentType(MediaType.APPLICATION_JSON);

                    ExportFileDTO exportFileDTO = new ExportFileDTO();
                    exportFileDTO.setApplicationResource(stringifiedFile);
                    exportFileDTO.setHttpHeaders(responseHeaders);
                    return exportFileDTO;
                });
    }

    /**
     * This function will take the Json filepart and saves the application in workspace
     *
     * @param workspaceId workspace to which the application needs to be hydrated
     * @param filePart    Json file which contains the entire application object
     * @return saved application in DB
     */
    public Mono<ApplicationImportDTO> extractFileAndSaveApplication(String workspaceId, Part filePart) {

        /*
            1. Check the validity of file part
            2. Save application to workspace
         */

        final MediaType contentType = filePart.headers().getContentType();

        if (workspaceId == null || workspaceId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            log.error("Invalid content type, {}", contentType);
            return Mono.error(new AppsmithException(AppsmithError.VALIDATION_FAILURE, INVALID_JSON_FILE));
        }

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                });

        Mono<ApplicationImportDTO> importedApplicationMono = stringifiedFile
                .flatMap(data -> {
                    /*
                    // Use JsonObject to migrate when we remove some field from the collection which is being exported
                    JsonObject json = gson.fromJson(data, JsonObject.class);
                    JsonObject update = new JsonObject();
                    update.addProperty("slug", "update_name");
                    update.addProperty("name", "update name");
                    ((JsonObject) json.get("exportedApplication")).add("name", update);
                    json.get("random") == null => true
                    ((JsonArray) json.get("pageList"))
                    */

                    Type fileType = new TypeToken<ApplicationJson>() {
                    }.getType();
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.setSerializationInclusion(Include.NON_NULL);
                    SimpleModule module = new SimpleModule();
                    //module.addSerializer(JSONObject.class, new JSONObjectSerializer());
                    //module.addDeserializer(JSONObject.class, new JSONObjectDeserializer());
                    //mapper.registerModule(module);
                    ApplicationJson jsonFile = null;
                    try {
                        jsonFile = mapper.readerWithView(Views.Import.class).readValue(data, ApplicationJson.class);
                    } catch (IOException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                    }
                    return importApplicationInWorkspace(workspaceId, jsonFile);
                            // .onErrorResume(error -> {
                            //     if (error instanceof AppsmithException) {
                            //         return Mono.error(error);
                            //     }
                            //     return Mono.error(new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, error.getMessage()));
                            // });
                })
                // Add un-configured datasource to the list to response
                .flatMap(application -> getApplicationImportDTO(application.getId(), application.getWorkspaceId(), application));

        return Mono.create(sink -> importedApplicationMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<Application> mergeApplicationJsonWithApplication(String organizationId, String applicationId,
            String branchName, ApplicationJson applicationJson, List<String> pagesToImport) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'mergeApplicationJsonWithApplication'");
    }

    @Override
    public Mono<Application> importApplicationInWorkspace(String workspaceId, ApplicationJson importedDoc) {
        return importApplicationInWorkspace(workspaceId, null, importedDoc, SerialiseApplicationObjective.SHARE);
    }

    @Override
    public Mono<Application> importApplicationInWorkspace(String workspaceId, ApplicationJson importedDoc,
            String applicationId, String branchName) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'importApplicationInWorkspace'");
    }

    public Mono<List<Datasource>> findDatasourceByApplicationId(String applicationId, String workspaceId) {
        // TODO: Investigate further why datasourcePermission.getReadPermission() is not being used.
        Mono<List<Datasource>> listMono = datasourceService.findAllByWorkspaceId(workspaceId, Optional.empty()).collectList();
        return newActionService.findAllByApplicationIdAndViewMode(applicationId, false, Optional.empty(), Optional.empty())
                .collectList()
                .zipWith(listMono)
                .flatMap(objects -> {
                    List<Datasource> datasourceList = objects.getT2();
                    List<NewAction> actionList = objects.getT1();
                    List<String> usedDatasource = actionList.stream()
                            .map(newAction -> newAction.getUnpublishedAction().getDatasource().getId())
                            .collect(Collectors.toList());

                    datasourceList.removeIf(datasource -> !usedDatasource.contains(datasource.getId()));

                    return Mono.just(datasourceList);
                });
    }

    @Override
    public Mono<ApplicationImportDTO> getApplicationImportDTO(String applicationId, String workspaceId, Application application) {
        return findDatasourceByApplicationId(applicationId, workspaceId)
                .map(datasources -> {
                    ApplicationImportDTO applicationImportDTO = new ApplicationImportDTO();
                    applicationImportDTO.setApplication(application);
                    Boolean isUnConfiguredDatasource = datasources.stream().anyMatch(datasource -> Boolean.FALSE.equals(datasource.getIsConfigured()));
                    if (Boolean.TRUE.equals(isUnConfiguredDatasource)) {
                        applicationImportDTO.setIsPartialImport(true);
                        applicationImportDTO.setUnConfiguredDatasourceList(datasources);
                    } else {
                        applicationImportDTO.setIsPartialImport(false);
                    }
                    return applicationImportDTO;
                });
    }

    Mono<List<Datasource>> checkIfAllPluginInstalled(List<Datasource> datasourceToImportList, Mono<Map<String, Plugin>> installedPluginReferenceToPluginMapMono) {
        return Flux.fromIterable(datasourceToImportList)
                .zipWith(installedPluginReferenceToPluginMapMono.repeat())
                .flatMap(tuple -> {
                    Datasource datasourceToImport = tuple.getT1();
                    Map<String, Plugin> installedPluginReferenceToPluginMap = tuple.getT2();
                    if (!installedPluginReferenceToPluginMap.containsKey(datasourceToImport.getPluginId())) {
                        log.error("Unable to find the plugin {}, available plugins are: {}", datasourceToImport.getPluginId(), installedPluginReferenceToPluginMap.keySet());
                        return Mono.error(new AppsmithException(AppsmithError.UNKNOWN_PLUGIN_REFERENCE, datasourceToImport.getPluginId()));
                    }
                    return Mono.just(datasourceToImport);
                })
                .collectList();
    }

    public static class ResourceMapper {

        private final Map<Class<?>, Map<String, String>> resourceMap = new ConcurrentHashMap<>();

        public <T>void setResourceId(Class<T> clazz, String name, String id) {
            if(!resourceMap.containsKey(clazz)) {
                resourceMap.putIfAbsent(clazz, new ConcurrentHashMap<>());
            }
            resourceMap.get(clazz).put(name, id);
        }

        public <T> String getResourceId(Class<T> clazz, String name) {
            return resourceMap.get(clazz).get(name);
        }
    }

    @Data
    public static class ImportContext<T extends BaseDomain & PublishableResource> {
        private List<T> resourcesToImport;
        private List<T> existingResources;
        private List<T> resourcesToCreate;
        private List<T> resourcesToUpdate;
        private List<T> resourcesToDelete;
        private Map<String, String> unpublishedResourceNameToIdMap;

        public ImportContext(List<T> resourcesToImport, List<T> existingResources) {
            this.resourcesToImport = resourcesToImport;
            this.existingResources = existingResources;
            this.resourcesToCreate = getResourcesToCreate(resourcesToImport);
            this.resourcesToUpdate = getResourcesToUpdate(resourcesToImport, existingResources);
            Set<String> resourcesToUpdateIds = resourcesToUpdate.stream().map(BaseDomain::getId).collect(Collectors.toSet());
            this.resourcesToDelete = getResourcesToDelete(resourcesToUpdateIds, existingResources);
            this.unpublishedResourceNameToIdMap = getUnpublishedResourceNameToIdMap(resourcesToImport);
        }

        private List<T> getResourcesToUpdate(List<T> resources, List<T> existingResources) {
            return resources.stream()
                    .filter(resource -> resource.getId() != null)
                    .collect(Collectors.toList());
        }
    
        private Map<String, String> getUnpublishedResourceNameToIdMap(List<T> resources) {
            // Create a map of resource name to resource id
            return resources.stream()
                    .collect(Collectors.toMap(resource -> resource.select(ResourceModes.EDIT).getName(), 
                            resource -> Optional.ofNullable(resource.getId()).orElse(resource.getExplicitId()))); 
        }
    
        private List<T> getResourcesToCreate(List<T> resources) {
            // Pages to create are the ones that have an explicit id
            return resources.stream()
                    .filter(resource -> resource.getExplicitId() != null)
                    .collect(Collectors.toList());
        }

        private List<T> getResourcesToDelete(Set<String> resourceToUpdateIds, List<T> existingResources) {
            // Pages to delete are the ones that are not in the list of pages to update
            return existingResources.stream()
                    .filter(resource -> !resourceToUpdateIds.contains(resource.getId()))
                    .collect(Collectors.toList());
        }
    }

    public static abstract class ImportProcessor<T extends BaseDomain & PublishableResource> {

        protected final ImportContext<T> context;
        protected final Map<String, T> existingPublishedResourceNameToResourceMap;
        protected final Map<String, T> existingUnpublishedResourceNameToResourceMap;
        protected final List<T> resourcesToImport;
        protected final List<T> existingResources;

        public ImportProcessor(List<T> resourcesToImport, List<T> existingResources) {
            this.resourcesToImport = resourcesToImport;
            this.existingResources = existingResources;
        }

        public abstract void preContextCreated();
        public abstract void postContextCreated(Map<Class<T>, ImportContext<T>> contextMap);
        public abstract void importEntity();

        private void buildContext() {
            List<T> resourcesToUpdateOrCreate = resourcesToImport.stream()
                    .map(resource -> {
                        String resourceName = resource.select(ResourceModes.EDIT).getName();
                        buildContext(resource.select(ResourceModes.EDIT),
                        existingPublishedResourceNameToResourceMap.get(resourceName),
                        existingUnpublishedResourceNameToResourceMap.get(resourceName));
                        return resource;
                    })
                    .collect(Collectors.toList());

            context = new ImportContext<>(resourcesToUpdateOrCreate, existingResources);
        }

        private T buildContext(PublishableDTO resourceDTO, T existingPublishedResource, T existingUnpublishedResource) {
            T resourceToImport = null;
            if(existingUnpublishedResource != null) {
                // Page exists, update it
                resourceToImport = existingUnpublishedResource;
            } else if(existingPublishedResource != null && ImportExportUtils.isResourceDeleted(existingPublishedResource.select(ResourceModes.EDIT))) {
                // Page exists, update it
                resourceToImport = existingUnpublishedResource;
            } else {
                // If the page does not exist, create it
                resourceToImport = newObject();
            }
            copyNestedNonNullProperties(resourceDTO, resourceToImport.select(ResourceModes.EDIT));  
            return resourceToImport;
        }

        protected abstract T newObject();

        public static <T extends BaseDomain & PublishableResource> void callPreContextCreated(List<ImportProcessor<T>> importProcessors) {
            importProcessors.forEach(importProcessor -> importProcessor.preContextCreated());
        }

        public static void callBuildContext(Map<Class<? extends BaseDomain>, ImportProcessor<? extends BaseDomain>> importProcessors) {
            importProcessors.values().forEach(ImportProcessor::buildContext);
        }

        public static <T extends BaseDomain & PublishableResource> void callPostContextCreated(List<ImportProcessor<T>> importProcessors, Map<Class<T>, ImportContext<T>> contextMap) {
            importProcessors.forEach(importProcessor -> importProcessor.postContextCreated(contextMap));
        }
    }

    public static class PageImportProcessor extends ImportProcessor<NewPage> {

        public PageImportProcessor(ApplicationJson applicationJson, List<NewPage> existingPages) {
            super(Collections.unmodifiableList(applicationJson.getPageList().stream().toList()), existingPages);
            // Compute maps for existing pages
            existingPublishedResourceNameToResourceMap = ImportExportUtils.computePublishedPageNameToPageMap(existingPages);
            existingUnpublishedResourceNameToResourceMap = ImportExportUtils.computeUnpublishedPageNameToPageMap(existingPages);
        }

        @Override
        protected NewPage newObject() {
            NewPage pageToImport = newObject();
            pageToImport.setUnpublishedPage(new PageDTO());
            pageToImport.setExplicitId(new ObjectId().toString());
            return pageToImport;
        }

        @Override
        public void preContextCreated() {
            // TODO Auto-generated method stub
            throw new UnsupportedOperationException("Unimplemented method 'preContextCreated'");
        }

        @Override
        public void postContextCreated(Map<Class<NewPage>, ImportContext<NewPage>> contextMap) {
            // TODO Auto-generated method stub
            throw new UnsupportedOperationException("Unimplemented method 'postContextCreated'");
        }

        @Override
        public void importEntity() {
            // TODO Auto-generated method stub
            throw new UnsupportedOperationException("Unimplemented method 'importEntity'");
        }

    }

    public Mono<Application> importApplicationInWorkspace(final String workspaceId, String applicationId, final ApplicationJson applicationJson, SerialiseApplicationObjective serialiseFor) {

        // Set workspace id
        Mono<Application> applicationToImportMono = Mono.just(applicationJson.getExportedApplication())
                .map(application -> {
                    application.setWorkspaceId(workspaceId);
                    return application;
                }).cache();

        // Set explicit application id in case import creates a new application
        String explicitApplicationId = new ObjectId().toString();

        // fetch workspace
        Mono<Workspace> workspaceMono = importExportHelper.fetchWorkspace(workspaceId, serialiseFor);

        // Fetch or create application
        Mono<Application> importedApplicationMono = applicationToImportMono
                .flatMap(applicationToImport -> {
                    return importExportHelper.fetchOrCreateApplicationForImport(applicationId, explicitApplicationId, applicationToImport, serialiseFor);
                })
                .flatMap(application -> themeService.importThemesToApplication(application, applicationJson))
                .cache();

        // Fetch plugins from DB
        Mono<List<Plugin>> installedPluginListMono = pluginRepository
                .findAll()
                .collectList()
                .cache();

        // Fetch existing pages from DB
        Mono<List<NewPage>> existingPagesMono = importedApplicationMono
                .flatMap(application -> newPageService
                            .findNewPagesByApplicationId(application.getId(), pagePermission.getEditPermission())
                            .collectList())
                            .cache();

        // Fetch existing actions from DB
        Mono<List<NewAction>> existingActionsMono = importedApplicationMono
                .flatMap(application -> newActionRepository
                            .findByApplicationId(application.getId())
                            .collectList())
                            .cache();

        // Fetch existing collections from DB
        Mono<List<ActionCollection>> existingCollectionsMono = importedApplicationMono
                .flatMap(application -> actionCollectionRepository
                            .findByApplicationId(application.getId())
                            .collectList())
                            .cache();

        // Fetch existing datasources
        Mono<List<Datasource>> existingDatasourcesMono = importExportHelper.fetchDatasourcesForWorkspace(workspaceId, false, serialiseFor)
                .collectList().cache();

        // Verify if all plugins are installed, required by the datasources to be imported
        Mono<Map<String, Plugin>> installedPluginReferenceToPluginMapMono = installedPluginListMono.map(ImportExportUtils::computePluginReferenceToPluginMap).cache();
        Mono<List<Datasource>> datasourceToImportListMono = Mono.just(applicationJson.getDatasourceList()).map(Collections::unmodifiableList).cache()
                .flatMap(datasourceToImportList -> {
                    return checkIfAllPluginInstalled(datasourceToImportList, installedPluginReferenceToPluginMapMono);
                })
                .map(datasources -> {
                    return processDatasourceConfigurationForImport(applicationJson, datasources);
                })
                .cache();

        // ImportDatasources
        Mono<Map<String, Datasource>> existingDatasourceNameToDatasourceMapMono = existingDatasourcesMono.map(ImportExportUtils::computeDatasourceNameToDatasourceMap).cache(); 
        Mono<List<Datasource>> importedDatasourceListMono = Mono.zip(datasourceToImportListMono, existingDatasourceNameToDatasourceMapMono, installedPluginReferenceToPluginMapMono)
                .flatMap((tuple) -> {
                    List<Datasource> datasourceToImportList = tuple.getT1();
                    Map<String, Datasource> existingDatasourceNameToDatasourceMap = tuple.getT2();
                    Map<String, Plugin> installedPluginReferenceToPluginMap = tuple.getT3();
                    return importDatasources(workspaceId, datasourceToImportList, existingDatasourceNameToDatasourceMap, installedPluginReferenceToPluginMap);
                }).cache();

        Mono<Map<Class<?>, ImportProcessor<?>>> importProcessorsMono = Mono.zip(existingPagesMono, 
                existingActionsMono,
                existingCollectionsMono)
                .map((tuple) -> {
                    Map<Class<?>, ImportProcessor<?>> importProcessors = new HashMap<>();
                    importProcessors.put(NewPage.class, new PageImportProcessor(applicationJson, tuple.getT1()));
                    importProcessors.put(NewAction.class, new ActionImportProcessor(applicationJson, tuple.getT2()));
                    importProcessors.put(ActionCollection.class, new ActionCollectionImportProcessor(applicationJson, tuple.getT3()));
                    return importProcessors;
                }).cache();

        importProcessorsMono.map(importProcessors -> {
            ImportProcessor.callPreContextCreated(importProcessors.values());
            return 0;
        });

        return importedDatasourceListMono.then(importedApplicationMono);
    }

    private Mono<List<Datasource>> importDatasources(String workspaceId, List<Datasource> datasourcesToImport, Map<String, Datasource> existingDatasourceNameToDatasourceMap, Map<String, Plugin> pluginReferenceToPluginMap) {
        return Flux.fromIterable(datasourcesToImport)
                .flatMap(datasource -> importDatasource(workspaceId, datasource, existingDatasourceNameToDatasourceMap, pluginReferenceToPluginMap))
                .collectList();
    }

    private Mono<Datasource> importDatasource(String workspaceId, Datasource datasourceToImport, Map<String, Datasource> existingDatasourceNameToDatasourceMap, Map<String, Plugin> pluginReferenceToPluginMap) {

        Datasource existingDatasource = existingDatasourceNameToDatasourceMap.get(datasourceToImport.getName());
        String datasourceToImportPluginName = datasourceToImport.getPluginId();
        String datasourceToImportPluginId = pluginReferenceToPluginMap.get(datasourceToImportPluginName).getId();

        if(existingDatasource == null) {
            // If the datasource does not exist, create it
            datasourceToImport.setExplicitId(new ObjectId().toString());
            log.debug("Importing datasource with id: {}", datasourceToImport.getExplicitId());
            datasourceToImport.setWorkspaceId(workspaceId);
            datasourceToImport.setPluginId(pluginReferenceToPluginMap.get(datasourceToImport.getPluginId()).getId());

            DatasourceConfiguration datasourceConfig = datasourceToImport.getDatasourceConfiguration();
            AuthenticationResponse authResponse = new AuthenticationResponse();
            if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
                copyNestedNonNullProperties(
                        datasourceConfig.getAuthentication().getAuthenticationResponse(), authResponse);
                datasourceConfig.getAuthentication().setAuthenticationResponse(null);
                datasourceConfig.getAuthentication().setAuthenticationType(null);
            }
            datasourceToImport.setIsConfigured(datasourceConfig != null && datasourceConfig.getAuthentication() != null);

            return datasourceService.create(datasourceToImport)
                    .as(transactionalOperator::transactional);
        }

        if(!datasourceToImportPluginId.equals(existingDatasource.getPluginId())){
            // No matching existing datasource found, so create a new one.
            datasourceToImport.setExplicitId(new ObjectId().toString());
            log.debug("Importing datasource with id: {}", datasourceToImport.getExplicitId());
            datasourceToImport.setWorkspaceId(workspaceId);
            datasourceToImport.setPluginId(pluginReferenceToPluginMap.get(datasourceToImport.getPluginId()).getId());

            DatasourceConfiguration datasourceConfig = datasourceToImport.getDatasourceConfiguration();
            AuthenticationResponse authResponse = new AuthenticationResponse();
            if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
                copyNestedNonNullProperties(
                        datasourceConfig.getAuthentication().getAuthenticationResponse(), authResponse);
                datasourceConfig.getAuthentication().setAuthenticationResponse(null);
                datasourceConfig.getAuthentication().setAuthenticationType(null);
            }
            datasourceToImport.setIsConfigured(datasourceConfig != null && datasourceConfig.getAuthentication() != null);

            return Mono.just(datasourceToImport).zipWith(importExportHelper.getUniqueSuffixForDuplicateNameEntity(datasourceToImport, workspaceId), (datsource, name) -> {
                datsource.setName(name);
                return datsource;
            }).flatMap(datasource -> datasourceService.create(datasource))
                    .as(transactionalOperator::transactional);
        }

        return Mono.just(existingDatasource);
     }

    @Override
    public Mono<ApplicationJson> exportApplicationById(String applicationId,
            SerialiseApplicationObjective serialiseFor) {
        return exportApplicationById(applicationId, serialiseFor, ResourceModes.EDIT);
    }
}

/**
 * DTO class to hold the application and the list of pages to be exported.
 */
@Getter
@AllArgsConstructor
class ApplicationAndPagesDTO {
    private Application application;
    private List<String> pageIds;
}