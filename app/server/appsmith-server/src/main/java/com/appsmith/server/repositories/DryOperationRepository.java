package com.appsmith.server.repositories;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
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

import static com.appsmith.server.helpers.ReactorUtils.asFlux;

@Component
@RequiredArgsConstructor
public class DryOperationRepository {

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private Map<Class<?>, AppsmithRepository<?>> repoByEntityClass;

    @PostConstruct
    public void init() {
        final Map<Class<?>, AppsmithRepository<?>> map = new HashMap<>();
        map.put(Datasource.class, datasourceRepository);
        map.put(DatasourceStorage.class, datasourceStorageRepository);
        repoByEntityClass = Collections.unmodifiableMap(map);
    }

    public <T> AppsmithRepository<?> getRepositoryForEntity(Class<T> entityClass) {
        return (AppsmithRepository<?>) repoByEntityClass.get(entityClass);
    }

    public Flux<Datasource> saveDatasourceToDb(List<Datasource> datasources) {
        return asFlux(() -> datasourceRepository.saveAll(datasources));
    }

    public Flux<DatasourceStorage> saveDatasourceStorageToDb(List<DatasourceStorage> datasourceStorage) {
        return asFlux(() -> datasourceStorageRepository.saveAll(datasourceStorage));
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
        return Flux.merge(datasourceFLux, datasourceStorageFLux).then();
    }
}
