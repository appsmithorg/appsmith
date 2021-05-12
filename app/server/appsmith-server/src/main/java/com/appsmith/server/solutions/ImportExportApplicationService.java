package com.appsmith.server.solutions;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJSONFile;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ImportExportApplicationService {
    private final DatasourceService datasourceService;
    private final SessionUserService sessionUserService;
    private final NewActionRepository newActionRepository;
    private final PluginRepository pluginRepository;
    private final OrganizationService organizationService;
    private final ApplicationService applicationService;
    private final NewPageService newPageService;
    private final ApplicationPageService applicationPageService;
    private final DatasourceContextService datasourceContextService;
    private final NewPageRepository newPageRepository;
    private final NewActionService newActionService;
    private final EncryptionService encryptionService;
    private final SequenceService sequenceService;

    public Mono<ApplicationJSONFile> getApplicationFileById(String applicationId) {
        ApplicationJSONFile file = new ApplicationJSONFile();
        Map<String, String> pluginMap = new HashMap<>();
        Map<String, String> datasourceMap = new HashMap<>();
        Map<String, String> newPageIdMap = new HashMap<>();

        return pluginRepository
                .findAll()
                .collectList()
                .map(pluginList -> {
                    pluginList.forEach(plugin -> pluginMap.put(plugin.getId(), plugin.getPackageName()));
                    return pluginList;
                })
                .flatMap(ignore -> applicationService.findById(applicationId, AclPermission.READ_APPLICATIONS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(application -> {
                    ApplicationPage defaultPage = application.getPages()
                            .stream()
                            .filter(page -> page.getIsDefault() == true)
                            .findFirst()
                            .orElse(null);

                    return Mono.zip(
                            newPageRepository.findById(defaultPage.getId(), AclPermission.READ_PAGES),
                            Mono.just(defaultPage),
                            Mono.just(application)
                    );
                })
                .flatMap(tuple -> {
                    NewPage defaultPage = tuple.getT1();
                    ApplicationPage defaultPageRef = tuple.getT2();
                    Application application = tuple.getT3();
                    if(defaultPage != null) {
                        defaultPageRef.setId(defaultPage.getUnpublishedPage().getName());
                    }
                    final String organizationId = application.getOrganizationId();
                    application.setOrganizationId(null);
                    makePristine(application);
                    String applicationName = application.getName();
                    file.setExportedApplication(application);
//                    log.debug("Exported Application : {}",file.getExportedApplication());
                    return newPageRepository.findByApplicationId(applicationId, AclPermission.READ_PAGES)
                            .collectList()
                            .map(newPageList -> {
                                newPageList.forEach(newPage -> {
                                    newPageIdMap.put(newPage.getId(), newPage.getUnpublishedPage().getName());
                                    newPage.setApplicationId(applicationName);
                                    makePristine(newPage);
                                });
                                file.setPageList(newPageList);
                                //log.debug("Exported Actions : {}",file.getActionList());
                                return datasourceService.findAllByOrganizationId(organizationId, AclPermission.READ_DATASOURCES);
                            })
                            .flatMap(datasourceFlux -> datasourceFlux.collectList())
                            .map(datasourceList -> {
                                //TODO Only export those are used in the app instead of org level
                                datasourceList.forEach(datasource -> {
                                    //decrypt all the fields in authentication object
                                    AuthenticationDTO authentication = datasource.getDatasourceConfiguration() == null
                                            ? null : datasource.getDatasourceConfiguration().getAuthentication();

                                    if (authentication != null) {
                                        authentication.setIsAuthorized(null);
                                        authentication.setAuthenticationResponse(null);
                                    }

                                    datasourceContextService.decryptSensitiveFields(authentication);
                                    datasource.setPluginId(pluginMap.get(datasource.getPluginId()));

                                    datasourceMap.put(datasource.getId(), datasource.getName());
                                    datasource.setId(null);
                                });
                                file.setDatasourceList(datasourceList);
                                return newActionRepository.findByApplicationId(applicationId);
                            })
                            .flatMap(Flux::collectList)
                            .map(newActionList -> {
                                newActionList.forEach(newAction -> {
                                    newAction.setPluginId(pluginMap.get(newAction.getPluginId()));
                                    newAction.setOrganizationId(null);
                                    newAction.setPolicies(null);
                                    newAction.setApplicationId(applicationName);
                                    mapDatasourceToExportAction(newAction, datasourceMap);
                                    if(newAction.getUnpublishedAction() != null) {
                                        ActionDTO actionDTO = newAction.getUnpublishedAction();
                                        actionDTO.setPageId(newPageIdMap.get(actionDTO.getPageId()));
                                    }
                                });
                                file.setActionList(newActionList);
                                //log.debug("Exported datasources : {}",file.getDatasourceList());
                                return Mono.just(file);
                            });
                })
                .then()
                .thenReturn(file);
    }

    public Mono<Application> importApplicationInOrganization(String orgId, ApplicationJSONFile importedDoc) {
        Map<String, String> pluginMap = new HashMap<>();
        Map<String, String> datasourceMap = new HashMap<>();
        Map<String, NewPage> pageNameMap = new HashMap<>();
        Map<String, String> actionIdMap = new HashMap<>();

        Application importedApplication = importedDoc.getExportedApplication();
        List<Datasource> importedDatasourceList = importedDoc.getDatasourceList();
        List<NewPage> importedNewPageList = importedDoc.getPageList();
        List<NewAction> importedNewActionList = importedDoc.getActionList();

        Mono<User> currUserMono = sessionUserService.getCurrentUser();
        log.debug("In importing function");
        return organizationService.findById(orgId, AclPermission.ORGANIZATION_MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, orgId)))
                .flatMap(organization ->
                    pluginRepository.findAll()
                        .collectList()
                        .map(pluginList -> {
                            pluginList.forEach(plugin -> pluginMap.put(plugin.getPackageName(), plugin.getId()));
                            log.debug("Plugin Map : {}", pluginMap);
                            return pluginList;
                        })
                )
                .flatMap(pluginList -> {

                    return Flux.fromIterable(importedDatasourceList)
                        //TODO check for duplicate datasources to avoid duplicates in target organization
                        .flatMap(datasource -> {
                            datasource.setPluginId(pluginMap.get(datasource.getPluginId()));
                            datasource.setOrganizationId(orgId);
                            return datasourceService.findByName(datasource.getName(), AclPermission.READ_DATASOURCES)
                                .flatMap(duplicateNameDatasource -> getUniqueSuffixForDuplicateNameEntity(duplicateNameDatasource, orgId))
                                .map(suffix -> {
                                    datasource.setName(datasource.getName() + suffix);
                                    return datasource;
                                })
                                .then(datasourceService.create(datasource));
                        })
                        .map(datasource -> {
                            log.debug("Saved DS : {}", datasource);
                            datasourceMap.put(datasource.getName(), datasource.getId());
                            return datasource;
                        })
                        .collectList();
                })
                .flatMap(ignored -> {
                    log.debug("Datasource Map : {}", datasourceMap);
                    ApplicationPage defaultPage = importedApplication.getPages()
                            .stream()
                            .filter(app -> app.getIsDefault())
                            .findFirst()
                            .get();
                    importedApplication.setPages(null);

                    return applicationPageService.setApplicationPolicies(currUserMono, orgId, importedApplication)
                            .flatMap(application -> applicationService.findByName(importedApplication.getName(), AclPermission.READ_APPLICATIONS))
                            .flatMap(duplicateNameApp -> getUniqueSuffixForDuplicateNameEntity(duplicateNameApp, orgId))
                            .map(suffix -> {
                                importedApplication.setName(importedApplication.getName() + suffix);
                                return defaultPage;
                            })
                            .then(Mono.zip(Mono.just(defaultPage), applicationService.save(importedApplication)));
                })
                .flatMap(tuple -> {
                    String defaultPageName = tuple.getT1().getId();
                    Application savedApp = tuple.getT2();
                    importedApplication.setId(savedApp.getId());
                    log.debug("Saved application : {}", savedApp);
                    importedNewPageList.forEach(newPage -> {
                        newPage.setApplicationId(savedApp.getId());
//                        newPage.getUnpublishedPage().getLayouts().forEach(layout -> layout.setId(null));
                        log.debug("newPage appId : {}", newPage.getApplicationId());
                    });
                    if(importedNewPageList.isEmpty()) {
                        new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE, importedNewPageList);
                    }
                    return importAndSavePages(importedNewPageList, importedApplication)
                            .map(newPage -> {
                                log.debug("Saved page : {}", newPage);
                                log.debug("Saved unpub Page : {}", newPage.getUnpublishedPage());
                                ApplicationPage tempPage = new ApplicationPage();
                                pageNameMap.put(newPage.getUnpublishedPage().getName(), newPage);
                                tempPage.setIsDefault(StringUtils.equals(newPage.getUnpublishedPage().getName(), defaultPageName));
                                tempPage.setId(newPage.getId());
                                return tempPage;
                            })
                            .collectList();
                })
                .flatMap(importedApplicationPages -> {
                    log.debug("ApplicationPages : {}", importedApplicationPages);
                    importedApplication.setPages(importedApplicationPages);

                    log.debug("PageIdMap: {}", pageNameMap);
                    importedNewActionList.forEach(newAction -> {
                        NewPage parentPage = pageNameMap.get(newAction.getUnpublishedAction().getPageId());
                        log.debug("Parent Page for action : {}", parentPage);
                        newAction.setOrganizationId(orgId);
                        newAction.setApplicationId(importedApplication.getId());
                        newAction.setPluginId(pluginMap.get(newAction.getPluginId()));
                        newAction.getUnpublishedAction().setPageId(parentPage.getId());
                        newAction.getPublishedAction().setPageId(parentPage.getId());
                        newActionService.generateAndSetActionPolicies(parentPage, newAction);
                        actionIdMap.put(newAction.getUnpublishedAction().getName(), newAction.getId());
                    });
                    return newActionService.saveAll(importedNewActionList)
                            .map(newAction -> {
                                log.debug("Saved new action : {}", newAction);
                                actionIdMap.put(actionIdMap.get(newAction.getUnpublishedAction().getName()), newAction.getId());
                                return newAction;
                            })
                            .then(Mono.just(importedApplication));
                })
                .flatMap(ignore -> {
                    log.debug("After empty action list");
                    importedNewPageList.forEach(page -> {
                        setPageLayout(page, actionIdMap);
                    });
                    return Flux.fromIterable(importedNewPageList)
                        .map(newPage -> newPageService.update(newPage.getId(), newPage))
                        .collectList()
                        .flatMap(finalPageList -> {
                            log.debug("finalPageList : {}", finalPageList);
                            return applicationService.update(importedApplication.getId(),importedApplication);
                        });
                });
    }

    //TODO use generics if possible
    //Class<? extends BaseDomain> sourceEntity
    private Mono<String> getUniqueSuffixForDuplicateNameEntity(BaseDomain sourceEntity, String orgId) {
        if(sourceEntity != null) {
            log.debug("SourceEntity class : {}", sourceEntity.getClass());
            return sequenceService
                    .getNextAsSuffix(sourceEntity.getClass(), " for organization with _id : " + orgId)
                    .flatMap(sequenceNumber -> Mono.just("#" + sequenceNumber));
        }
        log.debug("sourceEntity is null");
        return Mono.just("");
    }

    private Flux<NewPage> importAndSavePages(List<NewPage> pages, Application application) {

        pages.forEach(newPage -> {
            if(newPage.getPublishedPage() != null) {
                newPage.getPublishedPage().setApplicationId(application.getId());
                applicationPageService.generateAndSetPagePolicies(application, newPage.getPublishedPage());
            }
            newPage.getUnpublishedPage().setApplicationId(application.getId());
            applicationPageService.generateAndSetPagePolicies(application, newPage.getUnpublishedPage());
            newPage.setPolicies(newPage.getUnpublishedPage().getPolicies());
        });

        return Flux.fromIterable(pages)
                .flatMap(newPageService::save);
    }

    private void mapDatasourceToExportAction(NewAction action, Map<String, String> datasourceMap) {
        if (action.getUnpublishedAction() != null
                && action.getUnpublishedAction().getDatasource() != null
                && action.getUnpublishedAction().getDatasource().getId() != null) {

            Datasource unpublishedDatasource = action.getUnpublishedAction().getDatasource();
            String datasourceId = unpublishedDatasource.getId();
            unpublishedDatasource.setId(datasourceMap.get(datasourceId));
            unpublishedDatasource.setOrganizationId(null);
        }

        if (action.getPublishedAction() != null
                && action.getPublishedAction().getDatasource() != null
                && action.getPublishedAction().getDatasource().getId() != null) {

            Datasource publishedDatasource = action.getPublishedAction().getDatasource();
            String datasourceId = publishedDatasource.getId();
            publishedDatasource.setId(datasourceMap.get(datasourceId));
            publishedDatasource.setOrganizationId(null);
        }
    }

    private void setPageLayout(NewPage page, Map<String, String> actionIdMap) {
        if(page.getUnpublishedPage().getLayouts() != null) {

            page.getUnpublishedPage().getLayouts().forEach(layout -> {
                if(layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(dslActionDTO -> dslActionDTO.setId(actionIdMap.get(dslActionDTO.getId()))));
                }
            });
        }

        if(page.getPublishedPage() != null && page.getPublishedPage().getLayouts() != null) {

            page.getPublishedPage().getLayouts().forEach(layout -> {
                if(layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(dslActionDTO -> dslActionDTO.setId(actionIdMap.get(dslActionDTO.getId()))));
                }
            });
        }
    }

    private void makePristine(BaseDomain domain) {
        // Set the ID to null for this domain object so that it is saved a new document in the database (as opposed to
        // updating an existing document). If it contains any policies, they are also reset.
        domain.setId(null);
        if (domain.getPolicies() != null) {
            domain.getPolicies().clear();
        }
    }

    ApplicationJSONFile removePoliciesAndDecryptPasswords(ApplicationJSONFile file) {

        file.getPageList().forEach(newPage -> newPage.setPolicies(null));
        file.getExportedApplication().setPolicies(null);
        file.getDatasourceList().forEach(datasource -> datasource.setPolicies(null));
        file.getActionList().forEach(newAction -> newAction.setPolicies(null));

        //Decrypt passwords and store back to authentication object
        file.getDatasourceList()
                .stream()
                .filter(datasource -> datasource.getDatasourceConfiguration() != null
                        && datasource.getDatasourceConfiguration().getAuthentication().isEncrypted() != null
                        && datasource.getDatasourceConfiguration().getAuthentication().isEncrypted())
                .forEach(datasource -> {
                    AuthenticationDTO authentication = datasource.getDatasourceConfiguration().getAuthentication();
                    Map<String, String> decryptedFields = authentication
                            .getEncryptionFields()
                            .entrySet()
                            .stream()
                            .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                            .collect(Collectors.toMap(
                                    Map.Entry::getKey,
                                    e -> encryptionService.decryptString(e.getValue())));
                    authentication.setEncryptionFields(decryptedFields);
                    authentication.setIsEncrypted(false);
                });

        return file;
    }
}
