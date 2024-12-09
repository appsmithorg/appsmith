package com.appsmith.server.repositories;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.DBOpsType;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.BaseCake;
import com.appsmith.server.repositories.cakes.CustomJSLibRepositoryCake;
import com.appsmith.server.repositories.cakes.DatasourceRepositoryCake;
import com.appsmith.server.repositories.cakes.DatasourceStorageRepositoryCake;
import com.appsmith.server.repositories.cakes.ThemeRepositoryCake;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DryOperationRepository {

    private final DatasourceRepositoryCake datasourceRepository;

    private final DatasourceStorageRepositoryCake datasourceStorageRepository;

    private final CustomJSLibRepositoryCake customJSLibRepository;

    private final ThemeRepositoryCake themeRepository;

    private final ApplicationRepositoryCake applicationRepository;

    private Map<Class<?>, BaseCake<?, ?>> repoByEntityClass;

    @PostConstruct
    public void init() {
        final Map<Class<?>, BaseCake<?, ?>> map = new HashMap<>();
        map.put(Datasource.class, datasourceRepository);
        map.put(DatasourceStorage.class, datasourceStorageRepository);
        map.put(Theme.class, themeRepository);
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

    private Flux<Theme> saveThemeToDb(List<Theme> theme) {
        return themeRepository.saveAll(theme);
    }

    private Mono<Boolean> archiveTheme(List<String> themeIds) {
        return themeRepository.archiveAllById(themeIds);
    }

    private Mono<List<Theme>> updateTheme(List<Theme> themes) {
        return Flux.fromIterable(themes)
                .flatMap(themeToBeUpdated -> {
                    return themeRepository.updateById(
                            themeToBeUpdated.getId(), themeToBeUpdated, AclPermission.MANAGE_THEMES);
                })
                .collectList();
    }

    private Mono<Application> updateApplication(Application application) {
        String id = application.getId();
        application.setId(null);
        return applicationRepository.updateById(id, application, AclPermission.MANAGE_APPLICATIONS);
    }

    public Mono<Void> executeAllDbOps(MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        Flux<List<Datasource>> datasourceFLux = Flux.fromIterable(mappedImportableResourcesDTO
                        .getDatasourceDryRunQueries()
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

        Flux<List<CustomJSLib>> customJSLibFlux = Flux.fromIterable(
                        mappedImportableResourcesDTO.getCustomJSLibsDryOps().keySet())
                .flatMap(key -> {
                    List<CustomJSLib> customJSLibList =
                            mappedImportableResourcesDTO.getCustomJSLibsDryOps().get(key);
                    return saveCustomJSLibToDb(customJSLibList).collectList();
                });

        Flux<List<Theme>> themeFlux = Flux.fromIterable(
                        mappedImportableResourcesDTO.getThemeDryRunQueries().keySet())
                .flatMap(key -> {
                    List<Theme> themeList =
                            mappedImportableResourcesDTO.getThemeDryRunQueries().get(key);
                    if (key.equals(DBOpsType.SAVE.name())) {
                        return saveThemeToDb(themeList).collectList();
                    } else if (key.equals(DBOpsType.DELETE.name())) {
                        return archiveTheme(themeList.stream().map(Theme::getId).toList())
                                .then(Mono.just(themeList));
                    } else {
                        return updateTheme(themeList);
                    }
                });

        Flux<List<Application>> applicationFlux = Flux.fromIterable(mappedImportableResourcesDTO
                        .getApplicationDryRunQueries()
                        .keySet())
                .flatMap(key -> {
                    List<Application> applicationList = mappedImportableResourcesDTO
                            .getApplicationDryRunQueries()
                            .get(key);
                    if (key.equals(DBOpsType.SAVE.name())) {
                        return Flux.fromIterable(applicationList)
                                .flatMap(this::updateApplication)
                                .collectList();
                    } else {
                        return Flux.fromIterable(applicationList)
                                .flatMap(this::updateApplication)
                                .collectList();
                    }
                });

        return Flux.merge(datasourceFLux, datasourceStorageFLux, customJSLibFlux, themeFlux, applicationFlux)
                .then();
    }
}
