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
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.ThemeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.helpers.ReactorUtils.asMonoDirect;

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

    public void saveDatasourceToDb(Datasource datasource) {
        datasourceRepository.save(datasource);
    }

    public void archiveDatasource(String id) {
        datasourceRepository.archiveById(id);
    }

    public void saveDatasourceStorageToDb(DatasourceStorage datasourceStorage) {
        datasourceStorageRepository.save(datasourceStorage);
    }

    public void archiveDatasourceStorage(String id) {
        datasourceRepository.archiveById(id);
    }

    private void saveCustomJSLibToDb(CustomJSLib customJSLib) {
        customJSLibRepository.save(customJSLib);
    }

    private void archiveCustomJSLib(String customJSLibId) {
        customJSLibRepository.archiveById(customJSLibId);
    }

    private void saveThemeToDb(Theme theme) {
        themeRepository.save(theme);
    }

    private void archiveTheme(String themeId) {
        themeRepository.archiveById(themeId);
    }

    private void saveApplicationToDb(Application application) {
        applicationRepository.save(application);
    }

    private void archiveApplication(String applicationId) {
        applicationRepository.archiveById(applicationId);
    }

    private void saveNewPageToDb(NewPage newPage) {
        newPageRepository.save(newPage);
    }

    private void archiveNewPage(String newPageId) {
        newPageRepository.archiveById(newPageId);
    }

    private void saveActionCollectionToDb(ActionCollection actionCollection) {
        actionCollectionRepository.save(actionCollection);
    }

    private void archiveActionCollection(String actionCollectionId) {
        actionCollectionRepository.archiveById(actionCollectionId);
    }

    private void saveActionToDb(NewAction action) {
        newActionRepository.save(action);
    }

    private void archiveAction(String actionId) {
        newActionRepository.archiveById(actionId);
    }

    public Mono<Void> cleanUpDatabase(Map<String, TransactionAspect.DBOps> entityMap) {
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

        return asMonoDirect(() -> {
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

                        for (CustomJSLib customJSLib : customJSLibList) {
                            dbOps = entityMap.get(customJSLib.getId());
                            if (dbOps.isNew()) {
                                archiveCustomJSLib(customJSLib.getId());
                            } else {
                                saveCustomJSLibToDb(customJSLib);
                            }
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
                    return true;
                })
                .then();
    }
}
