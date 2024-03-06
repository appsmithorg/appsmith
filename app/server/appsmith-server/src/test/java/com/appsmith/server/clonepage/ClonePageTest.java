package com.appsmith.server.clonepage;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ClonePageMetaDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleActionCollectionDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
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
import com.appsmith.server.repositories.ActionCollectionRepository;
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
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
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
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

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
    ActionCollectionRepository actionCollectionRepository;

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
                pluginRepository,
                actionCollectionRepository,
                layoutCollectionService);
        moduleInstanceTestHelperDTO = new ModuleInstanceTestHelperDTO();
        moduleInstanceTestHelperDTO.setWorkspaceName("ClonePage_With_And_Without_ModuleInstances_Workspace");
        moduleInstanceTestHelperDTO.setApplicationName("ClonePage_With_And_Without_ModuleInstances_Application");
        moduleInstanceTestHelper.createPrerequisites(moduleInstanceTestHelperDTO);
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testClonePage_whenModuleInstanceIsPresent_shouldCloneModuleInstance() {
        // Create a query module instance in the source page
        CreateModuleInstanceResponseDTO queryModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO, "GetUsers_1");

        // Create a JS module instance in the source page
        CreateModuleInstanceResponseDTO jsModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createJSModuleInstance(moduleInstanceTestHelperDTO, "MyJSModule1_1");

        // Create a page action collection in the source page
        layoutCollectionService
                .createCollection(getActionCollectionReqDTO(), null)
                .block();

        // Create a page action in the source page
        layoutActionService
                .createSingleActionWithBranch(getActionReqDTO(), null)
                .block();

        assertThat(queryModuleInstanceResponseDTO.getEntities().getActions()).hasSize(1);
        ActionViewDTO sourcePublicAction =
                queryModuleInstanceResponseDTO.getEntities().getActions().get(0);

        // Turn on executeOnLoad for the page action
        layoutActionService
                .setExecuteOnLoad(sourcePublicAction.getId(), null, true)
                .block();

        setOnPageLoadExecutablesInTheSourcePage();

        // Clone page
        PageDTO clonedPageDTO = applicationPageService
                .clonePage(moduleInstanceTestHelperDTO.getPageDTO().getId(), new ClonePageMetaDTO())
                .block();

        // Fetch all the cloned entities
        List<NewAction> clonedActions = newActionService
                .findByPageId(clonedPageDTO.getId())
                .collectList()
                .block();
        List<ActionCollection> clonedActionCollections = actionCollectionService
                .findByPageId(clonedPageDTO.getId())
                .collectList()
                .block();

        List<ModuleInstance> clonedModuleInstances = crudModuleInstanceService
                .findByPageIds(List.of(clonedPageDTO.getId()), Optional.empty())
                .collectList()
                .block();
        ModuleInstanceEntitiesDTO clonedModuleInstanceEntitiesDTO = crudModuleInstanceService
                .getAllEntities(clonedPageDTO.getId(), CreatorContextType.PAGE, null, false)
                .block();

        // Verify all actions, action collections and module instances are cloned
        assertThat(clonedActions).hasSize(8);
        assertThat(clonedActionCollections).hasSize(3);
        assertThat(clonedModuleInstances).hasSize(2);
        assertThat(clonedModuleInstanceEntitiesDTO.getActions()).hasSize(1);
        assertThat(clonedModuleInstanceEntitiesDTO.getJsCollections()).hasSize(2);

        // Verify that cloned entities possess a pageId associated with the cloned page
        assertThat(clonedModuleInstanceEntitiesDTO.getActions().get(0).getPageId())
                .isEqualTo(clonedPageDTO.getId());
        assertThat(clonedModuleInstanceEntitiesDTO.getJsCollections().get(0).getPageId())
                .isEqualTo(clonedPageDTO.getId());
        assertThat(clonedModuleInstanceEntitiesDTO.getJsCollections().get(1).getPageId())
                .isEqualTo(clonedPageDTO.getId());
        assertThat(clonedModuleInstanceEntitiesDTO
                        .getJsCollections()
                        .get(0)
                        .getActions()
                        .get(0)
                        .getPageId())
                .isEqualTo(clonedPageDTO.getId());
        assertThat(clonedModuleInstanceEntitiesDTO
                        .getJsCollections()
                        .get(1)
                        .getActions()
                        .get(1)
                        .getPageId())
                .isEqualTo(clonedPageDTO.getId());

        // Assert default resources
        clonedActions.forEach(clonedAction -> {
            assertThat(clonedAction.getUnpublishedAction().getDefaultResources().getPageId())
                    .isEqualTo(clonedPageDTO.getId());
            assertThat(clonedAction.getDefaultResources().getActionId()).isEqualTo(clonedAction.getId());
        });
        clonedActionCollections.forEach(clonedActionCollection -> {
            assertThat(clonedActionCollection
                            .getUnpublishedCollection()
                            .getDefaultResources()
                            .getPageId())
                    .isEqualTo(clonedPageDTO.getId());
            assertThat(clonedActionCollection.getDefaultResources().getCollectionId())
                    .isEqualTo(clonedActionCollection.getId());
        });
        clonedModuleInstances.forEach(clonedModuleInstance -> {
            assertThat(clonedModuleInstance
                            .getUnpublishedModuleInstance()
                            .getDefaultResources()
                            .getPageId())
                    .isEqualTo(clonedPageDTO.getId());
            assertThat(clonedModuleInstance.getDefaultResources().getModuleInstanceId())
                    .isEqualTo(clonedModuleInstance.getId());
        });

        // verifyOnPageLoadExecutablesInTheClonedPage(clonedPageDTO);
    }

    private void verifyOnPageLoadExecutablesInTheClonedPage(PageDTO clonedPageDTO) {
        List<Set<String>> orderedOnLoadExecutableNames =
                clonedPageDTO.getLayouts().get(0).getLayoutOnLoadActions().stream()
                        .map(layer ->
                                layer.stream().map(DslExecutableDTO::getName).collect(Collectors.toSet()))
                        .collect(Collectors.toList());
        // TODO: There is some unpredictability in the onPageLoad calculation. While users may not experience any issues
        // since dependent
        // executables follow independent ones, it necessitates a review of the dependency graph.
        assertThat(orderedOnLoadExecutableNames.get(0))
                .containsExactlyInAnyOrder(
                        "_$GetUsers_1$_GetUsers",
                        "_$MyJSModule1_1$_PrivateJSObject1.getAllUsers",
                        "JSObject1.getAllUsers");
        assertThat(orderedOnLoadExecutableNames.get(1)).containsExactly("_$MyJSModule1_1$_MyJSModule1.getAllUsers");
    }

    private void setOnPageLoadExecutablesInTheSourcePage() {
        // Have some direct reference in the page DSL
        Layout layout = moduleInstanceTestHelperDTO.getPageDTO().getLayouts().get(0);
        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField")), new JSONObject(Map.of("key", "testField2"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ JSObject1.getAllUsers.data }}");
        dsl.put("testField2", "{{MyJSModule1_1.getAllUsers.data}}");

        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);
        updateLayoutService
                .updateLayout(
                        moduleInstanceTestHelperDTO.getPageDTO().getId(),
                        moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(),
                        layout.getId(),
                        layout)
                .block();
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
