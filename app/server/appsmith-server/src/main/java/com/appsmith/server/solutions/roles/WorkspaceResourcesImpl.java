package com.appsmith.server.solutions.roles;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.external.models.QDatasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.domains.QModuleInstance;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.QNewPage;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.ActionCollectionResourceDTO;
import com.appsmith.server.solutions.roles.dtos.ActionResourceDTO;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.DatasourceResourceDTO;
import com.appsmith.server.solutions.roles.dtos.EntityView;
import com.appsmith.server.solutions.roles.dtos.EnvironmentResourceDTO;
import com.appsmith.server.solutions.roles.dtos.IdPermissionDTO;
import com.appsmith.server.solutions.roles.dtos.ModuleInstanceResourceDTO;
import com.appsmith.server.solutions.roles.dtos.PageResourcesDTO;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.CommonFieldName.PRODUCTION_ENVIRONMENT;
import static com.appsmith.external.constants.CommonFieldName.STAGING_ENVIRONMENT;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.WORKSPACE_DATASOURCE;
import static com.appsmith.server.constants.FieldName.WORKSPACE_ENVIRONMENT;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.completeFieldName;
import static com.appsmith.server.solutions.roles.HelperUtil.generateBaseViewDto;
import static com.appsmith.server.solutions.roles.HelperUtil.generateLateralPermissionDTOsAndUpdateMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getHierarchicalLateralPermMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getLateralPermMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getRoleViewPermissionDTO;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Component
public class WorkspaceResourcesImpl implements WorkspaceResources {

    private final WorkspaceRepository workspaceRepository;
    private final ApplicationRepository applicationRepository;
    private final NewPageRepository pageRepository;
    private final NewActionRepository actionRepository;
    private final ActionCollectionRepository actionCollectionRepository;
    private final ModuleInstanceRepository moduleInstanceRepository;
    private final DatasourceRepository datasourceRepository;
    private final WorkflowRepository workflowRepository;
    private final ResponseUtils responseUtils;
    private final TenantService tenantService;
    private final PolicyGenerator policyGenerator;
    private final EnvironmentService environmentService;
    private final EnvironmentResources environmentResources;

    public WorkspaceResourcesImpl(
            WorkspaceRepository workspaceRepository,
            ApplicationRepository applicationRepository,
            NewPageRepository pageRepository,
            NewActionRepository actionRepository,
            ActionCollectionRepository actionCollectionRepository,
            ModuleInstanceRepository moduleInstanceRepository,
            DatasourceRepository datasourceRepository,
            WorkflowRepository workflowRepository,
            ResponseUtils responseUtils,
            TenantService tenantService,
            PolicyGenerator policyGenerator,
            EnvironmentService environmentService,
            EnvironmentResources environmentResources) {

        this.workspaceRepository = workspaceRepository;
        this.applicationRepository = applicationRepository;
        this.pageRepository = pageRepository;
        this.actionRepository = actionRepository;
        this.actionCollectionRepository = actionCollectionRepository;
        this.moduleInstanceRepository = moduleInstanceRepository;
        this.datasourceRepository = datasourceRepository;
        this.workflowRepository = workflowRepository;
        this.responseUtils = responseUtils;
        this.tenantService = tenantService;
        this.policyGenerator = policyGenerator;
        this.environmentService = environmentService;
        this.environmentResources = environmentResources;
    }

    @Override
    public Mono<RoleTabDTO> createApplicationResourcesTabView(
            String permissionGroupId, CommonAppsmithObjectData dataFromRepositoryForAllTabs) {

        Flux<Workspace> workspaceFlux = dataFromRepositoryForAllTabs.getWorkspaceFlux();
        Flux<Application> applicationFlux = dataFromRepositoryForAllTabs.getApplicationFlux();
        Flux<NewPage> pageFlux = dataFromRepositoryForAllTabs.getPageFlux();
        Flux<NewAction> actionFlux = dataFromRepositoryForAllTabs.getActionFlux();
        Flux<ActionCollection> actionCollectionFlux = dataFromRepositoryForAllTabs.getActionCollectionFlux();
        Flux<ModuleInstance> moduleInstanceFlux = dataFromRepositoryForAllTabs.getModuleInstanceFlux();

        Mono<Map<String, Collection<NewAction>>> pageActionNotDtoMapMono =
                dataFromRepositoryForAllTabs.getPageActionMapMono();
        Mono<Map<String, Collection<ActionResourceDTO>>> pageActionsMapMono =
                pageActionNotDtoMapMono.map(pageActionCollectionNotDtoMap -> getPageActionsMap(
                        pageActionCollectionNotDtoMap, RoleTab.APPLICATION_RESOURCES, permissionGroupId));

        Mono<Map<String, Collection<ActionCollection>>> pageActionCollectionNotDtoMapMono =
                dataFromRepositoryForAllTabs.getPageActionCollectionMapMono();
        Mono<Map<String, Collection<ActionCollectionResourceDTO>>> pageActionCollectionMapMono =
                pageActionCollectionNotDtoMapMono.map(pageActionCollectionNotDtoMap -> getPageActionCollectionMap(
                        pageActionCollectionNotDtoMap, RoleTab.APPLICATION_RESOURCES, permissionGroupId));

        Mono<Map<String, Collection<ModuleInstance>>> pageModuleInstanceMapNotDtoMono =
                dataFromRepositoryForAllTabs.getPageModuleInstanceMapMono();
        Mono<Map<String, Collection<ModuleInstanceResourceDTO>>> pageModuleInstanceMapMono =
                pageModuleInstanceMapNotDtoMono.map(pageModuleInstanceNotDtoMap -> getPageModuleInstanceMap(
                        pageModuleInstanceNotDtoMap, RoleTab.APPLICATION_RESOURCES, permissionGroupId));

        Mono<Map<String, Collection<Application>>> workspaceApplicationsMapMono =
                dataFromRepositoryForAllTabs.getWorkspaceApplicationMapMono();
        Mono<Map<String, Collection<NewPage>>> applicationPagesMapMono =
                dataFromRepositoryForAllTabs.applicationPageMapMono;

        // Get the permission hover interaction hashmap
        Mono<Map<String, Set<IdPermissionDTO>>> linkedPermissionsMono = getHoverPermissionMapForApplicationResources(
                RoleTab.APPLICATION_RESOURCES,
                workspaceFlux,
                workspaceApplicationsMapMono,
                applicationPagesMapMono,
                pageActionsMapMono,
                pageActionCollectionMapMono,
                pageModuleInstanceMapMono);

        // Get the map for disabled edit interaction
        Mono<Map<String, Set<IdPermissionDTO>>> disableMapForApplicationResourcesMono =
                getDisableMapForApplicationResources(
                        RoleTab.APPLICATION_RESOURCES,
                        workspaceFlux,
                        applicationFlux,
                        pageFlux,
                        actionFlux,
                        actionCollectionFlux,
                        moduleInstanceFlux);

        Mono<EntityView> entityViewMono = Mono.zip(
                        workspaceApplicationsMapMono,
                        applicationPagesMapMono,
                        pageActionsMapMono,
                        pageActionCollectionMapMono,
                        pageModuleInstanceMapMono)
                .flatMap(tuple -> {
                    Map<String, Collection<Application>> workspaceApplications = tuple.getT1();
                    Map<String, Collection<NewPage>> applicationPages = tuple.getT2();
                    Map<String, Collection<ActionResourceDTO>> pageActions = tuple.getT3();
                    Map<String, Collection<ActionCollectionResourceDTO>> pageActionCollections = tuple.getT4();
                    Map<String, Collection<ModuleInstanceResourceDTO>> pageModuleInstances = tuple.getT5();

                    return getWorkspaceDTOsForApplicationResources(
                                    permissionGroupId,
                                    workspaceFlux,
                                    workspaceApplications,
                                    applicationPages,
                                    pageActions,
                                    pageActionCollections,
                                    pageModuleInstances)
                            .collectList()
                            .map(workspaceDTOs -> {
                                EntityView entityView = new EntityView();
                                entityView.setType(Workspace.class.getSimpleName());
                                entityView.setEntities(workspaceDTOs);
                                return entityView;
                            });
                });

        return Mono.zip(entityViewMono, linkedPermissionsMono, disableMapForApplicationResourcesMono)
                .map(tuple -> {
                    EntityView entityView = tuple.getT1();
                    Map<String, Set<IdPermissionDTO>> linkedPermissions = tuple.getT2();
                    Map<String, Set<IdPermissionDTO>> disableMap = tuple.getT3();
                    RoleTabDTO roleTabDTO = new RoleTabDTO();
                    roleTabDTO.setData(entityView);
                    roleTabDTO.setPermissions(RoleTab.APPLICATION_RESOURCES.getViewablePermissions());
                    roleTabDTO.setHoverMap(linkedPermissions);
                    roleTabDTO.setDisableHelperMap(disableMap);

                    return roleTabDTO;
                });
    }

    @Override
    public Mono<RoleTabDTO> createDatasourceResourcesTabView(
            String permissionGroupId, CommonAppsmithObjectData dataFromRepositoryForAllTabs) {
        Flux<Workspace> workspaceFlux = dataFromRepositoryForAllTabs.getWorkspaceFlux();
        Flux<Datasource> datasourceFlux = dataFromRepositoryForAllTabs.getDatasourceFlux();
        Flux<NewAction> actionFlux = dataFromRepositoryForAllTabs.getActionFlux();
        Flux<NewPage> pageFlux = dataFromRepositoryForAllTabs.getPageFlux();
        Flux<Environment> environmentFlux = dataFromRepositoryForAllTabs.getEnvironmentFlux();
        Mono<Map<String, Collection<Datasource>>> workspaceDatasourceNotDtoMapMono =
                dataFromRepositoryForAllTabs.getWorkspaceDatasourceMapMono();
        Mono<Map<String, Collection<Environment>>> workspaceEnvironmentNotDtoMapMono =
                dataFromRepositoryForAllTabs.getWorkspaceEnvironmentMapMono();

        Mono<Map<String, Collection<DatasourceResourceDTO>>> workspaceDatasourcesDtoMap =
                workspaceDatasourceNotDtoMapMono.map(workspaceDatasourceNotDtoMap -> getWorkspaceDatasourceMap(
                        workspaceDatasourceNotDtoMap, RoleTab.DATASOURCES_ENVIRONMENTS, permissionGroupId));

        Mono<Map<String, Collection<EnvironmentResourceDTO>>> workspaceEnvironmentResourceDtoMapMono =
                workspaceEnvironmentNotDtoMapMono.map(workspaceEnvironmentnotDtoMap -> getWorkspaceEnvironmentMap(
                        workspaceEnvironmentnotDtoMap, RoleTab.DATASOURCES_ENVIRONMENTS, permissionGroupId));

        // Get the permission hover map for the tab
        Mono<Map<String, Set<IdPermissionDTO>>> linkedPermissionsMono = getLinkedPermissionsForDatasourceResources(
                RoleTab.DATASOURCES_ENVIRONMENTS,
                workspaceFlux,
                workspaceDatasourceNotDtoMapMono,
                datasourceFlux,
                actionFlux,
                pageFlux,
                workspaceEnvironmentNotDtoMapMono,
                environmentFlux,
                permissionGroupId);

        // Get the map for disabled edit interaction
        Mono<Map<String, Set<IdPermissionDTO>>> disableMapForDatasourceResourcesMono =
                getDisableMapsForDatasourceResources(
                        RoleTab.DATASOURCES_ENVIRONMENTS, workspaceFlux, datasourceFlux, environmentFlux);

        Mono<EntityView> entityViewMono = Mono.zip(workspaceDatasourcesDtoMap, workspaceEnvironmentResourceDtoMapMono)
                .flatMapMany(tuple -> {
                    Map<String, Collection<DatasourceResourceDTO>> workspaceDatasources = tuple.getT1();
                    Map<String, Collection<EnvironmentResourceDTO>> workspaceEnvironments = tuple.getT2();

                    return getWorkspaceDTOsForDatasourceResources(
                            permissionGroupId, workspaceFlux, workspaceDatasources, workspaceEnvironments);
                })
                .collectList()
                .map(workspaceDTOs -> {
                    EntityView entityView = new EntityView();
                    entityView.setType("Header");
                    entityView.setEntities(workspaceDTOs);
                    return entityView;
                });

        return Mono.zip(entityViewMono, linkedPermissionsMono, disableMapForDatasourceResourcesMono)
                .map(tuple -> {
                    EntityView entityView = tuple.getT1();
                    Map<String, Set<IdPermissionDTO>> linkedPermissions = tuple.getT2();
                    Map<String, Set<IdPermissionDTO>> disableHelper = tuple.getT3();
                    RoleTabDTO roleTabDTO = new RoleTabDTO();
                    roleTabDTO.setData(entityView);
                    roleTabDTO.setPermissions(RoleTab.DATASOURCES_ENVIRONMENTS.getViewablePermissions());
                    roleTabDTO.setHoverMap(linkedPermissions);
                    roleTabDTO.setDisableHelperMap(disableHelper);

                    return roleTabDTO;
                });
    }

    private Flux<BaseView> getWorkspaceDTOsForDatasourceResources(
            String permissionGroupId,
            Flux<Workspace> workspaceFlux,
            Map<String, Collection<DatasourceResourceDTO>> workspaceDatasourceMap,
            Map<String, Collection<EnvironmentResourceDTO>> workspaceEnvironmentMap) {
        return workspaceFlux.flatMap(workspace -> {
            BaseView workspaceDTO = generateBaseViewDto(
                    workspace,
                    Workspace.class,
                    workspace.getName(),
                    RoleTab.DATASOURCES_ENVIRONMENTS,
                    permissionGroupId,
                    policyGenerator);
            // Create the empty header representations and add the respective children inside them
            EntityView header = new EntityView();
            header.setType(Workspace.class.getSimpleName());

            // Datasource View
            BaseView datasourcesView = new BaseView();
            datasourcesView.setId(workspace.getId());
            datasourcesView.setName("Datasources");
            Tuple2<List<Integer>, List<Integer>> roleViewPermissionDTO = getRoleViewPermissionDTO(
                    permissionGroupId,
                    Workspace.class,
                    policyGenerator,
                    workspace.getPolicies(),
                    RoleTab.DATASOURCES_ENVIRONMENTS.getDuplicateEntities().stream()
                            .filter(tuple3 -> tuple3.getT1().equals("Datasources"))
                            .findFirst()
                            .get()
                            .getT3()
                            .stream()
                            .collect(Collectors.toSet()),
                    RoleTab.DATASOURCES_ENVIRONMENTS.getViewablePermissions());
            datasourcesView.setEnabled(roleViewPermissionDTO.getT1());
            datasourcesView.setEditable(roleViewPermissionDTO.getT2());
            EntityView datasourcesEntityView = new EntityView();
            datasourcesEntityView.setType(Datasource.class.getSimpleName());
            List<DatasourceResourceDTO> datasourceResourceDTOS =
                    (List<DatasourceResourceDTO>) workspaceDatasourceMap.get(workspaceDTO.getId());
            datasourcesEntityView.setEntities(datasourceResourceDTOS);
            datasourcesView.setChildren(Set.of(datasourcesEntityView));

            Mono<BaseView> environmentViewMono = environmentResources.getEnvironmentEntityBaseView(
                    workspaceEnvironmentMap, workspaceDTO, workspace, permissionGroupId);

            return environmentViewMono.map(environmentsView -> {
                List<BaseView> baseViews = new ArrayList<>();
                baseViews.add(datasourcesView);
                if (environmentsView != null && StringUtils.hasLength(environmentsView.getName())) {
                    baseViews.add(environmentsView);
                }
                header.setEntities(baseViews);
                workspaceDTO.setChildren(Set.of(header));
                return workspaceDTO;
            });
        });
    }

    private Map<String, Collection<DatasourceResourceDTO>> getWorkspaceDatasourceMap(
            Map<String, Collection<Datasource>> workspaceDatasourceNotDtoMap,
            RoleTab roleTab,
            String permissionGroupId) {
        Map<String, Collection<DatasourceResourceDTO>> workspaceDatasourceMap = new HashMap<>();
        workspaceDatasourceNotDtoMap.forEach((workspaceId, datasources) -> {
            Collection<DatasourceResourceDTO> datasourceResourceDTOS = datasources.stream()
                    .map(datasource -> {
                        DatasourceResourceDTO datasourceResourceDTO = new DatasourceResourceDTO();
                        datasourceResourceDTO.setId(datasource.getId());
                        datasourceResourceDTO.setName(datasource.getName());
                        datasourceResourceDTO.setPluginId(datasource.getPluginId());
                        Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(
                                roleTab,
                                permissionGroupId,
                                datasource.getPolicies(),
                                Datasource.class,
                                policyGenerator);
                        datasourceResourceDTO.setEnabled(permissionsTuple.getT1());
                        datasourceResourceDTO.setEditable(permissionsTuple.getT2());
                        return datasourceResourceDTO;
                    })
                    .collect(Collectors.toList());
            workspaceDatasourceMap.put(workspaceId, datasourceResourceDTOS);
        });
        return workspaceDatasourceMap;
    }

    private Map<String, Collection<ActionCollectionResourceDTO>> getPageActionCollectionMap(
            Map<String, Collection<ActionCollection>> pageActionCollectionNotDtoMap,
            RoleTab roleTab,
            String permissionGroupId) {
        Map<String, Collection<ActionCollectionResourceDTO>> pageActionCollectionMap = new HashMap<>();
        pageActionCollectionNotDtoMap.forEach((pageId, actionCollections) -> {
            Collection<ActionCollectionResourceDTO> actionCollectionDTOList = actionCollections.stream()
                    .map(actionCollection -> {
                        ActionCollectionResourceDTO actionCollectionDTO = new ActionCollectionResourceDTO();
                        actionCollectionDTO.setId(actionCollection.getId());
                        actionCollectionDTO.setName(
                                actionCollection.getUnpublishedCollection().getName());
                        Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(
                                roleTab,
                                permissionGroupId,
                                actionCollection.getPolicies(),
                                NewAction.class,
                                policyGenerator);
                        actionCollectionDTO.setEnabled(permissionsTuple.getT1());
                        actionCollectionDTO.setEditable(permissionsTuple.getT2());
                        return actionCollectionDTO;
                    })
                    .collect(Collectors.toList());
            pageActionCollectionMap.put(pageId, actionCollectionDTOList);
        });
        return pageActionCollectionMap;
    }

    private Map<String, Collection<ModuleInstanceResourceDTO>> getPageModuleInstanceMap(
            Map<String, Collection<ModuleInstance>> pageModuleInstanceNotDtoMap,
            RoleTab roleTab,
            String permissionGroupId) {
        Map<String, Collection<ModuleInstanceResourceDTO>> pageModuleInstanceMap = new HashMap<>();
        pageModuleInstanceNotDtoMap.forEach((pageId, moduleInstances) -> {
            Collection<ModuleInstanceResourceDTO> moduleInstanceResourceDTOList = moduleInstances.stream()
                    .map(moduleInstance -> {
                        ModuleInstanceResourceDTO moduleInstanceResourceDTO = new ModuleInstanceResourceDTO();
                        moduleInstanceResourceDTO.setId(moduleInstance.getId());
                        moduleInstanceResourceDTO.setName(
                                moduleInstance.getUnpublishedModuleInstance().getName());
                        Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(
                                roleTab,
                                permissionGroupId,
                                moduleInstance.getPolicies(),
                                ModuleInstance.class,
                                policyGenerator);
                        moduleInstanceResourceDTO.setEnabled(permissionsTuple.getT1());
                        moduleInstanceResourceDTO.setEditable(permissionsTuple.getT2());
                        return moduleInstanceResourceDTO;
                    })
                    .collect(Collectors.toList());
            pageModuleInstanceMap.put(pageId, moduleInstanceResourceDTOList);
        });
        return pageModuleInstanceMap;
    }

    private Map<String, Collection<ActionResourceDTO>> getPageActionsMap(
            Map<String, Collection<NewAction>> pageActionNotDtoMap, RoleTab roleTab, String permissionGroupId) {
        Map<String, Collection<ActionResourceDTO>> pageActionsMap = new HashMap<>();
        pageActionNotDtoMap.forEach((pageId, actions) -> {
            Collection<ActionResourceDTO> actionDTOList = actions.stream()
                    .map(action -> {
                        ActionResourceDTO actionDTO = new ActionResourceDTO();
                        actionDTO.setId(action.getId());
                        actionDTO.setName(action.getUnpublishedAction().getName());
                        actionDTO.setPluginId(action.getPluginId());
                        Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(
                                roleTab, permissionGroupId, action.getPolicies(), NewAction.class, policyGenerator);
                        actionDTO.setEnabled(permissionsTuple.getT1());
                        actionDTO.setEditable(permissionsTuple.getT2());
                        return actionDTO;
                    })
                    .collect(Collectors.toList());
            pageActionsMap.put(pageId, actionDTOList);
        });
        return pageActionsMap;
    }

    private Map<String, Collection<EnvironmentResourceDTO>> getWorkspaceEnvironmentMap(
            Map<String, Collection<Environment>> workspaceEnvironmentNotDtoMap,
            RoleTab roleTab,
            String permissionGroupId) {
        Map<String, Collection<EnvironmentResourceDTO>> workspaceEnvironmentMap = new HashMap<>();
        workspaceEnvironmentNotDtoMap.forEach((workspaceId, environments) -> {
            Collection<EnvironmentResourceDTO> environmentResourceDTOS = environments.stream()
                    .sorted(Comparator.comparing(Environment::getIsDefault)
                            .thenComparing(environment -> environment.getName().equals(PRODUCTION_ENVIRONMENT)
                                    || environment.getName().equals(STAGING_ENVIRONMENT))
                            .thenComparing(Environment::getName)
                            .reversed())
                    .map(environment -> {
                        EnvironmentResourceDTO environmentResourceDTO = new EnvironmentResourceDTO();
                        environmentResourceDTO.setId(environment.getId());
                        environmentResourceDTO.setName(environment.getName());
                        Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(
                                roleTab,
                                permissionGroupId,
                                environment.getPolicies(),
                                Environment.class,
                                policyGenerator);
                        environmentResourceDTO.setEnabled(permissionsTuple.getT1());
                        environmentResourceDTO.setEditable(permissionsTuple.getT2());
                        return environmentResourceDTO;
                    })
                    .collect(Collectors.toList());
            workspaceEnvironmentMap.put(workspaceId, environmentResourceDTOS);
        });
        return workspaceEnvironmentMap;
    }

    private Flux<BaseView> getWorkspaceDTOsForApplicationResources(
            String permissionGroupId,
            Flux<Workspace> workspaceFlux,
            Map<String, Collection<Application>> workspaceApplications,
            Map<String, Collection<NewPage>> applicationPages,
            Map<String, Collection<ActionResourceDTO>> pageActions,
            Map<String, Collection<ActionCollectionResourceDTO>> pageActionCollections,
            Map<String, Collection<ModuleInstanceResourceDTO>> pageModuleInstances) {
        return workspaceFlux
                .map(workspace -> generateBaseViewDto(
                        workspace,
                        Workspace.class,
                        workspace.getName(),
                        RoleTab.APPLICATION_RESOURCES,
                        permissionGroupId,
                        policyGenerator))
                .flatMap(workspaceDTO -> {
                    Collection<Application> applications = workspaceApplications.get(workspaceDTO.getId());

                    Mono<List<BaseView>> applicationsDTOsMono = Mono.just(List.of());

                    if (!CollectionUtils.isEmpty(applications)) {
                        applicationsDTOsMono = getApplicationDTOs(
                                        permissionGroupId,
                                        applicationPages,
                                        pageActions,
                                        pageActionCollections,
                                        pageModuleInstances,
                                        applications,
                                        RoleTab.APPLICATION_RESOURCES)
                                .collectList();
                    }

                    return applicationsDTOsMono.map(applicationDTOs -> {
                        EntityView applicationsEntity = new EntityView();
                        applicationsEntity.setType(Application.class.getSimpleName());
                        applicationsEntity.setEntities(applicationDTOs);
                        workspaceDTO.setChildren(Set.of(applicationsEntity));
                        return workspaceDTO;
                    });
                });
    }

    private Flux<BaseView> getApplicationDTOs(
            String permissionGroupId,
            Map<String, Collection<NewPage>> applicationPages,
            Map<String, Collection<ActionResourceDTO>> pageActions,
            Map<String, Collection<ActionCollectionResourceDTO>> pageActionCollections,
            Map<String, Collection<ModuleInstanceResourceDTO>> pageModuleInstances,
            Collection<Application> applications,
            RoleTab roleTab) {
        return Flux.fromIterable(applications).flatMap(application -> {
            BaseView applicationDTO = new BaseView();
            applicationDTO.setId(application.getId());
            applicationDTO.setName(application.getName());
            Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(
                    roleTab, permissionGroupId, application.getPolicies(), Application.class, policyGenerator);
            applicationDTO.setEnabled(permissionsTuple.getT1());
            applicationDTO.setEditable(permissionsTuple.getT2());

            // Get the default unpublished & published pages for the application.
            // This is to show the home page to the user in the application resources tab
            Set<String> defaultPageIds = new HashSet<>();

            /*
             * application#getPages() should not return a null object in a stable scenario but in some special
             * cases(we don't know when) it does, and does not allow the role page to be loaded. We are handling this for now but
             * can also be kept for later as it is a good check to have.
             */
            Optional<ApplicationPage> unpublishedDefaultPage = Optional.ofNullable(application.getPages())
                    .orElse(Collections.emptyList()) // Default to an empty list if it's null
                    .stream()
                    .filter(ApplicationPage::getIsDefault)
                    .findFirst();
            unpublishedDefaultPage.ifPresent(applicationPage -> defaultPageIds.add(applicationPage.getId()));

            if (application.getPublishedPages() != null) {
                Optional<ApplicationPage> publishedDefaultPage = application.getPublishedPages().stream()
                        .filter(ApplicationPage::getIsDefault)
                        .findFirst();

                publishedDefaultPage.ifPresent(applicationPage -> defaultPageIds.add(applicationPage.getId()));
            }
            Collection<NewPage> pages = applicationPages.get(application.getId());
            if (pages == null) {
                return Mono.just(applicationDTO);
            }
            return getPageActionDTOs(
                            permissionGroupId,
                            pageActions,
                            pageActionCollections,
                            pageModuleInstances,
                            defaultPageIds,
                            pages,
                            roleTab)
                    .map(pageDTOs -> {
                        EntityView entityView = new EntityView();
                        entityView.setType(NewPage.class.getSimpleName());
                        entityView.setEntities(pageDTOs);
                        applicationDTO.setChildren(Set.of(entityView));
                        return applicationDTO;
                    });
        });
    }

    private Mono<List<PageResourcesDTO>> getPageActionDTOs(
            String permissionGroupId,
            Map<String, Collection<ActionResourceDTO>> pageActions,
            Map<String, Collection<ActionCollectionResourceDTO>> pageActionCollections,
            Map<String, Collection<ModuleInstanceResourceDTO>> pageModuleInstances,
            Set<String> defaultPageIds,
            Collection<NewPage> pages,
            RoleTab roleTab) {
        return Flux.fromIterable(pages)
                .map(page -> {
                    List<BaseView> actionDTOs = (List) pageActions.get(page.getId());
                    List<BaseView> actionCollectionDTOs = (List) pageActionCollections.get(page.getId());
                    List<BaseView> moduleInstanceDTOs = (List) pageModuleInstances.get(page.getId());

                    PageResourcesDTO pageDTO = new PageResourcesDTO();
                    pageDTO.setId(page.getId());
                    pageDTO.setName(page.getUnpublishedPage().getName());
                    Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(
                            roleTab, permissionGroupId, page.getPolicies(), NewPage.class, policyGenerator);
                    pageDTO.setEnabled(permissionsTuple.getT1());
                    pageDTO.setEditable(permissionsTuple.getT2());

                    if (defaultPageIds.contains(page.getId())) {
                        pageDTO.setIsDefault(true);
                    }
                    Set<EntityView> pageChildren = new HashSet<>();

                    // Only add the actions entity if not empty
                    if (!CollectionUtils.isEmpty(actionDTOs)) {
                        EntityView actions;
                        actions = new EntityView();
                        actions.setType(NewAction.class.getSimpleName());
                        actions.setEntities(actionDTOs);
                        pageChildren.add(actions);
                    }

                    // Only add the action collection entity if not empty
                    if (!CollectionUtils.isEmpty(actionCollectionDTOs)) {
                        EntityView actionCollections;
                        actionCollections = new EntityView();
                        actionCollections.setType(ActionCollection.class.getSimpleName());
                        actionCollections.setEntities(actionCollectionDTOs);
                        pageChildren.add(actionCollections);
                    }

                    // Only add the action collection entity if not empty
                    if (!CollectionUtils.isEmpty(moduleInstanceDTOs)) {
                        EntityView moduleInstances;
                        moduleInstances = new EntityView();
                        moduleInstances.setType(ModuleInstance.class.getSimpleName());
                        moduleInstances.setEntities(moduleInstanceDTOs);
                        pageChildren.add(moduleInstances);
                    }

                    pageDTO.setChildren(pageChildren);
                    return pageDTO;
                })
                .collectList();
    }

    private Mono<Map<String, Set<IdPermissionDTO>>> getDisableMapForApplicationResources(
            RoleTab roleTab,
            Flux<Workspace> workspaceFlux,
            Flux<Application> applicationFlux,
            Flux<NewPage> pageFlux,
            Flux<NewAction> actionFlux,
            Flux<ActionCollection> actionCollectionFlux,
            Flux<ModuleInstance> moduleInstanceFlux) {
        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Set<AclPermission> workspacePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Workspace.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> workspaceLateralMap =
                getLateralPermMap(workspacePermissions, policyGenerator, roleTab);

        Set<AclPermission> applicationPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Application.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> applicationLateralMap =
                getLateralPermMap(applicationPermissions, policyGenerator, roleTab);

        Set<AclPermission> pagePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(NewPage.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> pageLateralMap =
                getLateralPermMap(pagePermissions, policyGenerator, roleTab);

        Set<AclPermission> actionPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(NewAction.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> actionLateralMap =
                getLateralPermMap(actionPermissions, policyGenerator, roleTab);

        ConcurrentHashMap<String, Set<IdPermissionDTO>> disableMap = new ConcurrentHashMap<>();

        Mono<Void> updateWorkspaceDisableMapMono = workspaceFlux
                .map(workspace -> {
                    String workspaceId = workspace.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            workspaceLateralMap, disableMap, workspaceId, workspaceId, Workspace.class);
                    return workspaceId;
                })
                .then();

        Mono<Void> updateApplicationDisableMapMono = applicationFlux
                .map(application -> {
                    String applicationId = application.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            applicationLateralMap, disableMap, applicationId, applicationId, Application.class);
                    return applicationId;
                })
                .then();

        Mono<Void> updatePageDisableMapMono = pageFlux.map(page -> {
                    String pageId = page.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            pageLateralMap, disableMap, pageId, pageId, NewPage.class);
                    return pageId;
                })
                .then();

        Mono<Void> updateActionDisableMapMono = actionFlux
                .map(action -> {
                    String actionId = action.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            actionLateralMap, disableMap, actionId, actionId, NewAction.class);
                    return actionId;
                })
                .then();

        Mono<Void> updateActionCollectionDisableMapMono = actionCollectionFlux
                .map(actionCollection -> {
                    String actionCollectionId = actionCollection.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            actionLateralMap, disableMap, actionCollectionId, actionCollectionId, NewAction.class);
                    return actionCollectionId;
                })
                .then();

        Mono<Void> updateModuleInstanceDisableMapMono = moduleInstanceFlux
                .map(moduleInstance -> {
                    String moduleInstanceId = moduleInstance.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            actionLateralMap, disableMap, moduleInstanceId, moduleInstanceId, NewAction.class);
                    return moduleInstanceId;
                })
                .then();

        return Mono.when(
                        updateWorkspaceDisableMapMono,
                        updateApplicationDisableMapMono,
                        updatePageDisableMapMono,
                        updateActionDisableMapMono,
                        updateActionCollectionDisableMapMono,
                        updateModuleInstanceDisableMapMono)
                .then(Mono.just(disableMap))
                .map(disableMap1 -> {
                    disableMap1.values().removeIf(Set::isEmpty);
                    return disableMap1;
                });
    }

    private Mono<Map<String, Set<IdPermissionDTO>>> getHoverPermissionMapForApplicationResources(
            RoleTab roleTab,
            Flux<Workspace> workspaceFlux,
            Mono<Map<String, Collection<Application>>> workspaceApplicationMapMono,
            Mono<Map<String, Collection<NewPage>>> applicationPageMapMono,
            Mono<Map<String, Collection<ActionResourceDTO>>> pageActionMapMono,
            Mono<Map<String, Collection<ActionCollectionResourceDTO>>> pageActionCollectionMapMono,
            Mono<Map<String, Collection<ModuleInstanceResourceDTO>>> pageModuleInstanceMapMono) {

        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Set<AclPermission> workspacePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Workspace.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> workspaceHierarchicalLateralMap =
                getHierarchicalLateralPermMap(workspacePermissions, policyGenerator, roleTab);

        Set<AclPermission> applicationPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Application.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> applicationHierarchicalLateralMap =
                getHierarchicalLateralPermMap(applicationPermissions, policyGenerator, roleTab);

        Set<AclPermission> pagePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(NewPage.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> pageHierarchicalLateralMap =
                getHierarchicalLateralPermMap(pagePermissions, policyGenerator, roleTab);

        Set<AclPermission> actionPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(NewAction.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> actionHierarchicalLateralMap =
                getHierarchicalLateralPermMap(actionPermissions, policyGenerator, roleTab);

        Set<AclPermission> actionCollectionPermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(NewAction.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> actionCollectionHierarchicalLateralMap =
                getHierarchicalLateralPermMap(actionCollectionPermissions, policyGenerator, roleTab);

        Set<AclPermission> moduleInstancePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(NewAction.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> moduleInstanceHierarchicalLateralMap =
                getHierarchicalLateralPermMap(moduleInstancePermissions, policyGenerator, roleTab);

        ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMap = new ConcurrentHashMap<>();

        return Mono.zip(
                        workspaceApplicationMapMono,
                        applicationPageMapMono,
                        pageActionMapMono,
                        pageActionCollectionMapMono,
                        pageModuleInstanceMapMono)
                .flatMapMany(tuple -> {
                    Map<String, Collection<Application>> workspaceApplicationMap = tuple.getT1();
                    Map<String, Collection<NewPage>> applicationPageMap = tuple.getT2();
                    Map<String, Collection<ActionResourceDTO>> pageActionMap = tuple.getT3();
                    Map<String, Collection<ActionCollectionResourceDTO>> pageActionCollectionMap = tuple.getT4();
                    Map<String, Collection<ModuleInstanceResourceDTO>> pageModuleInstanceMap = tuple.getT5();

                    return workspaceFlux.map(workspace -> {
                        String workspaceId = workspace.getId();

                        generateLateralPermissionDTOsAndUpdateMap(
                                workspaceHierarchicalLateralMap, hoverMap, workspaceId, workspaceId, Workspace.class);

                        Collection<Application> applications = workspaceApplicationMap.get(workspace.getId());

                        if (!CollectionUtils.isEmpty(applications)) {
                            applications.stream().forEach(application -> {
                                String applicationId = application.getId();

                                generateLateralPermissionDTOsAndUpdateMap(
                                        workspaceHierarchicalLateralMap,
                                        hoverMap,
                                        workspaceId,
                                        applicationId,
                                        Application.class);
                                generateLateralPermissionDTOsAndUpdateMap(
                                        applicationHierarchicalLateralMap,
                                        hoverMap,
                                        applicationId,
                                        applicationId,
                                        Application.class);

                                Collection<NewPage> pages = applicationPageMap.get(application.getId());
                                if (!CollectionUtils.isEmpty(pages)) {
                                    pages.stream().forEach(page -> {
                                        String pageId = page.getId();

                                        generateLateralPermissionDTOsAndUpdateMap(
                                                applicationHierarchicalLateralMap,
                                                hoverMap,
                                                applicationId,
                                                pageId,
                                                NewPage.class);
                                        generateLateralPermissionDTOsAndUpdateMap(
                                                pageHierarchicalLateralMap, hoverMap, pageId, pageId, NewPage.class);

                                        Collection<ActionResourceDTO> actions = pageActionMap.get(page.getId());
                                        if (!CollectionUtils.isEmpty(actions)) {
                                            actions.stream().forEach(action -> {
                                                String actionId = action.getId();

                                                generateLateralPermissionDTOsAndUpdateMap(
                                                        pageHierarchicalLateralMap,
                                                        hoverMap,
                                                        pageId,
                                                        actionId,
                                                        NewAction.class);
                                                generateLateralPermissionDTOsAndUpdateMap(
                                                        actionHierarchicalLateralMap,
                                                        hoverMap,
                                                        actionId,
                                                        actionId,
                                                        NewAction.class);
                                            });
                                        }

                                        Collection<ActionCollectionResourceDTO> actionCollections =
                                                pageActionCollectionMap.get(page.getId());
                                        if (!CollectionUtils.isEmpty(actionCollections)) {
                                            actionCollections.stream().forEach(actionCollection -> {
                                                String actionCollectionId = actionCollection.getId();

                                                generateLateralPermissionDTOsAndUpdateMap(
                                                        pageHierarchicalLateralMap,
                                                        hoverMap,
                                                        pageId,
                                                        actionCollectionId,
                                                        NewAction.class);
                                                generateLateralPermissionDTOsAndUpdateMap(
                                                        actionCollectionHierarchicalLateralMap,
                                                        hoverMap,
                                                        actionCollectionId,
                                                        actionCollectionId,
                                                        NewAction.class);
                                            });
                                        }

                                        Collection<ModuleInstanceResourceDTO> moduleInstances =
                                                pageModuleInstanceMap.get(page.getId());
                                        if (!CollectionUtils.isEmpty(moduleInstances)) {
                                            moduleInstances.stream().forEach(resourceDTO -> {
                                                String id = resourceDTO.getId();

                                                generateLateralPermissionDTOsAndUpdateMap(
                                                        pageHierarchicalLateralMap,
                                                        hoverMap,
                                                        pageId,
                                                        id,
                                                        NewAction.class);
                                                generateLateralPermissionDTOsAndUpdateMap(
                                                        moduleInstanceHierarchicalLateralMap,
                                                        hoverMap,
                                                        id,
                                                        id,
                                                        NewAction.class);
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        return workspace;
                    });
                })
                .then(Mono.just(hoverMap))
                .map(hoverMap1 -> {
                    hoverMap1.values().removeIf(Set::isEmpty);
                    return hoverMap1;
                });
    }

    private Mono<Map<String, Set<IdPermissionDTO>>> getDisableMapsForDatasourceResources(
            RoleTab roleTab,
            Flux<Workspace> workspaceFlux,
            Flux<Datasource> datasourceFlux,
            Flux<Environment> environmentFlux) {

        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Set<AclPermission> workspacePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Workspace.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> workspaceLateralMap =
                getLateralPermMap(workspacePermissions, policyGenerator, roleTab);

        Set<AclPermission> datasourcePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Datasource.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> datasourceLateralMap =
                getLateralPermMap(datasourcePermissions, policyGenerator, roleTab);

        ConcurrentHashMap<String, Set<IdPermissionDTO>> disableMap = new ConcurrentHashMap<>();

        Mono<Void> updateWorkspaceDisableMapMono = workspaceFlux
                .map(workspace -> {
                    String workspaceId = workspace.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            workspaceLateralMap, disableMap, workspaceId, workspaceId, Workspace.class);
                    disableMap.forEach((key, value) -> {
                        if (key.startsWith(workspaceId)
                                && !key.contains(WORKSPACE_DATASOURCE)
                                && !key.contains(WORKSPACE_ENVIRONMENT)) {
                            disableMap.remove(key);
                            disableMap.put(key + "_" + WORKSPACE_DATASOURCE, value);
                            disableMap.put(key + "_" + WORKSPACE_ENVIRONMENT, value);
                        }
                    });
                    return workspaceId;
                })
                .then();

        Mono<Void> updateDatasourceDisableMapMono = datasourceFlux
                .map(datasource -> {
                    String datasourceId = datasource.getId();
                    generateLateralPermissionDTOsAndUpdateMap(
                            datasourceLateralMap, disableMap, datasourceId, datasourceId, Datasource.class);
                    return datasourceId;
                })
                .then();

        Mono<Void> updateEnvironmentDisableMapMono =
                environmentResources.updateEnvironmentDisableMapMono(roleTab, environmentFlux, disableMap);

        return Mono.when(updateWorkspaceDisableMapMono, updateDatasourceDisableMapMono, updateEnvironmentDisableMapMono)
                .then(Mono.just(disableMap))
                .map(disableMap1 -> {
                    disableMap1.values().removeIf(Set::isEmpty);
                    return disableMap1;
                });
    }

    private Mono<Map<String, Set<IdPermissionDTO>>> getLinkedPermissionsForDatasourceResources(
            RoleTab roleTab,
            Flux<Workspace> workspaceFlux,
            Mono<Map<String, Collection<Datasource>>> workspaceDatasourceMapMono,
            Flux<Datasource> datasourceFlux,
            Flux<NewAction> actionFlux,
            Flux<NewPage> pageFlux,
            Mono<Map<String, Collection<Environment>>> workspaceEnvironmentMapMono,
            Flux<Environment> environmentFlux,
            String permissionGroupId) {

        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Set<AclPermission> workspacePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Workspace.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> workspaceHierarchicalLateralMap =
                getHierarchicalLateralPermMap(workspacePermissions, policyGenerator, roleTab);

        Set<AclPermission> datasourcePermissions = tabPermissions.stream()
                .filter(permission -> permission.getEntity().equals(Datasource.class))
                .collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> datasourceHierarchicalLateralMap =
                getHierarchicalLateralPermMap(datasourcePermissions, policyGenerator, roleTab);

        ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMap = new ConcurrentHashMap<>();

        Mono<Boolean> workspaceDatasourcesHoverMapMono = workspaceDatasourceMapMono
                .flatMapMany(workspaceDatasourceMap -> {
                    return workspaceFlux.map(workspace -> {
                        ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMapDatasources = new ConcurrentHashMap<>();

                        String workspaceId = workspace.getId();

                        generateLateralPermissionDTOsAndUpdateMap(
                                workspaceHierarchicalLateralMap,
                                hoverMapDatasources,
                                workspaceId,
                                workspaceId,
                                Workspace.class);

                        Collection<Datasource> datasources = workspaceDatasourceMap.get(workspace.getId());

                        if (!CollectionUtils.isEmpty(datasources)) {
                            datasources.stream().forEach(datasource -> {
                                String datasourceId = datasource.getId();
                                generateLateralPermissionDTOsAndUpdateMap(
                                        workspaceHierarchicalLateralMap,
                                        hoverMapDatasources,
                                        workspaceId,
                                        datasourceId,
                                        Datasource.class);
                                generateLateralPermissionDTOsAndUpdateMap(
                                        datasourceHierarchicalLateralMap,
                                        hoverMapDatasources,
                                        datasourceId,
                                        datasourceId,
                                        Datasource.class);
                            });
                        }

                        hoverMapDatasources.forEach((key, value) -> {
                            if (key.startsWith(workspaceId)
                                    && !key.contains(WORKSPACE_DATASOURCE)
                                    && !key.contains(WORKSPACE_ENVIRONMENT)) {
                                hoverMapDatasources.remove(key);
                                hoverMapDatasources.put(key + "_" + WORKSPACE_DATASOURCE, value);
                            }
                        });
                        hoverMap.putAll(hoverMapDatasources);

                        return workspace;
                    });
                })
                .then(Mono.just(TRUE));

        // Compute Datasource - Actions hover map interaction
        Mono<Map<String, Collection<NewAction>>> datasourceActionsMapMono = actionFlux
                // We are only interested with external datasources for this interaction. Skip the rest.
                .filter(action -> action.getUnpublishedAction() != null
                        && action.getUnpublishedAction().getDatasource() != null
                        && action.getUnpublishedAction().getDatasource().getId() != null)
                .collectMultimap(
                        action -> action.getUnpublishedAction().getDatasource().getId(), Function.identity())
                .cache();

        Mono<Map<String, Set<String>>> pageIdToReadPagePermissionGroupsMono =
                pageFlux.collectMap(page -> page.getId(), page -> page.getPolicies().stream()
                        .filter(policy -> policy.getPermission().equals(READ_PAGES.getValue()))
                        .findFirst()
                        .map(policy -> policy.getPermissionGroups())
                        .get());

        //        Mono<Boolean> datasourceActionsAddedToHoverMapDto = Mono.zip(datasourceActionsMapMono,
        // pageIdToReadPagePermissionGroupsMono)
        //                .flatMapMany(tuple -> {
        //                    Map<String, Collection<NewAction>> datasourceActionsMap = tuple.getT1();
        //                    Map<String, Set<String>> pageIdToReadPagePermissionGroups = tuple.getT2();
        //
        //                    return datasourceFlux
        //                            .flatMap(datasource -> {
        //                                String datasourceId = datasource.getId();
        //                                Collection<NewAction> actions = datasourceActionsMap.get(datasourceId);
        //                                PermissionViewableName datasourcePermissionViewableName =
        // getPermissionViewableName(EXECUTE_DATASOURCES);
        //                                PermissionViewableName actionPermissionViewableName =
        // getPermissionViewableName(EXECUTE_ACTIONS);
        //                                if (!CollectionUtils.isEmpty(actions)) {
        //                                    String sourceIdPermissionDto = datasourceId + "_" +
        // datasourcePermissionViewableName;
        //                                    actions.stream()
        //                                            .forEach(action -> {
        //                                                if (action.getUnpublishedAction() == null ||
        // action.getUnpublishedAction().getPageId() == null) {
        //                                                    return;
        //                                                }
        //
        //                                                String pageId = action.getUnpublishedAction().getPageId();
        //                                                Set<String> readPagePermissionGroups =
        // pageIdToReadPagePermissionGroups.get(pageId);
        //                                                // All we care about is if the page has view permission on it,
        // we can show the action on hover
        //                                                // of execute on the datasource
        //                                                if (!readPagePermissionGroups.contains(permissionGroupId)) {
        //                                                    return;
        //                                                }
        //                                                // generate execute datasource -> execute action relationship
        // in the hovermap
        //                                                IdPermissionDTO actionPermissionDto = new
        // IdPermissionDTO(action.getId(), actionPermissionViewableName);
        //                                                hoverMap.merge(sourceIdPermissionDto,
        // Set.of(actionPermissionDto), Sets::union);
        //                                            });
        //                                }
        //                                return Mono.just(TRUE);
        //                            });
        //                })
        //                .then(Mono.just(TRUE));

        // Trim the hover map before returning
        Mono<Map<String, Set<IdPermissionDTO>>> trimmedHoverMapMono = Mono.just(hoverMap)
                .map(hoverMap1 -> {
                    hoverMap1.values().removeIf(Set::isEmpty);
                    return hoverMap1;
                });

        Mono<Boolean> workspaceEnvironmentsHoverMapMono = environmentResources.getWorkspaceEnvironmentsHoverMapMono(
                roleTab, workspaceEnvironmentMapMono, workspaceHierarchicalLateralMap, hoverMap, workspaceFlux);
        return workspaceDatasourcesHoverMapMono
                .then(workspaceEnvironmentsHoverMapMono)
                .then(trimmedHoverMapMono);
    }

    @Override
    public CommonAppsmithObjectData getDataFromRepositoryForAllTabs() {

        // Fetch all the required objects.
        List<String> includeFields = List.of(fieldName(QBaseDomain.baseDomain.policies));

        List<String> workspaceIncludeFields = new ArrayList<>(includeFields);
        workspaceIncludeFields.add(FieldName.NAME);

        Flux<Workspace> workspaceFlux = tenantService
                .getDefaultTenantId()
                .flatMapMany(tenantId ->
                        workspaceRepository.findAllByTenantIdWithoutPermission(tenantId, workspaceIncludeFields))
                .cache();

        Mono<Set<String>> workspaceIdsMono = workspaceFlux
                .mapNotNull(Workspace::getId)
                .collect(Collectors.toSet())
                .cache();

        Flux<Environment> environmentFlux = workspaceIdsMono
                .flatMapMany(Flux::fromIterable)
                .flatMap(environmentService::findByWorkspaceId)
                .cache();

        Flux<Workflow> workflowFlux = workspaceIdsMono
                .flatMapMany(Flux::fromIterable)
                .flatMap(workspaceId -> workflowRepository.findAllByWorkspaceId(workspaceId, Optional.empty()))
                .cache();

        Mono<Map<String, Collection<Environment>>> workspaceEnvironmentMapMono = environmentFlux
                .collectMultimap(Environment::getWorkspaceId, Function.identity())
                .cache();

        Flux<Application> applicationFlux = workspaceIdsMono
                .flatMapMany(applicationRepository::findDefaultApplicationsByWorkspaceIds)
                .map(responseUtils::updateApplicationWithDefaultResources)
                .cache();

        List<String> datasourceIncludeFields = new ArrayList<>(includeFields);
        datasourceIncludeFields.add(fieldName(QDatasource.datasource.name));
        datasourceIncludeFields.add(fieldName(QDatasource.datasource.pluginId));
        datasourceIncludeFields.add(fieldName(QDatasource.datasource.workspaceId));
        Flux<Datasource> datasourceFlux = workspaceIdsMono
                .flatMapMany(workspaceIds -> datasourceRepository.findAllByWorkspaceIdsWithoutPermission(
                        workspaceIds, datasourceIncludeFields))
                .cache();

        Mono<List<String>> applicationIdsMono =
                applicationFlux.mapNotNull(Application::getId).collectList();

        Flux<NewPage> pagesFlux = applicationIdsMono
                .flatMapMany(applicationIds -> {
                    List<String> pageIncludeFields = new ArrayList<>(includeFields);
                    pageIncludeFields.add(fieldName(QNewAction.newAction.applicationId));
                    pageIncludeFields.add(fieldName(QNewPage.newPage.unpublishedPage) + "."
                            + fieldName(QNewPage.newPage.unpublishedPage.name));
                    pageIncludeFields.add(fieldName(QNewPage.newPage.publishedPage) + "."
                            + fieldName(QNewPage.newPage.publishedPage.name));
                    return pageRepository.findAllByApplicationIdsWithoutPermission(applicationIds, pageIncludeFields);
                })
                .cache();

        Flux<NewAction> actionFlux = applicationIdsMono
                .flatMapMany(applicationIds -> {
                    List<String> actionIncludeFields = new ArrayList<>(includeFields);
                    actionIncludeFields.add(fieldName(QNewAction.newAction.pluginId));
                    actionIncludeFields.add(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.name));
                    actionIncludeFields.add(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.pageId));
                    actionIncludeFields.add(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.datasource) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.datasource.id));
                    actionIncludeFields.add(fieldName(QNewAction.newAction.publishedAction) + "."
                            + fieldName(QNewAction.newAction.publishedAction.name));
                    actionIncludeFields.add(fieldName(QNewAction.newAction.publishedAction) + "."
                            + fieldName(QNewAction.newAction.publishedAction.pageId));
                    return actionRepository.findAllUncomposedNonJSActionsByApplicationIds(
                            applicationIds, actionIncludeFields);
                })
                .cache();

        Flux<ActionCollection> actionCollectionFlux = applicationIdsMono
                .flatMapMany(applicationIds -> {
                    List<String> actionCollectionIncludeFields = new ArrayList<>(includeFields);
                    actionCollectionIncludeFields.add(
                            fieldName(QActionCollection.actionCollection.unpublishedCollection) + "."
                                    + fieldName(QActionCollection.actionCollection.unpublishedCollection.name));
                    actionCollectionIncludeFields.add(
                            fieldName(QActionCollection.actionCollection.unpublishedCollection) + "."
                                    + fieldName(QActionCollection.actionCollection.unpublishedCollection.pageId));
                    actionCollectionIncludeFields.add(fieldName(QActionCollection.actionCollection.publishedCollection)
                            + "." + fieldName(QActionCollection.actionCollection.publishedCollection.name));
                    actionCollectionIncludeFields.add(fieldName(QActionCollection.actionCollection.publishedCollection)
                            + "." + fieldName(QActionCollection.actionCollection.publishedCollection.pageId));

                    return actionCollectionRepository.findAllUncomposedByApplicationIds(
                            applicationIds, actionCollectionIncludeFields);
                })
                .cache();

        Flux<ModuleInstance> moduleInstanceFlux = applicationIdsMono
                .flatMapMany(applicationIds -> {
                    List<String> moduleInstanceIncludeFields = new ArrayList<>(includeFields);
                    moduleInstanceIncludeFields.add(
                            completeFieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.name));
                    moduleInstanceIncludeFields.add(
                            completeFieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.pageId));
                    moduleInstanceIncludeFields.add(
                            completeFieldName(QModuleInstance.moduleInstance.publishedModuleInstance.name));
                    moduleInstanceIncludeFields.add(
                            completeFieldName(QModuleInstance.moduleInstance.publishedModuleInstance.pageId));

                    return moduleInstanceRepository.findAllUncomposedByApplicationIds(
                            applicationIds, moduleInstanceIncludeFields);
                })
                .cache();

        // Creating maps for faster lookup during hierarchy creation
        Mono<Map<String, Collection<Application>>> workspaceApplicationsMapMono = applicationFlux
                .collectMultimap(Application::getWorkspaceId, Function.identity())
                .cache();

        Mono<Map<String, Collection<NewPage>>> applicationPagesMapMono = pagesFlux
                .collectMultimap(NewPage::getApplicationId, Function.identity())
                .cache();

        Mono<Map<String, Collection<NewAction>>> pageActionsMapMono = actionFlux
                .collectMultimap(action -> action.getUnpublishedAction().getPageId(), Function.identity())
                .cache();

        Mono<Map<String, Collection<ActionCollection>>> pageActionCollectionMapMono = actionCollectionFlux
                .collectMultimap(
                        actionCollection ->
                                actionCollection.getUnpublishedCollection().getPageId(),
                        Function.identity())
                .cache();

        Mono<Map<String, Collection<ModuleInstance>>> pageModuleInstanceMapMono = moduleInstanceFlux
                .collectMultimap(
                        moduleInstance ->
                                moduleInstance.getUnpublishedModuleInstance().getPageId(),
                        Function.identity())
                .cache();

        Mono<Map<String, Collection<Datasource>>> workspaceDatasourcesMapMono = datasourceFlux
                .collectMultimap(Datasource::getWorkspaceId, Function.identity())
                .cache();

        Mono<Map<String, Collection<Workflow>>> workspaceWorkflowMapMono = workflowFlux
                .collectMultimap(Workflow::getWorkspaceId, Function.identity())
                .cache();

        Mono<Map<String, Collection<NewAction>>> workflowActionMapMono = workflowFlux
                .collectList()
                .flatMap(workflows -> {
                    List<String> workflowActionsIncludeFields = new ArrayList<>(includeFields);
                    workflowActionsIncludeFields.add(fieldName(QNewAction.newAction.workflowId));
                    workflowActionsIncludeFields.add(fieldName(QNewAction.newAction.publishedAction));
                    workflowActionsIncludeFields.add(fieldName(QNewAction.newAction.unpublishedAction));
                    workflowActionsIncludeFields.add(fieldName(QNewAction.newAction.pluginId));
                    List<String> workflowIds =
                            workflows.stream().map(Workflow::getId).toList();
                    return actionRepository
                            .findByWorkflowIds(
                                    workflowIds, Optional.empty(), Optional.of(workflowActionsIncludeFields), FALSE)
                            .collectMultimap(NewAction::getWorkflowId, Function.identity());
                })
                .cache();

        Mono<Map<String, Collection<ActionCollection>>> workflowActionCollectionMapMono = workflowFlux
                .collectList()
                .flatMap(workflows -> {
                    List<String> workflowActionsIncludeFields = new ArrayList<>(includeFields);
                    workflowActionsIncludeFields.add(fieldName(QActionCollection.actionCollection.workflowId));
                    workflowActionsIncludeFields.add(fieldName(QActionCollection.actionCollection.publishedCollection));
                    workflowActionsIncludeFields.add(
                            fieldName(QActionCollection.actionCollection.unpublishedCollection));
                    List<String> workflowIds =
                            workflows.stream().map(Workflow::getId).toList();
                    return actionCollectionRepository
                            .findByWorkflowIds(workflowIds, Optional.empty(), Optional.of(workflowActionsIncludeFields))
                            .collectMultimap(ActionCollection::getWorkflowId, Function.identity());
                })
                .cache();

        CommonAppsmithObjectData commonAppsmithObjectData = new CommonAppsmithObjectData(
                workspaceFlux,
                applicationFlux,
                pagesFlux,
                actionFlux,
                actionCollectionFlux,
                moduleInstanceFlux,
                datasourceFlux,
                environmentFlux,
                workflowFlux,
                workspaceApplicationsMapMono,
                applicationPagesMapMono,
                pageActionsMapMono,
                pageActionCollectionMapMono,
                pageModuleInstanceMapMono,
                workspaceDatasourcesMapMono,
                workspaceEnvironmentMapMono,
                workspaceWorkflowMapMono,
                workflowActionMapMono,
                workflowActionCollectionMapMono);

        return commonAppsmithObjectData;
    }

    private Flux<BaseView> getFilteredApplicationDTOMonoForDatasourceTab(Flux<BaseView> applicationDTOFlux) {
        return applicationDTOFlux
                .map(applicationDTOEntity -> {
                    Set<EntityView> children = applicationDTOEntity.getChildren();
                    for (EntityView child : children) {
                        List<? extends BaseView> childEntities = child.getEntities();
                        List<? extends BaseView> newChildEntities = childEntities.stream()
                                .filter(childEntity ->
                                        !childEntity.getChildren().isEmpty())
                                .collect(Collectors.toList());
                        child.setEntities(newChildEntities);
                    }
                    Set<EntityView> newChildren = children.stream()
                            .filter(child -> !child.getEntities().isEmpty())
                            .collect(Collectors.toSet());
                    applicationDTOEntity.setChildren(newChildren);
                    return applicationDTOEntity;
                })
                .filter(applicationDTOEntity ->
                        !applicationDTOEntity.getChildren().isEmpty());
    }
}
