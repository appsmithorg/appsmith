package com.appsmith.server.solutions;

import com.appsmith.external.helpers.BeanCopyUtils;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
    private final CommonConfig commonConfig;
    private final ReleaseNotesService releaseNotesService;

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";
    private static final String PAGE_DIRECTORY = "/Pages/";
    private static final String ACTION_DIRECTORY = "/Actions/";
    private static final String DATASOURCE_DIRECTORY = "/Datasources/";
    private enum PublishType {
        UNPUBLISHED, PUBLISHED
    }

    /**
     * This function will give the application resource to rebuild the application in import application flow
     * @param applicationId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationJson> exportApplicationById(String applicationId) {

        /*
            1. Fetch application by id
            2. Fetch pages from the application
            3. Fetch datasources from organization
            4. Fetch actions from the application
            5. Filter out relevant datasources using actions reference
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

                // Insert the release version for exported file
                applicationJson.setAppsmithVersion(releaseNotesService.getReleasedVersion());

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
                examplesOrganizationCloner.makePristine(application);
                applicationJson.setExportedApplication(application);
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
                    .map(newActionList -> {
                        Set<String> concernedDBNames = new HashSet<>();
                        newActionList.forEach(newAction -> {
                            newAction.setPluginId(pluginMap.get(newAction.getPluginId()));
                            newAction.setOrganizationId(null);
                            newAction.setPolicies(null);
                            newAction.setApplicationId(null);
                            //Collect Datasource names to filter only required datasources
                            if (PluginType.DB.equals(newAction.getPluginType())
                                || PluginType.API.equals(newAction.getPluginType())
                                || PluginType.SAAS.equals(newAction.getPluginType())) {
                                concernedDBNames.add(
                                    sanitizeDatasourceInActionDTO(newAction.getPublishedAction(), datasourceIdToNameMap, pluginMap, null)
                                );
                                concernedDBNames.add(
                                    sanitizeDatasourceInActionDTO(newAction.getUnpublishedAction(), datasourceIdToNameMap, pluginMap, null)
                                );
                            }
                            if (newAction.getUnpublishedAction() != null) {
                                ActionDTO actionDTO = newAction.getUnpublishedAction();
                                actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId() + PublishType.UNPUBLISHED));
                            }
                            if (newAction.getPublishedAction() != null) {
                                ActionDTO actionDTO = newAction.getPublishedAction();
                                actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId() + PublishType.PUBLISHED));
                            }
                        });
                        applicationJson
                                .getDatasourceList()
                                .removeIf(datasource -> !concernedDBNames.contains(datasource.getName()));
                        
                        applicationJson.setActionList(newActionList);
                        
                        //Only export those datasources which are used in the app instead of org level
                        Map<String, DecryptedSensitiveFields> decryptedFields = new HashMap<>();
                        applicationJson.getDatasourceList().forEach(datasource -> {
                            decryptedFields.put(datasource.getName(), getDecryptedFields(datasource));
                            datasource.setId(null);
                            datasource.setOrganizationId(null);
                            datasource.setPluginId(pluginMap.get(datasource.getPluginId()));
                            datasource.setStructure(null);
                            if (datasource.getDatasourceConfiguration() != null) {
                                datasource.getDatasourceConfiguration().setAuthentication(null);
                            }
                        });
                        applicationJson.setDecryptedFields(decryptedFields);
                        return applicationJson;
                    });
                });
    }

    /**
     * This function will take the Json filepart and saves the application in organization
     * @param orgId organization to which the application needs to be hydrated
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
                    Type fileType = new TypeToken<ApplicationJson>() {}.getType();
                    ApplicationJson jsonFile = gson.fromJson(data, fileType);
                    return importApplicationInOrganization(orgId, jsonFile);
                });
    }

    /**
     * This function will save the application to organisation from the application resource
     * @param organizationId organization to which application is going to be stored
     * @param importedDoc application resource which contains necessary information to save the application
     * @return saved application in DB
     */
    public Mono<Application> importApplicationInOrganization(String organizationId, ApplicationJson importedDoc) {

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
        
        Application importedApplication = importedDoc.getExportedApplication();
        List<Datasource> importedDatasourceList = importedDoc.getDatasourceList();
        List<NewPage> importedNewPageList = importedDoc.getPageList();
        List<NewAction> importedNewActionList = importedDoc.getActionList();
        
        Mono<User> currUserMono = sessionUserService.getCurrentUser();
        final Flux<Datasource> existingDatasourceFlux = datasourceRepository.findAllByOrganizationId(organizationId).cache();
        
        String errorField = "";
        if (importedNewPageList == null || importedNewPageList.isEmpty()) {
            errorField = FieldName.PAGES;
        } else if (importedApplication == null) {
            errorField = FieldName.APPLICATION;
        } else if (importedNewActionList == null) {
            errorField = FieldName.ACTIONS;
        } else if (importedDatasourceList == null) {
            errorField = FieldName.DATASOURCE;
        }
        
        if(!errorField.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, errorField, INVALID_JSON_FILE));
        } else if(importedDoc.getAppsmithVersion() == null) {
            return Mono.error(
                new AppsmithException(
                    AppsmithError.JSON_PROCESSING_ERROR,
                    ": Unable to find version field in the uploaded file. Can you please try exporting the " +
                        "application from source Appsmith server and then importing it once again"
                ));
        } else if(!releaseNotesService.getReleasedVersion().equals(importedDoc.getAppsmithVersion())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_IMPORTED_FILE_ERROR));
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
                    assert importedDatasourceList != null : "At least empty datasource list is expected here";
                    return Flux.fromIterable(importedDatasourceList)
                        //Check for duplicate datasources to avoid duplicates in target organization
                        .flatMap(datasource -> {
                            datasource.setPluginId(pluginMap.get(datasource.getPluginId()));
                            datasource.setOrganizationId(organization.getId());

                            //Check if any decrypted fields are present for datasource
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
                }
            )
            .then(
                // 1. Assign the policies for the imported application
                // 2. Check for possible duplicate names,
                // 3. Save the updated application
                applicationPageService.setApplicationPolicies(currUserMono, organizationId, importedApplication)
                    .flatMap(application -> applicationService
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
                                    assert importedApplication != null;
                                    importedApplication.setName(importedApplication.getName() + suffix);
                                    return importedApplication;
                                });
                        })
                        .then(applicationService.save(importedApplication))
                    )
            )
            .flatMap(savedApp -> {
                assert importedApplication != null;
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
                assert importedApplication != null;
                importedApplication.setPages(applicationPageMap.get(PublishType.UNPUBLISHED));
                importedApplication.setPublishedPages(applicationPageMap.get(PublishType.PUBLISHED));

                assert importedNewActionList != null;
                importedNewActionList.forEach(newAction -> {
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
                });
                return newActionService.saveAll(importedNewActionList)
                    .map(newAction -> {
                        
                        if (newAction.getUnpublishedAction() != null) {
                            ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                            actionIdMap.put(
                                actionIdMap.get(unpublishedAction.getName() + unpublishedAction.getPageId()),
                                newAction.getId()
                            );
                        }
    
                        if (newAction.getPublishedAction() != null) {
                            ActionDTO publishedAction = newAction.getPublishedAction();
                            actionIdMap.put(
                                actionIdMap.get(publishedAction.getName() + publishedAction.getPageId()),
                                newAction.getId()
                            );
                        }
                        
                        return newAction;
                    })
                    .then(Mono.just(importedApplication));
            })
            .flatMap(ignored -> {
                //Map layoutOnLoadActions ids with relevant actions
                assert importedNewPageList != null;
                importedNewPageList.forEach(page -> mapActionIdWithPageLayout(page, actionIdMap));
                return Flux.fromIterable(importedNewPageList)
                    .flatMap(newPageService::save)
                    .then(applicationService.update(importedApplication.getId(), importedApplication));
            });
    }

    /**
     * This function will respond with unique suffixed number for the entity to avoid duplicate names
     * @param sourceEntity for which the suffixed number is required to avoid duplication
     * @param orgId organisation in which entity should be searched
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
     * @param pages pagelist extracted from the imported JSON file
     * @param application saved application where pages needs to be added
     * @param publishedMongoEscapedWidget widget list those needs to be escaped for published layout
     * @param unpublishedMongoEscapedWidget widget list those needs to be escaped for unpublished layout
     * @return saved pages
     */
    private Flux<NewPage> importAndSavePages(List<NewPage> pages,
                                             Application application,
                                             Map<String, Set<String>> publishedMongoEscapedWidget,
                                             Map<String, Set<String>> unpublishedMongoEscapedWidget
    ) {

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

        return Flux.fromIterable(pages)
                .flatMap(newPageService::save);
    }

    /**
     * This function will be used to sanitise datasource within the actionDTO
     * @param actionDTO for which the datasource needs to be sanitised as per import format expected
     * @param datasourceMap datasource id to name map
     * @param pluginMap plugin id to name map
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
                ds.setPluginId(null);
                return ds.getId();
            } else {
                // This means we don't have regular datasource it can be simple REST_API
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
     * @param existingDatasourceFlux already present datasource in the organization
     * @param datasource which will be checked against existing datasources
     * @param organizationId organization where duplicate datasource should be checked
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
     * @param datasource for which sensitive fields should be rehydrated
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
     * This method will save the complete application in the local repo directory. The repoPath will contain the actual
     * path of branch as we will be using worktree for the requirement of multiple branches checked out at the same time
     * @param applicationJson application reference object from which entire application can be rehydrated
     * @param branchName name of the branch for the current application
     * @return repo path where the application is stored
     */
    public Mono<String> saveApplicationWithinServerDirectory(ApplicationJson applicationJson, String branchName) {

        String baseRepoPath = commonConfig.gitRepoPath + "/" + applicationJson.getExportedApplication().getName() + "/" + branchName;

        /*
        Application will be stored in the following structure :
        repo
        --ApplicationName
        ----Datasource
            --datasource1Name
            --datasource2Name
        ----Actions (Only requirement here is the filename should be unique)
            --action1_page1
            --action2_page2
        ----Pages
            --page1
            --page2
         */

        Gson gson = new GsonBuilder().disableHtmlEscaping().setPrettyPrinting().create();

        // Save application
        saveFile(applicationJson.getExportedApplication(), baseRepoPath + "/application.json", gson);

        // Save pages
        applicationJson.getPageList().forEach(newPage -> {
            String pageName = "";
            if (newPage.getUnpublishedPage() != null) {
                pageName = newPage.getUnpublishedPage().getName();
            } else if (newPage.getPublishedPage() != null) {
                pageName = newPage.getPublishedPage().getName();
            }
            saveFile(newPage, baseRepoPath + PAGE_DIRECTORY + pageName + ".json", gson);
        });

        // Save actions
        applicationJson.getActionList().forEach(newAction -> {
            String prefix = newAction.getUnpublishedAction() != null ?
                newAction.getUnpublishedAction().getName() + "_" + newAction.getUnpublishedAction().getPageId()
                : newAction.getPublishedAction().getName() + "_" + newAction.getPublishedAction().getPageId();
            saveFile(newAction, baseRepoPath + ACTION_DIRECTORY + prefix + ".json", gson);
        });

        // Save datasources ref
        applicationJson.getDatasourceList().forEach(
            datasource -> saveFile(datasource, baseRepoPath + DATASOURCE_DIRECTORY + datasource.getName() + ".json", gson)
        );

        return Mono.just(baseRepoPath);
    }

    private boolean saveFile (BaseDomain sourceEntity, String path, Gson gson) {
        File file = new File(path);
        try {
            // Create a file if absent
            FileUtils.write(file, "", StandardCharsets.UTF_8);
            FileWriter fileWriter = new FileWriter(file);
            gson.toJson(sourceEntity, fileWriter);
            fileWriter.close();
            return file.isFile() && file.length() > 0;
        } catch (IOException e) {
            log.debug(e.getMessage());
        }
        return false;
    }

    /**
     * This will reconstruct the application from the repo file
     * @param applicationName path to the actual application
     * @param branchName for which the application needs to be rehydrate
     * @return application reference from which entire application can be rehydrated
     */
    public ApplicationJson reconstructApplicationFromServerDirectory(String applicationName, String branchName) {

        String baseRepo = commonConfig.getGitRepoPath() + "/" + applicationName + "/" + branchName;
        ApplicationJson applicationJson = new ApplicationJson();

        Gson gson = new GsonBuilder()
            .registerTypeAdapter(DatasourceStructure.Key.class, new DatasourceStructure.KeyInstanceCreator())
            .create();

        // Extract application data from the json
        applicationJson.setExportedApplication(
            (Application) readFile( baseRepo + "/application.json", gson, Application.class)
        );

        // Extract actions
        List<NewAction> importedActions = new ArrayList<>();
        applicationJson.setActionList(
            (List<NewAction>) readFiles(baseRepo + ACTION_DIRECTORY, gson, importedActions, NewAction.class)
        );

        // Extract pages
        List<NewPage> importedPages = new ArrayList<>();
        applicationJson.setPageList(
            (List<NewPage>) readFiles(baseRepo + PAGE_DIRECTORY, gson, importedPages, NewPage.class)
        );

        // Extract datasources
        List<Datasource> importedDatasources = new ArrayList<>();
        applicationJson.setDatasourceList(
            (List<Datasource>) readFiles(baseRepo + DATASOURCE_DIRECTORY, gson, importedDatasources, Datasource.class)
        );

        return applicationJson;
    }

    private BaseDomain readFile(String filePath, Gson gson, Class<? extends BaseDomain> domain) {
        JsonReader reader = null;
        try {
            reader = new JsonReader(new FileReader(filePath));
        } catch (FileNotFoundException e) {
            log.debug(e.getMessage());
        }
        assert reader != null;
        return gson.fromJson(reader, domain);
    }

    private List<? extends BaseDomain> readFiles(String directoryPath,
                                                 Gson gson,
                                                 List<? extends BaseDomain> domainList,
                                                 Class<? extends BaseDomain> domainClass) {
        File directory = new File(directoryPath);
        if (directory.isDirectory()) {
            Arrays.stream(Objects.requireNonNull(directory.listFiles())).forEach(file -> {
                try {
                    domainList.add(gson.fromJson(new JsonReader(new FileReader(file)), domainClass));
                } catch (FileNotFoundException e) {
                    log.debug(e.getMessage());
                }
            });
        }
        return domainList;
    }

    /*
    public WidgetDSLMetadata getWidgetDslMetadata(JSONObject dsl) {

        // 1. Fetch the children of the current node in the DSL and recursively iterate over them
        // 2. Delete unwanted children and update dsl
        WidgetDSLMetadata widgetDSLMetadata = new WidgetDSLMetadata();

        if (dsl.get(FieldName.WIDGET_NAME) == null) {
            // This isn't a valid widget configuration. No need to traverse this.
            return widgetDSLMetadata;
        }

        // Updates in dynamicBindingPathlist not required as it's updated by FE code
        // Fetch the children of the current node in the DSL and recursively iterate over them
        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        ArrayList<Object> newChildren = new ArrayList<>();
        if (children != null) {
            for (Object obj : children) {
                if (!(obj instanceof Map)) {
                    log.error("Child in DSL is not instanceof Map, {}", obj);
                    continue;
                }
                Map data = (Map) obj;
                JSONObject object = new JSONObject();
                // If the children tag exists and there are entries within it
                if (!CollectionUtils.isEmpty(data)) {
                    object.putAll(data);
                    JSONObject child =
                        extractAndUpdateAllWidgetFromDSL(object, mappedColumnsAndTableNames, deletedWidgets);
                    String widgetType = child.getAsString(FieldName.WIDGET_TYPE);
                    if (FieldName.TABLE_WIDGET.equals(widgetType)
                        || FieldName.CONTAINER_WIDGET.equals(widgetType)
                        || FieldName.CANVAS_WIDGET.equals(widgetType)
                        || FieldName.FORM_WIDGET.equals(widgetType)
                        || !child.toString().contains(DELETE_FIELD)
                    ) {
                        newChildren.add(child);
                    } else {
                        deletedWidgets.add(child.getAsString(FieldName.WIDGET_NAME));
                    }
                }
            }
            dsl.put(FieldName.CHILDREN, newChildren);
        }

        return dsl;
    }
    */
}
