package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ActionCollectionServiceTest {

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    UserOrganizationService userOrganizationService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    Application testApp = null;

    PageDTO testPage = null;

    Datasource datasource;

    String orgId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {

        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
        Organization organization = organizationService.getById(orgId).block();

        if (testApp == null && testPage == null) {
            //Create application and page which will be used by the tests to create actions for.
            Application application = new Application();
            application.setName(UUID.randomUUID().toString());
            testApp = applicationPageService.createApplication(application, organization.getId()).block();

            final String pageId = testApp.getPages().get(0).getId();

            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();

            Layout layout = testPage.getLayouts().get(0);
            JSONObject dsl = new JSONObject(Map.of("text", "{{ query1.data }}"));

            JSONObject dsl2 = new JSONObject();
            dsl2.put("widgetName", "Table1");
            dsl2.put("type", "TABLE_WIDGET");
            Map<String, Object> primaryColumns = new HashMap<>();
            JSONObject jsonObject = new JSONObject(Map.of("key", "value"));
            primaryColumns.put("_id", "{{ query1.data }}");
            primaryColumns.put("_class", jsonObject);
            dsl2.put("primaryColumns", primaryColumns);
            final ArrayList<Object> objects = new ArrayList<>();
            JSONArray temp2 = new JSONArray();
            temp2.addAll(List.of(new JSONObject(Map.of("key", "primaryColumns._id"))));
            dsl2.put("dynamicBindingPathList", temp2);
            objects.add(dsl2);
            dsl.put("children", objects);

            layout.setDsl(dsl);
            layout.setPublishedDsl(dsl);
        }

        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg.getId();
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setOrganizationId(orgId);
        Plugin installed_plugin = pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
    }

    @After
    @WithUserDetails(value = "api_user")
    public void cleanup() {
        applicationPageService.deleteApplication(testApp.getId()).block();
        testApp = null;
        testPage = null;

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidActionCollectionAndCheckPermissions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Policy manageActionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readActionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("validActionCollection");
        actionCollectionDTO.setName("testActionCollection");
        actionCollectionDTO.setApplicationId(testApp.getId());
        actionCollectionDTO.setOrganizationId(testApp.getOrganizationId());
        actionCollectionDTO.setPageId(testPage.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);

        Mono<ActionCollection> actionCollectionMono = actionCollectionService.createCollection(actionCollectionDTO)
                .flatMap(createdCollection -> actionCollectionService.findById(createdCollection.getId(), READ_ACTIONS));

        StepVerifier
                .create(actionCollectionMono)
                .assertNext(createdActionCollection -> {
                    assertThat(createdActionCollection.getId()).isNotEmpty();
                    assertThat(createdActionCollection.getUnpublishedCollection().getName()).isEqualTo(actionCollectionDTO.getName());
                    assertThat(createdActionCollection.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addUserToOrganizationAsAdminAndCheckActionCollectionPermissions() {

        // Create action collection
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testActionCollection");
        actionCollectionDTO.setApplicationId(testApp.getId());
        actionCollectionDTO.setOrganizationId(testApp.getOrganizationId());
        actionCollectionDTO.setPageId(testPage.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);
        ActionCollectionDTO actionCollection =
                actionCollectionService.createCollection(actionCollectionDTO).block();

        UserRole userRole = new UserRole();
        userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
        userRole.setUsername("usertest@usertest.com");

        userOrganizationService.addUserRoleToOrganization(testApp.getOrganizationId(), userRole).block();

        assert actionCollection != null;
        Mono<ActionCollection> readActionCollectionMono =
                actionCollectionService.findById(actionCollection.getId(), READ_ACTIONS)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "ActionCollection", actionCollection.getId())));

        StepVerifier
                .create(readActionCollectionMono)
                .assertNext(updatedActionCollection -> {

                    Policy manageActionCollectionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();
                    Policy readActionCollectionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();
                    Policy executeActionCollectionPolicy = Policy.builder().permission(EXECUTE_ACTIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    assertThat(updatedActionCollection.getPolicies()).isNotEmpty();
                    assertThat(updatedActionCollection.getPolicies())
                            .containsAll(Set.of(
                                    manageActionCollectionPolicy,
                                    readActionCollectionPolicy,
                                    executeActionCollectionPolicy));

                })
                .verifyComplete();
    }
}
