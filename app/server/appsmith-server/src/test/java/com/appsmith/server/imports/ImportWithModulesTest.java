package com.appsmith.server.imports;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.ModuleInput;
import com.appsmith.external.models.ModuleInputForm;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ModuleActionCollectionDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.internal.ImportApplicationService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.PackageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.external.models.ModuleType.JS_MODULE;
import static com.appsmith.external.models.ModuleType.QUERY_MODULE;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
class ImportWithModulesTest {

    @Autowired
    private ImportApplicationService importApplicationService;

    @SpyBean
    private FeatureFlagService featureFlagService;

    @SpyBean
    private CommonConfig commonConfig;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ActionCollectionService actionCollectionService;

    @Autowired
    private ModuleInstanceRepository moduleInstanceRepository;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private PermissionGroupRepository permissionGroupRepository;

    @Autowired
    private CrudPackageService crudPackageService;

    @Autowired
    private PackageRepository packageRepository;

    @Autowired
    private CrudModuleService crudModuleService;

    @SpyBean
    private PluginService pluginService;

    @Autowired
    private LayoutActionService layoutActionService;

    @Autowired
    private PublishPackageService publishPackageService;

    @Autowired
    ObjectMapper objectMapper;

    private Datasource datasource;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_audit_logs_enabled))
                .thenReturn(Mono.just(TRUE));

        doReturn(FALSE).when(commonConfig).isCloudHosting();

        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_query_module_enabled))
                .thenReturn(Mono.just(TRUE));

        mockPluginServiceFormData();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testImportApplicationWithModuleInstances_beforeModuleExists_createsOrphanInstancesAndPublicActions()
            throws URISyntaxException {

        FilePart filePart = createFilePart("moduleinstances/application-with-q-and-js-module-instances.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Workspace without module definition");

        Mono<Workspace> workspaceMono = workspaceService.create(newWorkspace).cache();

        final Mono<ApplicationImportDTO> resultMono = workspaceMono.flatMap(
                workspace -> importApplicationService.extractFileAndSaveApplication(workspace.getId(), filePart));

        List<PermissionGroup> permissionGroups = workspaceMono
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.VIEWER))
                .findFirst()
                .get();

        Policy manageAppPolicy = Policy.builder()
                .permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder()
                .permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        ApplicationImportDTO applicationImportDTO = resultMono.block();
        Application application = applicationImportDTO.getApplication();

        StepVerifier.create(Mono.zip(
                        datasourceService
                                .getAllByWorkspaceIdWithStorages(
                                        application.getWorkspaceId(), Optional.of(MANAGE_DATASOURCES))
                                .collectList(),
                        newActionService
                                .findAllByApplicationIdAndViewMode(
                                        application.getId(), false, Optional.of(READ_ACTIONS), Optional.empty())
                                .collectList(),
                        newPageService
                                .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                .collectList(),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null)
                                .collectList(),
                        moduleInstanceRepository
                                .findByApplicationId(application.getId())
                                .collectList()))
                .assertNext(tuple -> {
                    final List<Datasource> unConfiguredDatasourceList =
                            applicationImportDTO.getUnConfiguredDatasourceList();
                    final boolean isPartialImport = applicationImportDTO.getIsPartialImport();
                    final List<Datasource> datasourceList = tuple.getT1();
                    final List<NewAction> actionList = tuple.getT2();
                    final List<PageDTO> pageList = tuple.getT3();
                    final List<ActionCollection> actionCollectionList = tuple.getT4();
                    List<ModuleInstance> moduleInstanceList = tuple.getT5();

                    assertThat(application.getName()).isEqualTo("test-app-with-module-instances");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(1);
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getPublishedPages()).hasSize(1);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEditModeThemeId()).isNotNull();
                    assertThat(application.getPublishedModeThemeId()).isNotNull();

                    // No datasources will be expected to be imported since the app only hase module related actions
                    assertThat(isPartialImport).isFalse();
                    assertThat(unConfiguredDatasourceList).isNull();

                    assertThat(datasourceList).isEmpty();

                    assertThat(moduleInstanceList).hasSize(2);

                    Optional<ModuleInstance> jsModuleOptional = moduleInstanceList.stream()
                            .filter(moduleInstance -> "JSModule1_1"
                                    .equals(moduleInstance
                                            .getUnpublishedModuleInstance()
                                            .getName()))
                            .findFirst();
                    assertThat(jsModuleOptional).isPresent();
                    ModuleInstance jsModuleInstance = jsModuleOptional.get();
                    assertThat(jsModuleInstance.getModuleUUID()).isEqualTo("jsmUUID");
                    assertThat(jsModuleInstance.getOriginModuleId()).isNull();
                    assertThat(jsModuleInstance.getSourceModuleId()).isNull();
                    assertThat(jsModuleInstance.getType()).isEqualTo(JS_MODULE);
                    assertThat(jsModuleInstance.getGitSyncId()).isEqualTo("jsmi_git_1");
                    ModuleInstanceDTO jsInstanceDTO = jsModuleInstance.getUnpublishedModuleInstance();
                    assertThat(jsInstanceDTO).isNotNull();
                    assertThat(jsInstanceDTO.getPageId())
                            .isEqualTo(pageList.get(0).getId());
                    assertThat(jsInstanceDTO.getIsValid()).isFalse();
                    assertThat(jsInstanceDTO.getInvalids())
                            .containsOnly(
                                    "Module instance does not have a valid module reference in the workspace. Please import module JSModule1 from package \"Untitled Package 1\" v0.0.1 to fix this issue.");

                    Optional<ModuleInstance> queryModuleOptional = moduleInstanceList.stream()
                            .filter(moduleInstance -> "QueryModule1_1"
                                    .equals(moduleInstance
                                            .getUnpublishedModuleInstance()
                                            .getName()))
                            .findFirst();
                    assertThat(queryModuleOptional).isPresent();
                    ModuleInstance queryModuleInstance = queryModuleOptional.get();
                    assertThat(queryModuleInstance.getModuleUUID()).isEqualTo("qmUUID");
                    assertThat(queryModuleInstance.getOriginModuleId()).isNull();
                    assertThat(queryModuleInstance.getSourceModuleId()).isNull();
                    assertThat(queryModuleInstance.getType()).isEqualTo(QUERY_MODULE);
                    assertThat(queryModuleInstance.getGitSyncId()).isEqualTo("qmi_git_1");
                    ModuleInstanceDTO queryInstanceDTO = queryModuleInstance.getUnpublishedModuleInstance();
                    assertThat(queryInstanceDTO).isNotNull();
                    assertThat(queryInstanceDTO.getPageId())
                            .isEqualTo(pageList.get(0).getId());
                    assertThat(queryInstanceDTO.getIsValid()).isFalse();
                    assertThat(queryInstanceDTO.getInputs()).hasSize(1);
                    assertThat(queryInstanceDTO.getInputs()).containsEntry("gender", "{{Select1.selectedOptionValue}}");
                    assertThat(queryInstanceDTO.getJsonPathKeys()).containsOnly("Select1.selectedOptionValue");
                    assertThat(queryInstanceDTO.getInvalids())
                            .containsOnly(
                                    "Module instance does not have a valid module reference in the workspace. Please import module QueryModule1 from package \"Untitled Package 1\" v0.0.1 to fix this issue.");

                    List<String> collectionIdInAction = new ArrayList<>();
                    assertThat(actionList).hasSize(3);

                    Optional<NewAction> queryActionOptional = actionList.stream()
                            .filter(newAction -> "_$QueryModule1_1$_QueryModule1"
                                    .equals(newAction.getUnpublishedAction().getName()))
                            .findFirst();
                    assertThat(queryActionOptional).isPresent();
                    NewAction queryAction = queryActionOptional.get();
                    assertThat(queryAction.getRootModuleInstanceId()).isEqualTo(queryModuleInstance.getId());
                    assertThat(queryAction.getModuleInstanceId()).isEqualTo(queryModuleInstance.getId());
                    assertThat(queryAction.getOriginActionId()).isNull();
                    assertThat(queryAction.getIsPublic()).isTrue();
                    assertThat(queryAction.getGitSyncId()).isEqualTo("qmi_q_git_1");
                    ActionDTO unpublishedQuery = queryAction.getUnpublishedAction();
                    assertThat(unpublishedQuery.getActionConfiguration()).isNull();

                    Optional<NewAction> jsFunc1ActionOptional = actionList.stream()
                            .filter(newAction -> "_$JSModule1_1$_JSModule1.myFun1"
                                    .equals(newAction.getUnpublishedAction().getFullyQualifiedName()))
                            .findFirst();
                    assertThat(jsFunc1ActionOptional).isPresent();
                    NewAction jsFunc1Action = jsFunc1ActionOptional.get();
                    assertThat(jsFunc1Action.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc1Action.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc1Action.getOriginActionId()).isNull();
                    assertThat(jsFunc1Action.getIsPublic()).isTrue();
                    assertThat(jsFunc1Action.getGitSyncId()).isEqualTo("jsmi_f1_git_1");
                    ActionDTO unpublishedJsFunc1 = jsFunc1Action.getUnpublishedAction();
                    assertThat(unpublishedJsFunc1.getActionConfiguration()).isNull();
                    assertThat(unpublishedJsFunc1.getJsonPathKeys()).isEmpty();
                    assertThat(unpublishedJsFunc1.getDefaultResources().getCollectionId())
                            .isEqualTo(unpublishedJsFunc1.getCollectionId());

                    collectionIdInAction.add(unpublishedJsFunc1.getCollectionId());

                    Optional<NewAction> jsFunc2ActionOptional = actionList.stream()
                            .filter(newAction -> "_$JSModule1_1$_JSModule1.myFun2"
                                    .equals(newAction.getUnpublishedAction().getFullyQualifiedName()))
                            .findFirst();
                    assertThat(jsFunc2ActionOptional).isPresent();
                    NewAction jsFunc2Action = jsFunc2ActionOptional.get();
                    assertThat(jsFunc2Action.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc2Action.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc2Action.getOriginActionId()).isNull();
                    assertThat(jsFunc2Action.getIsPublic()).isTrue();
                    assertThat(jsFunc2Action.getGitSyncId()).isEqualTo("jsmi_f2_git_1");
                    ActionDTO unpublishedJsFunc2 = jsFunc2Action.getUnpublishedAction();
                    assertThat(unpublishedJsFunc2.getActionConfiguration()).isNull();
                    assertThat(unpublishedJsFunc2.getJsonPathKeys()).isEmpty();
                    assertThat(unpublishedJsFunc2.getDefaultResources().getCollectionId())
                            .isEqualTo(unpublishedJsFunc2.getCollectionId());

                    collectionIdInAction.add(unpublishedJsFunc2.getCollectionId());

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getUnpublishedCollection().getPageId())
                                .isNotEqualTo(pageList.get(0).getName());

                        assertThat(actionCollection.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                        assertThat(actionCollection.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                        assertThat(actionCollection.getOriginActionCollectionId())
                                .isNull();

                        assertThat(actionCollection.getUnpublishedCollection().getBody())
                                .isNull();

                        assertThat(actionCollection.getUnpublishedCollection().getDefaultToBranchedActionIdsMap())
                                .hasSize(2);

                        assertThat(collectionIdInAction).containsOnly(actionCollection.getId());

                        assertThat(actionCollection.getGitSyncId()).isEqualTo("jsmi_ac_git_1");
                    });

                    assertThat(pageList).hasSize(1);

                    ApplicationPage defaultAppPage = application.getPages().stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId()))
                            .findFirst()
                            .orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                    assertThat(defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions())
                            .isNotEmpty();
                    List<Set<String>> onLoadMatrix =
                            defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions().stream()
                                    .map(layer -> layer.stream()
                                            .map(DslExecutableDTO::getName)
                                            .collect(Collectors.toSet()))
                                    .collect(Collectors.toList());
                    List<Set<String>> expectedOnloadMatrix =
                            List.of(Set.of("_$QueryModule1_1$_QueryModule1", "_$JSModule1_1$_JSModule1.myFun2"));
                    assertThat(onLoadMatrix).usingRecursiveComparison().isEqualTo(expectedOnloadMatrix);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void
            testImportApplicationWithModuleInstances_beforeModuleExistsAndThenPublishingModule_connectsImportedInstancesToPublishedModules()
                    throws URISyntaxException {
        FilePart filePart = createFilePart("moduleinstances/application-with-q-and-js-module-instances.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Workspace with module published after app import");

        Workspace workspace = workspaceService.create(newWorkspace).block();

        // First import the app
        ApplicationImportDTO applicationImportDTO = importApplicationService
                .extractFileAndSaveApplication(workspace.getId(), filePart)
                .block();

        // Then create the module
        PackageDTO packageDTO = createQueryAndJSModules(workspace);

        // Make sure to update the package and module UUID to the one in the imported app JSON
        crudModuleService
                .getAllModules(packageDTO.getId())
                .map(module -> {
                    module.setPackageUUID("pUUID");
                    if (QUERY_MODULE.equals(module.getType())) {
                        module.setModuleUUID("qmUUID");
                    } else {
                        module.setModuleUUID("jsmUUID");
                    }

                    return module;
                })
                .collectList()
                .flatMapMany(modules -> crudModuleService.saveModuleInBulk(modules))
                .collectList()
                .block();

        packageRepository
                .findById(packageDTO.getId())
                .flatMap(aPackage -> {
                    aPackage.setPackageUUID("pUUID");
                    return packageRepository.save(aPackage);
                })
                .block();

        // Now publish the package, this should trigger auto-upgrade
        publishPackageService.publishPackage(packageDTO.getId()).block();

        // Fetch all application resources and check validity
        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.VIEWER))
                .findFirst()
                .get();

        Policy manageAppPolicy = Policy.builder()
                .permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder()
                .permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        Application application = applicationImportDTO.getApplication();

        StepVerifier.create(Mono.zip(
                        datasourceService
                                .getAllByWorkspaceIdWithStorages(
                                        application.getWorkspaceId(), Optional.of(MANAGE_DATASOURCES))
                                .collectList(),
                        newActionService
                                .findAllByApplicationIdAndViewMode(
                                        application.getId(), false, Optional.of(READ_ACTIONS), Optional.empty())
                                .collectList(),
                        newPageService
                                .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                .collectList(),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null)
                                .collectList(),
                        moduleInstanceRepository
                                .findByApplicationId(application.getId())
                                .collectList()))
                .assertNext(tuple -> {
                    final List<Datasource> unConfiguredDatasourceList =
                            applicationImportDTO.getUnConfiguredDatasourceList();
                    final boolean isPartialImport = applicationImportDTO.getIsPartialImport();
                    final List<Datasource> datasourceList = tuple.getT1();
                    final List<NewAction> actionList = tuple.getT2();
                    final List<PageDTO> pageList = tuple.getT3();
                    final List<ActionCollection> actionCollectionList = tuple.getT4();
                    List<ModuleInstance> moduleInstanceList = tuple.getT5();

                    assertThat(application.getName()).isEqualTo("test-app-with-module-instances");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(1);
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getPublishedPages()).hasSize(1);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEditModeThemeId()).isNotNull();
                    assertThat(application.getPublishedModeThemeId()).isNotNull();

                    // No datasources will be expected to be imported since the app only has module related actions
                    assertThat(isPartialImport).isFalse();
                    assertThat(unConfiguredDatasourceList).isNull();

                    assertThat(datasourceList).isEmpty();

                    assertThat(moduleInstanceList).hasSize(2);

                    Optional<ModuleInstance> jsModuleOptional = moduleInstanceList.stream()
                            .filter(moduleInstance -> "JSModule1_1"
                                    .equals(moduleInstance
                                            .getUnpublishedModuleInstance()
                                            .getName()))
                            .findFirst();
                    assertThat(jsModuleOptional).isPresent();
                    ModuleInstance jsModuleInstance = jsModuleOptional.get();
                    assertThat(jsModuleInstance.getModuleUUID()).isEqualTo("jsmUUID");
                    assertThat(jsModuleInstance.getOriginModuleId()).isNotNull();
                    assertThat(jsModuleInstance.getSourceModuleId()).isNotNull();
                    assertThat(jsModuleInstance.getType()).isEqualTo(JS_MODULE);
                    assertThat(jsModuleInstance.getGitSyncId()).isEqualTo("jsmi_git_1");
                    ModuleInstanceDTO jsInstanceDTO = jsModuleInstance.getUnpublishedModuleInstance();
                    assertThat(jsInstanceDTO).isNotNull();
                    assertThat(jsInstanceDTO.getPageId())
                            .isEqualTo(pageList.get(0).getId());
                    assertThat(jsInstanceDTO.getIsValid()).isTrue();
                    assertThat(jsInstanceDTO.getInvalids()).isEmpty();

                    Optional<ModuleInstance> queryModuleOptional = moduleInstanceList.stream()
                            .filter(moduleInstance -> "QueryModule1_1"
                                    .equals(moduleInstance
                                            .getUnpublishedModuleInstance()
                                            .getName()))
                            .findFirst();
                    assertThat(queryModuleOptional).isPresent();
                    ModuleInstance queryModuleInstance = queryModuleOptional.get();
                    assertThat(queryModuleInstance.getModuleUUID()).isEqualTo("qmUUID");
                    assertThat(queryModuleInstance.getOriginModuleId()).isNotNull();
                    assertThat(queryModuleInstance.getSourceModuleId()).isNotNull();
                    assertThat(queryModuleInstance.getType()).isEqualTo(QUERY_MODULE);
                    assertThat(queryModuleInstance.getGitSyncId()).isEqualTo("qmi_git_1");
                    ModuleInstanceDTO queryInstanceDTO = queryModuleInstance.getUnpublishedModuleInstance();
                    assertThat(queryInstanceDTO).isNotNull();
                    assertThat(queryInstanceDTO.getPageId())
                            .isEqualTo(pageList.get(0).getId());
                    assertThat(queryInstanceDTO.getIsValid()).isTrue();
                    assertThat(queryInstanceDTO.getInvalids()).isEmpty();
                    assertThat(queryInstanceDTO.getInputs()).hasSize(1);
                    assertThat(queryInstanceDTO.getInputs()).containsEntry("gender", "{{Select1.selectedOptionValue}}");
                    assertThat(queryInstanceDTO.getJsonPathKeys()).containsOnly("Select1.selectedOptionValue");

                    List<String> collectionIdInAction = new ArrayList<>();
                    assertThat(actionList).hasSize(4);

                    Optional<NewAction> queryActionOptional = actionList.stream()
                            .filter(newAction -> "_$QueryModule1_1$_QueryModule1"
                                    .equals(newAction.getUnpublishedAction().getName()))
                            .findFirst();
                    assertThat(queryActionOptional).isPresent();
                    NewAction queryAction = queryActionOptional.get();
                    assertThat(queryAction.getRootModuleInstanceId()).isEqualTo(queryModuleInstance.getId());
                    assertThat(queryAction.getModuleInstanceId()).isEqualTo(queryModuleInstance.getId());
                    assertThat(queryAction.getOriginActionId()).isNotNull();
                    assertThat(queryAction.getIsPublic()).isTrue();
                    assertThat(queryAction.getGitSyncId()).isEqualTo("qmi_q_git_1");
                    ActionDTO unpublishedQuery = queryAction.getUnpublishedAction();
                    assertThat(unpublishedQuery.getActionConfiguration()).isNotNull();
                    assertThat(unpublishedQuery.getActionConfiguration().getBody())
                            .isEqualTo("Select * from users where gender = {{QueryModule1_1.inputs.genderInput}}");
                    assertThat(unpublishedQuery.getJsonPathKeys()).containsOnly("QueryModule1_1.inputs.genderInput");
                    assertThat(unpublishedQuery.getDynamicBindingPathList()).containsOnly(new Property("body", null));
                    assertThat(unpublishedQuery.getExecuteOnLoad()).isTrue();

                    Optional<NewAction> jsFunc1ActionOptional = actionList.stream()
                            .filter(newAction -> "_$JSModule1_1$_JSModule1.myFun1"
                                    .equals(newAction.getUnpublishedAction().getFullyQualifiedName()))
                            .findFirst();
                    assertThat(jsFunc1ActionOptional).isPresent();
                    NewAction jsFunc1Action = jsFunc1ActionOptional.get();
                    assertThat(jsFunc1Action.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc1Action.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc1Action.getOriginActionId()).isNotNull();
                    assertThat(jsFunc1Action.getIsPublic()).isTrue();
                    assertThat(jsFunc1Action.getGitSyncId()).isEqualTo("jsmi_f1_git_1");
                    ActionDTO unpublishedJsFunc1 = jsFunc1Action.getUnpublishedAction();
                    assertThat(unpublishedJsFunc1.getActionConfiguration()).isNotNull();
                    assertThat(unpublishedJsFunc1.getActionConfiguration().getBody())
                            .isEqualTo("function () { return \"foo\" }");
                    assertThat(unpublishedJsFunc1.getJsonPathKeys()).containsOnly("function () { return \"foo\" }");
                    assertThat(unpublishedJsFunc1.getDynamicBindingPathList()).containsOnly(new Property("body", null));
                    assertThat(unpublishedJsFunc1.getDefaultResources().getCollectionId())
                            .isEqualTo(unpublishedJsFunc1.getCollectionId());
                    assertThat(unpublishedJsFunc1.getExecuteOnLoad()).isFalse();

                    collectionIdInAction.add(unpublishedJsFunc1.getCollectionId());

                    Optional<NewAction> jsFunc2ActionOptional = actionList.stream()
                            .filter(newAction -> "_$JSModule1_1$_JSModule1.myFun2"
                                    .equals(newAction.getUnpublishedAction().getFullyQualifiedName()))
                            .findFirst();
                    assertThat(jsFunc2ActionOptional).isPresent();
                    NewAction jsFunc2Action = jsFunc2ActionOptional.get();
                    assertThat(jsFunc2Action.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc2Action.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc2Action.getOriginActionId()).isNotNull();
                    assertThat(jsFunc2Action.getIsPublic()).isTrue();
                    assertThat(jsFunc2Action.getGitSyncId()).isEqualTo("jsmi_f2_git_1");
                    ActionDTO unpublishedJsFunc2 = jsFunc2Action.getUnpublishedAction();
                    assertThat(unpublishedJsFunc2.getActionConfiguration()).isNotNull();
                    assertThat(unpublishedJsFunc2.getActionConfiguration().getBody())
                            .isEqualTo("function () { return _$JSModule1_1$_Query1.data }");
                    assertThat(unpublishedJsFunc2.getJsonPathKeys())
                            .containsOnly("function () { return _$JSModule1_1$_Query1.data }");
                    assertThat(unpublishedJsFunc2.getDynamicBindingPathList()).containsOnly(new Property("body", null));
                    assertThat(unpublishedJsFunc2.getDefaultResources().getCollectionId())
                            .isEqualTo(unpublishedJsFunc2.getCollectionId());
                    assertThat(unpublishedJsFunc2.getExecuteOnLoad()).isTrue();

                    collectionIdInAction.add(unpublishedJsFunc2.getCollectionId());

                    Optional<NewAction> privateQueryActionOptional = actionList.stream()
                            .filter(newAction -> "_$JSModule1_1$_Query1"
                                    .equals(newAction.getUnpublishedAction().getName()))
                            .findFirst();
                    assertThat(privateQueryActionOptional).isPresent();
                    NewAction privateQueryAction = privateQueryActionOptional.get();
                    assertThat(privateQueryAction.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(privateQueryAction.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(privateQueryAction.getOriginActionId()).isNotNull();
                    assertThat(privateQueryAction.getIsPublic()).isFalse();
                    ActionDTO unpublishedPrivateQuery = privateQueryAction.getUnpublishedAction();
                    assertThat(unpublishedPrivateQuery.getActionConfiguration()).isNotNull();
                    assertThat(unpublishedPrivateQuery.getActionConfiguration().getBody())
                            .isEqualTo("select * from users");
                    assertThat(unpublishedPrivateQuery.getJsonPathKeys()).isEmpty();
                    assertThat(unpublishedPrivateQuery.getDynamicBindingPathList())
                            .isNull();
                    assertThat(unpublishedPrivateQuery.getExecuteOnLoad()).isTrue();

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getUnpublishedCollection().getPageId())
                                .isNotEqualTo(pageList.get(0).getName());

                        assertThat(actionCollection.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                        assertThat(actionCollection.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                        assertThat(actionCollection.getOriginActionCollectionId())
                                .isNotNull();

                        assertThat(actionCollection.getUnpublishedCollection().getName())
                                .isEqualTo("_$JSModule1_1$_JSModule1");
                        assertThat(actionCollection.getUnpublishedCollection().getBody())
                                .isEqualTo(
                                        "export default { myFun1() { return \"foo\" }, myFun2() { return _$JSModule1_1$_Query1.data } }");

                        assertThat(actionCollection.getUnpublishedCollection().getDefaultToBranchedActionIdsMap())
                                .hasSize(2);

                        assertThat(collectionIdInAction).containsOnly(actionCollection.getId());

                        assertThat(actionCollection.getGitSyncId()).isEqualTo("jsmi_ac_git_1");
                    });

                    assertThat(pageList).hasSize(1);

                    ApplicationPage defaultAppPage = application.getPages().stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId()))
                            .findFirst()
                            .orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                    assertThat(defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions())
                            .isNotEmpty();

                    List<Set<String>> onLoadMatrix =
                            defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions().stream()
                                    .map(layer -> layer.stream()
                                            .map(DslExecutableDTO::getName)
                                            .collect(Collectors.toSet()))
                                    .collect(Collectors.toList());
                    List<Set<String>> expectedOnloadMatrix = List.of(
                            Set.of("_$JSModule1_1$_Query1", "_$QueryModule1_1$_QueryModule1"),
                            Set.of("_$JSModule1_1$_JSModule1.myFun2"));
                    assertThat(onLoadMatrix).usingRecursiveComparison().isEqualTo(expectedOnloadMatrix);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testImportApplicationWithModuleInstances_afterModuleExists_createsInstancesWithReferenceToExistingModules()
            throws URISyntaxException {
        FilePart filePart = createFilePart("moduleinstances/application-with-q-and-js-module-instances.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Workspace with module published before app import");

        Workspace workspace = workspaceService.create(newWorkspace).block();

        // First create the module
        PackageDTO packageDTO = createQueryAndJSModules(workspace);

        // Make sure to update the package and module UUID to the one in the imported app JSON
        crudModuleService
                .getAllModules(packageDTO.getId())
                .map(module -> {
                    module.setPackageUUID("pUUID");
                    if (QUERY_MODULE.equals(module.getType())) {
                        module.setModuleUUID("qmUUID");
                    } else {
                        module.setModuleUUID("jsmUUID");
                    }

                    return module;
                })
                .collectList()
                .flatMapMany(modules -> crudModuleService.saveModuleInBulk(modules))
                .collectList()
                .block();

        packageRepository
                .findById(packageDTO.getId())
                .flatMap(aPackage -> {
                    aPackage.setPackageUUID("pUUID");
                    return packageRepository.save(aPackage);
                })
                .block();

        // Now publish the package
        publishPackageService.publishPackage(packageDTO.getId()).block();

        // Then import the app
        ApplicationImportDTO applicationImportDTO = importApplicationService
                .extractFileAndSaveApplication(workspace.getId(), filePart)
                .block();

        // Fetch all application resources and check validity
        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.VIEWER))
                .findFirst()
                .get();

        Policy manageAppPolicy = Policy.builder()
                .permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder()
                .permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        Application application = applicationImportDTO.getApplication();

        StepVerifier.create(Mono.zip(
                        datasourceService
                                .getAllByWorkspaceIdWithStorages(
                                        application.getWorkspaceId(), Optional.of(MANAGE_DATASOURCES))
                                .collectList(),
                        newActionService
                                .findAllByApplicationIdAndViewMode(
                                        application.getId(), false, Optional.of(READ_ACTIONS), Optional.empty())
                                .collectList(),
                        newPageService
                                .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                .collectList(),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null)
                                .collectList(),
                        moduleInstanceRepository
                                .findByApplicationId(application.getId())
                                .collectList()))
                .assertNext(tuple -> {
                    final List<Datasource> unConfiguredDatasourceList =
                            applicationImportDTO.getUnConfiguredDatasourceList();
                    final boolean isPartialImport = applicationImportDTO.getIsPartialImport();
                    final List<Datasource> datasourceList = tuple.getT1();
                    final List<NewAction> actionList = tuple.getT2();
                    final List<PageDTO> pageList = tuple.getT3();
                    final List<ActionCollection> actionCollectionList = tuple.getT4();
                    List<ModuleInstance> moduleInstanceList = tuple.getT5();

                    assertThat(application.getName()).isEqualTo("test-app-with-module-instances");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(1);
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getPublishedPages()).hasSize(1);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEditModeThemeId()).isNotNull();
                    assertThat(application.getPublishedModeThemeId()).isNotNull();

                    // No datasources will be expected to be imported since the app only has module related actions
                    assertThat(isPartialImport).isFalse();
                    assertThat(unConfiguredDatasourceList).isNull();

                    assertThat(datasourceList).isEmpty();

                    assertThat(moduleInstanceList).hasSize(2);

                    Optional<ModuleInstance> jsModuleOptional = moduleInstanceList.stream()
                            .filter(moduleInstance -> "JSModule1_1"
                                    .equals(moduleInstance
                                            .getUnpublishedModuleInstance()
                                            .getName()))
                            .findFirst();
                    assertThat(jsModuleOptional).isPresent();
                    ModuleInstance jsModuleInstance = jsModuleOptional.get();
                    assertThat(jsModuleInstance.getModuleUUID()).isEqualTo("jsmUUID");
                    assertThat(jsModuleInstance.getOriginModuleId()).isNotNull();
                    assertThat(jsModuleInstance.getSourceModuleId()).isNotNull();
                    assertThat(jsModuleInstance.getType()).isEqualTo(JS_MODULE);
                    assertThat(jsModuleInstance.getGitSyncId()).isEqualTo("jsmi_git_1");
                    ModuleInstanceDTO jsInstanceDTO = jsModuleInstance.getUnpublishedModuleInstance();
                    assertThat(jsInstanceDTO).isNotNull();
                    assertThat(jsInstanceDTO.getPageId())
                            .isEqualTo(pageList.get(0).getId());
                    assertThat(jsInstanceDTO.getIsValid()).isTrue();
                    assertThat(jsInstanceDTO.getInvalids()).isEmpty();

                    Optional<ModuleInstance> queryModuleOptional = moduleInstanceList.stream()
                            .filter(moduleInstance -> "QueryModule1_1"
                                    .equals(moduleInstance
                                            .getUnpublishedModuleInstance()
                                            .getName()))
                            .findFirst();
                    assertThat(queryModuleOptional).isPresent();
                    ModuleInstance queryModuleInstance = queryModuleOptional.get();
                    assertThat(queryModuleInstance.getModuleUUID()).isEqualTo("qmUUID");
                    assertThat(queryModuleInstance.getOriginModuleId()).isNotNull();
                    assertThat(queryModuleInstance.getSourceModuleId()).isNotNull();
                    assertThat(queryModuleInstance.getType()).isEqualTo(QUERY_MODULE);
                    assertThat(queryModuleInstance.getGitSyncId()).isEqualTo("qmi_git_1");
                    ModuleInstanceDTO queryInstanceDTO = queryModuleInstance.getUnpublishedModuleInstance();
                    assertThat(queryInstanceDTO).isNotNull();
                    assertThat(queryInstanceDTO.getPageId())
                            .isEqualTo(pageList.get(0).getId());
                    assertThat(queryInstanceDTO.getIsValid()).isTrue();
                    assertThat(queryInstanceDTO.getInvalids()).isEmpty();
                    assertThat(queryInstanceDTO.getInputs()).hasSize(1);
                    assertThat(queryInstanceDTO.getInputs()).containsEntry("gender", "{{Select1.selectedOptionValue}}");
                    assertThat(queryInstanceDTO.getJsonPathKeys()).containsOnly("Select1.selectedOptionValue");

                    List<String> collectionIdInAction = new ArrayList<>();
                    assertThat(actionList).hasSize(4);

                    Optional<NewAction> queryActionOptional = actionList.stream()
                            .filter(newAction -> "_$QueryModule1_1$_QueryModule1"
                                    .equals(newAction.getUnpublishedAction().getName()))
                            .findFirst();
                    assertThat(queryActionOptional).isPresent();
                    NewAction queryAction = queryActionOptional.get();
                    assertThat(queryAction.getRootModuleInstanceId()).isEqualTo(queryModuleInstance.getId());
                    assertThat(queryAction.getModuleInstanceId()).isEqualTo(queryModuleInstance.getId());
                    assertThat(queryAction.getOriginActionId()).isNotNull();
                    assertThat(queryAction.getIsPublic()).isTrue();
                    assertThat(queryAction.getGitSyncId()).isEqualTo("qmi_q_git_1");
                    ActionDTO unpublishedQuery = queryAction.getUnpublishedAction();
                    assertThat(unpublishedQuery.getActionConfiguration()).isNotNull();
                    assertThat(unpublishedQuery.getActionConfiguration().getBody())
                            .isEqualTo("Select * from users where gender = {{QueryModule1_1.inputs.genderInput}}");
                    assertThat(unpublishedQuery.getJsonPathKeys()).containsOnly("QueryModule1_1.inputs.genderInput");
                    assertThat(unpublishedQuery.getDynamicBindingPathList()).containsOnly(new Property("body", null));
                    assertThat(unpublishedQuery.getExecuteOnLoad()).isTrue();

                    Optional<NewAction> jsFunc1ActionOptional = actionList.stream()
                            .filter(newAction -> "_$JSModule1_1$_JSModule1.myFun1"
                                    .equals(newAction.getUnpublishedAction().getFullyQualifiedName()))
                            .findFirst();
                    assertThat(jsFunc1ActionOptional).isPresent();
                    NewAction jsFunc1Action = jsFunc1ActionOptional.get();
                    assertThat(jsFunc1Action.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc1Action.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc1Action.getOriginActionId()).isNotNull();
                    assertThat(jsFunc1Action.getIsPublic()).isTrue();
                    assertThat(jsFunc1Action.getGitSyncId()).isEqualTo("jsmi_f1_git_1");
                    ActionDTO unpublishedJsFunc1 = jsFunc1Action.getUnpublishedAction();
                    assertThat(unpublishedJsFunc1.getActionConfiguration()).isNotNull();
                    assertThat(unpublishedJsFunc1.getActionConfiguration().getBody())
                            .isEqualTo("function () { return \"foo\" }");
                    assertThat(unpublishedJsFunc1.getJsonPathKeys()).containsOnly("function () { return \"foo\" }");
                    assertThat(unpublishedJsFunc1.getDynamicBindingPathList()).containsOnly(new Property("body", null));
                    assertThat(unpublishedJsFunc1.getDefaultResources().getCollectionId())
                            .isEqualTo(unpublishedJsFunc1.getCollectionId());
                    assertThat(unpublishedJsFunc1.getExecuteOnLoad()).isFalse();

                    collectionIdInAction.add(unpublishedJsFunc1.getCollectionId());

                    Optional<NewAction> jsFunc2ActionOptional = actionList.stream()
                            .filter(newAction -> "_$JSModule1_1$_JSModule1.myFun2"
                                    .equals(newAction.getUnpublishedAction().getFullyQualifiedName()))
                            .findFirst();
                    assertThat(jsFunc2ActionOptional).isPresent();
                    NewAction jsFunc2Action = jsFunc2ActionOptional.get();
                    assertThat(jsFunc2Action.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc2Action.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(jsFunc2Action.getOriginActionId()).isNotNull();
                    assertThat(jsFunc2Action.getIsPublic()).isTrue();
                    assertThat(jsFunc2Action.getGitSyncId()).isEqualTo("jsmi_f2_git_1");
                    ActionDTO unpublishedJsFunc2 = jsFunc2Action.getUnpublishedAction();
                    assertThat(unpublishedJsFunc2.getActionConfiguration()).isNotNull();
                    assertThat(unpublishedJsFunc2.getActionConfiguration().getBody())
                            .isEqualTo("function () { return _$JSModule1_1$_Query1.data }");
                    assertThat(unpublishedJsFunc2.getJsonPathKeys())
                            .containsOnly("function () { return _$JSModule1_1$_Query1.data }");
                    assertThat(unpublishedJsFunc2.getDynamicBindingPathList()).containsOnly(new Property("body", null));
                    assertThat(unpublishedJsFunc2.getDefaultResources().getCollectionId())
                            .isEqualTo(unpublishedJsFunc2.getCollectionId());
                    assertThat(unpublishedJsFunc2.getExecuteOnLoad()).isTrue();

                    collectionIdInAction.add(unpublishedJsFunc2.getCollectionId());

                    Optional<NewAction> privateQueryActionOptional = actionList.stream()
                            .filter(newAction -> "_$JSModule1_1$_Query1"
                                    .equals(newAction.getUnpublishedAction().getName()))
                            .findFirst();
                    assertThat(privateQueryActionOptional).isPresent();
                    NewAction privateQueryAction = privateQueryActionOptional.get();
                    assertThat(privateQueryAction.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(privateQueryAction.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                    assertThat(privateQueryAction.getOriginActionId()).isNotNull();
                    assertThat(privateQueryAction.getIsPublic()).isFalse();
                    ActionDTO unpublishedPrivateQuery = privateQueryAction.getUnpublishedAction();
                    assertThat(unpublishedPrivateQuery.getActionConfiguration()).isNotNull();
                    assertThat(unpublishedPrivateQuery.getActionConfiguration().getBody())
                            .isEqualTo("select * from users");
                    assertThat(unpublishedPrivateQuery.getJsonPathKeys()).isEmpty();
                    assertThat(unpublishedPrivateQuery.getDynamicBindingPathList())
                            .isNull();
                    assertThat(unpublishedPrivateQuery.getExecuteOnLoad()).isTrue();

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getUnpublishedCollection().getPageId())
                                .isNotEqualTo(pageList.get(0).getName());

                        assertThat(actionCollection.getRootModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                        assertThat(actionCollection.getModuleInstanceId()).isEqualTo(jsModuleInstance.getId());
                        assertThat(actionCollection.getOriginActionCollectionId())
                                .isNotNull();

                        assertThat(actionCollection.getUnpublishedCollection().getName())
                                .isEqualTo("_$JSModule1_1$_JSModule1");
                        assertThat(actionCollection.getUnpublishedCollection().getBody())
                                .isEqualTo(
                                        "export default { myFun1() { return \"foo\" }, myFun2() { return _$JSModule1_1$_Query1.data } }");

                        assertThat(actionCollection.getUnpublishedCollection().getDefaultToBranchedActionIdsMap())
                                .hasSize(2);

                        assertThat(collectionIdInAction).containsOnly(actionCollection.getId());

                        assertThat(actionCollection.getGitSyncId()).isEqualTo("jsmi_ac_git_1");
                    });

                    assertThat(pageList).hasSize(1);

                    ApplicationPage defaultAppPage = application.getPages().stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId()))
                            .findFirst()
                            .orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                    assertThat(defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions())
                            .isNotEmpty();

                    List<Set<String>> onLoadMatrix =
                            defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions().stream()
                                    .map(layer -> layer.stream()
                                            .map(DslExecutableDTO::getName)
                                            .collect(Collectors.toSet()))
                                    .collect(Collectors.toList());
                    List<Set<String>> expectedOnloadMatrix = List.of(
                            Set.of("_$JSModule1_1$_Query1", "_$QueryModule1_1$_QueryModule1"),
                            Set.of("_$JSModule1_1$_JSModule1.myFun2"));
                    assertThat(onLoadMatrix).usingRecursiveComparison().isEqualTo(expectedOnloadMatrix);
                })
                .verifyComplete();
    }

    private PackageDTO createQueryAndJSModules(Workspace workspace) {
        PackageDTO aPackage = new PackageDTO();
        aPackage.setName("Test Package");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        PackageDTO packageDTO =
                crudPackageService.createPackage(aPackage, workspace.getId()).block();

        setupDatasource(workspace);

        assertThat(packageDTO).isNotNull();
        ModuleDTO queryModuleDTO = createQueryModule(packageDTO);
        ModuleDTO jsModuleDTO = createJSModule(packageDTO);

        return packageDTO;
    }

    private ModuleDTO createQueryModule(PackageDTO packageDTO) {
        ModuleDTO moduleReqDTO = new ModuleDTO();
        moduleReqDTO.setName("QueryModule1");
        moduleReqDTO.setPackageId(packageDTO.getId());
        moduleReqDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("Select * from users where gender = {{inputs.genderInput}}");

        moduleActionDTO.setDynamicBindingPathList(List.of(new Property("body", null)));

        // configure inputs
        List<ModuleInputForm> moduleInputsForm = new ArrayList<>();
        ModuleInputForm genderInputForm = new ModuleInputForm();
        genderInputForm.setId(UUID.randomUUID().toString());
        genderInputForm.setSectionName("");
        List<ModuleInput> inputChildren = new ArrayList<>();
        ModuleInput genderInput = new ModuleInput();
        genderInput.setLabel("gender");
        genderInput.setPropertyName("inputs.genderInput");
        genderInput.setDefaultValue("{{\"female\"}}");
        genderInput.setControlType("INPUT_TEXT");
        inputChildren.add(genderInput);
        genderInputForm.setChildren(inputChildren);

        moduleInputsForm.add(genderInputForm);
        moduleReqDTO.setInputsForm(moduleInputsForm);

        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property(null, TRUE)));
        moduleActionDTO.setActionConfiguration(actionConfiguration);
        moduleActionDTO.setDatasource(datasource);
        moduleActionDTO.setPluginId(datasource.getPluginId());

        moduleReqDTO.setEntity(moduleActionDTO);

        return crudModuleService.createModule(moduleReqDTO).block();
    }

    private ModuleDTO createJSModule(PackageDTO packageDTO) {
        ModuleDTO moduleReqDTO = new ModuleDTO();
        moduleReqDTO.setName("JSModule1");
        moduleReqDTO.setPackageId(packageDTO.getId());
        moduleReqDTO.setType(ModuleType.JS_MODULE);

        ModuleActionDTO moduleActionDTO1 = new ModuleActionDTO();
        moduleActionDTO1.setName("myFun1");
        moduleActionDTO1.setWorkspaceId(packageDTO.getWorkspaceId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setBody("function () { return \"foo\" }");
        moduleActionDTO1.setActionConfiguration(actionConfiguration1);
        moduleActionDTO1.setClientSideExecution(true);
        moduleActionDTO1.setDynamicBindingPathList(List.of(new Property("body", null)));

        ModuleActionDTO moduleActionDTO2 = new ModuleActionDTO();
        moduleActionDTO2.setName("myFun2");
        moduleActionDTO2.setWorkspaceId(packageDTO.getWorkspaceId());
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setBody("function () { return Query1.data }");
        moduleActionDTO2.setActionConfiguration(actionConfiguration2);
        moduleActionDTO2.setClientSideExecution(true);
        moduleActionDTO2.setDynamicBindingPathList(List.of(new Property("body", null)));

        ModuleActionCollectionDTO moduleActionCollectionDTO = new ModuleActionCollectionDTO();
        moduleActionCollectionDTO.setPluginType(PluginType.JS);
        moduleActionCollectionDTO.setName("JSModule");
        moduleActionCollectionDTO.setBody(
                "export default { myFun1() { return \"foo\" }, myFun2() { return Query1.data } }");
        moduleActionCollectionDTO.setWorkspaceId(packageDTO.getWorkspaceId());

        moduleActionCollectionDTO.setActions(List.of(moduleActionDTO1, moduleActionDTO2));

        Plugin installedJsPlugin =
                pluginService.findByPackageName("installed-js-plugin").block();

        moduleActionCollectionDTO.setPluginId(installedJsPlugin.getId());

        moduleReqDTO.setEntity(moduleActionCollectionDTO);
        ModuleDTO moduleDTO = crudModuleService.createModule(moduleReqDTO).block();

        // Query1
        ModuleActionDTO query1 = new ModuleActionDTO();
        query1.setName("Query1");
        query1.setPluginId(datasource.getPluginId());
        query1.setDatasource(datasource);
        query1.setModuleId(moduleDTO.getId());
        ActionConfiguration actionConfiguration3 = new ActionConfiguration();
        actionConfiguration3.setBody("select * from users");
        query1.setActionConfiguration(actionConfiguration3);
        query1.setContextType(CreatorContextType.MODULE);

        layoutActionService.createSingleAction(query1, false).block();

        return moduleDTO;
    }

    private void setupDatasource(Workspace workspace) {
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspace.getId());
        Plugin installed_plugin =
                pluginService.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());
    }

    private void mockPluginServiceFormData() {
        String jsonString = "{\n" + "  \"setting\": [\n"
                + "    {\n"
                + "      \"sectionName\": \"\",\n"
                + "      \"id\": 1,\n"
                + "      \"children\": [\n"
                + "        {\n"
                + "          \"label\": \"Run query on page load\",\n"
                + "          \"configProperty\": \"executeOnLoad\",\n"
                + "          \"controlType\": \"SWITCH\",\n"
                + "          \"subtitle\": \"Will refresh data each time the page is loaded\"\n"
                + "        },\n"
                + "        {\n"
                + "          \"label\": \"Request confirmation before running query\",\n"
                + "          \"configProperty\": \"confirmBeforeExecute\",\n"
                + "          \"controlType\": \"SWITCH\",\n"
                + "          \"subtitle\": \"Ask confirmation from the user each time before refreshing data\"\n"
                + "        },\n"
                + "        {\n"
                + "          \"label\": \"Use Prepared Statement\",\n"
                + "          \"subtitle\": \"Turning on Prepared Statement makes your queries resilient against bad things like SQL injections. However, it cannot be used if your dynamic binding contains any SQL keywords like 'SELECT', 'WHERE', 'AND', etc.\",\n"
                + "          \"configProperty\": \"actionConfiguration.pluginSpecifiedTemplates[0].value\",\n"
                + "          \"controlType\": \"SWITCH\",\n"
                + "          \"initialValue\": true\n"
                + "        },\n"
                + "        {\n"
                + "          \"label\": \"Query timeout (in milliseconds)\",\n"
                + "          \"subtitle\": \"Maximum time after which the query will return\",\n"
                + "          \"configProperty\": \"actionConfiguration.timeoutInMillisecond\",\n"
                + "          \"controlType\": \"INPUT_TEXT\",\n"
                + "          \"dataType\": \"NUMBER\"\n"
                + "        }\n"
                + "      ]\n"
                + "    }\n"
                + "  ]\n"
                + "}";
        try {
            JsonNode pluginSettingsNode = objectMapper.readTree(jsonString);
            Map configMap = objectMapper.convertValue(pluginSettingsNode, Map.class);
            Mockito.doReturn(Mono.just(configMap)).when(pluginService).getFormConfig(Mockito.any());

        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }

    private FilePart createFilePart(String filePath) throws URISyntaxException {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        URL resource = this.getClass().getResource(filePath);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        Path.of(resource.toURI()), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filepart;
    }
}
