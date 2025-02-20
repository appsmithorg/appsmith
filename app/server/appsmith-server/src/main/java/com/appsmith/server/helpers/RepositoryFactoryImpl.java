package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.RepositoryFactoryCEImpl;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.ThemeRepository;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class RepositoryFactoryImpl extends RepositoryFactoryCEImpl implements RepositoryFactory {
    public RepositoryFactoryImpl(
            DatasourceRepository datasourceRepository,
            DatasourceStorageRepository datasourceStorageRepository,
            CustomJSLibRepository customJSLibRepository,
            ThemeRepository themeRepository,
            ApplicationRepository applicationRepository,
            NewPageRepository newPageRepository,
            NewActionRepository newActionRepository,
            ActionCollectionRepository actionCollectionRepository,
            Map<Class<?>, AppsmithRepository<?>> repoByEntityClass) {
        super(
                datasourceRepository,
                datasourceStorageRepository,
                customJSLibRepository,
                themeRepository,
                applicationRepository,
                newPageRepository,
                newActionRepository,
                actionCollectionRepository,
                repoByEntityClass);
    }
}
