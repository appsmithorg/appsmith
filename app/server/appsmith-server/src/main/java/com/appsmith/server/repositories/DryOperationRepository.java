package com.appsmith.server.repositories;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.helpers.ReactorUtils.asMonoDirect;

@Component
@RequiredArgsConstructor
public class DryOperationRepository {

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final CustomJSLibRepository customJSLibRepository;

    private final TransactionTemplate transactionTemplate;

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

    public List<Datasource> saveDatasourceToDb(List<Datasource> datasources) {
        return (List<Datasource>) datasourceRepository.saveAll(datasources);
    }

    public List<DatasourceStorage> saveDatasourceStorageToDb(List<DatasourceStorage> datasourceStorage) {
        return (List<DatasourceStorage>) datasourceStorageRepository.saveAll(datasourceStorage);
    }

    private List<CustomJSLib> saveCustomJSLibToDb(List<CustomJSLib> customJSLibs) {
        return (List<CustomJSLib>) customJSLibRepository.saveAll(customJSLibs);
    }

    public Mono<Void> executeAllDbOps(MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        MappedImportableResourcesDTO result = transactionTemplate.execute(ts -> {
            // Save all datasources
            mappedImportableResourcesDTO
                    .getDatasourceStorageDryRunQueries()
                    .keySet()
                    .forEach(key -> {
                        List<Datasource> datasourceList = mappedImportableResourcesDTO
                                .getDatasourceDryRunQueries()
                                .get(key);
                        saveDatasourceToDb(datasourceList);
                    });

            // Save all datasource storage
            mappedImportableResourcesDTO
                    .getDatasourceStorageDryRunQueries()
                    .keySet()
                    .forEach(key -> {
                        List<DatasourceStorage> datasourceStorageList = mappedImportableResourcesDTO
                                .getDatasourceStorageDryRunQueries()
                                .get(key);
                        saveDatasourceStorageToDb(datasourceStorageList);
                    });

            // Save all custom js libs
            mappedImportableResourcesDTO.getCustomJSLibsDryOps().keySet().forEach(key -> {
                List<CustomJSLib> customJSLibList =
                        mappedImportableResourcesDTO.getCustomJSLibsDryOps().get(key);
                saveCustomJSLibToDb(customJSLibList);
            });
            return mappedImportableResourcesDTO;
        });

        return asMonoDirect(() -> result).then();
    }
}
