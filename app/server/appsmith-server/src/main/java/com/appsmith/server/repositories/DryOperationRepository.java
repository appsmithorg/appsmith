package com.appsmith.server.repositories;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DryOperationRepository {

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final CustomJSLibRepository customJSLibRepository;

    private final ThemeRepository themeRepository;

    private final ApplicationRepository applicationRepository;

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

    public Mono<Void> executeAllDbOps(MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return Mono.empty().then();
    }
}
