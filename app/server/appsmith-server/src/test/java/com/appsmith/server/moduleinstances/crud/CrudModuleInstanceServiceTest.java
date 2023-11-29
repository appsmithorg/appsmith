package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.publish.PublishPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelper;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelperDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
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
    CrudPackageService crudPackageService;

    @Autowired
    PublishPackageService publishPackageService;

    @Autowired
    CrudModuleService crudModuleService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    NewPageService newPageService;

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
                objectMapper);
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

        StepVerifier.create(actionsMono)
                .assertNext(dbActions -> {
                    doAllAssertions(dbActions, createModuleInstanceResponseDTO, moduleInstanceDTO);
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

        Mono<List<NewAction>> fristDBActionsMono = getDBActions(firstCreateModuleInstanceResponseDTO);
        Mono<List<NewAction>> secondDBActionsMono = getDBActions(secondCreateModuleInstanceResponseDTO);

        StepVerifier.create(fristDBActionsMono)
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
        Mono<List<NewAction>> fristActionsMono = newActionService
                .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                        createModuleInstanceResponseDTO.getModuleInstance().getId(),
                        AclPermission.EXECUTE_ACTIONS,
                        false)
                .collectList();
        return fristActionsMono;
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
        assertThat(mustacheTokens.get(0).getValue()).isEqualTo(moduleInstanceName + ".inputs.genderInput");

        // Assert input references
        assertThat(firstModuleInstanceDTO.getInputs().size()).isEqualTo(1);
        assertThat(firstModuleInstanceDTO.getInputs().containsKey("genderInput"))
                .isTrue();

        // Assert jsonPathKeys
        assertThat(firstModuleInstanceDTO.getJsonPathKeys().size()).isEqualTo(1);
        assertThat(firstModuleInstanceDTO.getJsonPathKeys()).matches(keySet -> keySet.contains("\"female\""));

        NewAction modulePublicAction = moduleInstanceTestHelperDTO.getModulePublicAction();
        // Assert that module level settings should remain the same in the instantiated public entity
        assertThat(modulePublicAction
                        .getPublishedAction()
                        .getActionConfiguration()
                        .getTimeoutInMillisecond())
                .isEqualTo(moduleInstancePublicActionViewDTO.getTimeoutInMillisecond());
        assertThat(modulePublicAction.getPublishedAction().getConfirmBeforeExecute())
                .isEqualTo(moduleInstancePublicActionViewDTO.getConfirmBeforeExecute());
        assertThat(modulePublicAction
                        .getPublishedAction()
                        .getActionConfiguration()
                        .getPluginSpecifiedTemplates()
                        .get(0)
                        .getValue())
                .isEqualTo(TRUE);
    }

    private CreateModuleInstanceResponseDTO getCreateModuleInstanceResponseDTO(
            ModuleInstanceDTO firstModuleInstanceReqDTO) {
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO = crudModuleInstanceService
                .createModuleInstance(firstModuleInstanceReqDTO, null)
                .block();
        return createModuleInstanceResponseDTO;
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
                    assertThat(createdAction.getJsonPathKeys().contains("Input1.text"));
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
                                AclPermission.READ_MODULE_INSTANCES)
                        .collectList());

        Mono<List<NewAction>> actionsMono = deletedModuleInstanceMono.flatMap(deletedModuleInstance -> newActionService
                .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                        deletedModuleInstance.getId(), AclPermission.EXECUTE_ACTIONS, true)
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
}
