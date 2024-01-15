package com.appsmith.server.moduleinstances.fork;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.fork.internal.ApplicationForkingService;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
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
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class ModuleInstanceForkTest {

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private CrudModuleInstanceService crudModuleInstanceService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CrudModuleService crudModuleService;

    @Autowired
    private UserService userService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private ApplicationService applicationService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private EnvironmentPermission environmentPermission;

    @SpyBean
    private FeatureFlagService featureFlagService;

    @SpyBean
    private CommonConfig commonConfig;

    @SpyBean
    private PluginService pluginService;

    @Autowired
    private CrudPackageService crudPackageService;

    @Autowired
    private PublishPackageService publishPackageService;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private CustomJSLibService customJSLibService;

    @Autowired
    private ApplicationForkingService applicationForkingService;

    // Test helpers
    ModuleInstanceTestHelper moduleInstanceTestHelper;

    ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO;

    @BeforeEach
    void setup() {
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
    void
            testEnableForkingAndForkingApplication_withOrWithoutModuleInstance_shouldForkWhenThereIsNoModuleInstanceElseDisallow() {
        // Enable forking should pass as there is no module instance present
        Application applicationReq = new Application();
        applicationReq.setForkingEnabled(true);
        Mono<Application> applicationMono = applicationService.update(
                moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(), applicationReq, null);

        StepVerifier.create(applicationMono)
                .assertNext(updatedApplication -> {
                    assertThat(updatedApplication).isNotNull();
                    assertThat(updatedApplication.getForkingEnabled()).isTrue();
                })
                .verifyComplete();

        // Forking should pass as there is no module instance present
        Mono<ApplicationImportDTO> applicationForkMono = applicationForkingService.forkApplicationToWorkspace(
                moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(),
                moduleInstanceTestHelperDTO.getWorkspaceId(),
                null);

        StepVerifier.create(applicationForkMono)
                .assertNext(applicationImportDTO -> {
                    assertThat(applicationImportDTO).isNotNull();
                    assertThat(applicationImportDTO.getApplication()).isNotNull();
                    assertThat(applicationImportDTO
                                    .getApplication()
                                    .getId()
                                    .equals(moduleInstanceTestHelperDTO
                                            .getPageDTO()
                                            .getApplicationId()))
                            .isFalse();
                    assertThat(applicationImportDTO.getApplication().getName())
                            .isEqualTo("CRUD_Module_Instance_Application (1)");
                })
                .verifyComplete();

        // Create a module instance
        CreateModuleInstanceResponseDTO firstCreateModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO firstModuleInstanceDTO = firstCreateModuleInstanceResponseDTO.getModuleInstance();

        Mono<List<NewAction>> firstDBActionsMono = getDBActions(firstCreateModuleInstanceResponseDTO);

        StepVerifier.create(firstDBActionsMono)
                .assertNext(dbActions ->
                        doAllAssertions(dbActions, firstCreateModuleInstanceResponseDTO, firstModuleInstanceDTO))
                .verifyComplete();

        // Revert the forkingEnabled flag to false
        applicationReq.setForkingEnabled(false);
        applicationMono = applicationService.update(
                moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(), applicationReq, null);

        StepVerifier.create(applicationMono)
                .assertNext(updatedApplication -> {
                    assertThat(updatedApplication).isNotNull();
                    assertThat(updatedApplication.getForkingEnabled()).isFalse();
                })
                .verifyComplete();

        // Enabling forking this time should not be allowed as there is a module instance present
        applicationReq.setForkingEnabled(true);
        applicationMono = applicationService.update(
                moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(), applicationReq, null);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.APPLICATION_FORKING_NOT_ALLOWED.getMessage()))
                .verify();

        // Attempt to fork should be disallowed too
        applicationForkMono = applicationForkingService.forkApplicationToWorkspace(
                moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(),
                moduleInstanceTestHelperDTO.getWorkspaceId(),
                null);

        StepVerifier.create(applicationForkMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.APPLICATION_FORKING_NOT_ALLOWED.getMessage()))
                .verify();
    }

    private Mono<List<NewAction>> getDBActions(CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO) {
        return newActionService
                .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                        createModuleInstanceResponseDTO.getModuleInstance().getId(), EXECUTE_ACTIONS, false)
                .collectList();
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
        assertThat(firstModuleInstanceDTO.getInputs()).hasSize(1);
        assertThat(firstModuleInstanceDTO.getUserPermissions()).hasSize(4);

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

        assertThat(dbActions).hasSize(1);
        NewAction dbAction = dbActions.get(0);
        ActionDTO unpublishedDBAction = dbAction.getUnpublishedAction();

        // Assert dynamic binding references
        List<MustacheBindingToken> mustacheTokens = MustacheHelper.extractMustacheKeysInOrder(
                unpublishedDBAction.getActionConfiguration().getBody());
        assertThat(mustacheTokens).hasSize(1);
        assertThat(mustacheTokens.get(0).getValue())
                .isEqualTo("accessor.func(" + moduleInstanceName + ".inputs.genderInput)");

        // Assert input references
        assertThat(firstModuleInstanceDTO.getInputs()).hasSize(1);
        assertThat(firstModuleInstanceDTO.getInputs()).containsKey("genderInput");

        // Assert jsonPathKeys
        assertThat(firstModuleInstanceDTO.getJsonPathKeys()).hasSize(1);
        assertThat(firstModuleInstanceDTO.getJsonPathKeys()).matches(keySet -> keySet.contains("\"female\""));

        NewAction modulePublicAction = moduleInstanceTestHelperDTO.getModulePublicAction();
        // Assert that module level settings should remain the same in the instantiated entity
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
}
