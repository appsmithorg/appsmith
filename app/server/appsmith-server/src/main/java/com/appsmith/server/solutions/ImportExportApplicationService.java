package com.appsmith.server.solutions;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJSONFile;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
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
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ImportExportApplicationService {
    private final DatasourceService datasourceService;
    private final DatasourceRepository datasourceRepository;
    private final ConfigService configService;
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final NewActionRepository newActionRepository;
    private final PluginRepository pluginRepository;
    private final OrganizationService organizationService;
    private final ApplicationService applicationService;
    private final NewPageService newPageService;
    private final ApplicationPageService applicationPageService;
    private final DatasourceContextService datasourceContextService;
    private final NewPageRepository newPageRepository;
    private final NewActionService newActionService;
    private final LayoutActionService layoutActionService;
    private final EncryptionService encryptionService;
    private final SequenceService sequenceService;
    private final PolicyGenerator policyGenerator;

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
                                    newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                                        layout.setId(null);
                                    });

                                    //TODO Remove action ids
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
//                                    Map<String, String> decryptedFields = authentication
//                                            .getEncryptionFields()
//                                            .entrySet()
//                                            .stream()
//                                            .filter(e -> e.getValue() != null && !e.getValue().isBlank())
//                                            .collect(Collectors.toMap(
//                                                    Map.Entry::getKey,
//                                                    e -> encryptionService.decryptString(e.getValue())));
//                                    authentication.setEncryptionFields(decryptedFields);
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
        Map<String, String> pageIdMap = new HashMap<>();
        Map<String, String> actionIdMap = new HashMap<>();

        Application importedApplication = importedDoc.getExportedApplication();
        List<Datasource> importedDatasourceList = importedDoc.getDatasourceList();
        List<NewPage> importedNewPageList = importedDoc.getPageList();
        List<NewAction> importedNewActionList = importedDoc.getActionList();

        Mono<User> currUserMono = sessionUserService.getCurrentUser();
        log.debug("In importing function");
        //TODO check for duplicate names before starting any operation
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
                .flatMap(pluginList -> Flux
                        .fromIterable(importedDatasourceList)
                        .flatMap(datasource -> {
                            datasource.setPluginId(pluginMap.get(datasource.getPluginId()));
                            datasource.setOrganizationId(orgId);
                            return Mono.zip(
                                        datasourceService.findByName(datasource.getName(), AclPermission.READ_DATASOURCES),
                                        Mono.just(datasource)
                                );
                        })
                        .flatMap(tuple -> Mono.zip(
                                    getUniqueSuffixForDuplicateNameEntity(tuple.getT1().getClass(), orgId),
                                    Mono.just(tuple.getT2()))
                        )
                        .flatMap(tuple -> {
                            String suffix = tuple.getT1();
                            Datasource datasource = tuple.getT2();
                            datasource.setName(datasource.getName() + suffix);
                            log.debug("Datasource before saving : {}", datasource);
                            return datasourceService.create(datasource);
                        })
                        .map(datasource -> {
                            log.debug("Saved DS : {}", datasource);
                            return datasourceMap.put(datasource.getName(), datasource.getId());
                        })
                        .collectList()
                )
                .flatMap(datasourceList -> {
                    log.debug("Datasource Map : {}", datasourceMap);
                    return applicationService.findByName(importedApplication.getName(), AclPermission.READ_APPLICATIONS);
                })
                .flatMap(duplicateNameApp -> {
                    log.debug("Duplicate App : {}", duplicateNameApp);
                    ApplicationPage defaultPage = importedApplication.getPages()
                            .stream()
                            .filter(app -> app.getIsDefault())
                            .findFirst()
                            .orElse(null);
                    importedApplication.setPages(null);

                    return applicationPageService.setApplicationPolicies(currUserMono, orgId, importedApplication)
                            .flatMap(ignored -> getUniqueSuffixForDuplicateNameEntity(importedApplication.getClass(), orgId))
                            .map(suffix -> {
                                importedApplication.setName(importedApplication.getName() + suffix);
                                log.debug("App before save : {}", importedApplication);
                                return defaultPage;
                            });
                })
                .zipWith(applicationService.save(importedApplication))
                .flatMap(tuple -> {
                    String defaultPageName = tuple.getT1().getId();
                    Application savedApp = tuple.getT2();
                    importedApplication.setId(savedApp.getId());
                    importedNewPageList.forEach(newPage -> {
                        newPage.setApplicationId(savedApp.getId());
                        newPage.getUnpublishedPage().getLayouts().forEach(layout -> layout.setId(null));
                    });
                    return importAndSavePagesInApplication(importedNewPageList, importedApplication)
                            .map(newPage -> {
                                log.debug("Saved pages : {}", newPage);
                                ApplicationPage tempPage = new ApplicationPage();
                                pageIdMap.put(newPage.getUnpublishedPage().getName(), newPage.getId());
                                tempPage.setIsDefault(StringUtils.equals(newPage.getUnpublishedPage().getName(), defaultPageName));
                                tempPage.setId(newPage.getId());
                                return tempPage;
                            })
                            .collectList();
                })
                .map(importedApplicationPages -> {
                    //PublishedPages List is still remaining
                    importedApplication.setPages(importedApplicationPages);
                    importedNewActionList.forEach(newAction -> {
                        NewPage parentPage = importedNewPageList.stream()
                                .filter(newPage -> newPage.getUnpublishedPage().getName() == pageIdMap.get(newAction.getUnpublishedAction().getPageId()))
                                .findFirst()
                                .orElse(null);
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
                                return actionIdMap.put(actionIdMap.get(newAction.getUnpublishedAction().getName()), newAction.getId());
                            });
                })
                .flatMap(ignore -> {
                    importedNewPageList.forEach(page -> {
                        setPageLayout(page, actionIdMap);
                    });
                    return newPageService.saveAll(importedNewPageList)
                        .collectList()
                        .flatMap(finalPageList -> {
                            log.debug("finalPageList : {}", finalPageList);
                            return applicationService.update(importedApplication.getId(),importedApplication);
                        });
                });
    }

    //TODO use generics if possible
    //Class<? extends BaseDomain> sourceEntity
    private Mono<String> getUniqueSuffixForDuplicateNameEntity(Class<? extends BaseDomain> sourceEntity, String orgId) {
        if(sourceEntity != null) {
            log.debug("SourceEntity is not null");
            return sequenceService
                    .getNextAsSuffix(sourceEntity, " for organization with _id : " + orgId)
                    .flatMap(sequenceNumber -> Mono.just("#" + sequenceNumber));
        }
        log.debug("sourceEntity is null");
        return Mono.just("");
    }

    private Flux<NewPage> importAndSavePagesInApplication(List<NewPage> pages, Application application) {

        Map<String, Mono<PageDTO>> unplubishedPageDTOs = new HashMap<>(), publishedPageDTOs = new HashMap<>();
        pages.forEach(newPage -> {
            unplubishedPageDTOs.put(newPage.getId(), applicationPageService.createPage(newPage.getUnpublishedPage()));
            publishedPageDTOs.put(newPage.getId(), applicationPageService.createPage(newPage.getPublishedPage()));
        });

        return Flux.fromIterable(pages)
                .flatMap(newPage -> Mono.zip(
                        unplubishedPageDTOs.get(newPage.getId()),
                        publishedPageDTOs.get(newPage.getId()),
                        Mono.just(newPage)
                        )
                )
                .map(tuple -> {
                    PageDTO unpublishedPageDTO = tuple.getT1();
                    PageDTO publishedPageDTO = tuple.getT2();
                    NewPage newPage = tuple.getT3();
                    newPage.setPublishedPage(publishedPageDTO);
                    newPage.setUnpublishedPage(unpublishedPageDTO);
                    return newPage;
                })
                .map(newPage -> {
                    Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(application.getPolicies(), Application.class, Page.class);
                    newPage.setPolicies(documentPolicies);
                    return newPage;
                })
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
        if(!page.getUnpublishedPage().getLayouts().isEmpty()) {

            page.getUnpublishedPage().getLayouts().forEach(layout -> {
                layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                        .forEach(dslActionDTO -> dslActionDTO.setId(actionIdMap.get(dslActionDTO.getId()))));
            });
        }

        if(page.getPublishedPage() != null && !page.getPublishedPage().getLayouts().isEmpty()) {

            page.getPublishedPage().getLayouts().forEach(layout -> {
                layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                        .forEach(dslActionDTO -> dslActionDTO.setId(actionIdMap.get(dslActionDTO.getId()))));
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
