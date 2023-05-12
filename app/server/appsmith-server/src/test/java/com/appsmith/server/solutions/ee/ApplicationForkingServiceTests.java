package com.appsmith.server.solutions.ee;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationForkingService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_DATASOURCE;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@ExtendWith(SpringExtension.class)
@TestMethodOrder(MethodOrderer.MethodName.class)
@SpringBootTest
@DirtiesContext
public class ApplicationForkingServiceTests {

    @Autowired
    ApplicationForkingService applicationForkingService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    EncryptionService encryptionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    MongoTemplate mongoTemplate;

    @Autowired
    NewPageService newPageService;

    @Autowired
    UserService userService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    ThemeService themeService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    NewPageRepository newPageRepository;

    @Autowired
    WorkspaceRepository workspaceRepository;

    private static String sourceAppId;

    private static boolean isSetupDone = false;

    @SneakyThrows
    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        // Run setup only once
        if (isSetupDone) {
            return;
        }


        Workspace sourceWorkspace = new Workspace();
        sourceWorkspace.setName("Source Workspace");
        sourceWorkspace = workspaceService.create(sourceWorkspace).block();

        Application app1 = new Application();
        app1.setName("1 - public app");
        app1.setWorkspaceId(sourceWorkspace.getId());
        app1.setForkingEnabled(true);
        app1 = applicationPageService.createApplication(app1).block();
        sourceAppId = app1.getId();

        PageDTO testPage = newPageService.findPageById(app1.getPages().get(0).getId(), READ_PAGES, false).block();

        // Save action
        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(app1.getWorkspaceId());
        Plugin installed_plugin = pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        ActionDTO action = new ActionDTO();
        action.setName("forkActionTest");
        action.setPageId(app1.getPages().get(0).getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        layoutActionService.createSingleAction(action, Boolean.FALSE).block();


        // Save actionCollection
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection1");
        actionCollectionDTO.setPageId(app1.getPages().get(0).getId());
        actionCollectionDTO.setApplicationId(sourceAppId);
        actionCollectionDTO.setWorkspaceId(sourceWorkspace.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        actionCollectionDTO.setBody("export default {\n" +
                "\tgetData: async () => {\n" +
                "\t\tconst data = await forkActionTest.run();\n" +
                "\t\treturn data;\n" +
                "\t}\n" +
                "}");
        ActionDTO action1 = new ActionDTO();
        action1.setName("getData");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody(
                "async () => {\n" +
                        "\t\tconst data = await forkActionTest.run();\n" +
                        "\t\treturn data;\n" +
                        "\t}");
        actionCollectionDTO.setActions(List.of(action1));
        actionCollectionDTO.setPluginType(PluginType.JS);

        layoutCollectionService.createCollection(actionCollectionDTO).block();

        ObjectMapper objectMapper = new ObjectMapper();
        JSONObject parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
        }));
        ArrayList children = (ArrayList) parentDsl.get("children");
        JSONObject testWidget = new JSONObject();
        testWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField", "key1", "testField1"))));
        testWidget.put("dynamicBindingPathList", temp);
        testWidget.put("testField", "{{ forkActionTest.data }}");
        children.add(testWidget);

        JSONObject secondWidget = new JSONObject();
        secondWidget.put("widgetName", "secondWidget");
        temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField1"))));
        secondWidget.put("dynamicBindingPathList", temp);
        secondWidget.put("testField1", "{{ testCollection1.getData.data }}");
        children.add(secondWidget);

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(parentDsl);

        layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout).block();
        // Invite "usertest@usertest.com" with VIEW access, api_user will be the admin of sourceWorkspace and we are
        // controlling this with @FixMethodOrder(MethodSorters.NAME_ASCENDING) to run the TCs in a sequence.
        // Running TC in a sequence is a bad practice for unit TCs but here we are testing the invite user and then fork
        // application as a part of this flow.
        // We need to test with VIEW user access so that any user should be able to fork template applications
        PermissionGroup permissionGroup = permissionGroupService.getByDefaultWorkspace(sourceWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList().block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.VIEWER))
                .findFirst().get();
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> users = new ArrayList<>();
        users.add("usertest@usertest.com");
        inviteUsersDTO.setUsernames(users);
        inviteUsersDTO.setPermissionGroupId(permissionGroup.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "http://localhost:8080").block();

        isSetupDone = true;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test5_failForkApplication_noPageEditPermission() {
        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("Target Workspace");
        targetWorkspace = workspaceService.create(targetWorkspace).block();

        Application application = applicationService.findById(sourceAppId).block();
        String appPageId = application.getPages().get(0).getId();
        NewPage appPage = newPageRepository.findById(appPageId).block();
        Set<Policy> existingPolicies = appPage.getPolicies();
        /*
         * We take away all Manage Page permissions for existing page.
         * Now since, no one has the permissions to existing page, the application forking will fail.
         */
        Set<Policy> newPoliciesWithoutEdit = existingPolicies.stream()
                .filter(policy -> !policy.getPermission().equals(MANAGE_PAGES.getValue()))
                .collect(Collectors.toSet());
        appPage.setPolicies(newPoliciesWithoutEdit);
        NewPage updatedGitAppPage = newPageRepository.save(appPage).block();

        final Mono<ApplicationImportDTO> resultMono = applicationForkingService.forkApplicationToWorkspace(sourceAppId, targetWorkspace.getId(), null);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.APPLICATION_NOT_FORKED_MISSING_PERMISSIONS
                                .getMessage("page", appPageId)))
                .verify();
        updatedGitAppPage.setPolicies(existingPolicies);
        NewPage setPoliciesBack = newPageRepository.save(updatedGitAppPage).block();

        Mono<List<Application>> applicationsInWorkspace = applicationService.findAllApplicationsByWorkspaceId(targetWorkspace.getId()).collectList();
        /*
         * Check that no applications have been created in the Target Workspace
         */
        StepVerifier.create(applicationsInWorkspace).assertNext(applications -> assertThat(applications).isEmpty());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test6_failForkApplication_noDatasourceCreatePermission() {
        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("Target Workspace");
        targetWorkspace = workspaceService.create(targetWorkspace).block();
        final String workspaceId = targetWorkspace.getId();

        Set<Policy> existingPolicies = targetWorkspace.getPolicies();
        /*
         * We take away Workspace Datasource Permission for Target Workspace.
         * Now since, no one has the permissions for Target Workspace, the application forking will fail.
         */
        Set<Policy> newPoliciesWithoutCreateDatasource = existingPolicies.stream()
                .filter(policy -> !policy.getPermission().equals(WORKSPACE_CREATE_DATASOURCE.getValue()))
                .collect(Collectors.toSet());
        targetWorkspace.setPolicies(newPoliciesWithoutCreateDatasource);
        Workspace updatedargetWorkspace = workspaceRepository.save(targetWorkspace).block();

        final Mono<ApplicationImportDTO> resultMono = applicationForkingService.forkApplicationToWorkspace(sourceAppId, targetWorkspace.getId(), null);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.APPLICATION_NOT_FORKED_MISSING_PERMISSIONS
                                .getMessage("workspace", workspaceId)))
                .verify();
        targetWorkspace.setPolicies(existingPolicies);
        Workspace setPoliciesBack = workspaceRepository.save(updatedargetWorkspace).block();

        Mono<List<Application>> applicationsInWorkspace = applicationService.findAllApplicationsByWorkspaceId(targetWorkspace.getId()).collectList();
        /*
         * Check that no applications have been created in the Target Workspace
         */
        StepVerifier.create(applicationsInWorkspace).assertNext(applications -> assertThat(applications).isEmpty());
    }
}