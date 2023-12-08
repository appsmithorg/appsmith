package com.appsmith.server.newpages.imports;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportActionResultDTO;
import com.appsmith.server.dtos.ImportedActionAndCollectionMapsDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.helpers.ce.ImportApplicationPermissionProvider;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ApplicationPageService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;

@Slf4j
public class NewPageImportableServiceCEImpl implements ImportableServiceCE<NewPage> {

    private final NewPageService newPageService;
    private final ApplicationPageService applicationPageService;
    private final NewActionService newActionService;

    public NewPageImportableServiceCEImpl(
            NewPageService newPageService,
            ApplicationPageService applicationPageService,
            NewActionService newActionService) {
        this.newPageService = newPageService;
        this.applicationPageService = applicationPageService;
        this.newActionService = newActionService;
    }

    // Updates pageNametoIdMap and pageNameMap in importable resources.
    // Also directly updates required information in DB
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson,
            boolean isPartialImport) {

        List<NewPage> importedNewPageList = applicationJson.getPageList();

        // Import and save pages, also update the pages related fields in saved application
        assert importedNewPageList != null : "Unable to find pages in the imported application";

        // For git-sync this will not be empty
        Mono<List<NewPage>> existingPagesMono = applicationMono
                .flatMap(application -> newPageService
                        .findNewPagesByApplicationId(application.getId(), Optional.empty())
                        .collectList())
                .cache();

        Mono<Tuple2<List<NewPage>, Map<String, String>>> importedNewPagesMono = getImportNewPagesMono(
                        importedNewPageList,
                        existingPagesMono,
                        applicationMono,
                        importingMetaDTO.getAppendToApp(),
                        importingMetaDTO.getBranchName(),
                        importingMetaDTO.getPermissionProvider(),
                        mappedImportableResourcesDTO)
                .cache();

        Mono<Map<String, NewPage>> pageNameMapMono =
                getPageNameMapMono(importedNewPagesMono).cache();

        Mono<Application> updatedApplicationMono = savePagesToApplicationMono(
                        applicationJson.getExportedApplication(),
                        pageNameMapMono,
                        applicationMono,
                        importingMetaDTO.getAppendToApp(),
                        importingMetaDTO.getApplicationId(),
                        existingPagesMono,
                        importedNewPagesMono,
                        mappedImportableResourcesDTO)
                .cache();

        return updatedApplicationMono.then(importedNewPagesMono).then();
    }

    @Override
    public Mono<Void> updateImportedEntities(
            Application application,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            boolean isPartialImport) {

        ImportedActionAndCollectionMapsDTO actionAndCollectionMapsDTO =
                mappedImportableResourcesDTO.getActionAndCollectionMapsDTO();

        ImportActionResultDTO importActionResultDTO = mappedImportableResourcesDTO.getActionResultDTO();
        List<NewPage> newPages = mappedImportableResourcesDTO.getPageNameMap().values().stream()
                .distinct()
                .toList();
        return Flux.fromIterable(newPages)
                .flatMap(newPage -> {
                    if (newPage.getDefaultResources() != null) {
                        newPage.getDefaultResources().setBranchName(importingMetaDTO.getBranchName());
                    }
                    return mapActionAndCollectionIdWithPageLayout(
                            newPage,
                            importActionResultDTO.getActionIdMap(),
                            actionAndCollectionMapsDTO.getUnpublishedActionIdToCollectionIdMap(),
                            actionAndCollectionMapsDTO.getPublishedActionIdToCollectionIdMap());
                })
                .collectList()
                .flatMapMany(newPageService::saveAll)
                .collectList()
                .then()
                .onErrorResume(throwable -> {
                    log.error("Failed to set action ids in pages", throwable);
                    return Mono.error(throwable);
                });
    }

    private Mono<Map<String, NewPage>> getPageNameMapMono(
            Mono<Tuple2<List<NewPage>, Map<String, String>>> importedNewPagesMono) {
        return importedNewPagesMono.map(objects -> {
            Map<String, NewPage> pageNameMap = new HashMap<>();
            objects.getT1().forEach(newPage -> {
                // Save the map of pageName and NewPage
                if (newPage.getUnpublishedPage() != null
                        && newPage.getUnpublishedPage().getName() != null) {
                    pageNameMap.put(newPage.getUnpublishedPage().getName(), newPage);
                }
                if (newPage.getPublishedPage() != null
                        && newPage.getPublishedPage().getName() != null) {
                    pageNameMap.put(newPage.getPublishedPage().getName(), newPage);
                }
            });
            return pageNameMap;
        });
    }

    private Mono<Tuple2<List<NewPage>, Map<String, String>>> getImportNewPagesMono(
            List<NewPage> importedNewPageList,
            Mono<List<NewPage>> existingPagesMono,
            Mono<Application> importApplicationMono,
            boolean appendToApp,
            String branchName,
            ImportApplicationPermissionProvider permissionProvider,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return Mono.just(importedNewPageList)
                .zipWith(existingPagesMono)
                .map(objects -> {
                    List<NewPage> importedNewPages = objects.getT1();
                    List<NewPage> existingPages = objects.getT2();
                    Map<String, String> newToOldNameMap;
                    if (appendToApp) {
                        newToOldNameMap = updateNewPagesBeforeMerge(existingPages, importedNewPages);
                    } else {
                        newToOldNameMap = Map.of();
                    }

                    mappedImportableResourcesDTO.setNewPageNameToOldPageNameMap(newToOldNameMap);
                    return Tuples.of(importedNewPages, newToOldNameMap);
                })
                .zipWith(importApplicationMono)
                .flatMap(objects -> {
                    List<NewPage> importedNewPages = objects.getT1().getT1();
                    Map<String, String> newToOldNameMap = objects.getT1().getT2();
                    Application application = objects.getT2();
                    return importAndSavePages(
                                    importedNewPages, application, branchName, existingPagesMono, permissionProvider)
                            .collectList()
                            .zipWith(Mono.just(newToOldNameMap));
                })
                .onErrorResume(throwable -> {
                    log.error("Error importing pages", throwable);
                    return Mono.error(throwable);
                })
                .elapsed()
                .map(objects -> {
                    log.debug("time to import {} pages: {}", objects.getT2().size(), objects.getT1());
                    return objects.getT2();
                });
    }

    Mono<Application> savePagesToApplicationMono(
            Application importedApplication,
            Mono<Map<String, NewPage>> pageNameMapMono,
            Mono<Application> applicationMono,
            boolean appendToApp,
            String applicationId,
            Mono<List<NewPage>> existingPagesMono,
            Mono<Tuple2<List<NewPage>, Map<String, String>>> importedNewPagesMono,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        List<ApplicationPage> editModeApplicationPages = importedApplication.getPages();
        List<ApplicationPage> publishedModeApplicationPages = importedApplication.getPublishedPages();

        Mono<List<ApplicationPage>> unpublishedPagesMono =
                importUnpublishedPages(editModeApplicationPages, appendToApp, applicationMono, importedNewPagesMono);

        Mono<List<ApplicationPage>> publishedPagesMono = Mono.just(publishedModeApplicationPages);

        Mono<Map<ResourceModes, List<ApplicationPage>>> applicationPagesMono = Mono.zip(
                        unpublishedPagesMono, publishedPagesMono, pageNameMapMono, applicationMono)
                .map(objects -> {
                    List<ApplicationPage> unpublishedPages = objects.getT1();
                    List<ApplicationPage> publishedPages = objects.getT2();
                    Map<String, NewPage> pageNameMap = objects.getT3();
                    Application savedApp = objects.getT4();

                    mappedImportableResourcesDTO.setPageNameMap(pageNameMap);

                    log.debug("New pages imported for application: {}", savedApp.getId());
                    Map<ResourceModes, List<ApplicationPage>> applicationPages = new HashMap<>();
                    applicationPages.put(EDIT, unpublishedPages);
                    applicationPages.put(VIEW, publishedPages);

                    Iterator<ApplicationPage> unpublishedPageItr = unpublishedPages.iterator();
                    while (unpublishedPageItr.hasNext()) {
                        ApplicationPage applicationPage = unpublishedPageItr.next();
                        NewPage newPage = pageNameMap.get(applicationPage.getId());
                        if (newPage == null) {
                            if (appendToApp) {
                                // Don't remove the page reference if doing the partial import and appending
                                // to the existing application
                                continue;
                            }
                            log.debug(
                                    "Unable to find the page during import for appId {}, with name {}",
                                    applicationId,
                                    applicationPage.getId());
                            unpublishedPageItr.remove();
                        } else {
                            applicationPage.setId(newPage.getId());
                            applicationPage.setDefaultPageId(
                                    newPage.getDefaultResources().getPageId());
                            // Keep the existing page as the default one
                            if (appendToApp) {
                                applicationPage.setIsDefault(false);
                            }
                        }
                    }

                    Iterator<ApplicationPage> publishedPagesItr;
                    // Remove the newly added pages from merge app flow. Keep only the existing page from the old app
                    if (appendToApp) {
                        List<String> existingPagesId = savedApp.getPublishedPages().stream()
                                .map(applicationPage -> applicationPage.getId())
                                .collect(Collectors.toList());
                        List<ApplicationPage> publishedApplicationPages = publishedPages.stream()
                                .filter(applicationPage -> existingPagesId.contains(applicationPage.getId()))
                                .collect(Collectors.toList());
                        applicationPages.replace(VIEW, publishedApplicationPages);
                        publishedPagesItr = publishedApplicationPages.iterator();
                    } else {
                        publishedPagesItr = publishedPages.iterator();
                    }
                    while (publishedPagesItr.hasNext()) {
                        ApplicationPage applicationPage = publishedPagesItr.next();
                        NewPage newPage = pageNameMap.get(applicationPage.getId());
                        if (newPage == null) {
                            log.debug(
                                    "Unable to find the page during import for appId {}, with name {}",
                                    applicationId,
                                    applicationPage.getId());
                            if (!appendToApp) {
                                publishedPagesItr.remove();
                            }
                        } else {
                            applicationPage.setId(newPage.getId());
                            applicationPage.setDefaultPageId(
                                    newPage.getDefaultResources().getPageId());
                            if (appendToApp) {
                                applicationPage.setIsDefault(false);
                            }
                        }
                    }

                    return applicationPages;
                });

        if (!StringUtils.isEmpty(applicationId) && !appendToApp) {
            applicationPagesMono = applicationPagesMono
                    .zipWith(existingPagesMono)
                    .flatMap(objects -> {
                        Map<ResourceModes, List<ApplicationPage>> applicationPages = objects.getT1();
                        List<NewPage> existingPagesList = objects.getT2();
                        Set<String> validPageIds = applicationPages.get(EDIT).stream()
                                .map(ApplicationPage::getId)
                                .collect(Collectors.toSet());

                        validPageIds.addAll(applicationPages.get(VIEW).stream()
                                .map(ApplicationPage::getId)
                                .collect(Collectors.toSet()));

                        Set<String> invalidPageIds = new HashSet<>();
                        for (NewPage newPage : existingPagesList) {
                            if (!validPageIds.contains(newPage.getId())) {
                                invalidPageIds.add(newPage.getId());
                            }
                        }

                        // Delete the pages which were removed during git merge operation
                        // This does not apply to the traditional import via file approach
                        return Flux.fromIterable(invalidPageIds)
                                .flatMap(applicationPageService::deleteWithoutPermissionUnpublishedPage)
                                .flatMap(page -> newPageService
                                        .archiveWithoutPermissionById(page.getId())
                                        .onErrorResume(e -> {
                                            log.debug(
                                                    "Unable to archive page {} with error {}",
                                                    page.getId(),
                                                    e.getMessage());
                                            return Mono.empty();
                                        }))
                                .then()
                                .thenReturn(applicationPages);
                    });
        }
        return applicationMono.zipWith(applicationPagesMono).map(objects -> {
            Application application = objects.getT1();
            Map<ResourceModes, List<ApplicationPage>> applicationPages = objects.getT2();
            application.setPages(applicationPages.get(EDIT));
            application.setPublishedPages(applicationPages.get(VIEW));
            return application;
        });
    }

    /**
     * Method to
     * - save imported pages
     * - update the mongoEscapedWidgets if present in the page
     * - set the policies for the page
     * - update default resource ids along with branch-name if the application is connected to git
     *
     * @param pages         pagelist extracted from the imported JSON file
     * @param application   saved application where pages needs to be added
     * @param branchName    to which branch pages should be imported if application is connected to git
     * @param existingPages existing pages in DB if the application is connected to git
     * @return flux of saved pages in DB
     */
    private Flux<NewPage> importAndSavePages(
            List<NewPage> pages,
            Application application,
            String branchName,
            Mono<List<NewPage>> existingPages,
            ImportApplicationPermissionProvider permissionProvider) {

        Map<String, String> oldToNewLayoutIds = new HashMap<>();
        pages.forEach(newPage -> {
            newPage.setApplicationId(application.getId());
            if (newPage.getUnpublishedPage() != null) {
                applicationPageService.generateAndSetPagePolicies(application, newPage.getUnpublishedPage());
                newPage.setPolicies(newPage.getUnpublishedPage().getPolicies());
                newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                    String layoutId = new ObjectId().toString();
                    oldToNewLayoutIds.put(layout.getId(), layoutId);
                    layout.setId(layoutId);
                });
            }

            if (newPage.getPublishedPage() != null) {
                applicationPageService.generateAndSetPagePolicies(application, newPage.getPublishedPage());
                newPage.getPublishedPage().getLayouts().forEach(layout -> {
                    String layoutId = oldToNewLayoutIds.containsKey(layout.getId())
                            ? oldToNewLayoutIds.get(layout.getId())
                            : new ObjectId().toString();
                    layout.setId(layoutId);
                });
            }
        });

        return existingPages
                .flatMapMany(existingSavedPages -> {
                    Map<String, NewPage> savedPagesGitIdToPageMap = new HashMap<>();

                    existingSavedPages.stream()
                            .filter(newPage -> !StringUtils.isEmpty(newPage.getGitSyncId()))
                            .forEach(newPage -> savedPagesGitIdToPageMap.put(newPage.getGitSyncId(), newPage));

                    return Flux.fromIterable(pages).flatMap(newPage -> {
                        log.debug(
                                "Importing page: {}",
                                newPage.getUnpublishedPage().getName());
                        // Check if the page has gitSyncId and if it's already in DB
                        if (newPage.getGitSyncId() != null
                                && savedPagesGitIdToPageMap.containsKey(newPage.getGitSyncId())) {
                            // Since the resource is already present in DB, just update resource
                            NewPage existingPage = savedPagesGitIdToPageMap.get(newPage.getGitSyncId());
                            if (!permissionProvider.hasEditPermission(existingPage)) {
                                log.error(
                                        "User does not have permission to edit page with id: {}", existingPage.getId());
                                return Mono.error(new AppsmithException(
                                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, existingPage.getId()));
                            }
                            Set<Policy> existingPagePolicy = existingPage.getPolicies();
                            copyNestedNonNullProperties(newPage, existingPage);
                            // Update branchName
                            existingPage.getDefaultResources().setBranchName(branchName);
                            // Recover the deleted state present in DB from imported page
                            existingPage
                                    .getUnpublishedPage()
                                    .setDeletedAt(newPage.getUnpublishedPage().getDeletedAt());
                            existingPage.setDeletedAt(newPage.getDeletedAt());
                            existingPage.setDeleted(newPage.getDeleted());
                            existingPage.setPolicies(existingPagePolicy);
                            return newPageService.save(existingPage);
                        } else {
                            // check if user has permission to add new page to the application
                            if (!permissionProvider.canCreatePage(application)) {
                                log.error(
                                        "User does not have permission to create page in application with id: {}",
                                        application.getId());
                                return Mono.error(new AppsmithException(
                                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                                        FieldName.APPLICATION,
                                        application.getId()));
                            }
                            if (application.getGitApplicationMetadata() != null) {
                                final String defaultApplicationId =
                                        application.getGitApplicationMetadata().getDefaultApplicationId();
                                return newPageService
                                        .findByGitSyncIdAndDefaultApplicationId(
                                                defaultApplicationId, newPage.getGitSyncId(), Optional.empty())
                                        .switchIfEmpty(Mono.defer(() -> {
                                            // This is the first page we are saving with given gitSyncId in this
                                            // instance
                                            DefaultResources defaultResources = new DefaultResources();
                                            defaultResources.setApplicationId(defaultApplicationId);
                                            defaultResources.setBranchName(branchName);
                                            newPage.setDefaultResources(defaultResources);
                                            return saveNewPageAndUpdateDefaultResources(newPage, branchName);
                                        }))
                                        .flatMap(branchedPage -> {
                                            DefaultResources defaultResources = branchedPage.getDefaultResources();
                                            // Create new page but keep defaultApplicationId and defaultPageId same for
                                            // both the
                                            // pages
                                            defaultResources.setBranchName(branchName);
                                            newPage.setDefaultResources(defaultResources);
                                            newPage.getUnpublishedPage()
                                                    .setDeletedAt(branchedPage
                                                            .getUnpublishedPage()
                                                            .getDeletedAt());
                                            newPage.setDeletedAt(branchedPage.getDeletedAt());
                                            newPage.setDeleted(branchedPage.getDeleted());
                                            // Set policies from existing branch object
                                            newPage.setPolicies(branchedPage.getPolicies());
                                            return newPageService.save(newPage);
                                        });
                            }
                            return saveNewPageAndUpdateDefaultResources(newPage, branchName);
                        }
                    });
                })
                .onErrorResume(error -> {
                    log.error("Error importing page", error);
                    return Mono.error(error);
                });
    }

    private Mono<NewPage> saveNewPageAndUpdateDefaultResources(NewPage newPage, String branchName) {
        NewPage update = new NewPage();
        return newPageService.save(newPage).flatMap(page -> {
            update.setDefaultResources(
                    DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(page, branchName)
                            .getDefaultResources());
            return newPageService.update(page.getId(), update);
        });
    }

    private Map<String, String> updateNewPagesBeforeMerge(List<NewPage> existingPages, List<NewPage> importedPages) {
        Map<String, String> newToOldToPageNameMap = new HashMap<>(); // maps new names with old names

        // get a list of unpublished page names that already exists
        List<String> unpublishedPageNames = existingPages.stream()
                .filter(newPage -> newPage.getUnpublishedPage() != null)
                .map(newPage -> newPage.getUnpublishedPage().getName())
                .collect(Collectors.toList());

        // modify each new page
        for (NewPage newPage : importedPages) {
            newPage.setPublishedPage(null); // we'll not merge published pages so removing this

            // let's check if page name conflicts, rename in that case
            String oldPageName = newPage.getUnpublishedPage().getName(),
                    newPageName = newPage.getUnpublishedPage().getName();

            int i = 1;
            while (unpublishedPageNames.contains(newPageName)) {
                i++;
                newPageName = oldPageName + i;
            }
            newPage.getUnpublishedPage().setName(newPageName); // set new name. may be same as before or not
            newPage.getUnpublishedPage().setSlug(TextUtils.makeSlug(newPageName)); // set the slug also
            newToOldToPageNameMap.put(newPageName, oldPageName); // map: new name -> old name
        }
        return newToOldToPageNameMap;
    }

    private Mono<List<ApplicationPage>> importUnpublishedPages(
            List<ApplicationPage> editModeApplicationPages,
            boolean appendToApp,
            Mono<Application> importApplicationMono,
            Mono<Tuple2<List<NewPage>, Map<String, String>>> importedNewPagesMono) {
        Mono<List<ApplicationPage>> unpublishedPagesMono = Mono.just(editModeApplicationPages);
        if (appendToApp) {
            unpublishedPagesMono = unpublishedPagesMono
                    .zipWith(importApplicationMono)
                    .map(objects -> {
                        Application application = objects.getT2();
                        List<ApplicationPage> applicationPages = objects.getT1();
                        applicationPages.addAll(application.getPages());
                        return applicationPages;
                    })
                    .zipWith(importedNewPagesMono)
                    .map(objects -> {
                        List<ApplicationPage> unpublishedPages = objects.getT1();
                        Map<String, String> newToOldNameMap = objects.getT2().getT2();
                        List<NewPage> importedPages = objects.getT2().getT1();
                        for (NewPage newPage : importedPages) {
                            // we need to map the newly created page with old name
                            // because other related resources e.g. actions will refer the page with old name
                            String newPageName = newPage.getUnpublishedPage().getName();
                            if (newToOldNameMap.containsKey(newPageName)) {
                                String oldPageName = newToOldNameMap.get(newPageName);
                                unpublishedPages.stream()
                                        .filter(applicationPage -> oldPageName.equals(applicationPage.getId()))
                                        .findAny()
                                        .ifPresent(applicationPage -> applicationPage.setId(newPageName));
                            }
                        }
                        return unpublishedPages;
                    });
        }
        return unpublishedPagesMono;
    }

    // This method will update the action id in saved page for layoutOnLoadAction
    private Mono<NewPage> mapActionAndCollectionIdWithPageLayout(
            NewPage newPage,
            Map<String, String> actionIdMap,
            Map<String, List<String>> unpublishedActionIdToCollectionIdsMap,
            Map<String, List<String>> publishedActionIdToCollectionIdsMap) {

        Set<String> layoutOnLoadActionsForPage = getLayoutOnLoadActionsForPage(
                newPage, actionIdMap, unpublishedActionIdToCollectionIdsMap, publishedActionIdToCollectionIdsMap);

        return newActionService
                .findAllById(layoutOnLoadActionsForPage)
                .map(newAction -> {
                    final String defaultActionId =
                            newAction.getDefaultResources().getActionId();
                    if (newPage.getUnpublishedPage().getLayouts() != null) {
                        final String defaultCollectionId = newAction
                                .getUnpublishedAction()
                                .getDefaultResources()
                                .getCollectionId();
                        final String collectionId =
                                newAction.getUnpublishedAction().getCollectionId();

                        newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                            if (layout.getLayoutOnLoadActions() != null) {
                                layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction.stream()
                                        .filter(actionDTO -> StringUtils.equals(actionDTO.getId(), newAction.getId()))
                                        .forEach(actionDTO -> {
                                            actionDTO.setDefaultActionId(defaultActionId);
                                            actionDTO.setDefaultCollectionId(defaultCollectionId);
                                            actionDTO.setCollectionId(collectionId);
                                        }));
                            }
                        });
                    }

                    if (newPage.getPublishedPage() != null
                            && newPage.getPublishedPage().getLayouts() != null) {
                        newPage.getPublishedPage().getLayouts().forEach(layout -> {
                            if (layout.getLayoutOnLoadActions() != null) {
                                layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction.stream()
                                        .filter(actionDTO -> StringUtils.equals(actionDTO.getId(), newAction.getId()))
                                        .forEach(actionDTO -> {
                                            actionDTO.setDefaultActionId(defaultActionId);
                                            if (newAction.getPublishedAction() != null
                                                    && newAction
                                                                    .getPublishedAction()
                                                                    .getDefaultResources()
                                                            != null) {
                                                actionDTO.setDefaultCollectionId(newAction
                                                        .getPublishedAction()
                                                        .getDefaultResources()
                                                        .getCollectionId());
                                                actionDTO.setCollectionId(newAction
                                                        .getPublishedAction()
                                                        .getCollectionId());
                                            }
                                        }));
                            }
                        });
                    }
                    return newAction;
                })
                .collectList()
                .thenReturn(newPage)
                .onErrorResume(error -> {
                    log.error("Error while updating action collection id in page layout", error);
                    return Mono.error(error);
                });
    }

    private Set<String> getLayoutOnLoadActionsForPage(
            NewPage page,
            Map<String, String> actionIdMap,
            Map<String, List<String>> unpublishedActionIdToCollectionIdsMap,
            Map<String, List<String>> publishedActionIdToCollectionIdsMap) {
        Set<String> layoutOnLoadActions = new HashSet<>();
        if (page.getUnpublishedPage().getLayouts() != null) {

            page.getUnpublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions()
                            .forEach(onLoadAction -> onLoadAction.forEach(actionDTO -> {
                                String oldActionDTOId = actionDTO.getId();
                                actionDTO.setId(actionIdMap.get(oldActionDTOId));
                                if (!CollectionUtils.sizeIsEmpty(unpublishedActionIdToCollectionIdsMap)
                                        && !CollectionUtils.isEmpty(
                                                unpublishedActionIdToCollectionIdsMap.get(actionDTO.getId()))) {
                                    actionDTO.setCollectionId(unpublishedActionIdToCollectionIdsMap
                                            .get(actionDTO.getId())
                                            .get(0));
                                }
                                layoutOnLoadActions.add(actionDTO.getId());
                            }));
                }
            });
        }

        if (page.getPublishedPage() != null && page.getPublishedPage().getLayouts() != null) {

            page.getPublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions()
                            .forEach(onLoadAction -> onLoadAction.forEach(actionDTO -> {
                                String oldActionDTOId = actionDTO.getId();
                                actionDTO.setId(actionIdMap.get(oldActionDTOId));
                                if (!CollectionUtils.sizeIsEmpty(publishedActionIdToCollectionIdsMap)
                                        && !CollectionUtils.isEmpty(
                                                publishedActionIdToCollectionIdsMap.get(actionDTO.getId()))) {
                                    actionDTO.setCollectionId(publishedActionIdToCollectionIdsMap
                                            .get(actionDTO.getId())
                                            .get(0));
                                }
                                layoutOnLoadActions.add(actionDTO.getId());
                            }));
                }
            });
        }

        layoutOnLoadActions.remove(null);
        return layoutOnLoadActions;
    }
}
