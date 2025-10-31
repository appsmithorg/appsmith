package com.appsmith.server.newpages.importable;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportActionResultDTO;
import com.appsmith.server.dtos.ImportedActionAndCollectionMapsDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.staticurl.StaticUrlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;
import static org.springframework.util.StringUtils.hasText;

@RequiredArgsConstructor
@Slf4j
public class NewPageImportableServiceCEImpl implements ImportableServiceCE<NewPage> {

    private final NewPageService newPageService;
    protected final StaticUrlService staticUrlService;
    private final ApplicationPageService applicationPageService;
    private final NewActionService newActionService;

    @Override
    public ArtifactBasedImportableService<NewPage, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        // This service is already artifact specific
        return null;
    }

    // Updates pageNameToIdMap and pageNameMap in importable resources.
    // Also, directly updates required information in DB
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        List<NewPage> pagesToImport = applicationJson.getPageList();

        // Import and save pages, also update the pages related fields in saved application
        assert pagesToImport != null : "Unable to find pages in the imported application";

        Mono<? extends Artifact> importableArtifactMonoCached = importableArtifactMono.cache();

        // For git-sync this will not be empty
        Mono<List<NewPage>> dbPagesFromCurrentAppMono = importableArtifactMonoCached
                .flatMap(application -> newPageService
                        .findNewPagesByApplicationId(application.getId(), null)
                        .collectList())
                .cache();

        Mono<Tuple2<List<NewPage>, Map<String, String>>> importedNewPagesMono = importableArtifactMonoCached
                .zipWith(dbPagesFromCurrentAppMono)
                .flatMap(artifactAndDbPagesTuple -> {
                    Artifact artifact = artifactAndDbPagesTuple.getT1();
                    List<NewPage> dbPagesFromCurrentApp = artifactAndDbPagesTuple.getT2();
                    return getImportNewPagesMono(
                            pagesToImport,
                            dbPagesFromCurrentApp,
                            artifact,
                            importingMetaDTO,
                            mappedImportableResourcesDTO);
                })
                .cache();

        Mono<Application> updatedApplicationMono = Mono.zip(
                        importableArtifactMonoCached, dbPagesFromCurrentAppMono, importedNewPagesMono)
                .flatMap(objects -> {
                    Application application = (Application) objects.getT1();
                    List<NewPage> dbPagesFromCurrentApp = objects.getT2();
                    List<NewPage> importedPages = objects.getT3().getT1();
                    Map<String, String> newNamesForClashingPageNames =
                            objects.getT3().getT2();
                    Map<String, NewPage> pageNameToPageMap = getPageNameToPage(importedPages);
                    return savePagesToApplicationMono(
                            importingMetaDTO.getAppendToArtifact(),
                            importingMetaDTO.getArtifactId(),
                            ((ApplicationJson) artifactExchangeJson).getExportedApplication(),
                            application,
                            dbPagesFromCurrentApp,
                            importedPages,
                            pageNameToPageMap,
                            newNamesForClashingPageNames,
                            mappedImportableResourcesDTO);
                })
                .cache();

        return updatedApplicationMono.then();
    }

    @Override
    public Mono<Void> updateImportedEntities(
            Artifact importableArtifact,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        ImportedActionAndCollectionMapsDTO actionAndCollectionMapsDTO =
                mappedImportableResourcesDTO.getActionAndCollectionMapsDTO();

        ImportActionResultDTO importActionResultDTO = mappedImportableResourcesDTO.getActionResultDTO();
        List<NewPage> newPages = mappedImportableResourcesDTO.getContextMap().values().stream()
                .distinct()
                .map(context -> (NewPage) context)
                .toList();
        return Flux.fromIterable(newPages)
                .flatMap(newPage -> {
                    newPage.setRefType(importingMetaDTO.getRefType());
                    newPage.setRefName(importingMetaDTO.getRefName());
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

    private Map<String, NewPage> getPageNameToPage(List<NewPage> importedNewPages) {
        Map<String, NewPage> pageNameMap = new HashMap<>();
        for (NewPage newPage : importedNewPages) {
            // Save the map of pageName and NewPage
            if (newPage.getUnpublishedPage() != null
                    && newPage.getUnpublishedPage().getName() != null) {
                pageNameMap.put(newPage.getUnpublishedPage().getName(), newPage);
            }

            if (newPage.getPublishedPage() != null && newPage.getPublishedPage().getName() != null) {
                pageNameMap.put(newPage.getPublishedPage().getName(), newPage);
            }
        }

        return pageNameMap;
    }

    private Mono<Tuple2<List<NewPage>, Map<String, String>>> getImportNewPagesMono(
            List<NewPage> pagesToImport,
            List<NewPage> dbPagesFromCurrentApp,
            Artifact importedApplication,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        // maps new names with old names
        Map<String, String> newNameForClashingPageNames = new HashMap<>();
        if (importingMetaDTO.getAppendToArtifact()) {
            updateNameForClashingPages(newNameForClashingPageNames, dbPagesFromCurrentApp, pagesToImport);
        }

        mappedImportableResourcesDTO.setContextNewNameToOldName(newNameForClashingPageNames);
        Application application = (Application) importedApplication;
        return importAndSavePages(pagesToImport, application, importingMetaDTO, dbPagesFromCurrentApp)
                .collectList()
                .elapsed()
                .map(objects -> {
                    log.info("time to import {} pages: {}", objects.getT2().size(), objects.getT1());
                    return objects.getT2();
                })
                .zipWith(Mono.just(newNameForClashingPageNames))
                .onErrorResume(throwable -> {
                    log.error("Error importing pages", throwable);
                    return Mono.error(throwable);
                });
    }

    Mono<Application> savePagesToApplicationMono(
            boolean appendToApp,
            String applicationId,
            Application applicationFromJson,
            Application importedApplication,
            List<NewPage> dbPagesFromCurrentApp,
            List<NewPage> importedPages,
            Map<String, NewPage> pageNameToPageMap,
            Map<String, String> newNameForClashingPageNames,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        /**
         * After generalisation of export and import flow,
         * this method gets executed later than it was previously getting executed.
         * Hence, there was a need to create another source to capture the pages.
         */
        List<ApplicationPage> editModeApplicationPages = (List<ApplicationPage>) mappedImportableResourcesDTO
                .getResourceStoreFromArtifactExchangeJson()
                .get(FieldName.UNPUBLISHED);

        // this conditional is being placed just for compatibility of the PR #29691
        if (CollectionUtils.isEmpty(editModeApplicationPages)) {
            editModeApplicationPages = CollectionUtils.isEmpty(applicationFromJson.getPages())
                    ? new ArrayList<>()
                    : applicationFromJson.getPages();
        }

        List<ApplicationPage> publishedModeApplicationPages = (List<ApplicationPage>) mappedImportableResourcesDTO
                .getResourceStoreFromArtifactExchangeJson()
                .get(FieldName.PUBLISHED);

        // this conditional is being placed just for compatibility of the PR #29691
        if (CollectionUtils.isEmpty(publishedModeApplicationPages)) {
            publishedModeApplicationPages = CollectionUtils.isEmpty(applicationFromJson.getPublishedPages())
                    ? new ArrayList<>()
                    : applicationFromJson.getPublishedPages();
        }

        if (appendToApp) {
            editModeApplicationPages = updateEditModeApplicationPageNamesOldToNew(
                    editModeApplicationPages, importedPages, newNameForClashingPageNames, importedApplication);
        }

        mappedImportableResourcesDTO.setContextMap(pageNameToPageMap);
        log.info("New pages imported for application: {}", importedApplication.getId());

        Map<ResourceModes, List<ApplicationPage>> applicationPages = new HashMap<>();
        applicationPages.put(EDIT, editModeApplicationPages);
        applicationPages.put(VIEW, publishedModeApplicationPages);

        Iterator<ApplicationPage> unpublishedPageItr = editModeApplicationPages.iterator();
        while (unpublishedPageItr.hasNext()) {
            ApplicationPage applicationPage = unpublishedPageItr.next();
            NewPage newPage = pageNameToPageMap.get(applicationPage.getId());
            if (newPage == null) {
                if (appendToApp) {
                    // Don't remove the page reference if doing the partial import and appending
                    // to the existing application
                    continue;
                }

                log.info(
                        "Unable to find the page during import for appId {}, with name {}",
                        applicationId,
                        applicationPage.getId());
                unpublishedPageItr.remove();
            } else {
                applicationPage.setId(newPage.getId());
                applicationPage.setDefaultPageId(newPage.getBaseId());
                // Keep the existing page as the default one
                if (appendToApp) {
                    applicationPage.setIsDefault(false);
                }
            }
        }

        Iterator<ApplicationPage> publishedPagesItr;
        // Remove the newly added pages from merge app flow. Keep only the existing page from the old app
        if (appendToApp) {
            Set<String> existingPagesId = importedApplication.getPublishedPages().stream()
                    .map(applicationPage -> applicationPage.getId())
                    .collect(Collectors.toSet());

            List<ApplicationPage> publishedApplicationPages = publishedModeApplicationPages.stream()
                    .filter(applicationPage -> existingPagesId.contains(applicationPage.getId()))
                    .collect(Collectors.toList());

            applicationPages.replace(VIEW, publishedApplicationPages);
            publishedPagesItr = publishedApplicationPages.iterator();
        } else {
            publishedPagesItr = publishedModeApplicationPages.iterator();
        }

        while (publishedPagesItr.hasNext()) {
            ApplicationPage applicationPage = publishedPagesItr.next();
            NewPage newPage = pageNameToPageMap.get(applicationPage.getId());
            if (newPage == null) {
                log.info(
                        "Unable to find the page during import for appId {}, with name {}",
                        applicationId,
                        applicationPage.getId());
                if (!appendToApp) {
                    publishedPagesItr.remove();
                }
            } else {
                applicationPage.setId(newPage.getId());
                applicationPage.setDefaultPageId(newPage.getBaseId());
                if (appendToApp) {
                    applicationPage.setIsDefault(false);
                }
            }
        }

        // Normal file import or partial import
        if (!hasText(applicationId) || appendToApp) {
            importedApplication.setPages(applicationPages.get(EDIT));
            importedApplication.setPublishedPages(applicationPages.get(VIEW));
            return Mono.just(importedApplication);
        }

        // Git applications

        Set<String> validPageIds =
                applicationPages.get(EDIT).stream().map(ApplicationPage::getId).collect(Collectors.toSet());

        validPageIds.addAll(
                applicationPages.get(VIEW).stream().map(ApplicationPage::getId).collect(Collectors.toSet()));

        Set<String> invalidPageIds = new HashSet<>();
        for (NewPage newPage : dbPagesFromCurrentApp) {
            if (!validPageIds.contains(newPage.getId())) {
                invalidPageIds.add(newPage.getId());
            }
        }

        // Delete the pages which were removed during git merge operation
        // This does not apply to the traditional import via file approach
        return Flux.fromIterable(invalidPageIds)
                .flatMap(pageId -> {
                    return applicationPageService.deleteUnpublishedPage(pageId, null, null, null, null);
                })
                .flatMap(page -> newPageService
                        .archiveByIdWithoutPermission(page.getId())
                        .onErrorResume(e -> {
                            log.debug("Unable to archive page {} with error {}", page.getId(), e.getMessage());
                            return Mono.empty();
                        }))
                .collectList()
                .map(deletedPageList -> {
                    importedApplication.setPages(applicationPages.get(EDIT));
                    importedApplication.setPublishedPages(applicationPages.get(VIEW));
                    return importedApplication;
                });
    }

    /**
     * Method to
     * - save imported pages
     * - update the mongoEscapedWidgets if present in the page
     * - set the policies for the page
     * - update default resource ids along with branch-name if the application is connected to git
     *
     * @param pagesToImport         pagelist extracted from the imported JSON file
     * @param importedApplication   saved application where pages needs to be added
     * @param dbPagesFromCurrentApp existing pages in DB if the application is connected to git
     * @return flux of saved pages in DB
     */
    private Flux<NewPage> importAndSavePages(
            List<NewPage> pagesToImport,
            Application importedApplication,
            ImportingMetaDTO importingMetaDTO,
            List<NewPage> dbPagesFromCurrentApp) {

        final String createPage = "create page";

        Map<String, String> oldToNewLayoutIds = new HashMap<>();
        pagesToImport.forEach(newPage -> {
            newPage.setApplicationId(importedApplication.getId());
            if (newPage.getUnpublishedPage() != null) {
                applicationPageService.generateAndSetPagePolicies(importedApplication, newPage.getUnpublishedPage());
                newPage.setPolicies(newPage.getUnpublishedPage().getPolicies());
                newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                    String layoutId = new ObjectId().toString();
                    oldToNewLayoutIds.put(layout.getId(), layoutId);
                    layout.setId(layoutId);
                });
            }

            if (newPage.getPublishedPage() != null) {
                applicationPageService.generateAndSetPagePolicies(importedApplication, newPage.getPublishedPage());
                newPage.getPublishedPage().getLayouts().forEach(layout -> {
                    String layoutId = oldToNewLayoutIds.containsKey(layout.getId())
                            ? oldToNewLayoutIds.get(layout.getId())
                            : new ObjectId().toString();
                    layout.setId(layoutId);
                });
            }
        });

        Mono<List<NewPage>> pagesWithUpdatedUniqueSlugMono = staticUrlService.updateUniquePageSlugsBeforeImport(
                pagesToImport, dbPagesFromCurrentApp, importedApplication);

        Mono<Boolean> hasPageCreatePermissionMonoCached = importingMetaDTO
                .getPermissionProvider()
                .canCreatePage(importedApplication)
                .cache();

        // If not connected to git, let's go ahead and import pages directly
        if (!GitUtils.isArtifactConnectedToGit(importedApplication.getGitArtifactMetadata())) {
            return hasPageCreatePermissionMonoCached
                    .zipWith(pagesWithUpdatedUniqueSlugMono)
                    .flatMapMany(tuple2 -> {
                        Boolean canCreatePages = tuple2.getT1();
                        List<NewPage> updatedSlugpagesToImport = tuple2.getT2();
                        if (!canCreatePages) {
                            log.error(
                                    "User does not have permission to create pages in application with id: {}",
                                    importedApplication.getId());
                            return Mono.error(
                                    new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, createPage));
                        }

                        return insertPagesInBulkFlux(updatedSlugpagesToImport, importingMetaDTO);
                    });
        }

        // Git Applications only
        Mono<Map<String, NewPage>> gitSyncToPagesFromAllBranchesMono = newPageService
                .findAllByApplicationIds(importingMetaDTO.getBranchedArtifactIds(), null)
                .filter(page -> page.getGitSyncId() != null)
                .collectMap(NewPage::getGitSyncId)
                .cache();

        return Mono.zip(
                        gitSyncToPagesFromAllBranchesMono,
                        pagesWithUpdatedUniqueSlugMono,
                        hasPageCreatePermissionMonoCached)
                .flatMapMany(tuple3 -> {
                    List<NewPage> updatedSlugpagesToImport = tuple3.getT2();
                    Boolean canCreatePage = tuple3.getT3();

                    Map<String, NewPage> gitSyncToPagesFromAllBranches = tuple3.getT1();
                    Map<String, NewPage> gitSyncToDbPagesFromCurrentApp = new HashMap<>();

                    dbPagesFromCurrentApp.stream()
                            .filter(pageFromDb -> !StringUtils.isEmpty(pageFromDb.getGitSyncId()))
                            .forEach(pageFromDb ->
                                    gitSyncToDbPagesFromCurrentApp.put(pageFromDb.getGitSyncId(), pageFromDb));

                    return Flux.fromIterable(updatedSlugpagesToImport).flatMap(pageToImport -> {
                        log.info(
                                "Importing page: {}",
                                pageToImport.getUnpublishedPage().getName());
                        String gitSyncId = pageToImport.getGitSyncId();

                        // If git sync id of page to import doesn't match any existing page, insert this into db
                        if (!hasText(gitSyncId)
                                || (!gitSyncToDbPagesFromCurrentApp.containsKey(gitSyncId)
                                        && !gitSyncToPagesFromAllBranches.containsKey(gitSyncId))) {
                            // Insert this resource
                            if (!canCreatePage) {
                                log.error(
                                        "User does not have permission to create page in application with id: {}",
                                        importedApplication.getId());
                                return Mono.error(
                                        new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, createPage));
                            }

                            return saveNewPageAndUpdateBaseId(pageToImport, importingMetaDTO);
                        }

                        // check if the current app pages has this git sync id present
                        if (gitSyncToDbPagesFromCurrentApp.containsKey(pageToImport.getGitSyncId())) {
                            // Page from current app matches this resource, updating the page from app
                            NewPage existingPage = gitSyncToDbPagesFromCurrentApp.get(pageToImport.getGitSyncId());
                            boolean canEditPage =
                                    importingMetaDTO.getPermissionProvider().hasEditPermission(existingPage);
                            if (!canEditPage) {
                                log.error(
                                        "User does not have permission to edit page with id: {}", existingPage.getId());
                                return Mono.error(new AppsmithException(
                                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, existingPage.getId()));
                            }

                            Set<Policy> existingPagePolicy = existingPage.getPolicies();
                            staticUrlService.deleteUniqueSlugFromDbWhenAbsentFromPageJson(pageToImport, existingPage);
                            copyNestedNonNullProperties(pageToImport, existingPage);
                            // Update branchName
                            existingPage.setRefType(importingMetaDTO.getRefType());
                            existingPage.setRefName(importingMetaDTO.getRefName());
                            // Recover the deleted state present in DB from imported page
                            existingPage
                                    .getUnpublishedPage()
                                    .setDeletedAt(
                                            pageToImport.getUnpublishedPage().getDeletedAt());
                            existingPage.setDeletedAt(pageToImport.getDeletedAt());
                            existingPage.setPolicies(existingPagePolicy);
                            return newPageService.save(existingPage);
                        }

                        // check if user has permission to add new page to the application
                        if (!canCreatePage) {
                            log.error(
                                    "User does not have permission to create page in application with id: {}",
                                    importedApplication.getId());
                            return Mono.error(
                                    new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "create page"));
                        }

                        NewPage branchedPage = gitSyncToPagesFromAllBranches.get(pageToImport.getGitSyncId());
                        pageToImport.setBaseId(branchedPage.getBaseId());
                        pageToImport.setRefType(importingMetaDTO.getRefType());
                        pageToImport.setRefName(importingMetaDTO.getRefName());
                        pageToImport
                                .getUnpublishedPage()
                                .setDeletedAt(branchedPage.getUnpublishedPage().getDeletedAt());
                        pageToImport.setDeletedAt(branchedPage.getDeletedAt());
                        // Set policies from existing branch object
                        pageToImport.setPolicies(branchedPage.getPolicies());
                        return newPageService.save(pageToImport);
                    });
                })
                .onErrorResume(error -> {
                    log.error("Error importing page", error);
                    return Mono.error(error);
                });
    }

    private Mono<NewPage> saveNewPageAndUpdateBaseId(NewPage newPage, ImportingMetaDTO importingMetaDTO) {
        NewPage update = new NewPage();
        newPage.setRefType(importingMetaDTO.getRefType());
        newPage.setRefName(importingMetaDTO.getRefName());
        return newPageService.save(newPage).flatMap(page -> {
            if (StringUtils.isEmpty(page.getBaseId())) {
                update.setBaseId(page.getId());
                return newPageService.update(page.getId(), update);
            } else {
                return Mono.just(page);
            }
        });
    }

    private Flux<NewPage> insertPagesInBulkFlux(List<NewPage> pages, ImportingMetaDTO importingMetaDTO) {
        pages.forEach(page -> {
            page.setRefType(importingMetaDTO.getRefType());
            page.setRefName(importingMetaDTO.getRefName());
        });

        return newPageService.saveAll(pages).flatMap(page -> {
            NewPage update = new NewPage();
            if (StringUtils.isEmpty(page.getBaseId())) {
                update.setBaseId(page.getId());
                return newPageService.update(page.getId(), update);
            } else {
                return Mono.just(page);
            }
        });
    }

    private void updateNameForClashingPages(
            Map<String, String> newToOldPageName,
            List<NewPage> dbPagesFromCurrentApp,
            List<NewPage> pagesToBeImported) {
        // get a list of unpublished page names that already exists
        Set<String> unpublishedPageNames = dbPagesFromCurrentApp.stream()
                .filter(newPage -> newPage.getUnpublishedPage() != null)
                .map(newPage -> newPage.getUnpublishedPage().getName())
                .collect(Collectors.toSet());

        // modify each page to be imported
        for (NewPage newPage : pagesToBeImported) {
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
            newToOldPageName.put(newPageName, oldPageName); // map: new name -> old name
        }
    }

    private List<ApplicationPage> updateEditModeApplicationPageNamesOldToNew(
            List<ApplicationPage> editModeApplicationPages,
            List<NewPage> importedPages,
            Map<String, String> newNameForClashingOldPageNames,
            Application importedApplication) {

        editModeApplicationPages.addAll(importedApplication.getPages());
        for (NewPage newPage : importedPages) {
            // we need to map the newly created page with old name
            // because other related resources e.g. actions will refer the page with old name
            String newPageName = newPage.getUnpublishedPage().getName();
            if (!newNameForClashingOldPageNames.containsKey(newPageName)) {
                continue;
            }

            String oldPageName = newNameForClashingOldPageNames.get(newPageName);
            editModeApplicationPages.stream()
                    .filter(applicationPage -> oldPageName.equals(applicationPage.getId()))
                    .findAny()
                    .ifPresent(applicationPage -> applicationPage.setId(newPageName));
        }

        return editModeApplicationPages;
    }

    // This method will update the action id in saved page for layoutOnLoadAction
    private Mono<NewPage> mapActionAndCollectionIdWithPageLayout(
            NewPage newPage,
            Map<String, String> actionIdMap,
            Map<String, String> unpublishedActionIdToCollectionIdsMap,
            Map<String, String> publishedActionIdToCollectionIdsMap) {

        Set<String> layoutOnLoadActionsForPage = getLayoutOnLoadActionsForPage(
                newPage, actionIdMap, unpublishedActionIdToCollectionIdsMap, publishedActionIdToCollectionIdsMap);

        return newActionService
                .findAllById(layoutOnLoadActionsForPage)
                .map(newAction -> {
                    if (newPage.getUnpublishedPage().getLayouts() != null) {
                        final String collectionId =
                                newAction.getUnpublishedAction().getCollectionId();

                        newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                            if (layout.getLayoutOnLoadActions() != null) {
                                layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction.stream()
                                        .filter(actionDTO -> StringUtils.equals(actionDTO.getId(), newAction.getId()))
                                        .forEach(actionDTO -> {
                                            actionDTO.setCollectionId(collectionId);
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
            Map<String, String> unpublishedActionIdToCollectionIdsMap,
            Map<String, String> publishedActionIdToCollectionIdsMap) {
        Set<String> layoutOnLoadActions = new HashSet<>();
        if (page.getUnpublishedPage().getLayouts() != null) {

            page.getUnpublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions()
                            .forEach(onLoadAction -> onLoadAction.forEach(actionDTO -> {
                                String oldActionDTOId = actionDTO.getId();
                                actionDTO.setId(actionIdMap.get(oldActionDTOId));
                                if (!CollectionUtils.sizeIsEmpty(unpublishedActionIdToCollectionIdsMap)
                                        && unpublishedActionIdToCollectionIdsMap.containsKey(actionDTO.getId())) {
                                    actionDTO.setCollectionId(
                                            unpublishedActionIdToCollectionIdsMap.get(actionDTO.getId()));
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
                                        && publishedActionIdToCollectionIdsMap.containsKey(actionDTO.getId())) {
                                    actionDTO.setCollectionId(
                                            publishedActionIdToCollectionIdsMap.get(actionDTO.getId()));
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
