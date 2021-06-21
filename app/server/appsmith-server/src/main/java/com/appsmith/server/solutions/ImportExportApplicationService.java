package com.appsmith.server.solutions;

import com.appsmith.external.helpers.BeanCopyUtils;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.acl.AclPermission;
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

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    public final String INVALID_JSON_FILE = "invalid json file";
    private enum PublishType {
        UNPUBLISHED, PUBLISHED
    }

    public Mono<ApplicationJson> exportApplicationById(String applicationId) {
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
                    ApplicationPage publishedDefaultPage = application.getPublishedPages()
                        .stream()
                        .filter(ApplicationPage::getIsDefault)
                        .findFirst()
                        .orElse(null);
                    
                    if(publishedDefaultPage != null) {
                        applicationJson.setPublishedDefaultPageName(publishedDefaultPage.getId());
                    }
                }
                
                final String organizationId = application.getOrganizationId();
                application.setOrganizationId(null);
                application.setPages(null);
                examplesOrganizationCloner.makePristine(application);
                applicationJson.setExportedApplication(application);
                return newPageRepository.findByApplicationId(applicationId, AclPermission.MANAGE_PAGES)
                    .collectList()
                    .flatMap(newPageList -> {
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
                            if (newAction.getPluginType() == PluginType.DB || newAction.getPluginType() == PluginType.API) {
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
                            if (datasource.getDatasourceConfiguration() != null) {
                                datasource.getDatasourceConfiguration().setAuthentication(null);
                            }
                        });
                        applicationJson.setDecryptedFields(decryptedFields);
                        return applicationJson;
                    });
                })
                .then()
                .thenReturn(applicationJson);
    }

    public Mono<Application> extractFileAndSaveApplication(String orgId, Part filePart) {

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
    
    public Mono<Application> importApplicationInOrganization(String organizationId, ApplicationJson importedDoc) {
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
            .flatMap(organization -> Flux.fromIterable(importedDatasourceList)
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
                .collectList()
            )
            .then(
                
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
                                    importedApplication.setName(importedApplication.getName() + suffix);
                                    return importedApplication;
                                });
                        })
                        .then(applicationService.save(importedApplication))
                    )
            )
            .flatMap(savedApp -> {
                importedApplication.setId(savedApp.getId());
                Map<PublishType, List<ApplicationPage>> applicationPages = Map.of(
                    PublishType.UNPUBLISHED, new ArrayList<>(),
                    PublishType.PUBLISHED, new ArrayList<>()
                );
                
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
                    applicationPages.get(PublishType.UNPUBLISHED).add(unpublishedAppPage);
                    applicationPages.get(PublishType.PUBLISHED).add(publishedAppPage);
                    return applicationPages;
                })
                .then()
                .thenReturn(applicationPages);
            })
            .flatMap(applicationPageMap -> {
                importedApplication.setPages(applicationPageMap.get(PublishType.UNPUBLISHED));
                importedApplication.setPublishedPages(applicationPageMap.get(PublishType.PUBLISHED));
                
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
                importedNewPageList.forEach(page -> mapActionIdWithPageLayout(page, actionIdMap));
                return Flux.fromIterable(importedNewPageList)
                    .flatMap(newPageService::save)
                    .then(applicationService.update(importedApplication.getId(), importedApplication));
            });
    }

    private Mono<String> getUniqueSuffixForDuplicateNameEntity(BaseDomain sourceEntity, String orgId) {
        if (sourceEntity != null) {
            return sequenceService
                .getNextAsSuffix(sourceEntity.getClass(), " for organization with _id : " + orgId)
                .flatMap(sequenceNumber -> Mono.just(" #" + sequenceNumber.trim()));
        }
        return Mono.just("");
    }

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

    private Mono<Datasource> createUniqueDatasourceIfNotPresent(Flux<Datasource> existingDatasourceFlux,
                                                                Datasource datasource,
                                                                String toOrgId) {

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
                        .findByNameAndOrganizationId(datasource.getName(), toOrgId, AclPermission.MANAGE_DATASOURCES)
                        .flatMap(duplicateNameDatasource ->
                            getUniqueSuffixForDuplicateNameEntity(duplicateNameDatasource, toOrgId)
                        )
                        .map(suffix -> {
                            datasource.setName(datasource.getName() + suffix);
                            return datasource;
                        })
                        .then(datasourceService.create(datasource));
                }));
    }

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
            datasource.getDatasourceConfiguration().setAuthentication(auth2);
        }
        return datasource;
    }

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
