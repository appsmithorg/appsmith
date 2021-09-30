package com.appsmith.server.solutions;

import com.appsmith.external.helpers.BeanCopyUtils;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Component;
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

@Slf4j
@Component
@RequiredArgsConstructor
public class ImportExportApplicationService {
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

        if (applicationId == null || applicationId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        Mono<Application> applicationMono = applicationService.findById(applicationId, AclPermission.EXPORT_APPLICATIONS)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId))
                );

        return pluginRepository
                .findAll()
                .map(plugin -> {
                    pluginMap.put(plugin.getId(), plugin.getPackageName());
                    return plugin;
                })
                .then(applicationMono)
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
                    application.setOrganizationId(null);
                    application.setPages(null);
                    application.setPublishedPages(null);
                    application.setModifiedBy(null);
                    application.setUpdatedAt(null);
                    application.setLastDeployedAt(null);
                    application.setGitApplicationMetadata(null);
                    examplesOrganizationCloner.makePristine(application);
                    applicationJson.setExportedApplication(application);
                    // TODO @Abhijeet please take a look at the ACL permissions
                    return newPageRepository.findByApplicationId(applicationId, AclPermission.MANAGE_PAGES)
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

                                            unpublishedPageDTO.getLayouts().forEach(layout ->
                                                    unpublishedMongoEscapedWidgetsNames
                                                            .put(layout.getId(), layout.getMongoEscapedWidgetNames())
                                            );
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
                                            newPage.getPublishedPage().getLayouts().forEach(layout ->
                                                    publishedMongoEscapedWidgetsNames
                                                            .put(layout.getId(), layout.getMongoEscapedWidgetNames())
                                            );
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
                                return newActionRepository
                                        .findByApplicationId(applicationId, AclPermission.MANAGE_ACTIONS, null);
                            })
                            .collectList()
                            .flatMapMany(newActionList -> {
                                Set<String> concernedDBNames = new HashSet<>();
                                newActionList.forEach(newAction -> {
                                    newAction.setPluginId(pluginMap.get(newAction.getPluginId()));
                                    newAction.setOrganizationId(null);
                                    newAction.setPolicies(null);
                                    newAction.setApplicationId(null);
                                    concernedDBNames.add(
                                            sanitizeDatasourceInActionDTO(newAction.getPublishedAction(), datasourceIdToNameMap, pluginMap, null)
                                    );
                                    concernedDBNames.add(
                                            sanitizeDatasourceInActionDTO(newAction.getUnpublishedAction(), datasourceIdToNameMap, pluginMap, null)
                                    );

                                    if (newAction.getUnpublishedAction() != null) {
                                        ActionDTO actionDTO = newAction.getUnpublishedAction();
                                        actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId() + PublishType.UNPUBLISHED));
                                    }
                                    if (newAction.getPublishedAction() != null) {
                                        ActionDTO actionDTO = newAction.getPublishedAction();
                                        actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId() + PublishType.PUBLISHED));
                                    }
                                });
                                // This is where we're removing global datasources that are unused in this application
                                applicationJson
                                        .getDatasourceList()
                                        .removeIf(datasource -> !concernedDBNames.contains(datasource.getName()));

                                applicationJson.setActionList(newActionList);

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
                                applicationJson.setDecryptedFields(decryptedFields);
                                return actionCollectionRepository
                                        .findByApplicationId(applicationId, AclPermission.MANAGE_ACTIONS, null);
                            })
                            .map(actionCollection -> {
                                // Remove references to ids since the serialized version does not have this information
                                actionCollection.setOrganizationId(null);
                                actionCollection.setPolicies(null);
                                actionCollection.setApplicationId(null);

                                if (actionCollection.getUnpublishedCollection() != null) {
                                    ActionCollectionDTO actionCollectionDTO = actionCollection.getUnpublishedCollection();
                                    actionCollectionDTO.setPageId(pageIdToNameMap.get(actionCollectionDTO.getPageId() + PublishType.UNPUBLISHED));
                                    actionCollectionDTO.setPluginId(pluginMap.get(actionCollectionDTO.getPluginId()));
                                }
                                if (actionCollection.getPublishedCollection() != null) {
                                    ActionCollectionDTO actionCollectionDTO = actionCollection.getPublishedCollection();
                                    actionCollectionDTO.setPageId(pageIdToNameMap.get(actionCollectionDTO.getPageId() + PublishType.PUBLISHED));
                                    actionCollectionDTO.setPluginId(pluginMap.get(actionCollectionDTO.getPluginId()));
                                }

                                return actionCollection;
                            })
                            .collectList()
                            .map(actionCollections -> {
                                // This object won't have the list of actions but we don't care about that today
                                // Because the actions will have a reference to the collection
                                applicationJson.setActionCollectionList(actionCollections);
                                return applicationJson;
                            });
                })
                .then()
                .thenReturn(applicationJson);
    }

    public Mono<ApplicationJson> exportApplicationById(String applicationId) {
        return exportApplicationById(applicationId, SerialiseApplicationObjective.SHARE);
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

        final Flux<DataBuffer> contentCache = filePart.content().cache();
        Mono<String> stringifiedFile = DataBufferUtils.join(contentCache)
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                });

        return stringifiedFile
                .flatMap(data -> {
                    Gson gson = new Gson();
                    Type fileType = new TypeToken<ApplicationJson>() {
                    }.getType();
                    ApplicationJson jsonFile = gson.fromJson(data, fileType);
                    return importApplicationInOrganization(orgId, jsonFile);
                });
    }

    /**
     * This function will save the application to organisation from the application resource
     *
     * @param organizationId organization to which application is going to be stored
     * @param importedDoc    application resource which contains necessary information to save the application
     * @return saved application in DB
     */
    public Mono<Application> importApplicationInOrganization(String organizationId, ApplicationJson importedDoc) {
        return importApplicationInOrganization(organizationId, importedDoc, null);
    }

    /**
     * This function will take the application reference object to hydrate the application in mongoDB
     *
     * @param organizationId organization to which application is going to be stored
     * @param importedDoc    application resource which contains necessary information to save the application
     * @param applicationId  application which needs to be saved with the updated resources
     * @return Updated application
     */
    public Mono<Application> importApplicationInOrganization(String organizationId,
                                                             ApplicationJson importedDoc,
                                                             String applicationId) {

        /*
            1. Fetch organization by id
            2. Extract datasources and update plugin information
            3. Create new datasource if same datasource is not present
            4. Extract and save application
            5. Extract and save pages in the application
            6. Extract and save actions in the application
         */
        Map<String, String> pluginMap = new HashMap<>();
        Map<String, String> datasourceMap = new HashMap<>();
        Map<String, NewPage> pageNameMap = new HashMap<>();
        Map<String, String> actionIdMap = new HashMap<>();
        Map<String, Set<String>> unpublishedActionCollectionIdMap = new HashMap<>();
        Map<String, Set<String>> publishedActionCollectionIdMap = new HashMap<>();
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
        if (importedNewPageList == null || importedNewPageList.isEmpty()) {
            errorField = FieldName.PAGES;
        } else if (importedApplication == null) {
            errorField = FieldName.APPLICATION;
        } else if (importedNewActionList == null) {
            errorField = FieldName.ACTIONS;
        } else if (importedDatasourceList == null) {
            errorField = FieldName.DATASOURCE;
        } else if (importedActionCollectionList == null) {
            errorField = FieldName.ACTION_COLLECTION;
        }

        if (!errorField.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, errorField, INVALID_JSON_FILE));
        }

        return pluginRepository.findAll()
                .map(plugin -> {
                    pluginMap.put(plugin.getPackageName(), plugin.getId());
                    return plugin;
                })
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
                                    datasource.setId(savedDatasourcesGitIdToDatasourceMap.get(datasource.getGitSyncId()).getId());
                                    // Don't update datasource config as the saved datasource is already configured as per user
                                    // for this instance
                                    datasource.setDatasourceConfiguration(null);
                                    BeanCopyUtils.copyNewFieldValuesIntoOldObject(datasource, existingDatasource);
                                    return datasourceService.update(datasource.getId(), existingDatasource);
                                }

                                // This is explicitly copied over from the map we created before
                                datasource.setPluginId(pluginMap.get(datasource.getPluginId()));
                                datasource.setOrganizationId(organizationId);

                                // Check if any decrypted fields are present for datasource
                                if (importedDoc.getDecryptedFields().get(datasource.getName()) != null) {

                                    DecryptedSensitiveFields decryptedFields =
                                            importedDoc.getDecryptedFields().get(datasource.getName());

                                    updateAuthenticationDTO(datasource, decryptedFields);
                                }
                                return createUniqueDatasourceIfNotPresent(existingDatasourceFlux, datasource, organizationId);
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
                                    if (applicationId != null) {
                                        return applicationService.findById(applicationId, AclPermission.MANAGE_APPLICATIONS)
                                                .switchIfEmpty(
                                                        Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId))
                                                )
                                                .flatMap(existingApplication -> {
                                                    importedApplication.setId(existingApplication.getId());
                                                    BeanCopyUtils.copyNewFieldValuesIntoOldObject(importedApplication, existingApplication);
                                                    // Here we are expecting the changes present in DB are committed to git directory
                                                    // so that these won't be lost when we are pulling changes from remote and
                                                    // rehydrate the application. We are now rehydrating the application with/without
                                                    // the changes from remote

                                                    return applicationService.update(applicationId, existingApplication);
                                                });
                                    }
                                    return applicationService
                                            .findByOrganizationId(organizationId, AclPermission.MANAGE_APPLICATIONS)
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
                    Map<PublishType, List<ApplicationPage>> applicationPages = Map.of(
                            PublishType.UNPUBLISHED, new ArrayList<>(),
                            PublishType.PUBLISHED, new ArrayList<>()
                    );

                    // Import and save pages, also update the pages related fields in saved application
                    assert importedNewPageList != null;
                    return importAndSavePages(
                            importedNewPageList,
                            importedApplication,
                            importedDoc.getPublishedLayoutmongoEscapedWidgets(),
                            importedDoc.getUnpublishedLayoutmongoEscapedWidgets()
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
                                    pageNameMap.put(newPage.getUnpublishedPage().getName(), newPage);
                                }

                                if (newPage.getPublishedPage() != null && newPage.getPublishedPage().getName() != null) {
                                    publishedAppPage.setIsDefault(
                                            StringUtils.equals(
                                                    newPage.getPublishedPage().getName(), importedDoc.getPublishedDefaultPageName()
                                            )
                                    );
                                    publishedAppPage.setId(newPage.getId());
                                    pageNameMap.put(newPage.getPublishedPage().getName(), newPage);
                                }
                                if (unpublishedAppPage.getId() != null) {
                                    applicationPages.get(PublishType.UNPUBLISHED).add(unpublishedAppPage);
                                }
                                if (publishedAppPage.getId() != null) {
                                    applicationPages.get(PublishType.PUBLISHED).add(publishedAppPage);
                                }
                                return applicationPages;
                            })
                            .then()
                            .thenReturn(applicationPages);
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
                            .flatMap(newAction -> {
                                NewPage parentPage = new NewPage();
                                if (newAction.getUnpublishedAction() != null && newAction.getUnpublishedAction().getName() != null) {
                                    parentPage = pageNameMap.get(newAction.getUnpublishedAction().getPageId());
                                    actionIdMap.put(newAction.getUnpublishedAction().getName() + parentPage.getId(), newAction.getId());
                                    newAction.getUnpublishedAction().setPageId(parentPage.getId());
                                    sanitizeDatasourceInActionDTO(newAction.getUnpublishedAction(), datasourceMap, pluginMap, organizationId);
                                }

                                if (newAction.getPublishedAction() != null && newAction.getPublishedAction().getName() != null) {
                                    parentPage = pageNameMap.get(newAction.getPublishedAction().getPageId());
                                    actionIdMap.put(newAction.getPublishedAction().getName() + parentPage.getId(), newAction.getId());
                                    newAction.getPublishedAction().setPageId(parentPage.getId());
                                    sanitizeDatasourceInActionDTO(newAction.getPublishedAction(), datasourceMap, pluginMap, organizationId);
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
                                    BeanCopyUtils.copyNewFieldValuesIntoOldObject(newAction, existingAction);
                                    return newActionService.update(newAction.getId(), existingAction);
                                }
                                return newActionService.save(newAction);
                            })
                            .map(newAction -> {
                                // Populate actionIdsMap to associate the appropriate actions to be run on page load
                                if (newAction.getUnpublishedAction() != null) {
                                    ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                                    actionIdMap.put(
                                            actionIdMap.get(unpublishedAction.getName() + unpublishedAction.getPageId()),
                                            newAction.getId()
                                    );

                                    if (unpublishedAction.getCollectionId() != null) {
                                        unpublishedActionCollectionIdMap.putIfAbsent(unpublishedAction.getCollectionId(), new HashSet<>());
                                        final Set<String> actionIds = unpublishedActionCollectionIdMap.get(unpublishedAction.getCollectionId());
                                        actionIds.add(newAction.getId());
                                    }
                                }
                                if (newAction.getPublishedAction() != null) {
                                    ActionDTO publishedAction = newAction.getPublishedAction();
                                    actionIdMap.put(
                                            actionIdMap.get(publishedAction.getName() + publishedAction.getPageId()),
                                            newAction.getId()
                                    );

                                    if (publishedAction.getCollectionId() != null) {
                                        publishedActionCollectionIdMap.putIfAbsent(publishedAction.getCollectionId(), new HashSet<>());
                                        final Set<String> actionIds = publishedActionCollectionIdMap.get(publishedAction.getCollectionId());
                                        actionIds.add(newAction.getId());
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
                    assert importedActionCollectionList != null;

                    return Flux.fromIterable(importedActionCollectionList)
                            .flatMap(actionCollection -> {
                                final String actionCollectionId = actionCollection.getId();
                                NewPage parentPage = new NewPage();
                                final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
                                if (unpublishedCollection != null && unpublishedCollection.getName() != null) {
                                    parentPage = pageNameMap.get(unpublishedCollection.getPageId());
                                    unpublishedCollection.setActionIds(unpublishedActionCollectionIdMap.get(actionCollection.getId()));
                                    unpublishedCollection.setPageId(parentPage.getId());
                                    unpublishedCollection.setPluginId(pluginMap.get(unpublishedCollection.getPluginId()));
                                }

                                final ActionCollectionDTO publishedCollection = actionCollection.getPublishedCollection();
                                if (publishedCollection != null && publishedCollection.getName() != null) {
                                    parentPage = pageNameMap.get(publishedCollection.getPageId());
                                    publishedCollection.setActionIds(publishedActionCollectionIdMap.get(actionCollection.getId()));
                                    publishedCollection.setPageId(parentPage.getId());
                                    publishedCollection.setPluginId(pluginMap.get(publishedCollection.getPluginId()));
                                }

                                examplesOrganizationCloner.makePristine(actionCollection);
                                actionCollection.setOrganizationId(organizationId);
                                actionCollection.setApplicationId(importedApplication.getId());
                                actionCollectionService.generateAndSetPolicies(parentPage, actionCollection);

                                return actionCollectionService.save(actionCollection)
                                        .flatMapMany(createdActionCollection -> {
                                            unpublishedActionCollectionIdMap
                                                    .getOrDefault(actionCollectionId, Set.of())
                                                    .forEach(actionId -> {
                                                        unpublishedActionIdToCollectionIdMap.put(actionId, actionCollectionId);
                                                    });
                                            publishedActionCollectionIdMap
                                                    .getOrDefault(actionCollectionId, Set.of())
                                                    .forEach(actionId -> {
                                                        publishedActionIdToCollectionIdMap.put(actionId, actionCollectionId);
                                                    });
                                            final HashSet<String> actionIds = new HashSet<>();
                                            actionIds.addAll(unpublishedActionIdToCollectionIdMap.keySet());
                                            actionIds.addAll(publishedActionIdToCollectionIdMap.keySet());
                                            return Flux.fromIterable(actionIds);
                                        })
                                        .flatMap(actionId -> newActionRepository.findById(actionId, AclPermission.MANAGE_ACTIONS))
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
                            .then()
                            .thenReturn(true);
                })
                .flatMap(ignored -> {
                    // Map layoutOnLoadActions ids with relevant actions
                    assert importedNewPageList != null;
                    importedNewPageList.forEach(page -> mapActionIdWithPageLayout(page, actionIdMap));
                    return Flux.fromIterable(importedNewPageList)
                            .flatMap(newPageService::save)
                            .then(applicationService.update(importedApplication.getId(), importedApplication));
                });
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
                                             Map<String, Set<String>> unpublishedMongoEscapedWidget) {

        Mono<List<NewPage>> existingPages = newPageService
                .findNewPagesByApplicationId(application.getId(), AclPermission.MANAGE_PAGES)
                .collectList();

        pages.forEach(newPage -> {
            String layoutId = new ObjectId().toString();
            newPage.setApplicationId(application.getId());
            if (newPage.getUnpublishedPage() != null) {
                applicationPageService.generateAndSetPagePolicies(application, newPage.getUnpublishedPage());
                newPage.setPolicies(newPage.getUnpublishedPage().getPolicies());
                if (unpublishedMongoEscapedWidget != null) {
                    newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                        layout.setMongoEscapedWidgetNames(unpublishedMongoEscapedWidget.get(layout.getId()));
                        layout.setId(layoutId);
                    });
                }
            }

            if (newPage.getPublishedPage() != null) {
                applicationPageService.generateAndSetPagePolicies(application, newPage.getPublishedPage());
                if (publishedMongoEscapedWidget != null) {
                    newPage.getPublishedPage().getLayouts().forEach(layout -> {
                        layout.setMongoEscapedWidgetNames(publishedMongoEscapedWidget.get(layout.getId()));
                        layout.setId(layoutId);
                    });
                }
            }
        });

        return existingPages.flatMapMany(existingSavedPages -> {
            Map<String, NewPage> savedPagesGitIdToPageMap = new HashMap<>();

            existingSavedPages.stream()
                    .filter(newPage -> newPage.getGitSyncId() != null)
                    .forEach(newPage -> savedPagesGitIdToPageMap.put(newPage.getGitSyncId(), newPage));

            return Flux.fromIterable(pages)
                    .flatMap(newPage -> {
                        // Check if the page has gitSyncId and if it's already in DB
                        if (newPage.getGitSyncId() != null && savedPagesGitIdToPageMap.containsKey(newPage.getGitSyncId())) {
                            //Since the resource is already present in DB, just update resource
                            NewPage existingPage = savedPagesGitIdToPageMap.get(newPage.getGitSyncId());
                            newPage.setId(savedPagesGitIdToPageMap.get(newPage.getGitSyncId()).getId());
                            BeanCopyUtils.copyNewFieldValuesIntoOldObject(newPage, existingPage);
                            return newPageService.update(newPage.getId(), existingPage);
                        }
                        return newPageService.save(newPage);
                    });
        });
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
    private String sanitizeDatasourceInActionDTO(ActionDTO actionDTO, Map<String, String> datasourceMap, Map<String, String> pluginMap, String organizationId) {

        if (actionDTO != null && actionDTO.getDatasource() != null) {

            Datasource ds = actionDTO.getDatasource();
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
    private void mapActionIdWithPageLayout(NewPage page, Map<String, String> actionIdMap) {
        if (page.getUnpublishedPage().getLayouts() != null) {

            page.getUnpublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(actionDTO -> actionDTO.setId(actionIdMap.get(actionDTO.getId()))));
                }
            });
        }

        if (page.getPublishedPage() != null && page.getPublishedPage().getLayouts() != null) {

            page.getPublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(actionDTO -> actionDTO.setId(actionIdMap.get(actionDTO.getId()))));
                }
            });
        }
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
                                                                String organizationId) {

        /*
            1. If same datasource is present return
            2. If unable to find the datasource create a new datasource with unique name and return
         */
        final DatasourceConfiguration datasourceConfig = datasource.getDatasourceConfiguration();
        AuthenticationResponse authResponse = new AuthenticationResponse();
        if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
            BeanCopyUtils.copyNestedNonNullProperties(
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
                .filter(ds -> ds.softEquals(datasource))
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

}
