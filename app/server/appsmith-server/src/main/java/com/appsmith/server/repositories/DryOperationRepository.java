package com.appsmith.server.repositories;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
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

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final CustomJSLibRepository customJSLibRepository;

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

        return Flux.merge(datasourceFLux, datasourceStorageFLux, customJSLibFLux)
                .then();
    }
}
