package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Policy;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.publish.PublishPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelper;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelperDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_MODULE_INSTANCES;
import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static com.appsmith.server.constants.ce.FieldNameCE.DEVELOPER;
import static com.appsmith.server.constants.ce.FieldNameCE.VIEWER;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class CrudModuleInstanceServiceTest {
    @Autowired
    NewActionService newActionService;

    @Autowired
    CrudModuleInstanceService crudModuleInstanceService;

    @Autowired
    LayoutModuleInstanceService layoutModuleInstanceService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    ModuleInstanceRepository moduleInstanceRepository;

    @Autowired
    CrudModuleService crudModuleService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    EnvironmentPermission environmentPermission;

    @SpyBean
    FeatureFlagService featureFlagService;

    @SpyBean
    CommonConfig commonConfig;

    @SpyBean
    PluginService pluginService;

    ModuleInstanceTestHelper moduleInstanceTestHelper;

    ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO;

    @Autowired
    CrudPackageService crudPackageService;

    @Autowired
    PublishPackageService publishPackageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    CustomJSLibService customJSLibService;

    @BeforeEach
    public void setup() {
        moduleInstanceTestHelper = new ModuleInstanceTestHelper(
                crudPackageService,
                publishPackageService,
                crudModuleService,
                userService,
                workspaceService,
                applicationPageService,
                newPageService,
                newActionService,
                pluginExecutorHelper,
                environmentPermission,
                featureFlagService,
                commonConfig,
                pluginService,
                crudModuleInstanceService,
                objectMapper,
                customJSLibService);
        moduleInstanceTestHelperDTO = new ModuleInstanceTestHelperDTO();
        moduleInstanceTestHelperDTO.setWorkspaceName("CRUD_Module_Instance_Workspace");
        moduleInstanceTestHelperDTO.setApplicationName("CRUD_Module_Instance_Application");
        moduleInstanceTestHelper.createPrerequisites(moduleInstanceTestHelperDTO);
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testCreateModuleInstanceFromAPublishedModule() {
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        Mono<List<NewAction>> actionsMono = getDBActions(createModuleInstanceResponseDTO);

        List<CustomJSLib> customJSLibs = customJSLibService
                .getAllJSLibsInContext(
                        moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(),
                        CreatorContextType.APPLICATION,
                        null,
                        false)
                .block();

        Application application = applicationService
                .findById(moduleInstanceTestHelperDTO.getPageDTO().getApplicationId())
                .block();

        StepVerifier.create(actionsMono)
                .assertNext(dbActions -> {
                    doAllAssertions(dbActions, createModuleInstanceResponseDTO, moduleInstanceDTO);

                    // Make sure application gets source module's js libs as hidden libs
                    assert customJSLibs != null;
                    assertThat(customJSLibs.size()).isEqualTo(1);
                    CustomJSLib customJSLib = customJSLibs.get(0);
                    assertThat(customJSLib.getIsHidden()).isTrue();
                    assertThat(customJSLib.getName()).isEqualTo("name1");

                    assert application != null;
                    assertThat(application.getUnpublishedApplicationDetail()).isNotNull();
                    Set<CustomJSLibContextDTO> hiddenJSLibs =
                            application.getUnpublishedApplicationDetail().getHiddenJSLibs();
                    assertThat(hiddenJSLibs).isNotNull();
                    assertThat(hiddenJSLibs.size()).isEqualTo(1);
                    CustomJSLibContextDTO libContextDTO =
                            hiddenJSLibs.stream().findFirst().get();
                    assertThat(libContextDTO.getUidString()).isEqualTo("accessor_url");
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testCreateModuleInstance_withExistingCustomJsLib_doesNotCreateHiddenLib() {
        String applicationId = moduleInstanceTestHelperDTO.getPageDTO().getApplicationId();
        // Create custom JS lib in app
        CustomJSLib jsLib = new CustomJSLib("name1", Set.of("accessor"), "url", "docsUrl", "version", "defs");
        customJSLibService
                .addJSLibsToContext(applicationId, CreatorContextType.APPLICATION, Set.of(jsLib), null, false)
                .block();

        List<CustomJSLib> originalCustomLibs = customJSLibService
                .getAllJSLibsInContext(applicationId, CreatorContextType.APPLICATION, null, false)
                .block();

        // Make sure application originally had the same lib manually installed
        assertThat(originalCustomLibs.size()).isEqualTo(1);
        CustomJSLib originalLib = originalCustomLibs.get(0);
        assertThat(originalLib.getIsHidden()).isNull();
        assertThat(originalLib.getName()).isEqualTo("name1");

        Application originalApp = applicationService.findById(applicationId).block();
        assert originalApp != null;
        assertThat(originalApp.getUnpublishedApplicationDetail()).isNull();
        Set<CustomJSLibContextDTO> originalAppVisibleLibs = originalApp.getUnpublishedCustomJSLibs();
        assertThat(originalAppVisibleLibs.size()).isEqualTo(1);
        CustomJSLibContextDTO originalAppLibContextDTO =
                originalAppVisibleLibs.stream().findFirst().get();
        assertThat(originalAppLibContextDTO.getUidString()).isEqualTo("accessor_url");

        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        createModuleInstanceResponseDTO.getModuleInstance();

        Mono<List<CustomJSLib>> customJSLibsMono =
                customJSLibService.getAllJSLibsInContext(applicationId, CreatorContextType.APPLICATION, null, false);

        Application application = applicationService.findById(applicationId).block();

        StepVerifier.create(customJSLibsMono)
                .assertNext(customJSLibs -> {
                    // Make sure that we only get one entry for the lib in app eventually
                    assertThat(customJSLibs.size()).isEqualTo(1);
                    CustomJSLib customJSLib = customJSLibs.get(0);
                    // And make sure that it is not hidden, as was the case originally
                    assertThat(customJSLib.getIsHidden()).isNull();
                    assertThat(customJSLib.getName()).isEqualTo("name1");

                    // Also check the same as stored in the application document
                    assert application != null;
                    assertThat(application.getUnpublishedApplicationDetail()).isNotNull();
                    Set<CustomJSLibContextDTO> hiddenJSLibs =
                            application.getUnpublishedApplicationDetail().getHiddenJSLibs();
                    assertThat(hiddenJSLibs.size()).isEqualTo(0);
                    Set<CustomJSLibContextDTO> visibleLibs = application.getUnpublishedCustomJSLibs();
                    assertThat(visibleLibs.size()).isEqualTo(1);
                    CustomJSLibContextDTO libContextDTO =
                            visibleLibs.stream().findFirst().get();
                    assertThat(libContextDTO.getUidString()).isEqualTo("accessor_url");
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testInstantiateSameModuleTwiceOnSamePage() {
        CreateModuleInstanceResponseDTO firstCreateModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO firstModuleInstanceDTO = firstCreateModuleInstanceResponseDTO.getModuleInstance();
        CreateModuleInstanceResponseDTO secondCreateModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO secondModuleInstanceDTO = secondCreateModuleInstanceResponseDTO.getModuleInstance();

        Mono<List<NewAction>> firstDBActionsMono = getDBActions(firstCreateModuleInstanceResponseDTO);
        Mono<List<NewAction>> secondDBActionsMono = getDBActions(secondCreateModuleInstanceResponseDTO);

        StepVerifier.create(firstDBActionsMono)
                .assertNext(dbActions -> {
                    doAllAssertions(dbActions, firstCreateModuleInstanceResponseDTO, firstModuleInstanceDTO);
                })
                .verifyComplete();

        StepVerifier.create(secondDBActionsMono)
                .assertNext(dbActions -> {
                    doAllAssertions(dbActions, secondCreateModuleInstanceResponseDTO, secondModuleInstanceDTO);
                })
                .verifyComplete();
    }

    private Mono<List<NewAction>> getDBActions(CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO) {
        Mono<List<NewAction>> actionsMono = newActionService
                .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                        createModuleInstanceResponseDTO.getModuleInstance().getId(), EXECUTE_ACTIONS, false)
                .collectList();
        return actionsMono;
    }

    private void doAllAssertions(
            List<NewAction> dbActions,
            CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO,
            ModuleInstanceDTO firstModuleInstanceDTO) {
        String moduleInstanceName = firstModuleInstanceDTO.getName();
        assertThat(createModuleInstanceResponseDTO).isNotNull();
        assertThat(createModuleInstanceResponseDTO.getModuleInstance()).isNotNull();
        assertThat(createModuleInstanceResponseDTO.getEntities()).isNotNull();
        assertThat(createModuleInstanceResponseDTO.getEntities().getActions()).isNotNull();

        assertThat(firstModuleInstanceDTO.getContextType()).isEqualTo(CreatorContextType.PAGE);
        assertThat(firstModuleInstanceDTO.getContextId())
                .isEqualTo(moduleInstanceTestHelperDTO.getPageDTO().getId());
        assertThat(firstModuleInstanceDTO.getInputs()).isNotNull();
        assertThat(firstModuleInstanceDTO.getInputs().size()).isEqualTo(1);
        assertThat(firstModuleInstanceDTO.getUserPermissions().size()).isEqualTo(4);

        List<ActionViewDTO> actions =
                createModuleInstanceResponseDTO.getEntities().getActions();
        ActionViewDTO moduleInstancePublicActionViewDTO = actions.get(0);
        assertThat(moduleInstancePublicActionViewDTO.getId()).isNotNull();
        assertThat(moduleInstancePublicActionViewDTO.getName()).isEqualTo("_$" + moduleInstanceName + "$_GetUsers");
        assertThat(moduleInstancePublicActionViewDTO.getPluginId())
                .isEqualTo(moduleInstanceTestHelperDTO.getDatasource().getPluginId());
        assertThat(moduleInstancePublicActionViewDTO.getTimeoutInMillisecond()).isEqualTo(10000);
        assertThat(moduleInstancePublicActionViewDTO.getConfirmBeforeExecute()).isFalse();
        assertThat(moduleInstancePublicActionViewDTO.getJsonPathKeys()).isNotNull();

        assertThat(dbActions.size()).isEqualTo(1);
        NewAction dbAction = dbActions.get(0);
        ActionDTO unpublishedDBAction = dbAction.getUnpublishedAction();

        // Assert dynamic binding references
        List<MustacheBindingToken> mustacheTokens = MustacheHelper.extractMustacheKeysInOrder(
                unpublishedDBAction.getActionConfiguration().getBody());
        assertThat(mustacheTokens.size()).isEqualTo(1);
        assertThat(mustacheTokens.get(0).getValue())
                .isEqualTo("accessor.func(" + moduleInstanceName + ".inputs.genderInput)");

        // Assert input references
        assertThat(firstModuleInstanceDTO.getInputs().size()).isEqualTo(1);
        assertThat(firstModuleInstanceDTO.getInputs().containsKey("genderInput"))
                .isTrue();

        // Assert jsonPathKeys
        assertThat(firstModuleInstanceDTO.getJsonPathKeys().size()).isEqualTo(1);
        assertThat(firstModuleInstanceDTO.getJsonPathKeys()).matches(keySet -> keySet.contains("\"female\""));

        NewAction modulePublicAction = moduleInstanceTestHelperDTO.getModulePublicAction();
        // Assert that module level settings should remain the same in the instantiated public entity
        assertThat(moduleInstancePublicActionViewDTO.getTimeoutInMillisecond())
                .isEqualTo(modulePublicAction
                        .getPublishedAction()
                        .getActionConfiguration()
                        .getTimeoutInMillisecond());
        assertThat(moduleInstancePublicActionViewDTO.getConfirmBeforeExecute())
                .isEqualTo(modulePublicAction.getPublishedAction().getConfirmBeforeExecute());
        assertThat(modulePublicAction
                        .getPublishedAction()
                        .getActionConfiguration()
                        .getPluginSpecifiedTemplates()
                        .get(0)
                        .getValue())
                .isEqualTo(TRUE);
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testInstantiateModuleHavingTheSameNameAsAnotherQueryOnThePageShouldCoExist() {
        ActionDTO action = new ActionDTO();
        action.setName("GetUsers");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setBody("Select * from users where gender = {{Input1.text}}");
        action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
        action.setPageId(moduleInstanceTestHelperDTO.getPageDTO().getId());
        action.setDatasource(moduleInstanceTestHelperDTO.getDatasource());
        Mono<ActionDTO> createActionMono = layoutActionService.createSingleAction(action, false);

        StepVerifier.create(createActionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getName()).isEqualTo("GetUsers");
                    assertThat(createdAction.getJsonPathKeys().size()).isEqualTo(1);
                    assertThat(createdAction.getJsonPathKeys().contains("Input1.text"))
                            .isTrue();
                })
                .verifyComplete();

        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        Mono<List<NewAction>> actionsMono = getDBActions(createModuleInstanceResponseDTO);

        StepVerifier.create(actionsMono)
                .assertNext(dbActions -> {
                    doAllAssertions(dbActions, createModuleInstanceResponseDTO, moduleInstanceDTO);
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testDeleteModuleInstanceShouldDeleteAllReferences() {
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        Mono<ModuleInstanceDTO> deletedModuleInstanceMono = crudModuleInstanceService
                .deleteUnpublishedModuleInstance(
                        createModuleInstanceResponseDTO.getModuleInstance().getId(), null)
                .cache();

        Mono<List<ModuleInstance>> moduleInstancesMono =
                deletedModuleInstanceMono.flatMap(deletedModuleInstance -> layoutModuleInstanceService
                        .findAllUnpublishedComposedModuleInstancesByRootModuleInstanceId(
                                moduleInstanceTestHelperDTO.getPageDTO().getId(),
                                CreatorContextType.PAGE,
                                deletedModuleInstance.getId(),
                                READ_MODULE_INSTANCES)
                        .collectList());

        Mono<List<NewAction>> actionsMono = deletedModuleInstanceMono.flatMap(deletedModuleInstance -> newActionService
                .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                        deletedModuleInstance.getId(), EXECUTE_ACTIONS, true)
                .collectList());

        StepVerifier.create(Mono.zip(deletedModuleInstanceMono, moduleInstancesMono, actionsMono))
                .assertNext(tuple3 -> {
                    ModuleInstanceDTO deletedModuleInstanceDTO = tuple3.getT1();
                    List<ModuleInstance> moduleInstances = tuple3.getT2();
                    List<NewAction> actions = tuple3.getT3();
                    assertThat(deletedModuleInstanceDTO).isNotNull();

                    assertThat(moduleInstances.size()).isEqualTo(0);
                    assertThat(actions.size()).isEqualTo(0);
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testDeleteModuleWhenModuleInstancesPresentShouldRestrictDeletion() {
        // Create a module instance to restrict deletion of the source module
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);

        Mono<ModuleDTO> deleteModuleMono = crudModuleService.deleteModule(
                moduleInstanceTestHelperDTO.getSourceModuleDTO().getId());

        // Module cannot be deleted as it has one reference
        StepVerifier.create(deleteModuleMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && ((AppsmithException) throwable)
                                .getError()
                                .getAppErrorCode()
                                .equals(AppsmithErrorCode.MODULE_HAS_INSTANCES.getCode()))
                .verify();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testDeleteModuleWhenModuleInstancesAreDeletedShouldAllowModuleToDelete() {
        // Create a module instance to restrict deletion of the source module
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);

        Mono<ModuleDTO> deleteModuleMono = crudModuleService.deleteModule(
                moduleInstanceTestHelperDTO.getSourceModuleDTO().getId());

        // Module cannot be deleted as it has one reference
        StepVerifier.create(deleteModuleMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && ((AppsmithException) throwable)
                                .getError()
                                .getAppErrorCode()
                                .equals(AppsmithErrorCode.MODULE_HAS_INSTANCES.getCode()))
                .verify();

        // Make sure module has no instances
        crudModuleInstanceService
                .deleteUnpublishedModuleInstance(
                        createModuleInstanceResponseDTO.getModuleInstance().getId(), null)
                .block();

        // Module can be deleted now as it has no reference exists
        StepVerifier.create(deleteModuleMono)
                .assertNext(deletedModule -> {
                    assertThat(deletedModule.getId()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAddingNewModuleInstance_inPublicApp_grantsPublicPermissionToRelevantEntities() {
        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceService
                .getById(moduleInstanceTestHelperDTO.getWorkspaceId())
                .flatMapMany(workspace -> {
                    Set<String> defaultPermissionGroups = workspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        Application publicApp = applicationService
                .changeViewAccess(moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(), applicationAccessDTO)
                .block();

        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        Mono<List<NewAction>> actionsMono = getDBActions(createModuleInstanceResponseDTO);
        Mono<ModuleInstance> moduleInstanceMono = moduleInstanceRepository.findById(moduleInstanceDTO.getId());

        Mono<PermissionGroup> publicAppPermissionGroupMono = permissionGroupService.getPublicPermissionGroup();

        User anonymousUser = userService.findByEmail("anonymousUser").block();

        StepVerifier.create(Mono.zip(
                        moduleInstanceMono, actionsMono, defaultPermissionGroupsMono, publicAppPermissionGroupMono))
                .assertNext(tuple -> {
                    ModuleInstance moduleInstanceFromDb = tuple.getT1();
                    List<NewAction> actionsFromDb = tuple.getT2();
                    List<PermissionGroup> permissionGroups = tuple.getT3();
                    PermissionGroup publicAppPermissionGroup = tuple.getT4();

                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    Policy manageModuleInstancePolicy = Policy.builder()
                            .permission(MANAGE_MODULE_INSTANCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readModuleInstancePolicy = Policy.builder()
                            .permission(READ_MODULE_INSTANCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy deleteModuleInstancePolicy = Policy.builder()
                            .permission(DELETE_MODULE_INSTANCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeModuleInstancePolicy = Policy.builder()
                            .permission(EXECUTE_MODULE_INSTANCES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId(),
                                    publicAppPermissionGroup.getId()))
                            .build();

                    Policy manageActionPolicy = Policy.builder()
                            .permission(MANAGE_ACTIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readActionPolicy = Policy.builder()
                            .permission(READ_ACTIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy deleteActionPolicy = Policy.builder()
                            .permission(DELETE_ACTIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeActionPolicy = Policy.builder()
                            .permission(EXECUTE_ACTIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId(),
                                    publicAppPermissionGroup.getId()))
                            .build();

                    // Check that the datasource used in the app contains public execute permission
                    Assertions.assertThat(moduleInstanceFromDb.getPolicies())
                            .containsAll(Set.of(
                                    manageModuleInstancePolicy,
                                    readModuleInstancePolicy,
                                    deleteModuleInstancePolicy,
                                    executeModuleInstancePolicy));

                    // Check that the action used in the app contains public execute permission
                    assertThat(actionsFromDb.size()).isEqualTo(1);
                    Assertions.assertThat(actionsFromDb.get(0).getPolicies())
                            .containsAll(Set.of(
                                    manageActionPolicy, readActionPolicy, deleteActionPolicy, executeActionPolicy));

                    // Assert that viewerPermissionGroup has been assigned to anonymous user.
                    Assertions.assertThat(publicAppPermissionGroup.getAssignedToUserIds())
                            .contains(anonymousUser.getId());
                })
                .verifyComplete();
    }
}
