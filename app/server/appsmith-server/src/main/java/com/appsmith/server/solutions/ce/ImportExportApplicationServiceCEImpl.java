package com.appsmith.server.solutions.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.converters.GsonISOStringToInstantConverter;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ExamplesOrganizationCloner;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Type;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;

@Slf4j
@RequiredArgsConstructor
public class ImportExportApplicationServiceCEImpl implements ImportExportApplicationServiceCE {

    private final DatasourceService datasourceService;
    private final SessionUserService sessionUserService;
    private final NewActionRepository newActionRepository;
    private final DatasourceRepository datasourceRepository;
    private final PluginRepository pluginRepository;
    private final OrganizationService organizationService;
    private final ApplicationService applicationService;
    private final NewPageService newPageService;
    private final ApplicationPageService applicationPageService;
    private final NewPageRepository newPageRepository;
    private final NewActionService newActionService;
    private final SequenceService sequenceService;
    private final ExamplesOrganizationCloner examplesOrganizationCloner;
    private final ActionCollectionRepository actionCollectionRepository;
    private final ActionCollectionService actionCollectionService;
    private final ThemeRepository themeRepository;

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";

    private enum PublishType {
        UNPUBLISHED, PUBLISHED
    }

    /**
     * This function will give the application resource to rebuild the application in import application flow
     *
     * @param applicationId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationJson> exportApplicationById(String applicationId, SerialiseApplicationObjective serialiseFor) {

        // Start the stopwatch to log the execution time
        Stopwatch processStopwatch = new Stopwatch("Export application, with id: " + applicationId);
        /*
            1. Fetch application by id
            2. Fetch pages from the application
            3. Fetch datasources from organization
            4. Fetch actions from the application
            5. Filter out relevant datasources using actions reference
            6. Fetch action collections from the application
         */
        ApplicationJson applicationJson = new ApplicationJson();
        Map<String, String> pluginMap = new HashMap<>();
        Map<String, String> datasourceIdToNameMap = new HashMap<>();
        Map<String, String> pageIdToNameMap = new HashMap<>();
        Map<String, String> actionIdToNameMap = new HashMap<>();
        Map<String, String> collectionIdToNameMap = new HashMap<>();

        if (applicationId == null || applicationId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        Mono<Application> applicationMono = SerialiseApplicationObjective.VERSION_CONTROL.equals(serialiseFor)
                ? applicationService.findById(applicationId, MANAGE_APPLICATIONS)
                : applicationService.findById(applicationId, EXPORT_APPLICATIONS)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId))
                );

        // Set json schema version which will be used to check the compatibility while importing the JSON
        applicationJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
        applicationJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);

        return pluginRepository
                .findAll()
                .map(plugin -> {
                    pluginMap.put(plugin.getId(), plugin.getPluginName() == null ? plugin.getPackageName() : plugin.getPluginName());
                    return plugin;
                })
                .then(applicationMono)
                .flatMap(application -> themeRepository.findById(application.getEditModeThemeId())
                        .zipWith(themeRepository.findById(application.getPublishedModeThemeId()))
                        .map(themesTuple -> {
                            Theme editModeTheme = exportTheme(themesTuple.getT1());
                            Theme publishedModeTheme = exportTheme(themesTuple.getT2());
                            applicationJson.setEditModeTheme(editModeTheme);
                            applicationJson.setPublishedTheme(publishedModeTheme);
                            return themesTuple;
                        }).thenReturn(application))
                .flatMap(application -> {

                    // Assign the default page names for published and unpublished field in applicationJson object
                    ApplicationPage unpublishedDefaultPage = application.getPages()
                            .stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);

                    if (unpublishedDefaultPage == null) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DEFAULT_PAGE_NAME));
                    } else {
                        applicationJson.setUnpublishedDefaultPageName(unpublishedDefaultPage.getId());
                    }

                    if (application.getPublishedPages() != null) {
                        application.getPublishedPages()
                                .stream()
                                .filter(ApplicationPage::getIsDefault)
                                .findFirst()
                                .ifPresent(
                                        publishedDefaultPage -> applicationJson.setPublishedDefaultPageName(publishedDefaultPage.getId())
                                );
                    }

                    // Refactor application to remove the ids
                    final String organizationId = application.getOrganizationId();
                    removeUnwantedFieldsFromApplicationDuringExport(application);
                    examplesOrganizationCloner.makePristine(application);
                    applicationJson.setExportedApplication(application);

                    Set<String> dbNamesUsedInActions = new HashSet<>();

                    return newPageRepository.findByApplicationId(applicationId, MANAGE_PAGES)
                            .collectList()
                            .flatMap(newPageList -> {
                                // Extract mongoEscapedWidgets from pages and save it to applicationJson object as this
                                // field is JsonIgnored. Also remove any ids those are present in the page objects

                                Map<String, Set<String>> publishedMongoEscapedWidgetsNames = new HashMap<>();
                                Map<String, Set<String>> unpublishedMongoEscapedWidgetsNames = new HashMap<>();
                                newPageList.forEach(newPage -> {
                                    if (newPage.getUnpublishedPage() != null) {
                                        pageIdToNameMap.put(
                                                newPage.getId() + PublishType.UNPUBLISHED, newPage.getUnpublishedPage().getName()
                                        );
                                        PageDTO unpublishedPageDTO = newPage.getUnpublishedPage();
                                        if (StringUtils.equals(
                                                applicationJson.getUnpublishedDefaultPageName(), newPage.getId())
                                        ) {
                                            applicationJson.setUnpublishedDefaultPageName(unpublishedPageDTO.getName());
                                        }
                                        if (unpublishedPageDTO.getLayouts() != null) {

                                            unpublishedPageDTO.getLayouts().forEach(layout -> {
                                                layout.setId(unpublishedPageDTO.getName());
                                                unpublishedMongoEscapedWidgetsNames
                                                        .put(layout.getId(), layout.getMongoEscapedWidgetNames());

                                            });
                                        }
                                    }

                                    if (newPage.getPublishedPage() != null) {
                                        pageIdToNameMap.put(
                                                newPage.getId() + PublishType.PUBLISHED, newPage.getPublishedPage().getName()
                                        );
                                        PageDTO publishedPageDTO = newPage.getPublishedPage();
                                        if (applicationJson.getPublishedDefaultPageName() != null &&
                                                StringUtils.equals(
                                                        applicationJson.getPublishedDefaultPageName(), newPage.getId()
                                                )
                                        ) {
                                            applicationJson.setPublishedDefaultPageName(publishedPageDTO.getName());
                                        }

                                        if (publishedPageDTO.getLayouts() != null) {
                                            publishedPageDTO.getLayouts().forEach(layout -> {
                                                layout.setId(publishedPageDTO.getName());
                                                publishedMongoEscapedWidgetsNames.put(layout.getId(), layout.getMongoEscapedWidgetNames());
                                            });
                                        }
                                    }
                                    newPage.setApplicationId(null);
                                    examplesOrganizationCloner.makePristine(newPage);
                                });
                                applicationJson.setPageList(newPageList);
                                applicationJson.setPublishedLayoutmongoEscapedWidgets(publishedMongoEscapedWidgetsNames);
                                applicationJson.setUnpublishedLayoutmongoEscapedWidgets(unpublishedMongoEscapedWidgetsNames);
                                return datasourceRepository
                                        .findAllByOrganizationId(organizationId, AclPermission.MANAGE_DATASOURCES)
                                        .collectList();
                            })
                            .flatMapMany(datasourceList -> {
                                datasourceList.forEach(datasource ->
                                        datasourceIdToNameMap.put(datasource.getId(), datasource.getName()));

                                applicationJson.setDatasourceList(datasourceList);
                                return actionCollectionRepository
                                        .findByApplicationId(applicationId, MANAGE_ACTIONS, null);
                            })
                            .map(actionCollection -> {
                                // Remove references to ids since the serialized version does not have this information
                                actionCollection.setOrganizationId(null);
                                actionCollection.setPolicies(null);
                                actionCollection.setApplicationId(null);
                                actionCollection.setUpdatedAt(null);

                                // Set unique ids for actionCollection, also populate collectionIdToName map which will
                                // be used to replace collectionIds in action
                                if (actionCollection.getUnpublishedCollection() != null) {
                                    ActionCollectionDTO actionCollectionDTO = actionCollection.getUnpublishedCollection();
                                    actionCollectionDTO.setPageId(pageIdToNameMap.get(actionCollectionDTO.getPageId() + PublishType.UNPUBLISHED));
                                    actionCollectionDTO.setPluginId(pluginMap.get(actionCollectionDTO.getPluginId()));

                                    final String updatedCollectionId = actionCollectionDTO.getPageId() + "_" + actionCollectionDTO.getName();
                                    collectionIdToNameMap.put(actionCollection.getId(), updatedCollectionId);
                                    actionCollection.setId(updatedCollectionId);
                                }
                                if (actionCollection.getPublishedCollection() != null) {
                                    ActionCollectionDTO actionCollectionDTO = actionCollection.getPublishedCollection();
                                    actionCollectionDTO.setPageId(pageIdToNameMap.get(actionCollectionDTO.getPageId() + PublishType.PUBLISHED));
                                    actionCollectionDTO.setPluginId(pluginMap.get(actionCollectionDTO.getPluginId()));

                                    if (!collectionIdToNameMap.containsValue(actionCollection.getId())) {
                                        final String updatedCollectionId = actionCollectionDTO.getPageId() + "_" + actionCollectionDTO.getName();
                                        collectionIdToNameMap.put(actionCollection.getId(), updatedCollectionId);
                                        actionCollection.setId(updatedCollectionId);
                                    }
                                }

                                return actionCollection;
                            })
                            .collectList()
                            .flatMapMany(actionCollections -> {
                                // This object won't have the list of actions but we don't care about that today
                                // Because the actions will have a reference to the collection
                                applicationJson.setActionCollectionList(actionCollections);
                                return newActionRepository
                                        .findByApplicationId(applicationId, MANAGE_ACTIONS, null);
                            })
                            .map(newAction -> {
                                newAction.setPluginId(pluginMap.get(newAction.getPluginId()));
                                newAction.setOrganizationId(null);
                                newAction.setPolicies(null);
                                newAction.setApplicationId(null);
                                newAction.setUpdatedAt(null);
                                dbNamesUsedInActions.add(
                                        sanitizeDatasourceInActionDTO(newAction.getPublishedAction(), datasourceIdToNameMap, pluginMap, null, true)
                                );
                                dbNamesUsedInActions.add(
                                        sanitizeDatasourceInActionDTO(newAction.getUnpublishedAction(), datasourceIdToNameMap, pluginMap, null, true)
                                );

                                // Set unique id for action
                                if (newAction.getUnpublishedAction() != null) {
                                    ActionDTO actionDTO = newAction.getUnpublishedAction();
                                    actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId() + PublishType.UNPUBLISHED));

                                    if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                                            && collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                        actionDTO.setCollectionId(collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                    }

                                    final String updatedActionId = actionDTO.getPageId() + "_" + actionDTO.getName();
                                    actionIdToNameMap.put(newAction.getId(), updatedActionId);
                                    newAction.setId(updatedActionId);
                                }
                                if (newAction.getPublishedAction() != null) {
                                    ActionDTO actionDTO = newAction.getPublishedAction();
                                    actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId() + PublishType.PUBLISHED));

                                    if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                                            && collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                        actionDTO.setCollectionId(collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                    }

                                    if (!actionIdToNameMap.containsValue(newAction.getId())) {
                                        final String updatedActionId = actionDTO.getPageId() + "_" + actionDTO.getName();
                                        actionIdToNameMap.put(newAction.getId(), updatedActionId);
                                        newAction.setId(updatedActionId);
                                    }
                                }
                                return newAction;
                            })
                            .collectList()
                            .map(actionList -> {
                                applicationJson.setActionList(actionList);

                                // This is where we're removing global datasources that are unused in this application
                                applicationJson
                                        .getDatasourceList()
                                        .removeIf(datasource -> !dbNamesUsedInActions.contains(datasource.getName()));

                                // Save decrypted fields for datasources
                                Map<String, DecryptedSensitiveFields> decryptedFields = new HashMap<>();
                                applicationJson.getDatasourceList().forEach(datasource -> {
                                    decryptedFields.put(datasource.getName(), getDecryptedFields(datasource));
                                    datasource.setId(null);
                                    datasource.setOrganizationId(null);
                                    datasource.setPluginId(pluginMap.get(datasource.getPluginId()));
                                    datasource.setStructure(null);
                                    if (SerialiseApplicationObjective.VERSION_CONTROL.equals(serialiseFor)) {
                                        // If we are exporting the doc for git functionality, remove the datasourceConfiguration
                                        // object as user will configure it once imported to other instance
                                        datasource.setDatasourceConfiguration(null);
                                    } else if (datasource.getDatasourceConfiguration() != null) {
                                        datasource.getDatasourceConfiguration().setAuthentication(null);
                                    }
                                });

                                // Caution : Please don't serialise the credentials if we are serialising for git version control
                                if (SerialiseApplicationObjective.VERSION_CONTROL.equals(serialiseFor)) {
                                    applicationJson.setDecryptedFields(null);
                                } else {
                                    applicationJson.setDecryptedFields(decryptedFields);
                                }

                                // Update ids for layoutOnLoadAction
                                for (NewPage newPage : applicationJson.getPageList()) {
                                    if (!CollectionUtils.isEmpty(newPage.getUnpublishedPage().getLayouts())) {

                                        newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                                            if (layout.getLayoutOnLoadActions() != null) {
                                                layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                                                        .forEach(actionDTO -> {
                                                            if (actionIdToNameMap.containsKey(actionDTO.getId())) {
                                                                actionDTO.setId(actionIdToNameMap.get(actionDTO.getId()));
                                                            }
                                                            if (collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                                                actionDTO.setCollectionId(collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                                            }
                                                        })
                                                );
                                            }
                                        });
                                    }

                                    if (newPage.getPublishedPage() != null
                                            && !CollectionUtils.isEmpty(newPage.getPublishedPage().getLayouts())) {

                                        newPage.getPublishedPage().getLayouts().forEach(layout -> {
                                            if (layout.getLayoutOnLoadActions() != null) {
                                                layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                                                        .forEach(actionDTO -> {
                                                            if (actionIdToNameMap.containsKey(actionDTO.getId())) {
                                                                actionDTO.setId(actionIdToNameMap.get(actionDTO.getId()));
                                                            }
                                                            if (collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                                                actionDTO.setCollectionId(collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                                            }
                                                        })
                                                );
                                            }
                                        });
                                    }
                                }

                                processStopwatch.stopAndLogTimeInMillis();
                                return applicationJson;
                            });
                })
                .then()
                .thenReturn(applicationJson);
    }

    public Mono<ApplicationJson> exportApplicationById(String applicationId, String branchName) {
        return applicationService.findBranchedApplicationId(branchName, applicationId, EXPORT_APPLICATIONS)
                .flatMap(branchedAppId -> exportApplicationById(branchedAppId, SerialiseApplicationObjective.SHARE));
    }

    /**
     * This function will take the Json filepart and saves the application in organization
     *
     * @param orgId    organization to which the application needs to be hydrated
     * @param filePart Json file which contains the entire application object
     * @return saved application in DB
     */
    public Mono<Application> extractFileAndSaveApplication(String orgId, Part filePart) {

        /*
            1. Check the validity of file part
            2. Save application to organization
         */

        final MediaType contentType = filePart.headers().getContentType();

        if (orgId == null || orgId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
        }

        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return Mono.error(new AppsmithException(AppsmithError.VALIDATION_FAILURE, INVALID_JSON_FILE));
        }

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                });

        Mono<Application> importedApplicationMono = stringifiedFile
                .flatMap(data -> {
                    Gson gson = new GsonBuilder()
                            .registerTypeAdapter(Instant.class, new GsonISOStringToInstantConverter())
                            .create();


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
                    ApplicationJson jsonFile = gson.fromJson(data, fileType);
                    return importApplicationInOrganization(orgId, jsonFile);
                })
                .onErrorResume(error -> {
                    if (error instanceof AppsmithException) {
                        return Mono.error(error);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR, orgId, error.getMessage()));
                });

        return Mono.create(sink -> importedApplicationMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    /**
     * This function will save the application to organisation from the application resource
     *
     * @param organizationId organization to which application is going to be stored
     * @param importedDoc    application resource which contains necessary information to save the application
     * @return saved application in DB
     */
    public Mono<Application> importApplicationInOrganization(String organizationId, ApplicationJson importedDoc) {
        return importApplicationInOrganization(organizationId, importedDoc, null, null);
    }

    /**
     * This function will take the application reference object to hydrate the application in mongoDB
     *
     * @param organizationId organization to which application is going to be stored
     * @param applicationJson    application resource which contains necessary information to save the application
     * @param applicationId  application which needs to be saved with the updated resources
     * @return Updated application
     */
    public Mono<Application> importApplicationInOrganization(String organizationId,
                                                             ApplicationJson applicationJson,
                                                             String applicationId,
                                                             String branchName) {

        /*
            1. Migrate resource to latest schema
            2. Fetch organization by id
            3. Extract datasources and update plugin information
            4. Create new datasource if same datasource is not present
            5. Extract and save application
            6. Extract and save pages in the application
            7. Extract and save actions in the application
         */

        // Start the stopwatch to log the execution time
        Stopwatch processStopwatch = new Stopwatch("Import application");

        ApplicationJson importedDoc = JsonSchemaMigration.migrateApplicationToLatestSchema(applicationJson);

        Map<String, String> pluginMap = new HashMap<>();
        Map<String, String> datasourceMap = new HashMap<>();
        Map<String, NewPage> pageNameMap = new HashMap<>();
        Map<String, String> actionIdMap = new HashMap<>();
        Map<String, Map<String, String>> unpublishedActionCollectionIdMap = new HashMap<>();
        Map<String, Map<String, String>> publishedActionCollectionIdMap = new HashMap<>();
        Map<String, String> unpublishedActionIdToCollectionIdMap = new HashMap<>();
        Map<String, String> publishedActionIdToCollectionIdMap = new HashMap<>();

        Application importedApplication = importedDoc.getExportedApplication();
        List<Datasource> importedDatasourceList = importedDoc.getDatasourceList();
        List<NewPage> importedNewPageList = importedDoc.getPageList();
        List<NewAction> importedNewActionList = importedDoc.getActionList();
        List<ActionCollection> importedActionCollectionList = importedDoc.getActionCollectionList();

        Mono<User> currUserMono = sessionUserService.getCurrentUser().cache();
        final Flux<Datasource> existingDatasourceFlux = datasourceRepository
                .findAllByOrganizationId(organizationId, AclPermission.MANAGE_DATASOURCES)
                .cache();

        String errorField = "";
        if (CollectionUtils.isEmpty(importedNewPageList)) {
            errorField = FieldName.PAGES;
        } else if (importedApplication == null) {
            errorField = FieldName.APPLICATION;
        } else if (importedNewActionList == null) {
            errorField = FieldName.ACTIONS;
        } else if (importedDatasourceList == null) {
            errorField = FieldName.DATASOURCE;
        }

        if (!errorField.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, errorField, INVALID_JSON_FILE));
        }

        Mono<Application> importedApplicationMono = pluginRepository.findAll()
                .map(plugin -> {
                    final String pluginReference = plugin.getPluginName() == null ? plugin.getPackageName() : plugin.getPluginName();
                    pluginMap.put(pluginReference, plugin.getId());
                    return plugin;
                })
                .then(importThemes(importedApplication, importedDoc))
                .then(organizationService.findById(organizationId, AclPermission.ORGANIZATION_MANAGE_APPLICATIONS))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ORGANIZATION, organizationId))
                )
                .flatMap(organization -> {
                    // Check if the request is to hydrate the application to DB for particular branch
                    // Application id will be present for GIT sync
                    if (applicationId != null) {
                        // No need to hydrate the datasource as we expect user will configure the datasource
                        return existingDatasourceFlux.collectList();
                    }
                    return Mono.just(new ArrayList<Datasource>());
                })
                .flatMap(existingDatasources -> {
                    Map<String, Datasource> savedDatasourcesGitIdToDatasourceMap = new HashMap<>();

                    existingDatasources.stream()
                            .filter(datasource -> datasource.getGitSyncId() != null)
                            .forEach(datasource -> savedDatasourcesGitIdToDatasourceMap.put(datasource.getGitSyncId(), datasource));

                    return Flux.fromIterable(importedDatasourceList)
                            // Check for duplicate datasources to avoid duplicates in target organization
                            .flatMap(datasource -> {

                                // Check if the datasource has gitSyncId and if it's already in DB
                                if (datasource.getGitSyncId() != null
                                        && savedDatasourcesGitIdToDatasourceMap.containsKey(datasource.getGitSyncId())) {

                                    // Since the resource is already present in DB, just update resource
                                    Datasource existingDatasource = savedDatasourcesGitIdToDatasourceMap.get(datasource.getGitSyncId());
                                    datasource.setId(null);
                                    // Don't update datasource config as the saved datasource is already configured by user
                                    // for this instance
                                    datasource.setDatasourceConfiguration(null);
                                    datasource.setPluginId(null);
                                    AppsmithBeanUtils.copyNestedNonNullProperties(datasource, existingDatasource);
                                    existingDatasource.setStructure(null);
                                    return datasourceService.update(existingDatasource.getId(), existingDatasource);
                                }

                                // This is explicitly copied over from the map we created before
                                datasource.setPluginId(pluginMap.get(datasource.getPluginId()));
                                datasource.setOrganizationId(organizationId);

                                // Check if any decrypted fields are present for datasource
                                if (importedDoc.getDecryptedFields()!= null
                                        && importedDoc.getDecryptedFields().get(datasource.getName()) != null) {

                                    DecryptedSensitiveFields decryptedFields =
                                            importedDoc.getDecryptedFields().get(datasource.getName());

                                    updateAuthenticationDTO(datasource, decryptedFields);
                                }
                                return createUniqueDatasourceIfNotPresent(existingDatasourceFlux, datasource, organizationId, applicationId);
                            })
                            .map(datasource -> {
                                datasourceMap.put(datasource.getName(), datasource.getId());
                                return datasource;
                            })
                            .collectList();
                })
                .then(
                        // 1. Assign the policies for the imported application
                        // 2. Check for possible duplicate names,
                        // 3. Save the updated application
                        applicationPageService.setApplicationPolicies(currUserMono, organizationId, importedApplication)
                                .zipWith(currUserMono)
                                .map(objects -> {
                                    Application application = objects.getT1();
                                    application.setModifiedBy(objects.getT2().getUsername());
                                    return application;
                                })
                                .flatMap(application -> {
                                    // Application Id will be present for GIT sync
                                    if (!StringUtils.isEmpty(applicationId)) {
                                        return applicationService.findById(applicationId, MANAGE_APPLICATIONS)
                                                .switchIfEmpty(
                                                        Mono.error(new AppsmithException(
                                                                AppsmithError.ACL_NO_RESOURCE_FOUND,
                                                                FieldName.APPLICATION_ID,
                                                                applicationId))
                                                )
                                                .flatMap(existingApplication -> {
                                                    importedApplication.setId(existingApplication.getId());
                                                    AppsmithBeanUtils.copyNestedNonNullProperties(importedApplication, existingApplication);
                                                    // Here we are expecting the changes present in DB are committed to git directory
                                                    // so that these won't be lost when we are pulling changes from remote and
                                                    // rehydrate the application. We are now rehydrating the application with/without
                                                    // the changes from remote
                                                    // We are using the save instead of update as we are using @Encrypted
                                                    // for GitAuth
                                                    return applicationService.save(existingApplication)
                                                            .onErrorResume(DuplicateKeyException.class, error -> {
                                                                if (error.getMessage() != null) {
                                                                    return applicationPageService
                                                                            .createOrUpdateSuffixedApplication(
                                                                                    existingApplication,
                                                                                    existingApplication.getName(),
                                                                                    0
                                                                            );
                                                                }
                                                                throw error;
                                                            });
                                                });
                                    }
                                    return applicationService
                                            .findByOrganizationId(organizationId, MANAGE_APPLICATIONS)
                                            .collectList()
                                            .flatMap(applicationList -> {

                                                Application duplicateNameApp = applicationList
                                                        .stream()
                                                        .filter(application1 -> StringUtils.equals(application1.getName(), application.getName()))
                                                        .findAny()
                                                        .orElse(null);

                                                return getUniqueSuffixForDuplicateNameEntity(duplicateNameApp, organizationId)
                                                        .map(suffix -> {
                                                            importedApplication.setName(importedApplication.getName() + suffix);
                                                            return importedApplication;
                                                        });
                                            })
                                            .then(applicationService.save(importedApplication));
                                })
                )
                .flatMap(savedApp -> {
                    importedApplication.setId(savedApp.getId());
                    if (savedApp.getGitApplicationMetadata() != null) {
                        importedApplication.setGitApplicationMetadata(savedApp.getGitApplicationMetadata());
                    }
                    Map<PublishType, List<ApplicationPage>> applicationPages = Map.of(
                            PublishType.UNPUBLISHED, new ArrayList<>(),
                            PublishType.PUBLISHED, new ArrayList<>()
                    );

                    // Import and save pages, also update the pages related fields in saved application
                    assert importedNewPageList != null;

                    // For git-sync this will not be empty
                    Mono<List<NewPage>> existingPagesMono = newPageService
                            .findNewPagesByApplicationId(importedApplication.getId(), MANAGE_PAGES)
                            .collectList()
                            .cache();

                    return importAndSavePages(
                            importedNewPageList,
                            importedApplication,
                            importedDoc.getPublishedLayoutmongoEscapedWidgets(),
                            importedDoc.getUnpublishedLayoutmongoEscapedWidgets(),
                            branchName,
                            existingPagesMono
                    )
                            .map(newPage -> {
                                ApplicationPage unpublishedAppPage = new ApplicationPage();
                                ApplicationPage publishedAppPage = new ApplicationPage();

                                if (newPage.getUnpublishedPage() != null && newPage.getUnpublishedPage().getName() != null) {
                                    unpublishedAppPage.setIsDefault(
                                            StringUtils.equals(
                                                    newPage.getUnpublishedPage().getName(), importedDoc.getUnpublishedDefaultPageName()
                                            )
                                    );
                                    unpublishedAppPage.setId(newPage.getId());
                                    if (newPage.getDefaultResources() != null) {
                                        unpublishedAppPage.setDefaultPageId(newPage.getDefaultResources().getPageId());
                                    }
                                    pageNameMap.put(newPage.getUnpublishedPage().getName(), newPage);
                                }

                                if (newPage.getPublishedPage() != null && newPage.getPublishedPage().getName() != null) {
                                    publishedAppPage.setIsDefault(
                                            StringUtils.equals(
                                                    newPage.getPublishedPage().getName(), importedDoc.getPublishedDefaultPageName()
                                            )
                                    );
                                    publishedAppPage.setId(newPage.getId());
                                    if (newPage.getDefaultResources() != null) {
                                        publishedAppPage.setDefaultPageId(newPage.getDefaultResources().getPageId());
                                    }
                                    pageNameMap.put(newPage.getPublishedPage().getName(), newPage);
                                }
                                if (unpublishedAppPage.getId() != null && newPage.getUnpublishedPage().getDeletedAt() == null) {
                                    applicationPages.get(PublishType.UNPUBLISHED).add(unpublishedAppPage);
                                }
                                if (publishedAppPage.getId() != null && newPage.getPublishedPage().getDeletedAt() == null) {
                                    applicationPages.get(PublishType.PUBLISHED).add(publishedAppPage);
                                }
                                return applicationPages;
                            })
                            .then()
                            .thenReturn(applicationPages)
                            .flatMap(unused -> {
                                if (!StringUtils.isEmpty(applicationId)) {
                                    Set<String> validPageIds = applicationPages.get(PublishType.UNPUBLISHED).stream()
                                            .map(ApplicationPage::getId).collect(Collectors.toSet());

                                    validPageIds.addAll(applicationPages.get(PublishType.PUBLISHED).stream()
                                            .map(ApplicationPage::getId).collect(Collectors.toSet()));

                                    return existingPagesMono
                                            .flatMap(existingPagesList -> {
                                                List<String> inValidIds = new ArrayList<>();
                                                for (NewPage newPage : existingPagesList) {
                                                    if(!validPageIds.contains(newPage.getId())) {
                                                        inValidIds.add(newPage.getId());
                                                    }
                                                }

                                                // Delete the pages which were removed during git merge operation
                                                // This does not apply to the traditional import via file approach
                                                return Flux.fromIterable(inValidIds)
                                                        .flatMap(applicationPageService::deleteUnpublishedPage)
                                                        .then()
                                                        .thenReturn(applicationPages);
                                            });
                                }
                                return Mono.just(applicationPages);
                            });
                })
                .flatMap(applicationPageMap -> {
                    importedApplication.setPages(applicationPageMap.get(PublishType.UNPUBLISHED));
                    importedApplication.setPublishedPages(applicationPageMap.get(PublishType.PUBLISHED));

                    // This will be non-empty for GIT sync
                    return newActionRepository.findByApplicationId(importedApplication.getId())
                            .collectList();
                })
                .flatMap(existingActions -> {

                    Map<String, NewAction> savedActionsGitIdToActionsMap = new HashMap<>();

                    existingActions.stream()
                            .filter(newAction -> newAction.getGitSyncId() != null)
                            .forEach(newAction -> savedActionsGitIdToActionsMap.put(newAction.getGitSyncId(), newAction));

                    assert importedNewActionList != null;

                    return Flux.fromIterable(importedNewActionList)
                            .filter(action -> action.getUnpublishedAction() != null
                                    && !StringUtils.isEmpty(action.getUnpublishedAction().getPageId()))
                            .flatMap(newAction -> {
                                NewPage parentPage = new NewPage();
                                ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                                ActionDTO publishedAction = newAction.getPublishedAction();

                                if (newAction.getDefaultResources() != null) {
                                    newAction.getDefaultResources().setBranchName(branchName);
                                }

                                // If pageId is missing in the actionDTO create a fallback pageId
                                final String fallbackParentPageId = unpublishedAction.getPageId();

                                // pageNameMap.get(action.getPageId())
                                if (unpublishedAction.getName() != null) {
                                    unpublishedAction.setId(newAction.getId());
                                    parentPage = updatePageInAction(unpublishedAction, pageNameMap, actionIdMap);
                                    sanitizeDatasourceInActionDTO(unpublishedAction, datasourceMap, pluginMap, organizationId, false);
                                }

                                if (publishedAction != null && publishedAction.getName() != null) {
                                    publishedAction.setId(newAction.getId());
                                    if (StringUtils.isEmpty(publishedAction.getPageId())) {
                                        publishedAction.setPageId(fallbackParentPageId);
                                    }
                                    NewPage publishedActionPage = updatePageInAction(publishedAction, pageNameMap, actionIdMap);
                                    parentPage = parentPage == null ? publishedActionPage : parentPage;
                                    sanitizeDatasourceInActionDTO(publishedAction, datasourceMap, pluginMap, organizationId, false);
                                }

                                examplesOrganizationCloner.makePristine(newAction);
                                newAction.setOrganizationId(organizationId);
                                newAction.setApplicationId(importedApplication.getId());
                                newAction.setPluginId(pluginMap.get(newAction.getPluginId()));
                                newActionService.generateAndSetActionPolicies(parentPage, newAction);

                                // Check if the action has gitSyncId and if it's already in DB
                                if (newAction.getGitSyncId() != null
                                        && savedActionsGitIdToActionsMap.containsKey(newAction.getGitSyncId())) {

                                    //Since the resource is already present in DB, just update resource
                                    NewAction existingAction = savedActionsGitIdToActionsMap.get(newAction.getGitSyncId());
                                    newAction.setId(savedActionsGitIdToActionsMap.get(newAction.getGitSyncId()).getId());
                                    AppsmithBeanUtils.copyNestedNonNullProperties(newAction, existingAction);
                                    return newActionService.update(newAction.getId(), existingAction);
                                } else if(importedApplication.getGitApplicationMetadata() != null) {
                                    final String defaultApplicationId = importedApplication.getGitApplicationMetadata().getDefaultApplicationId();
                                    return newActionRepository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, newAction.getGitSyncId(), MANAGE_ACTIONS)
                                            .switchIfEmpty(Mono.defer(() -> {
                                                // This is the first page we are saving with given gitSyncId in this instance
                                                DefaultResources defaultResources = new DefaultResources();
                                                defaultResources.setApplicationId(defaultApplicationId);
                                                defaultResources.setBranchName(branchName);
                                                newAction.setDefaultResources(defaultResources);
                                                return saveNewActionAndUpdateDefaultResources(newAction, branchName);
                                            }))
                                            .flatMap(branchedAction -> {
                                                DefaultResources defaultResources = branchedAction.getDefaultResources();
                                                // Create new action but keep defaultApplicationId and defaultActionId same for both the actions
                                                defaultResources.setBranchName(branchName);
                                                newAction.setDefaultResources(defaultResources);

                                                String defaultPageId = branchedAction.getUnpublishedAction() != null
                                                        ? branchedAction.getUnpublishedAction().getDefaultResources().getPageId()
                                                        : branchedAction.getPublishedAction().getDefaultResources().getPageId();
                                                DefaultResources defaultsDTO = new DefaultResources();
                                                defaultsDTO.setPageId(defaultPageId);
                                                if (newAction.getUnpublishedAction() != null) {
                                                    newAction.getUnpublishedAction().setDefaultResources(defaultsDTO);
                                                }
                                                if (newAction.getPublishedAction() != null) {
                                                    newAction.getPublishedAction().setDefaultResources(defaultsDTO);
                                                }
                                                return newActionService.save(newAction);
                                            });
                                }

                                return saveNewActionAndUpdateDefaultResources(newAction, branchName);
                            })
                            .map(newAction -> {
                                // Populate actionIdsMap to associate the appropriate actions to run on page load
                                if (newAction.getUnpublishedAction() != null) {
                                    ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                                    actionIdMap.put(
                                            actionIdMap.get(unpublishedAction.getName() + unpublishedAction.getPageId()),
                                            newAction.getId()
                                    );

                                    if (unpublishedAction.getCollectionId() != null) {
                                        unpublishedActionCollectionIdMap.putIfAbsent(unpublishedAction.getCollectionId(), new HashMap<>());
                                        final Map<String, String> actionIds = unpublishedActionCollectionIdMap.get(unpublishedAction.getCollectionId());
                                        actionIds.put(newAction.getDefaultResources().getActionId(), newAction.getId());
                                    }
                                }
                                if (newAction.getPublishedAction() != null) {
                                    ActionDTO publishedAction = newAction.getPublishedAction();
                                    actionIdMap.put(
                                            actionIdMap.get(publishedAction.getName() + publishedAction.getPageId()),
                                            newAction.getId()
                                    );

                                    if (publishedAction.getCollectionId() != null) {
                                        publishedActionCollectionIdMap.putIfAbsent(publishedAction.getCollectionId(), new HashMap<>());
                                        final Map<String, String> actionIds = publishedActionCollectionIdMap.get(publishedAction.getCollectionId());
                                        actionIds.put(newAction.getDefaultResources().getActionId(), newAction.getId());
                                    }
                                }
                                return newAction;
                            })
                            .then()
                            .thenReturn(true)
                            .flatMap(x -> actionCollectionRepository.findByApplicationId(importedApplication.getId())
                                    .collectList());
                })
                .flatMap(existingActionCollections -> {
                    if (importedActionCollectionList == null) {
                        return Mono.just(true);
                    }

                    return Flux.fromIterable(importedActionCollectionList)
                            .filter(actionCollection -> actionCollection.getUnpublishedCollection() != null
                                    && !StringUtils.isEmpty(actionCollection.getUnpublishedCollection().getPageId()))
                            .flatMap(actionCollection -> {
                                if (actionCollection.getDefaultResources() != null) {
                                    actionCollection.getDefaultResources().setBranchName(branchName);
                                }
                                final String importedActionCollectionId = actionCollection.getId();
                                NewPage parentPage = new NewPage();
                                final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
                                final ActionCollectionDTO publishedCollection = actionCollection.getPublishedCollection();

                                // If pageId is missing in the actionDTO create a fallback pageId
                                final String fallbackParentPageId = unpublishedCollection.getPageId();

                                if (unpublishedCollection.getName() != null) {
                                    unpublishedCollection.setDefaultToBranchedActionIdsMap(unpublishedActionCollectionIdMap.get(importedActionCollectionId));
                                    unpublishedCollection.setPluginId(pluginMap.get(unpublishedCollection.getPluginId()));
                                    parentPage = updatePageInActionCollection(unpublishedCollection, pageNameMap);
                                }

                                if (publishedCollection != null && publishedCollection.getName() != null) {
                                    publishedCollection.setDefaultToBranchedActionIdsMap(publishedActionCollectionIdMap.get(importedActionCollectionId));
                                    publishedCollection.setPluginId(pluginMap.get(publishedCollection.getPluginId()));
                                    if (StringUtils.isEmpty(publishedCollection.getPageId())) {
                                        publishedCollection.setPageId(fallbackParentPageId);
                                    }
                                    NewPage publishedCollectionPage = updatePageInActionCollection(publishedCollection, pageNameMap);
                                    parentPage = parentPage == null ? publishedCollectionPage : parentPage;
                                }

                                examplesOrganizationCloner.makePristine(actionCollection);
                                actionCollection.setOrganizationId(organizationId);
                                actionCollection.setApplicationId(importedApplication.getId());
                                actionCollectionService.generateAndSetPolicies(parentPage, actionCollection);

                                Map<String, ActionCollection> savedActionCollectionGitIdToCollectionsMap = new HashMap<>();

                                existingActionCollections.stream()
                                        .filter(collection -> collection.getGitSyncId() != null)
                                        .forEach(collection -> savedActionCollectionGitIdToCollectionsMap.put(collection.getGitSyncId(), collection));
                                // Check if the action has gitSyncId and if it's already in DB
                                if (actionCollection.getGitSyncId() != null
                                        && savedActionCollectionGitIdToCollectionsMap.containsKey(actionCollection.getGitSyncId())) {

                                    //Since the resource is already present in DB, just update resource
                                    ActionCollection existingActionCollection = savedActionCollectionGitIdToCollectionsMap.get(actionCollection.getGitSyncId());
                                    AppsmithBeanUtils.copyNestedNonNullProperties(actionCollection, existingActionCollection);
                                    return Mono.zip(
                                            Mono.just(importedActionCollectionId),
                                            actionCollectionService.update(existingActionCollection.getId(), existingActionCollection)
                                    );
                                } else if (importedApplication.getGitApplicationMetadata() != null) {
                                    final String defaultApplicationId = importedApplication.getGitApplicationMetadata().getDefaultApplicationId();
                                    return actionCollectionRepository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, actionCollection.getGitSyncId(), MANAGE_ACTIONS)
                                            .switchIfEmpty(Mono.defer(() -> {
                                                // This is the first page we are saving with given gitSyncId in this instance
                                                DefaultResources defaultResources = new DefaultResources();
                                                defaultResources.setApplicationId(defaultApplicationId);
                                                defaultResources.setBranchName(branchName);
                                                actionCollection.setDefaultResources(defaultResources);
                                                return saveNewCollectionAndUpdateDefaultResources(actionCollection, branchName);
                                            }))
                                            .flatMap(branchedActionCollection -> {
                                                DefaultResources defaultResources = branchedActionCollection.getDefaultResources();
                                                // Create new action but keep defaultApplicationId and defaultActionId same for both the actions
                                                defaultResources.setBranchName(branchName);
                                                actionCollection.setDefaultResources(defaultResources);

                                                String defaultPageId = branchedActionCollection.getUnpublishedCollection() != null
                                                        ? branchedActionCollection.getUnpublishedCollection().getDefaultResources().getPageId()
                                                        : branchedActionCollection.getPublishedCollection().getDefaultResources().getPageId();
                                                DefaultResources defaultsDTO = new DefaultResources();
                                                defaultsDTO.setPageId(defaultPageId);
                                                if (actionCollection.getUnpublishedCollection() != null) {
                                                    actionCollection.getUnpublishedCollection().setDefaultResources(defaultsDTO);
                                                }
                                                if (actionCollection.getPublishedCollection() != null) {
                                                    actionCollection.getPublishedCollection().setDefaultResources(defaultsDTO);
                                                }
                                                return Mono.zip(
                                                        Mono.just(importedActionCollectionId),
                                                        actionCollectionService.save(actionCollection)
                                                );
                                            });
                                }

                                return Mono.zip(
                                        Mono.just(importedActionCollectionId),
                                        saveNewCollectionAndUpdateDefaultResources(actionCollection, branchName)
                                );
                            })
                            .flatMap(tuple -> {
                                final String importedActionCollectionId = tuple.getT1();
                                final String savedActionCollectionId = tuple.getT2().getId();
                                unpublishedActionCollectionIdMap
                                        .getOrDefault(importedActionCollectionId, Map.of())
                                        .forEach((defaultActionId, actionId) -> {
                                            unpublishedActionIdToCollectionIdMap.put(actionId, savedActionCollectionId);
                                        });
                                publishedActionCollectionIdMap
                                        .getOrDefault(importedActionCollectionId, Map.of())
                                        .forEach((defaultActionId, actionId) -> {
                                            publishedActionIdToCollectionIdMap.put(actionId, savedActionCollectionId);
                                        });
                                final HashSet<String> actionIds = new HashSet<>();
                                actionIds.addAll(unpublishedActionIdToCollectionIdMap.keySet());
                                actionIds.addAll(publishedActionIdToCollectionIdMap.keySet());
                                return Flux.fromIterable(actionIds);
                            })
                            .flatMap(actionId -> newActionRepository.findById(actionId, MANAGE_ACTIONS))
                            .map(newAction -> {
                                newAction.getUnpublishedAction().setCollectionId(
                                        unpublishedActionIdToCollectionIdMap.getOrDefault(newAction.getId(), null));
                                newAction.getPublishedAction().setCollectionId(
                                        publishedActionIdToCollectionIdMap.getOrDefault(newAction.getId(), null));
                                return newAction;
                            })
                            .flatMap(newAction -> newActionService.update(newAction.getId(), newAction))
                            .then()
                            .thenReturn(true);
                })
                .flatMap(ignored -> {
                    // Don't update gitAuth as we are using @Encrypted for private key
                    importedApplication.setGitApplicationMetadata(null);
                    // Map layoutOnLoadActions ids with relevant actions
                    return newPageService.findNewPagesByApplicationId(importedApplication.getId(), MANAGE_PAGES)
                            .flatMap(newPage -> {
                                if (newPage.getDefaultResources() != null) {
                                    newPage.getDefaultResources().setBranchName(branchName);
                                }
                                return mapActionIdWithPageLayout(newPage, actionIdMap)
                                        .flatMap(newPageService::save);
                            })
                            .then(applicationService.update(importedApplication.getId(), importedApplication))
                            .map(application -> {
                                processStopwatch.stopAndLogTimeInMillis();
                                return application;
                            });
                });

        // Import Application is currently a slow API because it needs to import and create application, pages, actions
        // and action collection. This process may take time and the client may cancel the request. This leads to the flow
        // getting stopped mid way producing corrupted objects in DB. The following ensures that even though the client may have
        // cancelled the flow, the importing the application should proceed uninterrupted and whenever the user refreshes
        // the page, the imported application is available and is in sane state.
        // To achieve this, we use a synchronous sink which does not take subscription cancellations into account. This
        // means that even if the subscriber has cancelled its subscription, the create method still generates its event.
        return Mono.create(sink -> importedApplicationMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    /**
     * This function will respond with unique suffixed number for the entity to avoid duplicate names
     *
     * @param sourceEntity for which the suffixed number is required to avoid duplication
     * @param orgId        organisation in which entity should be searched
     * @return next possible number in case of duplication
     */
    private Mono<String> getUniqueSuffixForDuplicateNameEntity(BaseDomain sourceEntity, String orgId) {
        if (sourceEntity != null) {
            return sequenceService
                    .getNextAsSuffix(sourceEntity.getClass(), " for organization with _id : " + orgId)
                    .map(sequenceNumber -> {
                        // sequence number will be empty if no duplicate is found
                        return sequenceNumber.isEmpty() ? " #1" : " #" + sequenceNumber.trim();
                    });
        }
        return Mono.just("");
    }

    /**
     * This function will set the mongoEscapedWidgets if present in the page along with setting the policies for the page
     *
     * @param pages                         pagelist extracted from the imported JSON file
     * @param application                   saved application where pages needs to be added
     * @param publishedMongoEscapedWidget   widget list those needs to be escaped for published layout
     * @param unpublishedMongoEscapedWidget widget list those needs to be escaped for unpublished layout
     * @return saved pages
     */
    private Flux<NewPage> importAndSavePages(List<NewPage> pages,
                                             Application application,
                                             Map<String, Set<String>> publishedMongoEscapedWidget,
                                             Map<String, Set<String>> unpublishedMongoEscapedWidget,
                                             String branchName,
                                             Mono<List<NewPage>> existingPages) {

        Map<String, String> oldToNewLayoutIds = new HashMap<>();
        pages.forEach(newPage -> {
            if (newPage.getDefaultResources() != null) {
                newPage.getDefaultResources().setBranchName(branchName);
            }
            newPage.setApplicationId(application.getId());
            if (newPage.getUnpublishedPage() != null) {
                applicationPageService.generateAndSetPagePolicies(application, newPage.getUnpublishedPage());
                newPage.setPolicies(newPage.getUnpublishedPage().getPolicies());
                if (unpublishedMongoEscapedWidget != null) {
                    newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                        String layoutId = new ObjectId().toString();
                        oldToNewLayoutIds.put(layout.getId(), layoutId);
                        layout.setMongoEscapedWidgetNames(unpublishedMongoEscapedWidget.get(layout.getId()));
                        layout.setId(layoutId);
                    });
                }
            }

            if (newPage.getPublishedPage() != null) {
                applicationPageService.generateAndSetPagePolicies(application, newPage.getPublishedPage());
                if (publishedMongoEscapedWidget != null) {
                    newPage.getPublishedPage().getLayouts().forEach(layout -> {
                        String layoutId = oldToNewLayoutIds.containsKey(layout.getId())
                                ? oldToNewLayoutIds.get(layout.getId()) : new ObjectId().toString();
                        layout.setMongoEscapedWidgetNames(publishedMongoEscapedWidget.get(layout.getId()));
                        layout.setId(layoutId);
                    });
                }
            }
        });

        return existingPages.flatMapMany(existingSavedPages -> {
            Map<String, NewPage> savedPagesGitIdToPageMap = new HashMap<>();

            existingSavedPages.stream()
                    .filter(newPage -> !StringUtils.isEmpty(newPage.getGitSyncId()))
                    .forEach(newPage -> savedPagesGitIdToPageMap.put(newPage.getGitSyncId(), newPage));

            return Flux.fromIterable(pages)
                    .flatMap(newPage -> {

                        // Check if the page has gitSyncId and if it's already in DB
                        if (newPage.getGitSyncId() != null && savedPagesGitIdToPageMap.containsKey(newPage.getGitSyncId())) {
                            //Since the resource is already present in DB, just update resource
                            NewPage existingPage = savedPagesGitIdToPageMap.get(newPage.getGitSyncId());
                            newPage.setId(savedPagesGitIdToPageMap.get(newPage.getGitSyncId()).getId());
                            AppsmithBeanUtils.copyNestedNonNullProperties(newPage, existingPage);
                            return newPageService.update(newPage.getId(), existingPage);
                        } else if(application.getGitApplicationMetadata() != null) {
                            final String defaultApplicationId = application.getGitApplicationMetadata().getDefaultApplicationId();
                            return newPageService.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, newPage.getGitSyncId(), MANAGE_PAGES)
                                    .switchIfEmpty(Mono.defer(() -> {
                                        // This is the first page we are saving with given gitSyncId in this instance
                                        DefaultResources defaultResources = new DefaultResources();
                                        defaultResources.setApplicationId(defaultApplicationId);
                                        defaultResources.setBranchName(branchName);
                                        newPage.setDefaultResources(defaultResources);
                                        return saveNewPageAndUpdateDefaultResources(newPage, branchName);
                                    }))
                                    .flatMap(branchedPage -> {
                                        DefaultResources defaultResources = branchedPage.getDefaultResources();
                                        // Create new page but keep defaultApplicationId and defaultPageId same for both the pages
                                        defaultResources.setBranchName(branchName);
                                        newPage.setDefaultResources(defaultResources);
                                        return newPageService.save(newPage);
                                    });
                        }
                        return saveNewPageAndUpdateDefaultResources(newPage, branchName);
                    });
        });
    }

    private Mono<NewPage> saveNewPageAndUpdateDefaultResources(NewPage newPage, String branchName) {
        NewPage update = new NewPage();
        return newPageService.save(newPage)
                .flatMap(page -> {
                    update.setDefaultResources(DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(page, branchName).getDefaultResources());
                    return newPageService.update(page.getId(), update);
                });
    }

    private Mono<NewAction> saveNewActionAndUpdateDefaultResources(NewAction newAction, String branchName) {
        return newActionService.save(newAction)
                .flatMap(action -> {
                    NewAction update = new NewAction();
                    update.setDefaultResources(
                            DefaultResourcesUtils
                                    .createDefaultIdsOrUpdateWithGivenResourceIds(action, branchName).getDefaultResources()
                    );
                    return newActionService.update(action.getId(), update);
                });
    }

    private Mono<ActionCollection> saveNewCollectionAndUpdateDefaultResources(ActionCollection actionCollection, String branchName) {
        return actionCollectionService.create(actionCollection)
                .flatMap(actionCollection1 -> {
                    ActionCollection update = new ActionCollection();
                    update.setDefaultResources(
                            DefaultResourcesUtils
                                    .createDefaultIdsOrUpdateWithGivenResourceIds(actionCollection1, branchName)
                                    .getDefaultResources()
                    );
                    return actionCollectionService.update(actionCollection1.getId(), update);
                });
    }

    private NewPage updatePageInAction(ActionDTO action,
                                       Map<String, NewPage> pageNameMap,
                                       Map<String, String> actionIdMap) {
        NewPage parentPage = pageNameMap.get(action.getPageId());
        if (parentPage == null) {
            return null;
        }
        actionIdMap.put(action.getName() + parentPage.getId(), action.getId());
        action.setPageId(parentPage.getId());

        // Update defaultResources in actionDTO
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setPageId(parentPage.getDefaultResources().getPageId());
        action.setDefaultResources(defaultResources);

        return parentPage;
    }

    private NewPage updatePageInActionCollection(ActionCollectionDTO collectionDTO,
                                                 Map<String, NewPage> pageNameMap) {
        NewPage parentPage = pageNameMap.get(collectionDTO.getPageId());
        if (parentPage == null) {
            return null;
        }
        collectionDTO.setPageId(parentPage.getId());

        // Update defaultResources in actionCollectionDTO
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setPageId(parentPage.getDefaultResources().getPageId());
        collectionDTO.setDefaultResources(defaultResources);

        return parentPage;
    }

    /**
     * This function will be used to sanitise datasource within the actionDTO
     *
     * @param actionDTO      for which the datasource needs to be sanitised as per import format expected
     * @param datasourceMap  datasource id to name map
     * @param pluginMap      plugin id to name map
     * @param organizationId organisation in which the application supposed to be imported
     * @return
     */
    private String sanitizeDatasourceInActionDTO(ActionDTO actionDTO,
                                                 Map<String, String> datasourceMap,
                                                 Map<String, String> pluginMap,
                                                 String organizationId,
                                                 boolean isExporting) {

        if (actionDTO != null && actionDTO.getDatasource() != null) {

            Datasource ds = actionDTO.getDatasource();
            if (isExporting) {
                ds.setUpdatedAt(null);
            }
            if (ds.getId() != null) {
                //Mapping ds name in id field
                ds.setId(datasourceMap.get(ds.getId()));
                ds.setOrganizationId(null);
                if (ds.getPluginId() != null) {
                    ds.setPluginId(pluginMap.get(ds.getPluginId()));
                }
                return ds.getId();
            } else {
                // This means we don't have regular datasource it can be simple REST_API and will also be used when
                // importing the action to populate the data
                ds.setOrganizationId(organizationId);
                ds.setPluginId(pluginMap.get(ds.getPluginId()));
                return "";
            }
        }

        return "";
    }

    // This method will update the action id in saved page for layoutOnLoadAction
    private Mono<NewPage> mapActionIdWithPageLayout(NewPage page, Map<String, String> actionIdMap) {

        Set<String> layoutOnLoadActions = new HashSet<>();
        if (page.getUnpublishedPage().getLayouts() != null) {

            page.getUnpublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(actionDTO -> {
                                actionDTO.setId(actionIdMap.get(actionDTO.getId()));
                                layoutOnLoadActions.add(actionDTO.getId());
                            }));
                }
            });
        }

        if (page.getPublishedPage() != null && page.getPublishedPage().getLayouts() != null) {

            page.getPublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(actionDTO -> {
                                actionDTO.setId(actionIdMap.get(actionDTO.getId()));
                                layoutOnLoadActions.add(actionDTO.getId());
                            }));
                }
            });
        }

        layoutOnLoadActions.remove(null);
        return Flux.fromIterable(layoutOnLoadActions)
                .flatMap(newActionService::findById)
                .map(newAction -> {
                    final String defaultActionId = newAction.getDefaultResources().getActionId();
                    if (page.getUnpublishedPage().getLayouts() != null) {

                        page.getUnpublishedPage().getLayouts().forEach(layout -> {
                            if (layout.getLayoutOnLoadActions() != null) {
                                layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                                        .stream()
                                        .filter(actionDTO -> StringUtils.equals(actionDTO.getId(), newAction.getId()))
                                        .forEach(actionDTO -> actionDTO.setDefaultActionId(defaultActionId)));
                            }
                        });
                    }

                    if (page.getPublishedPage() != null && page.getPublishedPage().getLayouts() != null) {

                        page.getPublishedPage().getLayouts().forEach(layout -> {
                            if (layout.getLayoutOnLoadActions() != null) {
                                layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                                        .stream()
                                        .filter(actionDTO -> StringUtils.equals(actionDTO.getId(), newAction.getId()))
                                        .forEach(actionDTO -> actionDTO.setDefaultActionId(defaultActionId)));
                            }
                        });
                    }
                    return newAction;
                })
                .then(Mono.just(page));
    }

    /**
     * This will check if the datasource is already present in the organization and create a new one if unable to find one
     *
     * @param existingDatasourceFlux already present datasource in the organization
     * @param datasource             which will be checked against existing datasources
     * @param organizationId         organization where duplicate datasource should be checked
     * @return already present or brand new datasource depending upon the equality check
     */
    private Mono<Datasource> createUniqueDatasourceIfNotPresent(Flux<Datasource> existingDatasourceFlux,
                                                                Datasource datasource,
                                                                String organizationId,
                                                                String applicationId) {

        /*
            1. If same datasource is present return
            2. If unable to find the datasource create a new datasource with unique name and return
         */
        final DatasourceConfiguration datasourceConfig = datasource.getDatasourceConfiguration();
        AuthenticationResponse authResponse = new AuthenticationResponse();
        if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
            AppsmithBeanUtils.copyNestedNonNullProperties(
                    datasourceConfig.getAuthentication().getAuthenticationResponse(), authResponse);
            datasourceConfig.getAuthentication().setAuthenticationResponse(null);
            datasourceConfig.getAuthentication().setAuthenticationType(null);
        }

        return existingDatasourceFlux
                .map(ds -> {
                    final DatasourceConfiguration dsAuthConfig = ds.getDatasourceConfiguration();
                    if (dsAuthConfig != null && dsAuthConfig.getAuthentication() != null) {
                        dsAuthConfig.getAuthentication().setAuthenticationResponse(null);
                        dsAuthConfig.getAuthentication().setAuthenticationType(null);
                    }
                    return ds;
                })
                // For git import exclude datasource configuration
                .filter(ds -> applicationId != null ? ds.getName().equals(datasource.getName()) : ds.softEquals(datasource))
                .next()  // Get the first matching datasource, we don't need more than one here.
                .switchIfEmpty(Mono.defer(() -> {
                    if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
                        datasourceConfig.getAuthentication().setAuthenticationResponse(authResponse);
                    }
                    // No matching existing datasource found, so create a new one.
                    return datasourceService
                            .findByNameAndOrganizationId(datasource.getName(), organizationId, AclPermission.MANAGE_DATASOURCES)
                            .flatMap(duplicateNameDatasource ->
                                    getUniqueSuffixForDuplicateNameEntity(duplicateNameDatasource, organizationId)
                            )
                            .map(suffix -> {
                                datasource.setName(datasource.getName() + suffix);
                                return datasource;
                            })
                            .then(datasourceService.create(datasource));
                }));
    }

    /**
     * Here we will be rehydrating the sensitive fields like password, secrets etc. in datasource while importing the application
     *
     * @param datasource      for which sensitive fields should be rehydrated
     * @param decryptedFields sensitive fields
     * @return updated datasource with rehydrated sensitive fields
     */
    private Datasource updateAuthenticationDTO(Datasource datasource, DecryptedSensitiveFields decryptedFields) {

        final DatasourceConfiguration dsConfig = datasource.getDatasourceConfiguration();
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
        }
        return datasource;
    }

    /**
     * This will be used to dehydrate sensitive fields from the datasource while exporting the application
     *
     * @param datasource entity from which sensitive fields need to be dehydrated
     * @return sensitive fields which then will be deserialized and exported in JSON file
     */
    private DecryptedSensitiveFields getDecryptedFields(Datasource datasource) {
        final AuthenticationDTO authentication = datasource.getDatasourceConfiguration() == null
                ? null : datasource.getDatasourceConfiguration().getAuthentication();

        if (authentication != null) {
            DecryptedSensitiveFields dsDecryptedFields =
                    authentication.getAuthenticationResponse() == null
                            ? new DecryptedSensitiveFields()
                            : new DecryptedSensitiveFields(authentication.getAuthenticationResponse());

            if (authentication instanceof DBAuth) {
                DBAuth auth = (DBAuth) authentication;
                dsDecryptedFields.setPassword(auth.getPassword());
                dsDecryptedFields.setDbAuth(auth);
            } else if (authentication instanceof OAuth2) {
                OAuth2 auth = (OAuth2) authentication;
                dsDecryptedFields.setPassword(auth.getClientSecret());
                dsDecryptedFields.setOpenAuth2(auth);
            } else if (authentication instanceof BasicAuth) {
                BasicAuth auth = (BasicAuth) authentication;
                dsDecryptedFields.setPassword(auth.getPassword());
                dsDecryptedFields.setBasicAuth(auth);
            }
            dsDecryptedFields.setAuthType(authentication.getClass().getName());
            return dsDecryptedFields;
        }
        return null;
    }

    /**
     * Removes internal fields e.g. database ID from the provided Theme object.
     * @param srcTheme Theme object from DB that'll be exported
     * @return Theme DTO with null or empty value in internal fields
     */
    private Theme exportTheme(Theme srcTheme) {
        srcTheme.setId(null);
        if(srcTheme.isSystemTheme()) {
            // for system theme, we only need theme name and isSystemTheme properties so set null to others
            srcTheme.setProperties(null);
            srcTheme.setConfig(null);
            srcTheme.setStylesheet(null);
        }
        // set null to base domain properties also
        srcTheme.setCreatedAt(null);
        srcTheme.setCreatedBy(null);
        srcTheme.setUpdatedAt(null);
        srcTheme.setModifiedBy(null);
        srcTheme.setUserPermissions(null);
        return srcTheme;
    }

    private Mono<Application> importThemes(Application application, ApplicationJson importedApplicationJson) {
        Mono<Theme> importedEditModeTheme = getOrSaveTheme(importedApplicationJson.getEditModeTheme());
        Mono<Theme> importedPublishedModeTheme = getOrSaveTheme(importedApplicationJson.getPublishedTheme());

        return Mono.zip(importedEditModeTheme, importedPublishedModeTheme).map(importedThemesTuple -> {
            application.setEditModeThemeId(importedThemesTuple.getT1().getId());
            application.setPublishedModeThemeId(importedThemesTuple.getT2().getId());
            return application;
        });
    }

    private Mono<Theme> getOrSaveTheme(Theme theme) {
        if(theme == null) { // this application was exported without theme, assign the legacy theme to it
            return themeRepository.getSystemThemeByName(Theme.LEGACY_THEME_NAME); // return the default theme
        } else if (theme.isSystemTheme()) {
            return themeRepository.getSystemThemeByName(theme.getName());
        } else {
            return themeRepository.save(theme);
        }
    }

    private void removeUnwantedFieldsFromApplicationDuringExport(Application application) {
            application.setOrganizationId(null);
            application.setPages(null);
            application.setPublishedPages(null);
            application.setModifiedBy(null);
            application.setUpdatedAt(null);
            application.setLastDeployedAt(null);
            application.setLastEditedAt(null);
            application.setUpdatedAt(null);
            application.setGitApplicationMetadata(null);
            application.setPolicies(null);
            application.setUserPermissions(null);
            application.setEditModeThemeId(null);
            application.setPublishedModeThemeId(null);
    }
}
