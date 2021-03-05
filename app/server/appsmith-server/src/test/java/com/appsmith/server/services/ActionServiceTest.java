package com.appsmith.server.services;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

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
public class ActionServiceTest {
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
    PluginService pluginService;

    @Autowired
    ApplicationService applicationService;

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
            Layout layout = new Layout();
            JSONObject dsl = new JSONObject(Map.of("text", "{{ query1.data }}"));
            layout.setDsl(dsl);
            layout.setPublishedDsl(dsl);
            layoutService.createLayout(pageId, layout).block();

            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();
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

        Mono<ActionDTO> actionMono = newActionService.createAction(action)
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

        Mono<ActionDTO> createActionMono = newActionService.createAction(action).cache();

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
                .flatMap(newActionService::createAction);
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
                .flatMap(newActionService::createAction);
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
                .flatMap(newActionService::createAction);
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
        Mono<ActionDTO> actionMono = Mono.just(action)
                .flatMap(newActionService::createAction);
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
                .flatMap(newActionService::createAction);
        StepVerifier
                .create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(
                                AppsmithError.NO_RESOURCE_FOUND.getMessage("page", "invalid page id here")))
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

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = newActionService.createAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteNullRequestBody() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setName("testActionExecuteNullRequestBody");
        action.setPageId(testPage.getId());
        action.setDatasource(datasource);
        ActionDTO createdAction = newActionService.createAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteDbQuery() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from users");
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteDbQuery");
        action.setDatasource(datasource);
        ActionDTO createdAction = newActionService.createAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteErrorResponse() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));

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
        ActionDTO createdAction = newActionService.createAction(action).block();

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
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteNullPaginationParameters() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));

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
        ActionDTO createdAction = newActionService.createAction(action).block();

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
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteSecondaryStaleConnection() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));

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
        ActionDTO createdAction = newActionService.createAction(action).block();

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
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));

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
        ActionDTO createdAction = newActionService.createAction(action).block();

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

        Mono<List<ActionViewDTO>> actionsListMono = newActionService.createAction(action)
                .then(newActionService.createAction(action1))
                .then(newActionService.createAction(action2))
                .then(applicationPageService.publish(testPage.getApplicationId()))
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


        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from users");
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("checkRecoveryFromStaleConnections");
        action.setDatasource(datasource);
        ActionDTO createdAction = newActionService.createAction(action).block();

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

    private void executeAndAssertAction(ExecuteActionDTO executeActionDTO, ActionConfiguration actionConfiguration, ActionExecutionResult mockResult) {

        Mono<ActionExecutionResult> actionExecutionResultMono = executeAction(executeActionDTO, actionConfiguration, mockResult);

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getBody()).isEqualTo(mockResult.getBody());
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

        Mono<ActionDTO> createActionMono = newActionService.createAction(action);
        Mono<List<ActionViewDTO>> actionViewModeListMono = createActionMono
                // Publish the application before fetching the action in view mode
                .then(applicationPageService.publish(testApp.getId()))
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


        Mono<ActionExecutionResult> resultMono = newActionService.createAction(action)
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

        Mono<ActionDTO> newActionMono = newActionService
                .createAction(action)
                .cache();

        Mono<ActionDTO> setExecuteOnLoadMono = newActionMono
                .flatMap(savedAction -> layoutActionService.setExecuteOnLoad(savedAction.getId(), true));

        Mono<ActionDTO> updateActionMono = newActionMono
                .flatMap(preUpdateAction -> {
                    ActionDTO actionUpdate = action;
                    actionUpdate.getActionConfiguration().setBody("New Body");
                    return actionCollectionService.updateAction(preUpdateAction.getId(), actionUpdate);
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

        ActionDTO savedAction = newActionService.createAction(action).block();

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

        Mono<ActionDTO> actionMono = newActionService.createAction(action);
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
        Mono<ActionDTO> actionMono = newActionService.createAction(action, eventContext);
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

        Mono<ActionDTO> newActionMono = newActionService
                .createAction(action);

        Mono<ActionDTO> updateActionMono = newActionMono
                .flatMap(preUpdateAction -> {
                    ActionDTO actionUpdate = action;
                    actionUpdate.getActionConfiguration().setBody("New Body");
                    return actionCollectionService.updateAction(preUpdateAction.getId(), actionUpdate);
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

        Mono<ActionDTO> newActionMono = newActionService
                .createAction(action);

        Mono<ActionDTO> updateActionMono = newActionMono
                .flatMap(preUpdateAction -> {
                    ActionDTO actionUpdate = action;
                    actionUpdate.getActionConfiguration().setBody("New Body");
                    return actionCollectionService.updateAction(preUpdateAction.getId(), actionUpdate);
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

        Mono<ActionDTO> actionMono = newActionService.createAction(action)
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

        Mono<ActionDTO> actionMono = newActionService.createAction(action)
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
}
