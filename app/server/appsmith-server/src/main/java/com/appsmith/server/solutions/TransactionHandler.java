package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.aspect.TransactionAspect;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class TransactionHandler {

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final CustomJSLibRepository customJSLibRepository;

    private final ThemeRepository themeRepository;

    private final ApplicationRepository applicationRepository;

    private final NewPageRepository newPageRepository;

    private final NewActionRepository newActionRepository;

    private final ActionCollectionRepository actionCollectionRepository;

    private final TransactionTemplate transactionTemplate;

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

    public Datasource saveDatasourceToDb(Datasource datasource) {
        return datasourceRepository.save(datasource);
    }

    public int archiveDatasource(String id) {
        return datasourceRepository.archiveById(id);
    }

    public DatasourceStorage saveDatasourceStorageToDb(DatasourceStorage datasourceStorage) {
        return datasourceStorageRepository.save(datasourceStorage);
    }

    public int archiveDatasourceStorage(String id) {
        return datasourceRepository.archiveById(id);
    }

    private CustomJSLib saveCustomJSLibToDb(CustomJSLib customJSLib) {
        return customJSLibRepository.save(customJSLib);
    }

    private int archiveCustomJSLib(String customJSLibId) {
        return customJSLibRepository.archiveById(customJSLibId);
    }

    private Theme saveThemeToDb(Theme theme) {
        return themeRepository.save(theme);
    }

    private int archiveTheme(String themeId) {
        return themeRepository.archiveById(themeId);
    }

    private Application saveApplicationToDb(Application application) {
        return applicationRepository.save(application);
    }

    private int archiveApplication(String applicationId) {
        return applicationRepository.archiveById(applicationId);
    }

    private NewPage saveNewPageToDb(NewPage newPage) {
        return newPageRepository.save(newPage);
    }

    private int archiveNewPage(String newPageId) {
        return newPageRepository.archiveById(newPageId);
    }

    private ActionCollection saveActionCollectionToDb(ActionCollection actionCollection) {
        return actionCollectionRepository.save(actionCollection);
    }

    private int archiveActionCollection(String actionCollectionId) {
        return actionCollectionRepository.archiveById(actionCollectionId);
    }

    private NewAction saveActionToDb(NewAction action) {
        return newActionRepository.save(action);
    }

    private int archiveAction(String actionId) {
        return newActionRepository.archiveById(actionId);
    }

    public void cleanUpDatabase(Map<String, TransactionAspect.DBOps> entityMap) {
        List<Datasource> datasourceList = new ArrayList<>();
        List<DatasourceStorage> datasourceStorageList = new ArrayList<>();
        List<Theme> themeList = new ArrayList<>();
        List<NewPage> newPageList = new ArrayList<>();
        List<ActionCollection> actionCollectionList = new ArrayList<>();
        List<NewAction> actionList = new ArrayList<>();
        final Application[] application = {new Application()};
        List<CustomJSLib> customJSLibList = new ArrayList<>();

        entityMap.forEach((entityName, entity) -> {
            Object object = entity.getEntity();
            if (object instanceof Datasource) {
                datasourceList.add((Datasource) object);
            } else if (object instanceof DatasourceStorage) {
                datasourceStorageList.add((DatasourceStorage) object);
            } else if (object instanceof Theme) {
                themeList.add((Theme) object);
            } else if (object instanceof NewPage) {
                newPageList.add((NewPage) object);
            } else if (object instanceof ActionCollectionDTO) {
                actionCollectionList.add((ActionCollection) object);
            } else if (object instanceof ActionDTO) {
                actionList.add((NewAction) object);
            } else if (object instanceof CustomJSLib) {
                customJSLibList.add((CustomJSLib) object);
            } else if (object instanceof Application) {
                application[0] = (Application) object;
            }
        });

        transactionTemplate.executeWithoutResult(transactionStatus -> {
            for (Datasource datasource : datasourceList) {
                TransactionAspect.DBOps dbOps = entityMap.get(datasource.getId());
                if (dbOps.isNew()) {
                    archiveDatasource(datasource.getId());
                } else {
                    saveDatasourceToDb(datasource);
                }
            }
            for (DatasourceStorage datasourceStorage : datasourceStorageList) {
                TransactionAspect.DBOps dbOps = entityMap.get(datasourceStorage.getId());
                if (dbOps.isNew()) {
                    archiveDatasourceStorage(datasourceStorage.getId());
                } else {
                    saveDatasourceStorageToDb(datasourceStorage);
                }
            }
            for (Theme theme : themeList) {
                TransactionAspect.DBOps dbOps = entityMap.get(theme.getId());
                if (dbOps.isNew()) {
                    archiveTheme(theme.getId());
                } else {
                    saveThemeToDb(theme);
                }
            }

            TransactionAspect.DBOps dbOps = entityMap.get(application[0].getId());
            if (dbOps.isNew()) {
                archiveApplication(application[0].getId());
            } else {
                saveApplicationToDb(application[0]);
            }

            for (NewPage newPage : newPageList) {
                dbOps = entityMap.get(newPage.getId());
                if (dbOps.isNew()) {
                    archiveNewPage(newPage.getId());
                } else {
                    saveNewPageToDb(newPage);
                }
            }

            for (ActionCollection actionCollection : actionCollectionList) {
                dbOps = entityMap.get(actionCollection.getId());
                if (dbOps.isNew()) {
                    archiveActionCollection(actionCollection.getId());
                } else {
                    saveActionCollectionToDb(actionCollection);
                }
            }

            for (NewAction action : actionList) {
                dbOps = entityMap.get(action.getId());
                if (dbOps.isNew()) {
                    archiveAction(action.getId());
                } else {
                    saveActionToDb(action);
                }
            }
        });
    }
}
