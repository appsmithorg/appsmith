package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.ThemeRepository;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@AllArgsConstructor
public class RepositoryFactoryCEImpl implements RepositoryFactoryCE {
    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final CustomJSLibRepository customJSLibRepository;

    private final ThemeRepository themeRepository;

    private final ApplicationRepository applicationRepository;

    private final NewPageRepository newPageRepository;

    private final NewActionRepository newActionRepository;

    private final ActionCollectionRepository actionCollectionRepository;

    private Map<Class<?>, AppsmithRepository<?>> repoByEntityClass;

    @PostConstruct
    public void init() {
        repoByEntityClass = new HashMap<>();
        repoByEntityClass.put(Datasource.class, datasourceRepository);
        repoByEntityClass.put(DatasourceStorage.class, datasourceStorageRepository);
        repoByEntityClass.put(Theme.class, themeRepository);
        repoByEntityClass.put(CustomJSLib.class, customJSLibRepository);
        repoByEntityClass.put(Application.class, applicationRepository);
        repoByEntityClass.put(NewPage.class, newPageRepository);
        repoByEntityClass.put(NewAction.class, newActionRepository);
        repoByEntityClass.put(ActionCollection.class, actionCollectionRepository);
    }

    @Override
    public AppsmithRepository<?> getRepositoryFromEntity(Object object) {
        if (object instanceof Datasource) {
            return repoByEntityClass.get(Datasource.class);
        } else if (object instanceof DatasourceStorage) {
            return repoByEntityClass.get(DatasourceStorage.class);
        } else if (object instanceof Theme) {
            return repoByEntityClass.get(Theme.class);
        } else if (object instanceof NewPage) {
            return repoByEntityClass.get(NewPage.class);
        } else if (object instanceof ActionCollectionDTO) {
            return repoByEntityClass.get(ActionCollectionDTO.class);
        } else if (object instanceof ActionDTO) {
            return repoByEntityClass.get(ActionDTO.class);
        } else if (object instanceof CustomJSLib) {
            return repoByEntityClass.get(CustomJSLib.class);
        } else if (object instanceof Application) {
            return repoByEntityClass.get(Application.class);
        }
        return null;
    }
}
