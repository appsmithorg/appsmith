package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BaseDomain;
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
import java.util.function.Consumer;

import static com.appsmith.server.helpers.ReactorUtils.asMonoDirect;

@Component
@RequiredArgsConstructor
public class TransactionHandlerCEImpl implements TransactionHandlerCE {
    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final CustomJSLibRepository customJSLibRepository;

    private final ThemeRepository themeRepository;

    private final ApplicationRepository applicationRepository;

    private final NewPageRepository newPageRepository;

    private final NewActionRepository newActionRepository;

    private final ActionCollectionRepository actionCollectionRepository;

    private final TransactionTemplate transactionTemplate;

    private List<Datasource> datasourceList = new ArrayList<>();
    private List<DatasourceStorage> datasourceStorageList = new ArrayList<>();
    private List<Theme> themeList = new ArrayList<>();
    private List<NewPage> newPageList = new ArrayList<>();
    private List<ActionCollection> actionCollectionList = new ArrayList<>();
    private List<NewAction> actionList = new ArrayList<>();
    private final Application[] application = {new Application()};
    private List<CustomJSLib> customJSLibList = new ArrayList<>();

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

    @Override
    public Mono<Void> cleanUpDatabase(Map<String, TransactionAspect.DBOps> entityMap) {
        // Extract all the entities into their respective lists
        populateEntityData(entityMap);

        return processEntitiesAndUpdateDBState(entityMap);
    }

    @Override
    public Mono<Void> processEntitiesAndUpdateDBState(Map<String, TransactionAspect.DBOps> entityMap) {
        return asMonoDirect(() -> {
                    transactionTemplate.executeWithoutResult(transactionStatus -> {
                        for (Datasource datasource : datasourceList) {
                            processEntity(datasource, entityMap, this::archiveDatasource, this::saveDatasourceToDb);
                        }
                        for (DatasourceStorage datasourceStorage : datasourceStorageList) {
                            processEntity(
                                    datasourceStorage,
                                    entityMap,
                                    this::archiveDatasourceStorage,
                                    this::saveDatasourceStorageToDb);
                        }
                        for (Theme theme : themeList) {
                            processEntity(theme, entityMap, this::archiveTheme, this::saveThemeToDb);
                        }
                        processEntity(application[0], entityMap, this::archiveApplication, this::saveApplicationToDb);

                        for (CustomJSLib customJSLib : customJSLibList) {
                            processEntity(customJSLib, entityMap, this::archiveCustomJSLib, this::saveCustomJSLibToDb);
                        }
                        for (NewPage newPage : newPageList) {
                            processEntity(newPage, entityMap, this::archiveNewPage, this::saveNewPageToDb);
                        }
                        for (ActionCollection actionCollection : actionCollectionList) {
                            processEntity(
                                    actionCollection,
                                    entityMap,
                                    this::archiveActionCollection,
                                    this::saveActionCollectionToDb);
                        }
                        for (NewAction action : actionList) {
                            processEntity(action, entityMap, this::archiveAction, this::saveActionToDb);
                        }
                    });
                    return true;
                })
                .then();
    }

    @Override
    public void populateEntityData(Map<String, TransactionAspect.DBOps> entityMap) {
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
    }

    @Override
    public <T> void processEntity(
            T entity,
            Map<String, TransactionAspect.DBOps> entityMap,
            Consumer<String> archiveMethod,
            Consumer<T> saveMethod) {
        TransactionAspect.DBOps dbOps = entityMap.get(getEntityId(entity));
        if (dbOps != null && dbOps.isNew()) {
            archiveMethod.accept(getEntityId(entity));
        } else {
            saveMethod.accept(entity);
        }
    }

    @Override
    public String getEntityId(Object entity) {
        if (entity instanceof Datasource) {
            return ((Datasource) entity).getId();
        } else if (entity instanceof DatasourceStorage) {
            return ((DatasourceStorage) entity).getId();
        } else if (entity instanceof Theme) {
            return ((Theme) entity).getId();
        } else if (entity instanceof Application) {
            return ((Application) entity).getId();
        } else if (entity instanceof CustomJSLib) {
            return ((CustomJSLib) entity).getId();
        } else if (entity instanceof NewPage) {
            return ((NewPage) entity).getId();
        } else if (entity instanceof ActionCollection) {
            return ((ActionCollection) entity).getId();
        } else if (entity instanceof NewAction) {
            return ((NewAction) entity).getId();
        }
        return ((BaseDomain) entity).getId();
    }
}
