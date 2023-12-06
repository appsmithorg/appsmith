package com.appsmith.server.services.ee;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.models.Property;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
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
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class UpdatePageLayoutServiceEETest {
    @Autowired
    NewActionService newActionService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    CrudModuleInstanceService crudModuleInstanceService;

    @Autowired
    LayoutModuleInstanceService layoutModuleInstanceService;

    @Autowired
    UpdateLayoutService updateLayoutService;

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

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    CustomJSLibService customJSLibService;

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
                objectMapper,
                customJSLibService);
        moduleInstanceTestHelperDTO = new ModuleInstanceTestHelperDTO();
        moduleInstanceTestHelperDTO.setWorkspaceName("CRUD_Module_Instance_Workspace");
        moduleInstanceTestHelperDTO.setApplicationName("CRUD_Module_Instance_Application");
        moduleInstanceTestHelper.createPrerequisites(moduleInstanceTestHelperDTO);
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testOnPageLoadsActions_withSimpleModuleInstanceReference_containsPublicActionInOnLoadActions()
            throws JsonProcessingException {
        // Create a module instance in the app
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();
        ActionViewDTO publicAction =
                createModuleInstanceResponseDTO.getEntities().getActions().get(0);

        // Use the default DSL to start with
        JSONObject parentDsl = new JSONObject(
                objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));

        ArrayList children = (ArrayList) parentDsl.get("children");

        // Add a reference to the module instance in DSL
        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "testField")));
        firstWidget.put("dynamicBindingPathList", temp);
        firstWidget.put("testField", "{{ " + moduleInstanceDTO.getName() + ".data }}");
        children.add(firstWidget);

        parentDsl.put("children", children);
        PageDTO pageDTO = moduleInstanceTestHelperDTO.getPageDTO();

        Layout layout = pageDTO.getLayouts().get(0);
        layout.setDsl(parentDsl);

        // Call update layout
        Mono<LayoutDTO> updateLayoutMono =
                updateLayoutService.updateLayout(pageDTO.getId(), pageDTO.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {
                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(1);

                    // On load actions should have module instance public action
                    final Set<DslExecutableDTO> firstSet =
                            updatedLayout.getLayoutOnLoadActions().get(0);
                    assertThat(firstSet).hasSize(1);
                    assertThat(firstSet)
                            .allMatch(actionDTO -> publicAction.getName().equals(actionDTO.getName()));

                    // Action updates should show module instance public action with execute on load marked as true
                    assertThat(updatedLayout.getActionUpdates()).hasSize(1);
                    List<LayoutExecutableUpdateDTO> actionUpdates = updatedLayout.getActionUpdates();
                    LayoutExecutableUpdateDTO layoutExecutableUpdateDTO = actionUpdates.get(0);
                    assertThat(layoutExecutableUpdateDTO).isNotNull();
                    assertThat(layoutExecutableUpdateDTO.getName()).isEqualTo(publicAction.getName());
                    assertThat(layoutExecutableUpdateDTO.getExecuteOnLoad()).isTrue();

                    // Toast messages should include module instance name in it
                    assertThat(updatedLayout.getMessages()).hasSize(1);
                    List<String> messages = updatedLayout.getMessages();
                    String message = messages.get(0);
                    assertThat(message)
                            .contains(List.of(moduleInstanceDTO.getName()).toString());
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testOnPageLoadsActions_withModuleInstanceSetToRunOnPageLoad_containsPublicActionInOnLoadActions()
            throws JsonProcessingException {
        // Create a module instance in the app
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);

        ActionViewDTO publicAction =
                createModuleInstanceResponseDTO.getEntities().getActions().get(0);

        // Mark the module instance to run on page load, this equates to marking the public action
        layoutActionService.setExecuteOnLoad(publicAction.getId(), true).block();

        // Use the default DSL to start with
        JSONObject parentDsl = new JSONObject(
                objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));

        PageDTO pageDTO = moduleInstanceTestHelperDTO.getPageDTO();

        Layout layout = pageDTO.getLayouts().get(0);
        layout.setDsl(parentDsl);

        // Call update layout
        Mono<LayoutDTO> updateLayoutMono =
                updateLayoutService.updateLayout(pageDTO.getId(), pageDTO.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {
                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(1);

                    // On load actions should have module instance public action
                    final Set<DslExecutableDTO> firstSet =
                            updatedLayout.getLayoutOnLoadActions().get(0);
                    assertThat(firstSet).hasSize(1);
                    assertThat(firstSet)
                            .allMatch(actionDTO -> publicAction.getName().equals(actionDTO.getName()));
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void
            testOnPageLoadsActions_withActionSetToRunOnPageLoadAndSecondaryModuleInstanceReference_containsPublicActionInOnLoadActions()
                    throws JsonProcessingException {
        // Create a module instance in the app
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();
        ActionViewDTO publicAction =
                createModuleInstanceResponseDTO.getEntities().getActions().get(0);

        // Add a reference to the module instance in page action
        ActionDTO action1 = new ActionDTO();
        action1.setName("firstAction");
        action1.setPageId(moduleInstanceTestHelperDTO.getPageDTO().getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        actionConfiguration1.setBody("{{ " + moduleInstanceDTO.getName() + ".data }}");
        action1.setActionConfiguration(actionConfiguration1);
        action1.setDynamicBindingPathList(List.of(new Property("body", null)));
        action1.setDatasource(moduleInstanceTestHelperDTO.getDatasource());

        // Use the default DSL to start with
        JSONObject parentDsl = new JSONObject(
                objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));

        PageDTO pageDTO = moduleInstanceTestHelperDTO.getPageDTO();

        Layout layout = pageDTO.getLayouts().get(0);
        layout.setDsl(parentDsl);

        ActionDTO createdAction1 =
                layoutActionService.createSingleAction(action1, Boolean.FALSE).block();
        assertThat(createdAction1).isNotNull();

        // Mark the page action to run on page load
        layoutActionService.setExecuteOnLoad(createdAction1.getId(), true).block();

        // Call update layout
        Mono<LayoutDTO> updateLayoutMono =
                updateLayoutService.updateLayout(pageDTO.getId(), pageDTO.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {
                    // On load actions should have module instance public action as well as page action
                    // in that order
                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(2);

                    final Set<DslExecutableDTO> firstSet =
                            updatedLayout.getLayoutOnLoadActions().get(0);
                    assertThat(firstSet).hasSize(1);
                    assertThat(firstSet)
                            .allMatch(actionDTO -> publicAction.getName().equals(actionDTO.getName()));

                    final Set<DslExecutableDTO> secondSet =
                            updatedLayout.getLayoutOnLoadActions().get(1);
                    assertThat(secondSet).hasSize(1);
                    assertThat(secondSet)
                            .allMatch(actionDTO -> createdAction1.getName().equals(actionDTO.getName()));
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void
            testOnPageLoadsActions_withActionReferenceAndSecondaryModuleInstanceReference_containsPublicActionInOnLoadActions()
                    throws JsonProcessingException {
        // Create a module instance in the app
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();
        ActionViewDTO publicAction =
                createModuleInstanceResponseDTO.getEntities().getActions().get(0);

        // Add a reference to the module instance in page action
        ActionDTO action1 = new ActionDTO();
        action1.setName("firstAction");
        action1.setPageId(moduleInstanceTestHelperDTO.getPageDTO().getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        actionConfiguration1.setBody("{{ " + moduleInstanceDTO.getName() + ".data }}");
        action1.setActionConfiguration(actionConfiguration1);
        action1.setDynamicBindingPathList(List.of(new Property("body", null)));
        action1.setDatasource(moduleInstanceTestHelperDTO.getDatasource());

        // Use the default DSL to start with
        JSONObject parentDsl = new JSONObject(
                objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));

        ArrayList children = (ArrayList) parentDsl.get("children");

        // Add a reference to the module instance in DSL
        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "testField")));
        firstWidget.put("dynamicBindingPathList", temp);
        firstWidget.put("testField", "{{ firstAction.data }}");
        children.add(firstWidget);

        parentDsl.put("children", children);
        PageDTO pageDTO = moduleInstanceTestHelperDTO.getPageDTO();

        Layout layout = pageDTO.getLayouts().get(0);
        layout.setDsl(parentDsl);

        ActionDTO createdAction1 =
                layoutActionService.createSingleAction(action1, Boolean.FALSE).block();
        assertThat(createdAction1).isNotNull();

        // Call update layout
        Mono<LayoutDTO> updateLayoutMono =
                updateLayoutService.updateLayout(pageDTO.getId(), pageDTO.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {
                    // On load actions should have module instance public action as well as page action
                    // in that order
                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(2);

                    final Set<DslExecutableDTO> firstSet =
                            updatedLayout.getLayoutOnLoadActions().get(0);
                    assertThat(firstSet).hasSize(1);
                    assertThat(firstSet)
                            .allMatch(actionDTO -> publicAction.getName().equals(actionDTO.getName()));

                    final Set<DslExecutableDTO> secondSet =
                            updatedLayout.getLayoutOnLoadActions().get(1);
                    assertThat(secondSet).hasSize(1);
                    assertThat(secondSet)
                            .allMatch(actionDTO -> createdAction1.getName().equals(actionDTO.getName()));

                    // Action updates should show page action and module instance public action,
                    // with execute on load marked as true
                    assertThat(updatedLayout.getActionUpdates()).hasSize(2);
                    List<LayoutExecutableUpdateDTO> actionUpdates = updatedLayout.getActionUpdates();
                    assertThat(actionUpdates)
                            .allMatch(actionDTO -> Set.of(publicAction.getName(), createdAction1.getName())
                                    .contains(actionDTO.getName()));

                    // Toast messages should include page action name and module instance name in it
                    assertThat(updatedLayout.getMessages()).hasSize(1);
                    List<String> messages = updatedLayout.getMessages();
                    String message = messages.get(0);
                    assertThat(message).contains(List.of(moduleInstanceDTO.getName(), createdAction1.getName()));
                })
                .verifyComplete();
    }
}
