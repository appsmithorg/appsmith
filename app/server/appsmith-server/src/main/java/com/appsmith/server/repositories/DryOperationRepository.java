package com.appsmith.server.repositories;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.services.AnalyticsService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DryOperationRepository {

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final CustomJSLibRepository customJSLibRepository;

    private final NewPageRepository newPageRepository;

    private final NewActionRepository newActionRepository;

    private final ActionCollectionRepository actionCollectionRepository;

    private final AnalyticsService analyticsService;

    private final ApplicationRepository applicationRepository;

    private Map<Class<?>, AppsmithRepository<?>> repoByEntityClass;

    @PostConstruct
    public void init() {
        final Map<Class<?>, AppsmithRepository<?>> map = new HashMap<>();
        map.put(Datasource.class, datasourceRepository);
        map.put(DatasourceStorage.class, datasourceStorageRepository);
        map.put(CustomJSLib.class, customJSLibRepository);
        repoByEntityClass = Collections.unmodifiableMap(map);
    }

    public <T> AppsmithRepository<?> getRepositoryForEntity(Class<T> entityClass) {
        return (AppsmithRepository<?>) repoByEntityClass.get(entityClass);
    }

    public Flux<Datasource> saveDatasourceToDb(List<Datasource> datasources) {
        return datasourceRepository.saveAll(datasources);
    }

    public Flux<DatasourceStorage> saveDatasourceStorageToDb(List<DatasourceStorage> datasourceStorage) {
        return datasourceStorageRepository.saveAll(datasourceStorage);
    }

    private Flux<CustomJSLib> saveCustomJSLibToDb(List<CustomJSLib> customJSLibs) {
        return customJSLibRepository.saveAll(customJSLibs);
    }

    private Flux<NewPage> deletePageAndDependencies(List<String> invalidPageIds) {
        /*
         * 1. Check for published and unpublished states for page, action, actionCollection
         * 2. Delete page and then children
         * */
        return Flux.fromIterable(invalidPageIds).flatMap(invalidPageId -> {
            return newPageRepository.findById(invalidPageId).flatMap(newPage -> {
                Mono<NewPage> newPageMono;
                if (newPage.getPublishedPage() != null) {
                    PageDTO unpublishedPage = newPage.getUnpublishedPage();
                    unpublishedPage.setDeletedAt(Instant.now());
                    newPageMono = newPageRepository.save(newPage);
                } else {
                    // This page was never published. This can be safely archived.
                    newPageMono = newPageRepository.archive(newPage);
                }

                Mono<NewPage> archivedPageMono = newPageMono.flatMap(page -> {
                    final Map<String, Object> eventData = Map.of(FieldName.APP_MODE, ApplicationMode.EDIT.toString());
                    final Map<String, Object> data = Map.of(FieldName.EVENT_DATA, eventData);

                    return analyticsService.sendDeleteEvent(newPage, data);
                });

                Flux<Boolean> deleteActionFlux = newActionRepository
                        .findByPageId(invalidPageId)
                        .filter(newAction -> !StringUtils.hasLength(
                                newAction.getUnpublishedAction().getCollectionId()))
                        .flatMap(newAction -> {
                            // Analytics event for delete action

                            return newActionRepository.archiveById(newAction.getId());
                        });

                Flux<Boolean> deleteCollectionFlux = actionCollectionRepository
                        .findByPageId(invalidPageId)
                        .flatMap(actionCollection -> actionCollectionRepository.archiveById(actionCollection.getId()));

                return Flux.merge(deleteActionFlux, deleteCollectionFlux).then(archivedPageMono);
            });
        });
    }

    private Flux<NewPage> saveNewPageToDb(List<NewPage> newPages) {
        return newPageRepository.saveAll(newPages);
    }

    private Mono<Application> updateApplication(Application application) {
        String id = application.getId();
        application.setId(null);
        return applicationRepository.updateById(id, application, AclPermission.MANAGE_APPLICATIONS);
    }

    public Mono<Void> executeAllDbOps(MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        Flux<List<Datasource>> datasourceFLux = Flux.fromIterable(mappedImportableResourcesDTO
                        .getDatasourceStorageDryRunQueries()
                        .keySet())
                .flatMap(key -> {
                    List<Datasource> datasourceList = mappedImportableResourcesDTO
                            .getDatasourceDryRunQueries()
                            .get(key);
                    return saveDatasourceToDb(datasourceList).collectList();
                });

        Flux<List<DatasourceStorage>> datasourceStorageFLux = Flux.fromIterable(mappedImportableResourcesDTO
                        .getDatasourceStorageDryRunQueries()
                        .keySet())
                .flatMap(key -> {
                    List<DatasourceStorage> datasourceStorageList = mappedImportableResourcesDTO
                            .getDatasourceStorageDryRunQueries()
                            .get(key);
                    return saveDatasourceStorageToDb(datasourceStorageList).collectList();
                });

        Flux<List<CustomJSLib>> customJSLibFLux = Flux.fromIterable(
                        mappedImportableResourcesDTO.getCustomJSLibsDryOps().keySet())
                .flatMap(key -> {
                    List<CustomJSLib> customJSLibList =
                            mappedImportableResourcesDTO.getCustomJSLibsDryOps().get(key);
                    return saveCustomJSLibToDb(customJSLibList).collectList();
                });

        Flux<NewPage> pageDeleteFlux = deletePageAndDependencies(mappedImportableResourcesDTO.getInvalidPageIds());

        Flux<NewPage> pageSaveFlux = saveNewPageToDb(mappedImportableResourcesDTO.getNewPageDryOps());

        Mono<Application> applicationMono = updateApplication(mappedImportableResourcesDTO.getApplication());

        return Flux.merge(
                        datasourceFLux,
                        datasourceStorageFLux,
                        customJSLibFLux,
                        applicationMono,
                        pageSaveFlux,
                        pageDeleteFlux)
                .then();
    }
}
