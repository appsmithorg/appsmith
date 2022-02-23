package com.appsmith.server.services.ce;

import com.appsmith.external.constants.DisplayDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.ParsedDataType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.WidgetSuggestionDTO;
import com.appsmith.external.models.WidgetType;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.WidgetSuggestionHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ActionServiceCE_Test {
    @Autowired
    NewActionService newActionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    PluginRepository pluginRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginExecutor pluginExecutor;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    LayoutService layoutService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    ImportExportApplicationService importExportApplicationService;

    @SpyBean
    PluginService pluginService;

    @Autowired
    ApplicationService applicationService;

    Application testApp = null;

    PageDTO testPage = null;

    Application gitConnectedApp = null;

    PageDTO gitConnectedPage = null;

    Datasource datasource;

    String orgId;

    String branchName;

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

        if (gitConnectedApp == null) {
            Application newApp = new Application();
            newApp.setName(UUID.randomUUID().toString());
            GitApplicationMetadata gitData = new GitApplicationMetadata();
            gitData.setBranchName("actionServiceTest");
            newApp.setGitApplicationMetadata(gitData);
            gitConnectedApp = applicationPageService.createApplication(newApp, orgId)
                    .flatMap(application -> {
                        application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                        return applicationService.save(application)
                                .zipWhen(application1 -> importExportApplicationService.exportApplicationById(application1.getId(), gitData.getBranchName()));
                    })
                    // Assign the branchName to all the resources connected to the application
                    .flatMap(tuple -> importExportApplicationService.importApplicationInOrganization(orgId, tuple.getT2(), tuple.getT1().getId(), gitData.getBranchName()))
                    .block();

            gitConnectedPage = newPageService.findPageById(gitConnectedApp.getPages().get(0).getId(), READ_PAGES, false).block();

            branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();
        }

        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg.getId();
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setOrganizationId(orgId);
        Plugin installed_plugin = pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());
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
    public void findByIdAndBranchName_forGitConnectedAction_getBranchedAction() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        ActionDTO action = new ActionDTO();
        action.setName("findActionByBranchNameTest");
        action.setPageId(gitConnectedPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<NewAction> actionMono = layoutActionService.createSingleActionWithBranch(action, branchName)
                .flatMap(createdAction -> newActionService.findByBranchNameAndDefaultActionId(branchName, createdAction.getId(), READ_ACTIONS));

        StepVerifier
                .create(actionMono)
                .assertNext(newAction -> {
                    assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(gitConnectedPage.getId());
                    assertThat(newAction.getDefaultResources().getActionId()).isEqualTo(newAction.getId());
                    assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(gitConnectedApp.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidActionAndCheckPermissions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Policy manageActionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readActionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(testPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action)
                .flatMap(createdAction -> newActionService.findById(createdAction.getId(), READ_ACTIONS))
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false));

        StepVerifier
                .create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getId()).isNotEmpty();
                    assertThat(createdAction.getName()).isEqualTo(action.getName());
                    assertThat(createdAction.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy));
                    assertThat(createdAction.getExecuteOnLoad()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidAction_forGitConnectedApp_getValidPermissionAndDefaultIds() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Policy manageActionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readActionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(gitConnectedPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService.createSingleActionWithBranch(action, branchName)
                .flatMap(createdAction -> newActionService.findByBranchNameAndDefaultActionId(branchName, createdAction.getId(), READ_ACTIONS))
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false));

        StepVerifier
                .create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy));
                    assertThat(createdAction.getExecuteOnLoad()).isFalse();

                    assertThat(createdAction.getDefaultResources()).isNotNull();
                    assertThat(createdAction.getDefaultResources().getActionId()).isEqualTo(createdAction.getId());
                    assertThat(createdAction.getDefaultResources().getPageId()).isEqualTo(gitConnectedPage.getId());
                    assertThat(createdAction.getDefaultResources().getApplicationId()).isEqualTo(gitConnectedPage.getApplicationId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMoveAction() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO newPage = new PageDTO();
        newPage.setName("Destination Page");
        newPage.setApplicationId(testApp.getId());
        PageDTO destinationPage = applicationPageService.createPage(newPage).block();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> createActionMono = layoutActionService.createSingleAction(action).cache();

        Mono<ActionDTO> movedActionMono = createActionMono
                .flatMap(savedAction -> {
                    ActionMoveDTO actionMoveDTO = new ActionMoveDTO();
                    actionMoveDTO.setAction(savedAction);
                    actionMoveDTO.setDestinationPageId(destinationPage.getId());
                    return layoutActionService.moveAction(actionMoveDTO);
                });

        StepVerifier
                .create(Mono.zip(createActionMono, movedActionMono))
                .assertNext(tuple -> {
                    ActionDTO originalAction = tuple.getT1();
                    ActionDTO movedAction = tuple.getT2();

                    assertThat(movedAction.getId()).isEqualTo(originalAction.getId());
                    assertThat(movedAction.getName()).isEqualTo(originalAction.getName());
                    assertThat(movedAction.getPolicies()).containsAll(originalAction.getPolicies());
                    assertThat(movedAction.getPageId()).isEqualTo(destinationPage.getId());
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void moveAction_forGitConnectedApp_defaultResourceIdsUpdateSuccess() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO newPage = new PageDTO();
        newPage.setName("Destination Page");
        newPage.setApplicationId(gitConnectedApp.getId());
        PageDTO destinationPage = applicationPageService.createPageWithBranchName(newPage, branchName).block();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(gitConnectedPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> createActionMono = layoutActionService.createSingleActionWithBranch(action, branchName).cache();
        DefaultResources sourceActionDefaultRes = new DefaultResources();

        Mono<ActionDTO> movedActionMono = createActionMono
                .flatMap(savedAction -> {
                    ActionMoveDTO actionMoveDTO = new ActionMoveDTO();
                    actionMoveDTO.setAction(savedAction);
                    actionMoveDTO.setDestinationPageId(destinationPage.getId());
                    AppsmithBeanUtils.copyNestedNonNullProperties(savedAction.getDefaultResources(), sourceActionDefaultRes);
                    return layoutActionService.moveAction(actionMoveDTO, branchName);
                });

        StepVerifier
                .create(Mono.zip(createActionMono, movedActionMono))
                .assertNext(tuple -> {
                    ActionDTO originalAction = tuple.getT1();
                    ActionDTO movedAction = tuple.getT2();

                    assertThat(movedAction.getId()).isEqualTo(originalAction.getId());
                    assertThat(movedAction.getName()).isEqualTo(originalAction.getName());
                    assertThat(movedAction.getPolicies()).containsAll(originalAction.getPolicies());
                    assertThat(movedAction.getPageId()).isEqualTo(destinationPage.getId());

                    // Check if the defaultIds are updated as per destination page default Id
                    assertThat(movedAction.getDefaultResources()).isNotNull();
                    assertThat(movedAction.getDefaultResources().getPageId()).isEqualTo(destinationPage.getDefaultResources().getPageId());
                    assertThat(sourceActionDefaultRes.getPageId()).isEqualTo(gitConnectedPage.getDefaultResources().getPageId());
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidActionWithJustName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("randomActionName");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);
        Mono<ActionDTO> actionMono = Mono.just(action)
                .flatMap(layoutActionService::createSingleAction);
        StepVerifier
                .create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getId()).isNotEmpty();
                    assertThat(createdAction.getName()).isEqualTo(action.getName());
                    assertThat(createdAction.getIsValid()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidActionNullActionConfiguration() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("randomActionName2");
        action.setPageId(testPage.getId());
        action.setDatasource(datasource);
        Mono<ActionDTO> actionMono = Mono.just(action)
                .flatMap(layoutActionService::createSingleAction);
        StepVerifier
                .create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getId()).isNotEmpty();
                    assertThat(createdAction.getName()).isEqualTo(action.getName());
                    assertThat(createdAction.getIsValid()).isFalse();
                    assertThat(createdAction.getInvalids()).contains(AppsmithError.NO_CONFIGURATION_FOUND_IN_ACTION.getMessage());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidCreateActionNullName() {
        ActionDTO action = new ActionDTO();
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);
        Mono<ActionDTO> actionMono = Mono.just(action)
                .flatMap(layoutActionService::createSingleAction);
        StepVerifier
                .create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidCreateActionNullPageId() {
        ActionDTO action = new ActionDTO();
        action.setName("randomActionName");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action);
        StepVerifier
                .create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createActionWithBranchName_withNullPageId_throwException() {
        ActionDTO action = new ActionDTO();
        action.setName("randomActionName");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        Mono<ActionDTO> actionMono = layoutActionService.createSingleActionWithBranch(action, branchName);

        StepVerifier
                .create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidCreateActionInvalidPageId() {
        ActionDTO action = new ActionDTO();
        action.setName("randomActionName3");
        action.setPageId("invalid page id here");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        Mono<ActionDTO> actionMono = Mono.just(action)
                .flatMap(layoutActionService::createSingleAction);
        StepVerifier
                .create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(
                                AppsmithError.NO_RESOURCE_FOUND.getMessage("page", "invalid page id here")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createAction_forGitConnectedAppWithInvalidBranchName_throwException() {
        ActionDTO action = new ActionDTO();
        action.setName("randomActionName");
        action.setPageId(gitConnectedPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        Mono<ActionDTO> actionMono = layoutActionService.createSingleActionWithBranch(action, "randomTestBranch");
        StepVerifier
                .create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.PAGE, action.getPageId() + ", randomTestBranch")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testVariableSubstitution() {
        String json = "{\n" +
                "  \n" +
                "  \"deleted\": false,\n" +
                "  \"config\": {\n" +
                "    \"CONTAINER_WIDGET\": [\n" +
                "      {\n" +
                "        \"_id\": \"7\",\n" +
                "        \"sectionName\": \"General\",\n" +
                "        \"children\": [\n" +
                "          {\n" +
                "            \"_id\": \"7.1\",\n" +
                "            \"helpText\": \"Use a html color name, HEX, RGB or RGBA value\",\n" +
                "            \"placeholderText\": \"#FFFFFF / Gray / rgb(255, 99, 71)\",\n" +
                "            \"propertyName\": \"backgroundColor\",\n" +
                "            \"label\": \"Background Color\",\n" +
                "            \"controlType\": \"INPUT_TEXT\"\n" +
                "          },\n" +
                "          {\n" +
                "            \"_id\": \"7.2\",\n" +
                "            \"helpText\": \"Controls the visibility of the widget\",\n" +
                "            \"propertyName\": \"isVisible\",\n" +
                "            \"label\": \"Visible\",\n" +
                "            \"controlType\": \"SWITCH\",\n" +
                "            \"isJSConvertible\": true\n" +
                "          }\n" +
                "        ]\n" +
                "      }\n" +
                "    ]\n" +
                "  },\n" +
                "  \"name\": \"propertyPane\"\n" +
                "}";

        ActionDTO action = new ActionDTO();
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setBody("{{Input.text}}");

        ActionDTO renderedAction = newActionService.variableSubstitution(action, Map.of("Input.text", json));
        assertThat(renderedAction).isNotNull();
        assertThat(renderedAction.getActionConfiguration().getBody()).isEqualTo(json);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testVariableSubstitutionWithNewline() {
        ActionDTO action = new ActionDTO();
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setBody("{{Input.text}}");

        ActionDTO renderedAction = newActionService.variableSubstitution(action, Map.of("Input.text", "name\nvalue"));
        assertThat(renderedAction).isNotNull();
        assertThat(renderedAction.getActionConfiguration().getBody()).isEqualTo("name\nvalue");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecute() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteNullRequestBody() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setName("testActionExecuteNullRequestBody");
        action.setPageId(testPage.getId());
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteDbQuery() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from users");
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteDbQuery");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteErrorResponse() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(List.of(
                new Property("random-header-key", "random-header-value"),
                new Property("", "")
        ));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteErrorResponse");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        AppsmithPluginException pluginException = new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR);
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterized(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any())).thenReturn(Mono.error(pluginException));
        Mockito.when(pluginExecutor.datasourceCreate(Mockito.any())).thenReturn(Mono.empty());

        Mono<ActionExecutionResult> executionResultMono = newActionService.executeAction(executeActionDTO);

        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    assertThat(result.getIsExecutionSuccess()).isFalse();
                    assertThat(result.getStatusCode()).isEqualTo(pluginException.getAppErrorCode().toString());
                    assertThat(result.getTitle()).isEqualTo(pluginException.getTitle());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteNullPaginationParameters() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(List.of(
                new Property("random-header-key", "random-header-value"),
                new Property("", "")
        ));
        actionConfiguration.setPaginationType(PaginationType.URL);
        actionConfiguration.setNext(null);
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteErrorResponse");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);
        executeActionDTO.setPaginationField(PaginationField.NEXT);

        AppsmithPluginException pluginException = new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR);
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterized(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any())).thenReturn(Mono.error(pluginException));
        Mockito.when(pluginExecutor.datasourceCreate(Mockito.any())).thenReturn(Mono.empty());

        Mono<ActionExecutionResult> executionResultMono = newActionService.executeAction(executeActionDTO);

        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    assertThat(result.getIsExecutionSuccess()).isFalse();
                    assertThat(result.getStatusCode()).isEqualTo(pluginException.getAppErrorCode().toString());
                    assertThat(result.getTitle()).isEqualTo(pluginException.getTitle());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteSecondaryStaleConnection() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(List.of(
                new Property("random-header-key", "random-header-value"),
                new Property("", "")
        ));
        actionConfiguration.setTimeoutInMillisecond(String.valueOf(1000));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteSecondaryStaleConnection");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterized(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.error(new StaleConnectionException())).thenReturn(Mono.error(new StaleConnectionException()));
        Mockito.when(pluginExecutor.datasourceCreate(Mockito.any())).thenReturn(Mono.empty());

        Mono<ActionExecutionResult> executionResultMono = newActionService.executeAction(executeActionDTO);

        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    assertThat(result.getIsExecutionSuccess()).isFalse();
                    assertThat(result.getStatusCode()).isEqualTo(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                    assertThat(result.getTitle()).isEqualTo(AppsmithPluginError.PLUGIN_ERROR.getTitle());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(List.of(
                new Property("random-header-key", "random-header-value"),
                new Property("", "")
        ));
        actionConfiguration.setTimeoutInMillisecond(String.valueOf(10));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteTimeout");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterized(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenAnswer(x -> Mono.delay(Duration.ofMillis(1000)).ofType(ActionExecutionResult.class));
        Mockito.when(pluginExecutor.datasourceCreate(Mockito.any())).thenReturn(Mono.empty());

        Mono<ActionExecutionResult> executionResultMono = newActionService.executeAction(executeActionDTO);

        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    assertThat(result.getIsExecutionSuccess()).isFalse();
                    assertThat(result.getStatusCode()).isEqualTo(AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR.getAppErrorCode().toString());
                    assertThat(result.getTitle()).isEqualTo(AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR.getTitle());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkActionInViewMode() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        String key = "bodyMustacheKey";
        ActionDTO action = new ActionDTO();
        action.setName("actionInViewMode");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setBody("{{" + key + "}}");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        ActionDTO action1 = new ActionDTO();
        action1.setName("actionInViewModeWithoutMustacheKey");
        action1.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        actionConfiguration1.setTimeoutInMillisecond(String.valueOf(20000));
        action1.setActionConfiguration(actionConfiguration1);
        action1.setDatasource(datasource);

        ActionDTO action2 = new ActionDTO();
        action2.setName("actionInViewModeWithoutActionConfiguration");
        action2.setPageId(testPage.getId());
        action2.setDatasource(datasource);

        Mono<List<ActionViewDTO>> actionsListMono = layoutActionService.createSingleAction(action)
                .then(layoutActionService.createSingleAction(action1))
                .then(layoutActionService.createSingleAction(action2))
                .then(applicationPageService.publish(testPage.getApplicationId(), true))
                .then(newActionService.getActionsForViewMode(testApp.getId()).collectList());

        StepVerifier
                .create(actionsListMono)
                .assertNext(actionsList -> {
                    assertThat(actionsList.size()).isGreaterThan(0);
                    ActionViewDTO actionViewDTO = actionsList.stream().filter(dto -> dto.getName().equals(action.getName())).findFirst().get();

                    assertThat(actionViewDTO).isNotNull();
                    assertThat(actionViewDTO.getJsonPathKeys()).containsAll(Set.of(key));
                    assertThat(actionViewDTO.getPageId()).isEqualTo(testPage.getId());
                    assertThat(actionViewDTO.getTimeoutInMillisecond()).isEqualTo(DEFAULT_ACTION_EXECUTION_TIMEOUT_MS);

                    ActionViewDTO actionViewDTO1 = actionsList.stream().filter(dto -> dto.getName().equals(action1.getName())).findFirst().get();

                    assertThat(actionViewDTO1).isNotNull();
                    assertThat(actionViewDTO1.getJsonPathKeys()).isNullOrEmpty();
                    assertThat(actionViewDTO1.getPageId()).isEqualTo(testPage.getId());
                    assertThat(actionViewDTO1.getTimeoutInMillisecond()).isEqualTo(20000);

                    ActionViewDTO actionViewDTO2 = actionsList.stream().filter(dto -> dto.getName().equals(action2.getName())).findFirst().get();

                    assertThat(actionViewDTO2).isNotNull();
                    assertThat(actionViewDTO2.getPageId()).isEqualTo(testPage.getId());
                    assertThat(actionViewDTO2.getTimeoutInMillisecond()).isEqualTo(DEFAULT_ACTION_EXECUTION_TIMEOUT_MS);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkRecoveryFromStaleConnections() {
        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterized(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenThrow(new StaleConnectionException())
                .thenReturn(Mono.just(mockResult));
        Mockito.when(pluginExecutor.datasourceCreate(Mockito.any())).thenReturn(Mono.empty());
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));


        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from users");
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("checkRecoveryFromStaleConnections");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        Mono<ActionExecutionResult> actionExecutionResultMono = newActionService.executeAction(executeActionDTO);

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getBody()).isEqualTo(mockResult.getBody());
                })
                .verifyComplete();
    }

    private void executeAndAssertAction(ExecuteActionDTO executeActionDTO, ActionConfiguration actionConfiguration,
                                        ActionExecutionResult mockResult, List<ParsedDataType> expectedReturnDataTypes) {

        List<WidgetSuggestionDTO> expectedWidgets = mockResult.getSuggestedWidgets();
        Mono<ActionExecutionResult> actionExecutionResultMono = executeAction(executeActionDTO, actionConfiguration, mockResult);

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getBody()).isEqualTo(mockResult.getBody());
                    assertThat(result.getDataTypes().toString()).isEqualTo(expectedReturnDataTypes.toString());
                    assertThat(result.getSuggestedWidgets().size()).isEqualTo(expectedWidgets.size());
                    assertThat(result.getSuggestedWidgets().containsAll(expectedWidgets));
                    assertThat(expectedWidgets.containsAll(result.getSuggestedWidgets()));
                })
                .verifyComplete();
    }

    private Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO, ActionConfiguration actionConfiguration, ActionExecutionResult mockResult) {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterized(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockResult));
        Mockito.when(pluginExecutor.datasourceCreate(Mockito.any())).thenReturn(Mono.empty());

        Mono<ActionExecutionResult> actionExecutionResultMono = newActionService.executeAction(executeActionDTO);
        return actionExecutionResultMono;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getActionInViewMode() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("view-mode-action-test");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setPath("{{mustache}}");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> createActionMono = layoutActionService.createSingleAction(action);
        Mono<List<ActionViewDTO>> actionViewModeListMono = createActionMono
                // Publish the application before fetching the action in view mode
                .then(applicationPageService.publish(testApp.getId(), true))
                .then(newActionService.getActionsForViewMode(testApp.getId()).collectList());

        StepVerifier.create(actionViewModeListMono)
                .assertNext(actions -> {
                    assertThat(actions.size()).isGreaterThan(0);
                    ActionViewDTO actionViewDTO = actions.get(0);
                    assertThat(actionViewDTO.getId()).isNotNull();
                    assertThat(actionViewDTO.getTimeoutInMillisecond()).isNotNull();
                    assertThat(actionViewDTO.getPageId()).isNotNull();
                    assertThat(actionViewDTO.getConfirmBeforeExecute()).isNotNull();
                    assertThat(actionViewDTO.getJsonPathKeys().size()).isEqualTo(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void executeActionWithExternalDatasource() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginService.getEditorConfigLabelMap(Mockito.anyString())).thenReturn(Mono.just(new HashMap<>()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("Default Database");
        externalDatasource.setOrganizationId(orgId);
        Plugin installed_plugin = pluginRepository.findByPackageName("installed-plugin").block();
        externalDatasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");
        externalDatasource.setDatasourceConfiguration(datasourceConfiguration);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("actionWithExternalDatasource");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(savedDs);


        Mono<ActionExecutionResult> resultMono = layoutActionService.createSingleAction(action)
                .flatMap(savedAction -> {
                    ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
                    executeActionDTO.setActionId(savedAction.getId());
                    executeActionDTO.setViewMode(false);
                    return newActionService.executeAction(executeActionDTO);
                });


        StepVerifier
                .create(resultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getStatusCode()).isEqualTo("200");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateShouldNotResetUserSetOnLoad() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("updateShouldNotResetUserSetOnLoad Database");
        externalDatasource.setOrganizationId(orgId);
        Plugin installed_plugin = pluginRepository.findByPackageName("installed-plugin").block();
        externalDatasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");
        externalDatasource.setDatasourceConfiguration(datasourceConfiguration);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("updateShouldNotResetUserSetOnLoad");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(savedDs);

        Mono<ActionDTO> newActionMono = layoutActionService
                .createSingleAction(action)
                .cache();

        Mono<ActionDTO> setExecuteOnLoadMono = newActionMono
                .flatMap(savedAction -> layoutActionService.setExecuteOnLoad(savedAction.getId(), true));

        Mono<ActionDTO> updateActionMono = newActionMono
                .flatMap(preUpdateAction -> {
                    ActionDTO actionUpdate = action;
                    actionUpdate.getActionConfiguration().setBody("New Body");
                    return layoutActionService.updateSingleAction(preUpdateAction.getId(), actionUpdate);
                });

        StepVerifier
                .create(setExecuteOnLoadMono.then(updateActionMono))
                .assertNext(updatedAction -> {
                    assertThat(updatedAction).isNotNull();
                    assertThat(updatedAction.getActionConfiguration().getBody()).isEqualTo("New Body");
                    assertThat(updatedAction.getUserSetOnLoad()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkNewActionAndNewDatasourceAnonymousPermissionInPublicApp() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Application application = new Application();
        application.setName("validApplicationPublic-ExplicitDatasource-Test");

        Policy manageDatasourcePolicy = Policy.builder().permission(MANAGE_DATASOURCES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readDatasourcePolicy = Policy.builder().permission(READ_DATASOURCES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy executeDatasourcePolicy = Policy.builder().permission(EXECUTE_DATASOURCES.getValue())
                .users(Set.of("api_user", FieldName.ANONYMOUS_USER))
                .build();

        Policy manageActionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readActionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy executeActionPolicy = Policy.builder().permission(EXECUTE_ACTIONS.getValue())
                .users(Set.of("api_user", FieldName.ANONYMOUS_USER))
                .build();

        Application createdApplication = applicationPageService.createApplication(application, orgId).block();

        String pageId = createdApplication.getPages().get(0).getId();

        Plugin plugin = pluginService.findByName("Installed Plugin Name").block();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        Mono<Application> publicAppMono = applicationService
                .changeViewAccess(createdApplication.getId(), applicationAccessDTO)
                .cache();

        Datasource datasource = new Datasource();
        datasource.setName("After Public Datasource");
        datasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);

        Datasource savedDatasource = datasourceService.create(datasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("After Public action");
        action.setPageId(pageId);
        action.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration1);

        ActionDTO savedAction = layoutActionService.createSingleAction(action).block();

        Mono<Datasource> datasourceMono = publicAppMono
                .then(datasourceService.findById(savedDatasource.getId()));

        Mono<NewAction> actionMono = publicAppMono
                .then(newActionService.findById(savedAction.getId()));

        StepVerifier
                .create(Mono.zip(datasourceMono, actionMono))
                .assertNext(tuple -> {
                    Datasource datasourceFromDb = tuple.getT1();
                    NewAction actionFromDb = tuple.getT2();

                    // Check that the datasource used in the app contains public execute permission
                    assertThat(datasourceFromDb.getPolicies()).containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));

                    // Check that the action used in the app contains public execute permission
                    assertThat(actionFromDb.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testExecuteOnLoadParamOnActionCreateWithDefaultContext() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        action.setPageId(testPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action);
        StepVerifier
                .create(actionMono)
                .assertNext(createdAction -> {
                    // executeOnLoad is expected to be set to false in case of default context
                    assertThat(createdAction.getExecuteOnLoad()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testExecuteOnLoadParamOnActionCreateWithClonePageContext() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        action.setPageId(testPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        AppsmithEventContext eventContext = new AppsmithEventContext(AppsmithEventContextType.CLONE_PAGE);
        Mono<ActionDTO> actionMono = layoutActionService.createAction(action, eventContext);
        StepVerifier
                .create(actionMono)
                .assertNext(createdAction -> {
                    // executeOnLoad is expected to be set to false in case of default context
                    assertThat(createdAction.getExecuteOnLoad()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateActionWithOutOfRangeTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("60001");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> newActionMono = layoutActionService
                .createSingleAction(action);

        Mono<ActionDTO> updateActionMono = newActionMono
                .flatMap(preUpdateAction -> {
                    ActionDTO actionUpdate = action;
                    actionUpdate.getActionConfiguration().setBody("New Body");
                    return layoutActionService.updateSingleAction(preUpdateAction.getId(), actionUpdate);
                });

        StepVerifier
                .create(updateActionMono)
                .assertNext(updatedAction -> {
                    assertThat(updatedAction).isNotNull();
                    assertThat(updatedAction
                            .getInvalids()
                            .stream()
                            .anyMatch(errorMsg -> errorMsg.contains("'Query timeout' field must be an integer between" +
                                    " 0 and 60000"))
                    ).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateActionWithValidRangeTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("6000");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> newActionMono = layoutActionService
                .createSingleAction(action);

        Mono<ActionDTO> updateActionMono = newActionMono
                .flatMap(preUpdateAction -> {
                    action.getActionConfiguration().setBody("New Body");
                    return layoutActionService.updateSingleAction(preUpdateAction.getId(), action);
                });

        StepVerifier
                .create(updateActionMono)
                .assertNext(updatedAction -> {
                    assertThat(updatedAction).isNotNull();
                    assertThat(updatedAction
                            .getInvalids()
                            .stream()
                            .anyMatch(errorMsg -> errorMsg.contains("'Query timeout' field must be an integer between"))
                    ).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateActionWithOutOfRangeTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(testPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setTimeoutInMillisecond("60001");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action)
                .flatMap(createdAction -> newActionService.findById(createdAction.getId(), READ_ACTIONS))
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false));

        StepVerifier
                .create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction).isNotNull();
                    assertThat(createdAction
                            .getInvalids()
                            .stream()
                            .anyMatch(errorMsg -> errorMsg.contains("'Query timeout' field must be an integer between" +
                                    " 0 and 60000"))
                    ).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateActionWithValidRangeTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(testPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setTimeoutInMillisecond("6000");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action)
                .flatMap(createdAction -> newActionService.findById(createdAction.getId(), READ_ACTIONS))
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false));

        StepVerifier
                .create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction).isNotNull();
                    assertThat(createdAction
                            .getInvalids()
                            .stream()
                            .anyMatch(errorMsg -> errorMsg.contains("'Query timeout' field must be an integer between"))
                    ).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteWithTableReturnType() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("[\n" +
                "{\"name\": \"Richard\", \"profession\": \"medical\"},\n" +
                "{\"name\": \"John\", \"profession\": \"self employed\"},\n" +
                "{\"name\": \"Mary\", \"profession\": \"engineer\"}\n" +
                "]");
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.TABLE), new ParsedDataType(DisplayDataType.JSON)
                        , new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteWithJsonReturnType() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("{\n" +
                "  \"name\":\"John\",\n" +
                "  \"age\":30,\n" +
                "  \"cars\": {\n" +
                "    \"car1\":\"Ford\",\n" +
                "    \"car2\":\"BMW\",\n" +
                "    \"car3\":\"Fiat\"\n" +
                "  }\n" +
                " }");
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.JSON), new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteWithPreAssignedReturnType() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("{\n" +
                "  \"name\":\"John\",\n" +
                "  \"age\":30,\n" +
                "  \"cars\": {\n" +
                "    \"car1\":\"Ford\",\n" +
                "    \"car2\":\"BMW\",\n" +
                "    \"car3\":\"Fiat\"\n" +
                "  }\n" +
                " }");
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteReturnTypeWithNullResultBody() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(null);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult, new ArrayList<>());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithChartWidgetData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": [\n" +
                "  {\n" +
                "    \"x\": \"Mon\",\n" +
                "    \"y\": 10000\n" +
                "  },\n" +
                "  {\n" +
                "    \"x\": \"Tue\",\n" +
                "    \"y\": 12000\n" +
                "  },\n" +
                "  {\n" +
                "    \"x\": \"Wed\",\n" +
                "    \"y\": 32000\n" +
                "  },\n" +
                "  {\n" +
                "    \"x\": \"Thu\",\n" +
                "    \"y\": 28000\n" +
                "  },\n" +
                "  {\n" +
                "    \"x\": \"Fri\",\n" +
                "    \"y\": 14000\n" +
                "  },\n" +
                "  {\n" +
                "    \"x\": \"Sat\",\n" +
                "    \"y\": 19000\n" +
                "  },\n" +
                "  {\n" +
                "    \"x\": \"Sun\",\n" +
                "    \"y\": 36000\n" +
                "  }\n" +
                "]}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.CHART_WIDGET, "x", "y"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.DROP_DOWN_WIDGET, "x", "x"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithTableWidgetData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": [\n" +
                "\t{\n" +
                "\t\t\"id\": \"0001\",\n" +
                "\t\t\"type\": \"donut\",\n" +
                "\t\t\"name\": \"Cake\",\n" +
                "\t\t\"ppu\": 0.55,\n" +
                "\t\t\"batters\":\n" +
                "\t\t\t{\n" +
                "\t\t\t\t\"batter\":\n" +
                "\t\t\t\t\t[\n" +
                "\t\t\t\t\t\t{ \"id\": \"1001\", \"type\": \"Regular\" },\n" +
                "\t\t\t\t\t\t{ \"id\": \"1002\", \"type\": \"Chocolate\" },\n" +
                "\t\t\t\t\t\t{ \"id\": \"1003\", \"type\": \"Blueberry\" },\n" +
                "\t\t\t\t\t\t{ \"id\": \"1004\", \"type\": \"Devil's Food\" }\n" +
                "\t\t\t\t\t]\n" +
                "\t\t\t},\n" +
                "\t\t\"topping\":\n" +
                "\t\t\t[\n" +
                "\t\t\t\t{ \"id\": \"5001\", \"type\": \"None\" },\n" +
                "\t\t\t\t{ \"id\": \"5002\", \"type\": \"Glazed\" },\n" +
                "\t\t\t\t{ \"id\": \"5005\", \"type\": \"Sugar\" },\n" +
                "\t\t\t\t{ \"id\": \"5007\", \"type\": \"Powdered Sugar\" },\n" +
                "\t\t\t\t{ \"id\": \"5006\", \"type\": \"Chocolate with Sprinkles\" },\n" +
                "\t\t\t\t{ \"id\": \"5003\", \"type\": \"Chocolate\" },\n" +
                "\t\t\t\t{ \"id\": \"5004\", \"type\": \"Maple\" }\n" +
                "\t\t\t]\n" +
                "\t},\n" +
                "\t{\n" +
                "\t\t\"id\": \"0002\",\n" +
                "\t\t\"type\": \"donut\",\n" +
                "\t\t\"name\": \"Raised\",\n" +
                "\t\t\"ppu\": 0.55,\n" +
                "\t\t\"batters\":\n" +
                "\t\t\t{\n" +
                "\t\t\t\t\"batter\":\n" +
                "\t\t\t\t\t[\n" +
                "\t\t\t\t\t\t{ \"id\": \"1001\", \"type\": \"Regular\" }\n" +
                "\t\t\t\t\t]\n" +
                "\t\t\t},\n" +
                "\t\t\"topping\":\n" +
                "\t\t\t[\n" +
                "\t\t\t\t{ \"id\": \"5001\", \"type\": \"None\" },\n" +
                "\t\t\t\t{ \"id\": \"5002\", \"type\": \"Glazed\" },\n" +
                "\t\t\t\t{ \"id\": \"5005\", \"type\": \"Sugar\" },\n" +
                "\t\t\t\t{ \"id\": \"5003\", \"type\": \"Chocolate\" },\n" +
                "\t\t\t\t{ \"id\": \"5004\", \"type\": \"Maple\" }\n" +
                "\t\t\t]\n" +
                "\t},\n" +
                "\t{\n" +
                "\t\t\"id\": \"0003\",\n" +
                "\t\t\"type\": \"donut\",\n" +
                "\t\t\"name\": \"Old Fashioned\",\n" +
                "\t\t\"ppu\": 0.55,\n" +
                "\t\t\"batters\":\n" +
                "\t\t\t{\n" +
                "\t\t\t\t\"batter\":\n" +
                "\t\t\t\t\t[\n" +
                "\t\t\t\t\t\t{ \"id\": \"1001\", \"type\": \"Regular\" },\n" +
                "\t\t\t\t\t\t{ \"id\": \"1002\", \"type\": \"Chocolate\" }\n" +
                "\t\t\t\t\t]\n" +
                "\t\t\t},\n" +
                "\t\t\"topping\":\n" +
                "\t\t\t[\n" +
                "\t\t\t\t{ \"id\": \"5001\", \"type\": \"None\" },\n" +
                "\t\t\t\t{ \"id\": \"5002\", \"type\": \"Glazed\" },\n" +
                "\t\t\t\t{ \"id\": \"5003\", \"type\": \"Chocolate\" },\n" +
                "\t\t\t\t{ \"id\": \"5004\", \"type\": \"Maple\" }\n" +
                "\t\t\t]\n" +
                "\t}\n" +
                "]}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.CHART_WIDGET, "id", "ppu"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.DROP_DOWN_WIDGET, "id", "type"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithListWidgetData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": [\n" +
                "    {\n" +
                "        \"url\": \"images/thumbnails/0001.jpg\",\n" +
                "        \"width\": 32,\n" +
                "        \"height\": 32\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0001.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0002.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0002.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0003.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0004.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0005.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0006.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0007.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0008.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0009.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    },\n" +
                "    {\n" +
                "        \"url\": \"images/0010.jpg\",\n" +
                "        \"width\": 200,\n" +
                "        \"height\": 200\n" +
                "    }\n" +
                "]}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.CHART_WIDGET, "url", "width"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.DROP_DOWN_WIDGET, "url", "url"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithDropdownWidgetData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": [\n" +
                "    {\n" +
                "     \"CarType\": \"BMW\",\n" +
                "     \"carID\": \"bmw123\"\n" +
                "     },\n" +
                "      {\n" +
                "     \"CarType\": \"mercedes\",\n" +
                "     \"carID\": \"merc123\"\n" +
                "      },\n" +
                "      {\n" +
                "     \"CarType\": \"volvo\",\n" +
                "     \"carID\": \"vol123r\"\n" +
                "       },\n" +
                "       {\n" +
                "     \"CarType\": \"ford\",\n" +
                "     \"carID\": \"ford123\"\n" +
                "       }\n" +
                "  ]}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.DROP_DOWN_WIDGET, "CarType", "carID"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithArrayOfStringsDropDownWidget() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\":[\"string1\", \"string2\", \"string3\", \"string4\"] }";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));
        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.INPUT_WIDGET));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithArrayOfArray() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\":[[\"string1\", \"string2\", \"string3\", \"string4\"]," +
                "[\"string5\", \"string6\", \"string7\", \"string8\"]," +
                "[\"string9\", \"string10\", \"string11\", \"string12\"]] }";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithEmptyData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\":[] }";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithNumericData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": [1] }";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.INPUT_WIDGET));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithJsonNodeData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{\"data\": {\n" +
                "    \"next\": \"https://mock-api.appsmith.com/users?page=2&pageSize=10\",\n" +
                "    \"previous\": null,\n" +
                "    \"users\": [\n" +
                "        {\n" +
                "            \"id\": 3,\n" +
                "            \"name\": \"Demetre\",\n" +
                "            \"status\": \"APPROVED\",\n" +
                "            \"gender\": \"Male\",\n" +
                "            \"avatar\": \"https://robohash.org/iustooptiocum.jpg?size=100x100&set=set1\",\n" +
                "            \"email\": \"aaaa@bbb.com\",\n" +
                "            \"address\": \"262 Saint Paul Park\",\n" +
                "            \"createdAt\": \"2020-05-01T17:30:50.000Z\",\n" +
                "            \"updatedAt\": \"2019-10-08T14:55:53.000Z\"\n" +
                "        },\n" +
                "        {\n" +
                "            \"id\": 4,\n" +
                "            \"name\": \"Currey\",\n" +
                "            \"status\": \"APPROVED\",\n" +
                "            \"gender\": \"Female\",\n" +
                "            \"avatar\": \"https://robohash.org/aspernaturnatusrepellat.jpg?size=100x100&set=set1\",\n" +
                "            \"email\": \"cbrayson3@taobao.com\",\n" +
                "            \"address\": \"35180 Lotheville Street!\",\n" +
                "            \"createdAt\": \"2019-12-30T03:54:23.000Z\",\n" +
                "            \"updatedAt\": \"2020-08-12T17:43:01.016Z\"\n" +
                "        }\n" +
                "    ]\n" +
                "}}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidgetNestedData(WidgetType.TEXT_WIDGET,"users"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidgetNestedData(WidgetType.CHART_WIDGET,"users","name","id"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidgetNestedData(WidgetType.TABLE_WIDGET,"users"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidgetNestedData(WidgetType.DROP_DOWN_WIDGET,"users","name", "status"));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithJsonObjectData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": {\n" +
                "            \"id\": 1,\n" +
                "            \"name\": \"Barty Crouch\",\n" +
                "            \"status\": \"APPROVED\",\n" +
                "            \"gender\": \"\",\n" +
                "            \"avatar\": \"https://robohash.org/sednecessitatibuset.png?size=100x100&set=set1\",\n" +
                "            \"email\": \"barty.crouch@gmail.com\",\n" +
                "            \"address\": \"St Petersberg #911 4th main\",\n" +
                "            \"createdAt\": \"2020-03-16T18:00:05.000Z\",\n" +
                "            \"updatedAt\": \"2020-08-12T17:29:31.980Z\"\n" +
                "        } }";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithJsonArrayObjectData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": {\n" +
                "            \"id\": 1,\n" +
                "            \"name\": \"Barty Crouch\",\n" +
                "            \"status\": \"APPROVED\",\n" +
                "            \"gender\": \"\",\n" +
                "            \"avatar\": \"https://robohash.org/sednecessitatibuset.png?size=100x100&set=set1\",\n" +
                "            \"email\": \"barty.crouch@gmail.com\",\n" +
                "            \"address\": \"St Petersberg #911 4th main\",\n" +
                "            \"createdAt\": \"2020-03-16T18:00:05.000Z\",\n" +
                "            \"updatedAt\": \"2020-08-12T17:29:31.980Z\"\n" +
                "        }," +
                "\"data\": {\n" +
                "            \"id\": 2,\n" +
                "            \"name\": \"Jenelle Kibbys\",\n" +
                "            \"status\": \"APPROVED\",\n" +
                "            \"gender\": \"Female\",\n" +
                "            \"avatar\": \"https://robohash.org/quiaasperiorespariatur.bmp?size=100x100&set=set1\",\n" +
                "            \"email\": \"jkibby1@hp.com\",\n" +
                "            \"address\": \"85 Tennessee Plaza\",\n" +
                "            \"createdAt\": \"2019-10-04T03:22:23.000Z\",\n" +
                "            \"updatedAt\": \"2019-09-11T20:18:38.000Z\"\n" +
                "        } }";
        final JsonNode arrNode = new ObjectMapper().readTree(data);;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionNestedData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{\"data\": {\n" +
                "    \"next\": \"https://mock-api.appsmith.com/users?page=2&pageSize=10\",\n" +
                "    \"previous\": null,\n" +
                "    \"users\": []\n" +
                "}}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");;

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidgetNestedData(WidgetType.TEXT_WIDGET,"users"));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void suggestWidget_ArrayListData_SuggestTableTextChartDropDownWidget() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        ArrayList<JSONObject> listData = new ArrayList<>();
        JSONObject jsonObject = new JSONObject(Map.of("url", "images/thumbnails/0001.jpg", "width",32, "height", 32));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0001.jpg", "width",42, "height", 22));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0002.jpg", "width",52, "height", 12));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0003.jpg", "width",62, "height", 52));
        listData.add(jsonObject);
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(listData);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.CHART_WIDGET, "url", "width"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.DROP_DOWN_WIDGET, "url", "url"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void suggestWidget_ArrayListData_SuggestTableTextDropDownWidget() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        ArrayList<JSONObject> listData = new ArrayList<>();
        JSONObject jsonObject = new JSONObject(Map.of("url", "images/thumbnails/0001.jpg", "width","32", "height", "32"));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0001.jpg", "width","42", "height", "22"));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0002.jpg", "width","52", "height", "12"));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0003.jpg", "width","62", "height", "52"));
        listData.add(jsonObject);
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(listData);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.DROP_DOWN_WIDGET, "url", "width"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void suggestWidget_ArrayListDataEmpty_SuggestTextWidget() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        ArrayList<JSONObject> listData = new ArrayList<>();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(listData);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult,
                List.of(new ParsedDataType(DisplayDataType.RAW)));

    }

    private Mono<PageDTO> createPage(Application app, PageDTO page) {
        return newPageService
                .findByNameAndViewMode(page.getName(), AclPermission.READ_PAGES, false)
                .switchIfEmpty(applicationPageService.createApplication(app, orgId)
                        .map(application -> {
                            page.setApplicationId(application.getId());
                            return page;
                        })
                        .flatMap(applicationPageService::createPage));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getActionsExecuteOnLoadPaginatedApi() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO testPage = new PageDTO();
        testPage.setName("ActionsExecuteOnLoad Paginated Api Test Page");

        Application app = new Application();
        app.setName("newApplication-paginated-api-execute-on-load-Test");

        Mono<PageDTO> pageMono = createPage(app, testPage).cache();

        Mono<LayoutDTO> testMono = pageMono
                .flatMap(page1 -> {
                    List<Mono<ActionDTO>> monos = new ArrayList<>();

                    ActionDTO action = new ActionDTO();
                    action.setName("paginatedApi");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.getActionConfiguration().setPaginationType(PaginationType.URL);
                    action.getActionConfiguration().setNext("{{paginatedApi.data.next}}");
                    action.getActionConfiguration().setPrev("{{paginatedApi.data.prev}}");
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    action.setDynamicBindingPathList(List.of(new Property("next", null), new Property("prev", null)));
                    monos.add(layoutActionService.createSingleAction(action));

                    return Mono.zip(monos, objects -> page1);
                })
                .zipWhen(page1 -> {
                    Layout layout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "key", "value"
                    ));
                    layout.setDsl(obj);

                    return layoutService.createLayout(page1.getId(), layout);
                })
                .flatMap(tuple2 -> {
                    final PageDTO page1 = tuple2.getT1();
                    final Layout layout = tuple2.getT2();

                    Layout newLayout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "widgetName", "testWidget",
                            "key", "value-updated",
                            "bindingPath", "{{paginatedApi.data}}"
                    ));
                    JSONArray dynamicBindingsPathList = new JSONArray();
                    dynamicBindingsPathList.addAll(List.of(
                            new JSONObject(Map.of("key", "bindingPath"))
                    ));

                    obj.put("dynamicBindingPathList", dynamicBindingsPathList);
                    newLayout.setDsl(obj);

                    return layoutActionService.updateLayout(page1.getId(), layout.getId(), newLayout);

                });
        StepVerifier
                .create(testMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                    assertThat(layout.getLayoutOnLoadActions().get(0)).hasSize(1);

                    Set<String> firstSetPageLoadActions = Set.of(
                            "paginatedApi"
                    );

                    assertThat(layout.getLayoutOnLoadActions().get(0).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(firstSetPageLoadActions);
                })
                .verifyComplete();
    }

}
