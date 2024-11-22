package com.appsmith.server.repositories;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.DBOpsType;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.repositories.cakes.ThemeRepositoryCake;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.appsmith.server.helpers.ReactorUtils.asMonoDirect;

@Component
@RequiredArgsConstructor
public class DryOperationRepository {

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final CustomJSLibRepository customJSLibRepository;

    private final ThemeRepository themeRepository;

    private final ApplicationRepository applicationRepository;

    private final TransactionTemplate transactionTemplate;

    private final EntityManager entityManager;

    private Map<Class<?>, AppsmithRepository<?>> repoByEntityClass;

    @PostConstruct
    public void init() {
        final Map<Class<?>, AppsmithRepository<?>> map = new HashMap<>();
        map.put(Datasource.class, datasourceRepository);
        map.put(DatasourceStorage.class, datasourceStorageRepository);
        map.put(Theme.class, themeRepository);
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

    private List<Theme> saveThemeToDb(List<Theme> theme) {
        return (List<Theme>) themeRepository.saveAll(theme);
    }

    private int archiveTheme(List<String> themeIds) {
        return themeRepository.archiveAllById(themeIds, entityManager);
    }

    private List<Theme> updateTheme(List<Theme> themes) {
        return themes.stream()
                .map(themeToBeUpdated -> {
                    return themeRepository
                            .updateById(themeToBeUpdated.getId(), themeToBeUpdated, null, null, entityManager)
                            .orElse(null);
                })
                .toList();
    }

    private Optional<Application> updateApplication(Application application) {
        String id = application.getId();
        application.setId(null);
        return applicationRepository.updateById(id, application, null, null, entityManager);
    }

    public Mono<Void> executeAllDbOps(MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        MappedImportableResourcesDTO result = transactionTemplate.execute(ts -> {
            // Save all datasources
            mappedImportableResourcesDTO.getDatasourceDryRunQueries().keySet().forEach(key -> {
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

            mappedImportableResourcesDTO.getThemeDryRunQueries().keySet().forEach(key -> {
                List<Theme> themeList =
                        mappedImportableResourcesDTO.getThemeDryRunQueries().get(key);
                if (key.equals(DBOpsType.SAVE.name())) {
                    saveThemeToDb(themeList);
                } else if (key.equals(DBOpsType.DELETE.name())) {
                    archiveTheme(themeList.stream().map(Theme::getId).toList());
                } else {
                    updateTheme(themeList);
                }
            });

            mappedImportableResourcesDTO.getApplicationDryRunQueries().keySet().forEach(key -> {
                List<Application> applicationList = mappedImportableResourcesDTO
                        .getApplicationDryRunQueries()
                        .get(key);
                if (key.equals(DBOpsType.SAVE.name())) {
                    applicationList.forEach(this::updateApplication);
                } else {
                    applicationList.forEach(this::updateApplication);
                }
            });
            return mappedImportableResourcesDTO;
        });

        return asMonoDirect(() -> result).then();
    }
}
