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
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.Theme;
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
import com.appsmith.server.services.ThemeService;
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
import reactor.util.function.Tuple3;
import reactor.util.function.Tuple4;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

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

    @Autowired
    private ThemeService themeService;

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


        // Save actionCollection
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection1");
        actionCollectionDTO.setPageId(app1.getPages().get(0).getId());
        actionCollectionDTO.setApplicationId(sourceAppId);
        actionCollectionDTO.setOrganizationId(sourceOrganization.getId());
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

        layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();
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
                                .forEach(layout -> {
                                        assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                                        layout.getLayoutOnLoadActions().forEach(dslActionDTOS -> {
                                            assertThat(dslActionDTOS).hasSize(2);
                                            dslActionDTOS.forEach(actionDTO -> {
                                                assertThat(actionDTO.getId()).isEqualTo(actionDTO.getDefaultActionId());
                                                if (!StringUtils.isEmpty(actionDTO.getCollectionId())) {
                                                    assertThat(actionDTO.getCollectionId()).isEqualTo(actionDTO.getDefaultCollectionId());
                                                }
                                            });
                                        });
                                    }
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

    @Test
    @WithUserDetails("api_user")
    public void forkApplicationToOrganization_WhenAppHasUnsavedThemeCustomization_ForkedWithCustomizations() {
        String uniqueString = UUID.randomUUID().toString();
        Organization organization = new Organization();
        organization.setName("org_" + uniqueString);

        Mono<Tuple4<Theme, Theme, Application, Application>> tuple4Mono = organizationService.create(organization)
                .flatMap(createdOrg -> {
                    Application application = new Application();
                    application.setName("app_" + uniqueString);
                    return applicationPageService.createApplication(application, createdOrg.getId());
                }).flatMap(srcApplication -> {
                    Theme theme = new Theme();
                    theme.setDisplayName("theme_" + uniqueString);
                    return themeService.updateTheme(srcApplication.getId(), null, theme)
                            .then(applicationService.findById(srcApplication.getId()));
                }).flatMap(srcApplication -> {
                    Organization desOrg = new Organization();
                    desOrg.setName("org_dest_" + uniqueString);
                    return organizationService.create(desOrg).flatMap(createdOrg ->
                            applicationForkingService.forkApplicationToOrganization(srcApplication.getId(), createdOrg.getId())
                    ).zipWith(Mono.just(srcApplication));
                }).flatMap(applicationTuple2 -> {
                    Application forkedApp = applicationTuple2.getT1();
                    Application srcApp = applicationTuple2.getT2();
                    return Mono.zip(
                            themeService.getApplicationTheme(forkedApp.getId(), ApplicationMode.EDIT, null),
                            themeService.getApplicationTheme(forkedApp.getId(), ApplicationMode.PUBLISHED, null),
                            Mono.just(forkedApp),
                            Mono.just(srcApp)
                    );
                });

        StepVerifier.create(tuple4Mono).assertNext(objects -> {
            Theme editModeTheme = objects.getT1();
            Theme publishedModeTheme = objects.getT2();
            Application forkedApp = objects.getT3();
            Application srcApp = objects.getT4();

            assertThat(forkedApp.getEditModeThemeId()).isEqualTo(editModeTheme.getId());
            assertThat(forkedApp.getPublishedModeThemeId()).isEqualTo(publishedModeTheme.getId());
            assertThat(forkedApp.getEditModeThemeId()).isNotEqualTo(forkedApp.getPublishedModeThemeId());

            // published mode should have the custom theme as we publish after forking the app
            assertThat(publishedModeTheme.isSystemTheme()).isFalse();
            // published mode theme will have no application id and org id set as the customizations were not saved
            assertThat(publishedModeTheme.getOrganizationId()).isNullOrEmpty();
            assertThat(publishedModeTheme.getApplicationId()).isNullOrEmpty();

            // edit mode theme should be a custom one
            assertThat(editModeTheme.isSystemTheme()).isFalse();
            // edit mode theme will have no application id and org id set as the customizations were not saved
            assertThat(editModeTheme.getOrganizationId()).isNullOrEmpty();
            assertThat(editModeTheme.getApplicationId()).isNullOrEmpty();

            // forked theme should have the same name as src theme
            assertThat(editModeTheme.getDisplayName()).isEqualTo("theme_" + uniqueString);
            assertThat(publishedModeTheme.getDisplayName()).isEqualTo("theme_" + uniqueString);

            // forked application should have a new edit mode theme created, should not be same as src app theme
            assertThat(srcApp.getEditModeThemeId()).isNotEqualTo(forkedApp.getEditModeThemeId());
            assertThat(srcApp.getPublishedModeThemeId()).isNotEqualTo(forkedApp.getPublishedModeThemeId());
        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void forkApplicationToOrganization_WhenAppHasSystemTheme_SystemThemeSet() {
        String uniqueString = UUID.randomUUID().toString();
        Organization organization = new Organization();
        organization.setName("org_" + uniqueString);

        Mono<Tuple3<Theme, Application, Application>> tuple3Mono = organizationService.create(organization)
                .flatMap(createdOrg -> {
                    Application application = new Application();
                    application.setName("app_" + uniqueString);
                    return applicationPageService.createApplication(application, createdOrg.getId());
                }).flatMap(srcApplication -> {
                    Organization desOrg = new Organization();
                    desOrg.setName("org_dest_" + uniqueString);
                    return organizationService.create(desOrg).flatMap(createdOrg ->
                            applicationForkingService.forkApplicationToOrganization(srcApplication.getId(), createdOrg.getId())
                    ).zipWith(Mono.just(srcApplication));
                }).flatMap(applicationTuple2 -> {
                    Application forkedApp = applicationTuple2.getT1();
                    Application srcApp = applicationTuple2.getT2();
                    return Mono.zip(
                            themeService.getApplicationTheme(forkedApp.getId(), ApplicationMode.EDIT, null),
                            Mono.just(forkedApp),
                            Mono.just(srcApp)
                    );
                });

        StepVerifier.create(tuple3Mono).assertNext(objects -> {
            Theme editModeTheme = objects.getT1();
            Application forkedApp = objects.getT2();
            Application srcApp = objects.getT3();

            // same theme should be set to edit mode and published mode
            assertThat(forkedApp.getEditModeThemeId()).isEqualTo(editModeTheme.getId());
            assertThat(forkedApp.getPublishedModeThemeId()).isEqualTo(editModeTheme.getId());

            // edit mode theme should be system theme
            assertThat(editModeTheme.isSystemTheme()).isTrue();
            // edit mode theme will have no application id and org id set as it's system theme
            assertThat(editModeTheme.getOrganizationId()).isNullOrEmpty();
            assertThat(editModeTheme.getApplicationId()).isNullOrEmpty();

            // forked theme should be default theme
            assertThat(editModeTheme.getName()).isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);

            // forked application should have same theme set
            assertThat(srcApp.getEditModeThemeId()).isEqualTo(forkedApp.getEditModeThemeId());
        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void forkApplicationToOrganization_WhenAppHasCustomSavedTheme_NewCustomThemeCreated() {
        String uniqueString = UUID.randomUUID().toString();
        Organization organization = new Organization();
        organization.setName("org_" + uniqueString);

        Mono<Tuple4<Theme, Theme, Application, Application>> tuple4Mono = organizationService.create(organization)
                .flatMap(createdOrg -> {
                    Application application = new Application();
                    application.setName("app_" + uniqueString);
                    return applicationPageService.createApplication(application, createdOrg.getId());
                }).flatMap(srcApplication -> {
                    Theme theme = new Theme();
                    theme.setDisplayName("theme_" + uniqueString);
                    return themeService.updateTheme(srcApplication.getId(), null, theme)
                            .then(themeService.persistCurrentTheme(srcApplication.getId(), null, theme))
                            .then(applicationService.findById(srcApplication.getId()));
                }).flatMap(srcApplication -> {
                    Organization desOrg = new Organization();
                    desOrg.setName("org_dest_" + uniqueString);
                    return organizationService.create(desOrg).flatMap(createdOrg ->
                            applicationForkingService.forkApplicationToOrganization(srcApplication.getId(), createdOrg.getId())
                    ).zipWith(Mono.just(srcApplication));
                }).flatMap(applicationTuple2 -> {
                    Application forkedApp = applicationTuple2.getT1();
                    Application srcApp = applicationTuple2.getT2();
                    return Mono.zip(
                            themeService.getApplicationTheme(forkedApp.getId(), ApplicationMode.EDIT, null),
                            themeService.getApplicationTheme(forkedApp.getId(), ApplicationMode.PUBLISHED, null),
                            Mono.just(forkedApp),
                            Mono.just(srcApp)
                    );
                });

        StepVerifier.create(tuple4Mono).assertNext(objects -> {
            Theme editModeTheme = objects.getT1();
            Theme publishedModeTheme = objects.getT2();
            Application forkedApp = objects.getT3();
            Application srcApp = objects.getT4();

            assertThat(forkedApp.getEditModeThemeId()).isEqualTo(editModeTheme.getId());
            assertThat(forkedApp.getPublishedModeThemeId()).isEqualTo(publishedModeTheme.getId());
            assertThat(forkedApp.getEditModeThemeId()).isNotEqualTo(forkedApp.getPublishedModeThemeId());

            // published mode should have the custom theme as we publish after forking the app
            assertThat(publishedModeTheme.isSystemTheme()).isFalse();

            // published mode theme will have no application id and org id set as it's a copy
            assertThat(publishedModeTheme.getOrganizationId()).isNullOrEmpty();
            assertThat(publishedModeTheme.getApplicationId()).isNullOrEmpty();

            // edit mode theme should be a custom one
            assertThat(editModeTheme.isSystemTheme()).isFalse();

            // edit mode theme will have application id and org id set as the customizations were saved
            assertThat(editModeTheme.getOrganizationId()).isNullOrEmpty();
            assertThat(editModeTheme.getApplicationId()).isNullOrEmpty();

            // forked theme should have the same name as src theme
            assertThat(editModeTheme.getDisplayName()).isEqualTo("theme_" + uniqueString);
            assertThat(publishedModeTheme.getDisplayName()).isEqualTo("theme_" + uniqueString);

            // forked application should have a new edit mode theme created, should not be same as src app theme
            assertThat(srcApp.getEditModeThemeId()).isNotEqualTo(forkedApp.getEditModeThemeId());
            assertThat(srcApp.getPublishedModeThemeId()).isNotEqualTo(forkedApp.getPublishedModeThemeId());
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void forkApplication_deletePageAfterBeingPublished_deletedPageIsNotCloned() {

        Organization targetOrganization = new Organization();
        targetOrganization.setName("delete-edit-mode-page-target-org");
        targetOrganization = organizationService.create(targetOrganization).block();
        assert targetOrganization != null;
        final String targetOrgId = targetOrganization.getId();

        Organization srcOrganization = new Organization();
        srcOrganization.setName("delete-edit-mode-page-src-org");
        srcOrganization = organizationService.create(srcOrganization).block();

        Application application = new Application();
        application.setName("delete-edit-mode-page-app");
        assert srcOrganization != null;
        final String originalAppId = Objects.requireNonNull(applicationPageService.createApplication(application, srcOrganization.getId()).block()).getId();
        PageDTO pageDTO = new PageDTO();
        pageDTO.setName("delete-edit-mode-page");
        pageDTO.setApplicationId(originalAppId);
        final String pageId = Objects.requireNonNull(applicationPageService.createPage(pageDTO).block()).getId();
        final Mono<Application> resultMono = applicationPageService.publish(originalAppId, true)
                .flatMap(ignored -> applicationPageService.deleteUnpublishedPage(pageId))
                .flatMap(page -> applicationForkingService.forkApplicationToOrganization(pageDTO.getApplicationId(), targetOrgId));

        StepVerifier.create(resultMono
                        .zipWhen(application1 -> newPageService.findNewPagesByApplicationId(application1.getId(), READ_PAGES).collectList()
                                .zipWith(newPageService.findNewPagesByApplicationId(originalAppId, READ_PAGES).collectList())))
                .assertNext(tuple -> {
                    Application forkedApplication = tuple.getT1();
                    List<NewPage> forkedPages = tuple.getT2().getT1();
                    List<NewPage> originalPages = tuple.getT2().getT2();

                    assertThat(forkedApplication).isNotNull();
                    assertThat(forkedPages).hasSize(1);
                    assertThat(originalPages).hasSize(2);
                    forkedPages.forEach(newPage -> assertThat(newPage.getUnpublishedPage().getName()).isNotEqualTo(pageDTO.getName()));
                    NewPage deletedPage = originalPages.stream()
                            .filter(newPage -> pageDTO.getName().equals(newPage.getUnpublishedPage().getName()))
                            .findAny()
                            .orElse(null);
                    assert deletedPage != null;
                    assertThat(deletedPage.getUnpublishedPage().getName()).isEqualTo(pageDTO.getName());
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

    @Test
    @WithUserDetails(value = "api_user")
    public void forkGitConnectedApplication_defaultBranchUpdated_forkDefaultBranchApplication() {
        String uniqueString = UUID.randomUUID().toString();
        Organization organization = new Organization();
        organization.setName("org_" + uniqueString);

        Mono<Application> applicationMono = organizationService.create(organization)
                .flatMap(createdOrg -> {
                    Application application = new Application();
                    application.setName("app_" + uniqueString);
                    return applicationPageService.createApplication(application, createdOrg.getId());
                }).flatMap(srcApplication -> {
                    Theme theme = new Theme();
                    theme.setDisplayName("theme_" + uniqueString);
                    GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
                    gitApplicationMetadata.setDefaultApplicationId(srcApplication.getId());
                    gitApplicationMetadata.setBranchName("master");
                    gitApplicationMetadata.setDefaultBranchName("feature1");
                    gitApplicationMetadata.setIsRepoPrivate(false);
                    gitApplicationMetadata.setRepoName("testRepo");
                    GitAuth gitAuth = new GitAuth();
                    gitAuth.setPublicKey("testkey");
                    gitAuth.setPrivateKey("privatekey");
                    gitApplicationMetadata.setGitAuth(gitAuth);
                    srcApplication.setGitApplicationMetadata(gitApplicationMetadata);
                    return themeService.updateTheme(srcApplication.getId(), null, theme)
                            .then(applicationService.save(srcApplication))
                            .flatMap(application -> {
                                // Create a branch application
                                Application branchApp = new Application();
                                branchApp.setName("app_" + uniqueString);
                                return applicationPageService.createApplication(branchApp, srcApplication.getOrganizationId())
                                        .zipWith(Mono.just(srcApplication));
                            });
                })
                .flatMap(tuple -> {
                    Application branchApp = tuple.getT1();
                    Application srcApplication = tuple.getT2();
                    GitApplicationMetadata gitApplicationMetadata1 = new GitApplicationMetadata();
                    gitApplicationMetadata1.setDefaultApplicationId(srcApplication.getId());
                    gitApplicationMetadata1.setBranchName("feature1");
                    gitApplicationMetadata1.setDefaultBranchName("feature1");
                    gitApplicationMetadata1.setIsRepoPrivate(false);
                    gitApplicationMetadata1.setRepoName("testRepo");
                    branchApp.setGitApplicationMetadata(gitApplicationMetadata1);
                    return applicationService.save(branchApp)
                            .flatMap(application -> {
                                PageDTO page = new PageDTO();
                                page.setName("discard-page-test");
                                page.setApplicationId(branchApp.getId());
                                return applicationPageService.createPage(page)
                                        .then(Mono.just(srcApplication));
                            });
                })
                .flatMap(srcApplication -> {
                    Organization desOrg = new Organization();
                    desOrg.setName("org_dest_" + uniqueString);

                    return organizationService.create(desOrg).flatMap(createdOrg ->
                            applicationForkingService.forkApplicationToOrganization(srcApplication.getGitApplicationMetadata().getDefaultApplicationId(), createdOrg.getId())
                    );
                });

        StepVerifier
                .create(applicationMono)
                .assertNext(forkedApplication -> {
                    assertThat(forkedApplication.getPages().size()).isEqualTo(2);
        }).verifyComplete();
    }
}
