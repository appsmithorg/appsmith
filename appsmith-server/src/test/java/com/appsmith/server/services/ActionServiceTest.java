package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ExecuteActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ActionServiceTest {
    @Autowired
    ActionService actionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PageService pageService;

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

    Application testApp = null;

    Page testPage = null;

    int i = 0;

    Datasource datasource;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {

        User apiUser = userService.findByEmail("api_user").block();
        String orgId = apiUser.getOrganizationIds().iterator().next();
        Organization organization = organizationService.findById(orgId).block();

        if (testApp == null && testPage == null) {
            //Create application and page which will be used by the tests to create actions for.
            Application application = new Application();
            application.setName("ActionServiceTest-App-" + String.valueOf(i));
            i++;
            testApp = applicationPageService.createApplication(application, organization.getId()).block();
            testPage = pageService.getById(testApp.getPages().get(0).getId()).block();
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

        Action action = new Action();
        action.setName("validAction");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<Action> actionMono = actionService.create(action);

        StepVerifier
                .create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getId()).isNotEmpty();
                    assertThat(createdAction.getName()).isEqualTo(action.getName());
                    assertThat(createdAction.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy));
                })
                .verifyComplete();
    }


        @Test
    @WithUserDetails(value = "api_user")
    public void createValidActionWithJustName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Action action = new Action();
        action.setName("randomActionName");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);
        Mono<Action> actionMono = Mono.just(action)
                .flatMap(actionService::create);
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

        Action action = new Action();
        action.setName("randomActionName2");
        action.setPageId(testPage.getId());
        action.setDatasource(datasource);
        Mono<Action> actionMono = Mono.just(action)
                .flatMap(actionService::create);
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
        Action action = new Action();
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);
        Mono<Action> actionMono = Mono.just(action)
                .flatMap(actionService::create);
        StepVerifier
                .create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidCreateActionNullPageId() {
        Action action = new Action();
        action.setName("randomActionName");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        Mono<Action> actionMono = Mono.just(action)
                .flatMap(actionService::create);
        StepVerifier
                .create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidCreateActionInvalidPageId() {
        Action action = new Action();
        action.setName("randomActionName3");
        action.setPageId("invalid page id here");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        Mono<Action> actionMono = Mono.just(action)
                .flatMap(actionService::create);
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

        Object obj = actionService.variableSubstitution("{{Input.text}}", Map.of("Input.text", json));
        assertThat(obj).isNotNull();
        assertThat(obj).isInstanceOf(String.class);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testVariableSubstitutionWithNewline() {
        String inputText = "name\\nvalue";
        String expectedOutput = "name\nvalue";
        Object obj = actionService.variableSubstitution("{{Input.text}}", Map.of("Input.text", inputText));
        assertThat(obj).isNotNull();
        assertThat(obj).isInstanceOf(String.class);
        assertThat(obj).isEqualTo(expectedOutput);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecute() {
        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));

        Action action = new Action();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setAction(action);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteNullRequestBody() {
        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));

        Action action = new Action();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setAction(action);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteDbQuery() {
        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        Action action = new Action();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from users");
        action.setActionConfiguration(actionConfiguration);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setAction(action);

        executeAndAssertAction(executeActionDTO, actionConfiguration, mockResult);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteDuplicateRequestHeader() {
        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        Action action = new Action();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(List.of(
                new Property("random-header-key", "random-header-value"),
                new Property("dup-key", "dup-value1"),
                new Property("DUP-key", "dup-value2")
        ));
        action.setActionConfiguration(actionConfiguration);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setAction(action);

        Mono<ActionExecutionResult> executionResultMono = executeAction(executeActionDTO, actionConfiguration, mockResult);
        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    // Assert that the fxn should pick up the latest key based on the case-insensitive values
                    assertThat(result.getRequestHeaders().size()).isEqualTo(2);
                    MultiValueMap<String, String> resultHeader = CollectionUtils.toMultiValueMap(Map.of(
                            "random-header-key", Arrays.asList("random-header-value"),
                            "DUP-key", Arrays.asList("dup-value2")));
                    assertThat(result.getRequestHeaders()).isEqualTo(objectMapper.valueToTree(resultHeader));
                })
                .verifyComplete();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteEmptyRequestHeader() {
        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        Action action = new Action();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(List.of(
                new Property("random-header-key", "random-header-value"),
                new Property("", "")
        ));
        action.setActionConfiguration(actionConfiguration);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setAction(action);

        Mono<ActionExecutionResult> executionResultMono = executeAction(executeActionDTO, actionConfiguration, mockResult);
        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    // The fxn should have ignored all duplicate headers
                    assertThat(result.getRequestHeaders().size()).isEqualTo(1);
                    MultiValueMap<String, String> resultHeader = CollectionUtils.toMultiValueMap(Map.of(
                            "random-header-key", Arrays.asList("random-header-value")));

                    assertThat(result.getRequestHeaders()).isEqualTo(objectMapper.valueToTree(resultHeader));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteErrorResponse() {
        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        Action action = new Action();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(List.of(
                new Property("random-header-key", "random-header-value"),
                new Property("", "")
        ));
        action.setActionConfiguration(actionConfiguration);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setAction(action);

        AppsmithPluginException pluginException = new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR);
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.execute(Mockito.any(), Mockito.any(), Mockito.any())).thenReturn(Mono.error(pluginException));
        Mockito.when(pluginExecutor.datasourceCreate(Mockito.any())).thenReturn(Mono.empty());

        Mono<ActionExecutionResult> executionResultMono = actionService.executeAction(executeActionDTO);

        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    assertThat(result.getIsExecutionSuccess()).isFalse();
                    assertThat(result.getStatusCode()).isEqualTo(pluginException.getAppErrorCode().toString());
                })
                .verifyComplete();
    }

    private void executeAndAssertAction(ExecuteActionDTO executeActionDTO, ActionConfiguration actionConfiguration, ActionExecutionResult mockResult) {

        Mono<ActionExecutionResult> actionExecutionResultMono = executeAction(executeActionDTO, actionConfiguration, mockResult);

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getBody()).isEqualTo(mockResult.getBody());

                    if (actionConfiguration.getHeaders() != null) {
                        assertThat(result.getRequestHeaders().size()).isEqualTo(actionConfiguration.getHeaders().size());
                    }

                    assertThat(result.getRequestBody() == actionConfiguration.getBody()).isTrue();
                    assertThat(result.getHeaders()).isEqualTo(mockResult.getHeaders());
                })
                .verifyComplete();
    }

    private Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO, ActionConfiguration actionConfiguration, ActionExecutionResult mockResult) {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.execute(Mockito.any(), Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockResult));
        Mockito.when(pluginExecutor.datasourceCreate(Mockito.any())).thenReturn(Mono.empty());

        Mono<ActionExecutionResult> actionExecutionResultMono = actionService.executeAction(executeActionDTO);
        return actionExecutionResultMono;
    }
}
