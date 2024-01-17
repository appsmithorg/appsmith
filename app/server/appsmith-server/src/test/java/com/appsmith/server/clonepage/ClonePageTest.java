package com.appsmith.server.clonepage;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleActionCollectionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.fork.internal.ApplicationForkingService;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.repositories.PackageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.PermissionGroupService;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class ClonePageTest {
    @Autowired
    private PackageRepository packageRepository;

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
    ModuleRepository moduleRepository;

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

    @Autowired
    CrudPackageService crudPackageService;

    @Autowired
    PublishPackageService publishPackageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    CustomJSLibService customJSLibService;

    @Autowired
    UpdateLayoutService updateLayoutService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    ApplicationForkingService applicationForkingService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    LayoutCollectionService layoutCollectionService;

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
                customJSLibService,
                pluginRepository);
        moduleInstanceTestHelperDTO = new ModuleInstanceTestHelperDTO();
        moduleInstanceTestHelperDTO.setWorkspaceName("ClonePage_With_And_Without_ModuleInstances_Workspace");
        moduleInstanceTestHelperDTO.setApplicationName("ClonePage_With_And_Without_ModuleInstances_Application");
        moduleInstanceTestHelper.createPrerequisites(moduleInstanceTestHelperDTO);
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testClonePage_whenModuleInstanceIsPresent_shouldNotCloneComposedEntities() {
        CreateModuleInstanceResponseDTO firstCreateModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);

        layoutCollectionService
                .createCollection(getActionCollectionReqDTO(), null)
                .block();
        layoutActionService
                .createSingleActionWithBranch(getActionReqDTO(), null)
                .block();

        PageDTO clonedPageDTO = applicationPageService
                .clonePage(moduleInstanceTestHelperDTO.getPageDTO().getId())
                .block();

        List<NewAction> clonedActions = newActionService
                .findByPageId(clonedPageDTO.getId())
                .collectList()
                .block();
        List<ActionCollection> clonedActionCollections = actionCollectionService
                .findByPageId(clonedPageDTO.getId())
                .collectList()
                .block();

        // verify that module instance actions should not appear in the cloned page
        assertThat(clonedActions).hasSize(3);
        assertThat(clonedActionCollections).hasSize(1);
        assertThat(clonedActions.get(0).getRootModuleInstanceId()).isNull();
        assertThat(clonedActionCollections.get(0).getRootModuleInstanceId()).isNull();
        assertThat(clonedActions.get(0).getRootModuleInstanceId()).isNull();
        assertThat(clonedActions.get(1).getRootModuleInstanceId()).isNull();
        assertThat(clonedActions.get(2).getRootModuleInstanceId()).isNull();
    }

    private ModuleActionCollectionDTO getActionCollectionReqDTO() {
        ModuleActionCollectionDTO actionCollectionDTO = new ModuleActionCollectionDTO();

        actionCollectionDTO.setWorkspaceId(moduleInstanceTestHelperDTO.getWorkspaceId());
        actionCollectionDTO.setApplicationId(
                moduleInstanceTestHelperDTO.getPageDTO().getApplicationId());
        actionCollectionDTO.setPageId(moduleInstanceTestHelperDTO.getPageDTO().getId());
        actionCollectionDTO.setName("JSObject1");
        actionCollectionDTO.setPluginId(
                moduleInstanceTestHelperDTO.getJsDatasource().getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        String body =
                """
        export default {
            myVar1: [],
            myVar2: {},
            getAllUsers () {
                return "dummy users";
            },
            async myFun2 () {
                return "dummy myFun2";
            }
        }
""";

        actionCollectionDTO.setBody(body);
        ActionDTO getAllUsersActionDTO = new ActionDTO();
        getAllUsersActionDTO.setName("getAllUsers");
        getAllUsersActionDTO.setActionConfiguration(new ActionConfiguration());
        getAllUsersActionDTO
                .getActionConfiguration()
                .setBody("""
    getAllUsers () {
        return "dummy users";
    }
""");

        ActionDTO myFun2ActionDTO = new ActionDTO();
        myFun2ActionDTO.setName("myFun2");
        myFun2ActionDTO.setActionConfiguration(new ActionConfiguration());
        myFun2ActionDTO
                .getActionConfiguration()
                .setBody("""
    async myFun2 () {
        return "dummy myFun2";
    }
""");
        actionCollectionDTO.setActions(List.of(getAllUsersActionDTO, myFun2ActionDTO));
        actionCollectionDTO.setPluginType(PluginType.JS);

        return actionCollectionDTO;
    }

    private ActionDTO getActionReqDTO() {
        ActionDTO actionReqDTO = new ActionDTO();
        actionReqDTO.setName("Api1");
        actionReqDTO.setWorkspaceId(moduleInstanceTestHelperDTO.getWorkspaceId());
        actionReqDTO.setApplicationId(moduleInstanceTestHelperDTO.getPageDTO().getApplicationId());
        actionReqDTO.setPageId(moduleInstanceTestHelperDTO.getPageDTO().getId());
        actionReqDTO.setActionConfiguration(new ActionConfiguration());
        actionReqDTO.setDatasource(moduleInstanceTestHelperDTO.getDatasource());
        actionReqDTO.setPluginType(PluginType.API);
        actionReqDTO.setPluginId(moduleInstanceTestHelperDTO.getDatasource().getPluginId());

        actionReqDTO.getActionConfiguration().setBody("Dummy body");

        return actionReqDTO;
    }
}
