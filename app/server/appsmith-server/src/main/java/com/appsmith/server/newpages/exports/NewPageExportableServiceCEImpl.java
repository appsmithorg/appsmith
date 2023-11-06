package com.appsmith.server.newpages.exports;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.solutions.PagePermission;
import org.apache.commons.collections.CollectionUtils;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;

public class NewPageExportableServiceCEImpl implements ExportableServiceCE<NewPage> {

    private final NewPageService newPageService;
    private final PagePermission pagePermission;

    public NewPageExportableServiceCEImpl(NewPageService newPageService, PagePermission pagePermission) {
        this.newPageService = newPageService;
        this.pagePermission = pagePermission;
    }

    @Override
    public Mono<List<NewPage>> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {
        Optional<AclPermission> optionalPermission = Optional.ofNullable(pagePermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration()));

        List<String> unpublishedPages = exportingMetaDTO.getUnpublishedPages();

        return newPageService
                .findNewPagesByApplicationId(exportingMetaDTO.getApplicationId(), optionalPermission)
                .collectList()
                .map(newPageList -> {
                    // Extract mongoEscapedWidgets from pages and save it to applicationJson object as this
                    // field is JsonIgnored. Also remove any ids those are present in the page objects

                    Set<String> updatedPageSet = new HashSet<String>();

                    // check the application object for the page reference in the page list
                    // Exclude the deleted pages that are present in view mode  because the app is not
                    // published yet
                    newPageList.removeIf(newPage -> !unpublishedPages.contains(newPage.getId()));
                    newPageList.forEach(newPage -> {
                        if (newPage.getUnpublishedPage() != null) {
                            mappedExportableResourcesDTO
                                    .getPageIdToNameMap()
                                    .put(
                                            newPage.getId() + EDIT,
                                            newPage.getUnpublishedPage().getName());
                            PageDTO unpublishedPageDTO = newPage.getUnpublishedPage();
                            if (!CollectionUtils.isEmpty(unpublishedPageDTO.getLayouts())) {
                                unpublishedPageDTO.getLayouts().forEach(layout -> {
                                    layout.setId(unpublishedPageDTO.getName());
                                });
                            }
                        }

                        if (newPage.getPublishedPage() != null) {
                            mappedExportableResourcesDTO
                                    .getPageIdToNameMap()
                                    .put(
                                            newPage.getId() + VIEW,
                                            newPage.getPublishedPage().getName());
                            PageDTO publishedPageDTO = newPage.getPublishedPage();
                            if (!CollectionUtils.isEmpty(publishedPageDTO.getLayouts())) {
                                publishedPageDTO.getLayouts().forEach(layout -> {
                                    layout.setId(publishedPageDTO.getName());
                                });
                            }
                        }
                        // Including updated pages list for git file storage
                        Instant newPageUpdatedAt = newPage.getUpdatedAt();
                        boolean isNewPageUpdated = exportingMetaDTO.isClientSchemaMigrated()
                                || exportingMetaDTO.isServerSchemaMigrated()
                                || exportingMetaDTO.getApplicationLastCommittedAt() == null
                                || newPageUpdatedAt == null
                                || exportingMetaDTO
                                        .getApplicationLastCommittedAt()
                                        .isBefore(newPageUpdatedAt);
                        String newPageName = newPage.getUnpublishedPage() != null
                                ? newPage.getUnpublishedPage().getName()
                                : newPage.getPublishedPage() != null
                                        ? newPage.getPublishedPage().getName()
                                        : null;
                        if (isNewPageUpdated && newPageName != null) {
                            updatedPageSet.add(newPageName);
                        }
                        newPage.sanitiseToExportDBObject();
                    });
                    applicationJson.setPageList(newPageList);
                    applicationJson.setUpdatedResources(new HashMap<>() {
                        {
                            put(FieldName.PAGE_LIST, updatedPageSet);
                        }
                    });
                    return newPageList;
                });
    }

    @Override
    public void sanitizeEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ApplicationJson applicationJson,
            SerialiseApplicationObjective serialiseFor) {
        // Update ids for layoutOnLoadAction
        for (NewPage newPage : applicationJson.getPageList()) {
            updateIdsForLayoutOnLoadAction(
                    newPage.getUnpublishedPage(),
                    mappedExportableResourcesDTO.getActionIdToNameMap(),
                    mappedExportableResourcesDTO.getCollectionIdToNameMap());
            updateIdsForLayoutOnLoadAction(
                    newPage.getPublishedPage(),
                    mappedExportableResourcesDTO.getActionIdToNameMap(),
                    mappedExportableResourcesDTO.getCollectionIdToNameMap());
        }

        applicationJson
                .getExportedApplication()
                .exportApplicationPages(mappedExportableResourcesDTO.getPageIdToNameMap());
    }

    private void updateIdsForLayoutOnLoadAction(
            PageDTO page, Map<String, String> actionIdToNameMap, Map<String, String> collectionIdToNameMap) {

        if (page != null && !CollectionUtils.isEmpty(page.getLayouts())) {
            for (Layout layout : page.getLayouts()) {
                if (!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
                    layout.getLayoutOnLoadActions()
                            .forEach(onLoadAction -> onLoadAction.forEach(actionDTO -> {
                                if (actionIdToNameMap.containsKey(actionDTO.getId())) {
                                    actionDTO.setId(actionIdToNameMap.get(actionDTO.getId()));
                                }
                                if (collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                    actionDTO.setCollectionId(collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                }
                            }));
                }
            }
        }
    }
}
