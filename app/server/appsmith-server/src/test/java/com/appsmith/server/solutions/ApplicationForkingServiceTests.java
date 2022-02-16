package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.junit.Before;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Always run the complete test suite here as TCs have dependency between them. We are controlling this with
 * FixMethodOrder(MethodSorters.NAME_ASCENDING) to run the TCs in a sequence. Running TC in a sequence is a bad
 * practice for unit TCs but here we are actually executing a integration test where we are first inviting user and then
 * forking the application
 *
 */
@Slf4j
@RunWith(SpringRunner.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
@SpringBootTest
@DirtiesContext
public class ApplicationForkingServiceTests {

    @Autowired
    private ApplicationForkingService applicationForkingService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private ActionCollectionService actionCollectionService;

    @Autowired
    private PluginRepository pluginRepository;

    @Autowired
    private EncryptionService encryptionService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private LayoutActionService layoutActionService;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private UserService userService;

    @Autowired
    private LayoutCollectionService layoutCollectionService;

    private static String sourceAppId;

    private static String testUserOrgId;

    private static boolean isSetupDone = false;

    @SneakyThrows
    @Before
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        // Run setup only once
        if (isSetupDone) {
            return;
        }


        Organization sourceOrganization = new Organization();
        sourceOrganization.setName("Source Organization");
        organizationService.create(sourceOrganization).map(Organization::getId).block();

        Application app1 = new Application();
        app1.setName("1 - public app");
        app1.setOrganizationId(sourceOrganization.getId());
        app1.setForkingEnabled(true);
        app1 = applicationPageService.createApplication(app1).block();
        sourceAppId = app1.getId();

        PageDTO testPage = newPageService.findPageById(app1.getPages().get(0).getId(), READ_PAGES, false).block();

        // Save action
        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setOrganizationId(app1.getOrganizationId());
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

        layoutActionService.createSingleAction(action).block();

        ObjectMapper objectMapper = new ObjectMapper();
        JSONObject parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
        }));

        ArrayList children = (ArrayList) parentDsl.get("children");
        JSONObject testWidget = new JSONObject();
        testWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        testWidget.put("dynamicBindingPathList", temp);
        testWidget.put("testField", "{{ forkActionTest.data }}");
        children.add(testWidget);

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(parentDsl);

        layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();

        // Save actionCollection
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection1");
        actionCollectionDTO.setPageId(app1.getPages().get(0).getId());
        actionCollectionDTO.setApplicationId(sourceAppId);
        actionCollectionDTO.setOrganizationId(sourceOrganization.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        actionCollectionDTO.setBody("collectionBody");
        ActionDTO action1 = new ActionDTO();
        action1.setName("forkTestAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO.setActions(List.of(action1));
        actionCollectionDTO.setPluginType(PluginType.JS);

        layoutCollectionService.createCollection(actionCollectionDTO).block();

        // Invite "usertest@usertest.com" with VIEW access, api_user will be the admin of sourceOrganization and we are
        // controlling this with @FixMethodOrder(MethodSorters.NAME_ASCENDING) to run the TCs in a sequence.
        // Running TC in a sequence is a bad practice for unit TCs but here we are testing the invite user and then fork
        // application as a part of this flow.
        // We need to test with VIEW user access so that any user should be able to fork template applications
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> users = new ArrayList<>();
        users.add("usertest@usertest.com");
        inviteUsersDTO.setUsernames(users);
        inviteUsersDTO.setOrgId(sourceOrganization.getId());
        inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_VIEWER.getName());
        userService.inviteUsers(inviteUsersDTO, "http://localhost:8080").block();

        isSetupDone = true;
    }

    private static class OrganizationData {
        Organization organization;
        List<Application> applications = new ArrayList<>();
        List<Datasource> datasources = new ArrayList<>();
        List<ActionDTO> actions = new ArrayList<>();
    }

    public Mono<OrganizationData> loadOrganizationData(Organization organization) {
        final OrganizationData data = new OrganizationData();
        data.organization = organization;

        return Mono
                .when(
                        applicationService
                                .findByOrganizationId(organization.getId(), READ_APPLICATIONS)
                                .map(data.applications::add),
                        datasourceService
                                .findAllByOrganizationId(organization.getId(), READ_DATASOURCES)
                                .map(data.datasources::add),
                        getActionsInOrganization(organization)
                                .map(data.actions::add)
                )
                .thenReturn(data);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test1_cloneOrganizationWithItsContents() {

        Organization targetOrganization = new Organization();
        targetOrganization.setName("Target Organization");

        final Mono<Application> resultMono = organizationService.create(targetOrganization)
                .map(Organization::getId)
                .flatMap(targetOrganizationId ->
                        applicationForkingService.forkApplicationToOrganization(sourceAppId, targetOrganizationId)
                );

        StepVerifier.create(resultMono
                .zipWhen(application -> Mono.zip(
                        newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES).collectList()
                )))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();

                    assertThat(application).isNotNull();
                    assertThat(application.getName()).isEqualTo("1 - public app");
                    assertThat(application.getPages().get(0).getDefaultPageId())
                            .isEqualTo(application.getPages().get(0).getId());
                    assertThat(application.getPublishedPages().get(0).getDefaultPageId())
                            .isEqualTo(application.getPublishedPages().get(0).getId());

                    assertThat(pageList).isNotEmpty();
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getDefaultResources()).isNotNull();
                        assertThat(newPage.getDefaultResources().getPageId()).isEqualTo(newPage.getId());
                        assertThat(newPage.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        newPage.getUnpublishedPage()
                                .getLayouts()
                                .forEach(layout ->
                                        layout.getLayoutOnLoadActions().forEach(dslActionDTOS -> {
                                            dslActionDTOS.forEach(actionDTO -> {
                                                assertThat(actionDTO.getId()).isEqualTo(actionDTO.getDefaultActionId());
                                            });
                                        })
                                );
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getDefaultResources()).isNotNull();
                        assertThat(newAction.getDefaultResources().getActionId()).isEqualTo(newAction.getId());
                        assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        ActionDTO action = newAction.getUnpublishedAction();
                        assertThat(action.getDefaultResources()).isNotNull();
                        assertThat(action.getDefaultResources().getPageId()).isEqualTo(application.getPages().get(0).getId());
                        if (!StringUtils.isEmpty(action.getDefaultResources().getCollectionId())) {
                            assertThat(action.getDefaultResources().getCollectionId()).isEqualTo(action.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getDefaultResources()).isNotNull();
                        assertThat(actionCollection.getDefaultResources().getCollectionId()).isEqualTo(actionCollection.getId());
                        assertThat(actionCollection.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                        assertThat(unpublishedCollection.getDefaultToBranchedActionIdsMap())
                                .hasSize(1);
                        unpublishedCollection.getDefaultToBranchedActionIdsMap().keySet()
                                .forEach(key ->
                                    assertThat(key).isEqualTo(unpublishedCollection.getDefaultToBranchedActionIdsMap().get(key))
                                );

                        assertThat(unpublishedCollection.getDefaultResources()).isNotNull();
                        assertThat(unpublishedCollection.getDefaultResources().getPageId())
                                .isEqualTo(application.getPages().get(0).getId());
                    });

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void test2_forkApplicationWithReadApplicationUserAccess() {

        Organization targetOrganization = new Organization();
        targetOrganization.setName("test-user-organization");

        final Mono<Application> resultMono = organizationService.create(targetOrganization)
                .flatMap(organization -> {
                    testUserOrgId = organization.getId();
                    return applicationForkingService.forkApplicationToOrganization(sourceAppId, organization.getId());
                });

        StepVerifier.create(resultMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.getName()).isEqualTo("1 - public app");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test3_failForkApplicationWithInvalidPermission() {

        final Mono<Application> resultMono = applicationForkingService.forkApplicationToOrganization(sourceAppId, testUserOrgId);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.ORGANIZATION, testUserOrgId)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test4_validForkApplication_cancelledMidWay_createValidApplication() {

        Organization targetOrganization = new Organization();
        targetOrganization.setName("Target Organization");
        targetOrganization = organizationService.create(targetOrganization).block();

        // Trigger the fork application flow
        applicationForkingService.forkApplicationToOrganization(sourceAppId, targetOrganization.getId())
                .timeout(Duration.ofMillis(10))
                .subscribe();

        // Wait for fork to complete
        Mono<Application> forkedAppFromDbMono = Mono.just(targetOrganization)
                .flatMap(organization -> {
                    try {
                        // Before fetching the forked application, sleep for 5 seconds to ensure that the forking finishes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationService.findByOrganizationId(organization.getId(), READ_APPLICATIONS).next();
                })
                .cache();

        StepVerifier
                .create(forkedAppFromDbMono.zipWhen(application ->
                        Mono.zip(
                                newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES).collectList()))
                )
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();

                    assertThat(application).isNotNull();
                    assertThat(application.getName()).isEqualTo("1 - public app");
                    assertThat(application.getPages().get(0).getDefaultPageId())
                            .isEqualTo(application.getPages().get(0).getId());
                    assertThat(application.getPublishedPages().get(0).getDefaultPageId())
                            .isEqualTo(application.getPublishedPages().get(0).getId());

                    assertThat(pageList).isNotEmpty();
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getDefaultResources()).isNotNull();
                        assertThat(newPage.getDefaultResources().getPageId()).isEqualTo(newPage.getId());
                        assertThat(newPage.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        newPage.getUnpublishedPage()
                                .getLayouts()
                                .forEach(layout ->
                                        layout.getLayoutOnLoadActions().forEach(dslActionDTOS -> {
                                            dslActionDTOS.forEach(actionDTO -> {
                                                assertThat(actionDTO.getId()).isEqualTo(actionDTO.getDefaultActionId());
                                            });
                                        })
                                );
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getDefaultResources()).isNotNull();
                        assertThat(newAction.getDefaultResources().getActionId()).isEqualTo(newAction.getId());
                        assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        ActionDTO action = newAction.getUnpublishedAction();
                        assertThat(action.getDefaultResources()).isNotNull();
                        assertThat(action.getDefaultResources().getPageId()).isEqualTo(application.getPages().get(0).getId());
                        if (!StringUtils.isEmpty(action.getDefaultResources().getCollectionId())) {
                            assertThat(action.getDefaultResources().getCollectionId()).isEqualTo(action.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getDefaultResources()).isNotNull();
                        assertThat(actionCollection.getDefaultResources().getCollectionId()).isEqualTo(actionCollection.getId());
                        assertThat(actionCollection.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                        assertThat(unpublishedCollection.getDefaultToBranchedActionIdsMap())
                                .hasSize(1);
                        unpublishedCollection.getDefaultToBranchedActionIdsMap().keySet()
                                .forEach(key ->
                                        assertThat(key).isEqualTo(unpublishedCollection.getDefaultToBranchedActionIdsMap().get(key))
                                );

                        assertThat(unpublishedCollection.getDefaultResources()).isNotNull();
                        assertThat(unpublishedCollection.getDefaultResources().getPageId())
                                .isEqualTo(application.getPages().get(0).getId());
                    });
                })
                .verifyComplete();

    }

    private Flux<ActionDTO> getActionsInOrganization(Organization organization) {
        return applicationService
                .findByOrganizationId(organization.getId(), READ_APPLICATIONS)
                // fetch the unpublished pages
                .flatMap(application -> newPageService.findByApplicationId(application.getId(), READ_PAGES, false))
                .flatMap(page -> newActionService.getUnpublishedActionsExceptJs(new LinkedMultiValueMap<>(
                        Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId())))));
    }
}
