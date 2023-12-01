package com.appsmith.server.moduleinstances.publish;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.publish.PublishPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
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
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ModuleInstanceApplicationPublishableServiceTest {
    @Autowired
    ModuleInstanceRepository moduleInstanceRepository;

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

    ModuleInstanceTestHelper moduleInstanceTestHelper;

    ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO;

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
    public void testApplicationPublish_withModuleInstances_shouldAlsoPublishModuleInstances() {
        // Create a module instance and publish the application
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);

        applicationPageService
                .publish(moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(), true)
                .block();

        // Retrieve the action and module instance Mono for verification
        Mono<NewAction> actionMono = newActionService.findById(createModuleInstanceResponseDTO
                .getEntities()
                .getActions()
                .get(0)
                .getId());
        Mono<ModuleInstance> moduleInstanceMono = moduleInstanceRepository.findById(
                createModuleInstanceResponseDTO.getModuleInstance().getId());

        // Verify the published and unpublished module instances and associated action
        StepVerifier.create(Mono.zip(actionMono, moduleInstanceMono))
                .assertNext(tuple2 -> {
                    NewAction dbAction = tuple2.getT1();
                    ModuleInstance moduleInstance = tuple2.getT2();

                    ModuleInstanceDTO publishedModuleInstance = moduleInstance.getPublishedModuleInstance();
                    ModuleInstanceDTO unpublishedModuleInstance = moduleInstance.getUnpublishedModuleInstance();

                    // Assertions for module instance properties
                    assertThat(publishedModuleInstance).isNotNull();
                    assertThat(publishedModuleInstance.getName()).isEqualTo(unpublishedModuleInstance.getName());
                    assertThat(publishedModuleInstance.getContextType())
                            .isEqualTo(unpublishedModuleInstance.getContextType());
                    assertThat(publishedModuleInstance.getApplicationId())
                            .isEqualTo(unpublishedModuleInstance.getApplicationId());
                    if (unpublishedModuleInstance.getJsonPathKeys() == null) {
                        assertThat(publishedModuleInstance.getJsonPathKeys()).isNull();
                    } else {
                        assertThat(publishedModuleInstance.getJsonPathKeys())
                                .isEqualTo(unpublishedModuleInstance.getJsonPathKeys());
                    }

                    // Assertions for associated action properties
                    assertThat(dbAction.getModuleInstanceId()).isEqualTo(moduleInstance.getId());
                    assertThat(dbAction.getIsPublic()).isTrue();
                    ActionDTO publishedAction = dbAction.getPublishedAction();
                    ActionDTO unpublishedAction = dbAction.getUnpublishedAction();
                    assertThat(publishedAction.getContextType()).isEqualTo(CreatorContextType.PAGE);
                    assertThat(publishedAction.getPageId()).isNotNull();
                    assertThat(publishedAction.getPageId()).isEqualTo(unpublishedAction.getPageId());
                    assertThat(publishedAction.getName()).isEqualTo(unpublishedAction.getName());
                    assertThat(publishedAction.getJsonPathKeys()).isEqualTo(unpublishedAction.getJsonPathKeys());
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testApplicationRePublish_withModuleInstancesDeletedInEditMode_shouldDeleteTheEntireModuleInstance() {
        // Create a module instance and publish the application
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();
        applicationPageService
                .publish(moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(), true)
                .block();

        // Retrieve the action and module instance Mono for verification
        Mono<NewAction> actionMono = newActionService.findById(createModuleInstanceResponseDTO
                .getEntities()
                .getActions()
                .get(0)
                .getId());
        Mono<ModuleInstance> moduleInstanceMono = moduleInstanceRepository.findById(
                createModuleInstanceResponseDTO.getModuleInstance().getId());

        // Verify the published and unpublished module instances and associated action
        StepVerifier.create(Mono.zip(actionMono, moduleInstanceMono))
                .assertNext(tuple2 -> {
                    NewAction dbAction = tuple2.getT1();
                    ModuleInstance moduleInstance = tuple2.getT2();

                    ModuleInstanceDTO publishedModuleInstance = moduleInstance.getPublishedModuleInstance();
                    ModuleInstanceDTO unpublishedModuleInstance = moduleInstance.getUnpublishedModuleInstance();

                    // Assertions for module instance properties
                    assertThat(publishedModuleInstance).isNotNull();
                    assertThat(publishedModuleInstance.getName()).isEqualTo(unpublishedModuleInstance.getName());
                    assertThat(publishedModuleInstance.getContextType())
                            .isEqualTo(unpublishedModuleInstance.getContextType());
                    assertThat(publishedModuleInstance.getApplicationId())
                            .isEqualTo(unpublishedModuleInstance.getApplicationId());
                    if (unpublishedModuleInstance.getJsonPathKeys() == null) {
                        assertThat(publishedModuleInstance.getJsonPathKeys()).isNull();
                    } else {
                        assertThat(publishedModuleInstance.getJsonPathKeys())
                                .isEqualTo(unpublishedModuleInstance.getJsonPathKeys());
                    }

                    // Assertions for associated action properties
                    assertThat(dbAction.getModuleInstanceId()).isEqualTo(moduleInstance.getId());
                    assertThat(dbAction.getIsPublic()).isTrue();
                    ActionDTO publishedAction = dbAction.getPublishedAction();
                    ActionDTO unpublishedAction = dbAction.getUnpublishedAction();
                    assertThat(publishedAction.getContextType()).isEqualTo(CreatorContextType.PAGE);
                    assertThat(publishedAction.getPageId()).isNotNull();
                    assertThat(publishedAction.getPageId()).isEqualTo(unpublishedAction.getPageId());
                    assertThat(publishedAction.getName()).isEqualTo(unpublishedAction.getName());
                    assertThat(publishedAction.getJsonPathKeys()).isEqualTo(unpublishedAction.getJsonPathKeys());
                })
                .verifyComplete();

        // Delete the module instance in edit mode
        crudModuleInstanceService
                .deleteUnpublishedModuleInstance(moduleInstanceDTO.getId(), null)
                .block();
        ModuleInstance deletedInEditModeModuleInstance =
                moduleInstanceRepository.findById(moduleInstanceDTO.getId()).block();

        // Ensure that the module instance exists in view mode but not in edit mode
        List<ModuleInstanceDTO> moduleInstancesInViewMode = layoutModuleInstanceService
                .getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
                        moduleInstanceTestHelperDTO.getPageDTO().getId(),
                        CreatorContextType.PAGE,
                        ResourceModes.VIEW,
                        null)
                .block();
        List<ModuleInstanceDTO> moduleInstancesInEditMode = layoutModuleInstanceService
                .getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
                        moduleInstanceTestHelperDTO.getPageDTO().getId(),
                        CreatorContextType.PAGE,
                        ResourceModes.EDIT,
                        null)
                .block();

        assertThat(moduleInstancesInViewMode.size()).isEqualTo(1);
        assertThat(moduleInstancesInEditMode.size()).isEqualTo(0);

        // Assertions for deletion in edit mode
        assertThat(deletedInEditModeModuleInstance
                        .getUnpublishedModuleInstance()
                        .getDeletedAt())
                .isNotNull();
        assertThat(deletedInEditModeModuleInstance.getPublishedModuleInstance().getDeletedAt())
                .isNull();

        // Publish the application again to see if the module instance deleted in edit mode gets completely deleted
        applicationPageService
                .publish(moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(), true)
                .block();

        // Verify that the module instance is completely deleted after republishing
        ModuleInstance deletedInModuleInstance =
                moduleInstanceRepository.findById(moduleInstanceDTO.getId()).block();
        assertThat(deletedInModuleInstance).isNull();

        // Ensure that the module instance does not exist in either view mode or edit mode
        moduleInstancesInViewMode = layoutModuleInstanceService
                .getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
                        moduleInstanceTestHelperDTO.getPageDTO().getId(),
                        CreatorContextType.PAGE,
                        ResourceModes.VIEW,
                        null)
                .block();
        moduleInstancesInEditMode = layoutModuleInstanceService
                .getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
                        moduleInstanceTestHelperDTO.getPageDTO().getId(),
                        CreatorContextType.PAGE,
                        ResourceModes.EDIT,
                        null)
                .block();

        assertThat(moduleInstancesInViewMode.size()).isEqualTo(0);
        assertThat(moduleInstancesInEditMode.size()).isEqualTo(0);
    }
}
