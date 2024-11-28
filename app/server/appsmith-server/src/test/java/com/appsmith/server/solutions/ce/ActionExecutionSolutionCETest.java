package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.DisplayDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.ParsedDataType;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.WidgetSuggestionDTO;
import com.appsmith.external.models.WidgetType;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExecuteActionMetaDTO;
import com.appsmith.server.dtos.MockDataSource;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.WidgetSuggestionHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.cakes.DatasourceRepositoryCake;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.repositories.cakes.PluginRepositoryCake;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutService;
import com.appsmith.server.services.MockDataService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionExecutionSolution;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(AfterAllCleanUpExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
public class ActionExecutionSolutionCETest {

    @Autowired
    ActionExecutionSolution actionExecutionSolution;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    PluginRepositoryCake pluginRepository;

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
    ImportService importService;

    @Autowired
    ExportService exportService;

    @SpyBean
    PluginService pluginService;

    @SpyBean
    DatasourceService spyDatasourceService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    MockDataService mockDataService;

    @Autowired
    PermissionGroupRepositoryCake permissionGroupRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @SpyBean
    AstService astService;

    @Autowired
    DatasourceRepositoryCake datasourceRepository;

    @SpyBean
    DatasourceStorageService datasourceStorageService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    Application testApp = null;

    PageDTO testPage = null;

    Application gitConnectedApp = null;

    PageDTO gitConnectedPage = null;

    Datasource datasource;

    String workspaceId;

    String defaultEnvironmentId;

    String branchName;

    @BeforeEach
    public void setup() {
        User currentUser = sessionUserService.getCurrentUser().block();
        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("ActionServiceCE_Test");
        Set<String> beforeCreatingWorkspace =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User before creating workspace: {}", beforeCreatingWorkspace);

        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();
        Set<String> afterCreatingWorkspace =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User after creating workspace: {}", afterCreatingWorkspace);

        log.info("Workspace ID: {}", workspaceId);
        log.info("Workspace Role Ids: {}", workspace.getDefaultPermissionGroups());
        log.info("Policy for created Workspace: {}", workspace.getPolicies());
        log.info("Current User ID: {}", currentUser.getId());

        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        // Create application and page which will be used by the tests to create actions for.
        Application application = new Application();
        application.setName(UUID.randomUUID().toString());
        testApp = applicationPageService
                .createApplication(application, workspaceId)
                .block();

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
        temp2.add(new JSONObject(Map.of("key", "primaryColumns._id")));
        dsl2.put("dynamicBindingPathList", temp2);
        objects.add(dsl2);
        dsl.put("children", objects);

        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        Application newApp = new Application();
        newApp.setName(UUID.randomUUID().toString());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setBranchName("actionServiceTest");
        newApp.setGitApplicationMetadata(gitData);
        gitConnectedApp = applicationPageService
                .createApplication(newApp, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1).zipWhen(application11 -> exportService
                            .exportByArtifactIdAndBranchName(
                                    application11.getId(), gitData.getBranchName(), ArtifactType.APPLICATION)
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson));
                })
                // Assign the branchName to all the resources connected to the application
                .flatMap(tuple -> importService.importArtifactInWorkspaceFromGit(
                        workspaceId, tuple.getT1().getId(), tuple.getT2(), gitData.getBranchName()))
                .map(importableArtifact -> (Application) importableArtifact)
                .block();

        gitConnectedPage = newPageService
                .findPageById(gitConnectedApp.getPages().get(0).getId(), READ_PAGES, false)
                .block();

        branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();

        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId,
                new DatasourceStorageDTO(null, defaultEnvironmentId, datasource.getDatasourceConfiguration()));
        datasource.setDatasourceStorages(storages);
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    private void executeAndAssertAction(
            ExecuteActionDTO executeActionDTO,
            ActionExecutionResult mockResult,
            List<ParsedDataType> expectedReturnDataTypes) {

        List<WidgetSuggestionDTO> expectedWidgets = mockResult.getSuggestedWidgets();
        Mono<ActionExecutionResult> actionExecutionResultMono = executeAction(executeActionDTO, mockResult);

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getBody()).isEqualTo(mockResult.getBody());
                    assertThat(result.getDataTypes()).hasToString(expectedReturnDataTypes.toString());
                    assertThat(result.getSuggestedWidgets())
                            .usingRecursiveFieldByFieldElementComparator()
                            .containsExactlyInAnyOrderElementsOf(expectedWidgets);
                    assertThat(result.getRequest().getActionId()).isEqualTo(executeActionDTO.getActionId());
                    assertThat(result.getRequest().getRequestedAt()).isBefore(Instant.now());
                })
                .verifyComplete();
    }

    private Mono<ActionExecutionResult> executeAction(
            ExecuteActionDTO executeActionDTO, ActionExecutionResult mockResult) {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterizedWithMetrics(any(), any(), any(), any(), any()))
                .thenReturn(Mono.just(mockResult));
        Mockito.when(pluginExecutor.executeParameterizedWithMetricsAndFlags(any(), any(), any(), any(), any(), any()))
                .thenReturn(Mono.just(mockResult));
        Mockito.when(pluginExecutor.datasourceCreate(any())).thenReturn(Mono.empty());
        Mockito.doReturn(Mono.just(false))
                .when(spyDatasourceService)
                .isEndpointBlockedForConnectionRequest(Mockito.any());

        ExecuteActionMetaDTO executeActionMetaDTO = ExecuteActionMetaDTO.builder()
                .environmentId(defaultEnvironmentId)
                .build();

        Mono<ActionExecutionResult> actionExecutionResultMono =
                actionExecutionSolution.executeAction(executeActionDTO, executeActionMetaDTO);
        return actionExecutionResultMono;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testVariableSubstitution() {
        String json = "{\n" + "  \n"
                + "  \"deleted\": false,\n"
                + "  \"config\": {\n"
                + "    \"CONTAINER_WIDGET\": [\n"
                + "      {\n"
                + "        \"_id\": \"7\",\n"
                + "        \"sectionName\": \"General\",\n"
                + "        \"children\": [\n"
                + "          {\n"
                + "            \"_id\": \"7.1\",\n"
                + "            \"helpText\": \"Use a html color name, HEX, RGB or RGBA value\",\n"
                + "            \"placeholderText\": \"#FFFFFF / Gray / rgb(255, 99, 71)\",\n"
                + "            \"propertyName\": \"backgroundColor\",\n"
                + "            \"label\": \"Background Color\",\n"
                + "            \"controlType\": \"INPUT_TEXT\"\n"
                + "          },\n"
                + "          {\n"
                + "            \"_id\": \"7.2\",\n"
                + "            \"helpText\": \"Controls the visibility of the widget\",\n"
                + "            \"propertyName\": \"isVisible\",\n"
                + "            \"label\": \"Visible\",\n"
                + "            \"controlType\": \"SWITCH\",\n"
                + "            \"isJSConvertible\": true\n"
                + "          }\n"
                + "        ]\n"
                + "      }\n"
                + "    ]\n"
                + "  },\n"
                + "  \"name\": \"propertyPane\"\n"
                + "}";

        ActionDTO action = new ActionDTO();
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setBody("{{Input.text}}");

        ActionDTO renderedAction = actionExecutionSolution.variableSubstitution(action, Map.of("Input.text", json));
        assertThat(renderedAction).isNotNull();
        assertThat(renderedAction.getActionConfiguration().getBody()).isEqualTo(json);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testVariableSubstitutionWithNewline() {
        ActionDTO action = new ActionDTO();
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setBody("{{Input.text}}");

        ActionDTO renderedAction =
                actionExecutionSolution.variableSubstitution(action, Map.of("Input.text", "name\nvalue"));
        assertThat(renderedAction).isNotNull();
        assertThat(renderedAction.getActionConfiguration().getBody()).isEqualTo("name\nvalue");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecute() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteNullRequestBody() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setName("testActionExecuteNullRequestBody");
        action.setPageId(testPage.getId());
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteDbQuery() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from users");
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteDbQuery");
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteErrorResponse() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(
                List.of(new Property("random-header-key", "random-header-value"), new Property("", "")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteErrorResponse");
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        AppsmithPluginException pluginException = new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR);
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterizedWithMetrics(any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(pluginException));
        Mockito.when(pluginExecutor.executeParameterizedWithMetricsAndFlags(any(), any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(pluginException));
        Mockito.when(pluginExecutor.datasourceCreate(any())).thenReturn(Mono.empty());
        Mockito.doReturn(Mono.just(false))
                .when(spyDatasourceService)
                .isEndpointBlockedForConnectionRequest(Mockito.any());

        ExecuteActionMetaDTO executeActionMetaDTO =
                ExecuteActionMetaDTO.builder().build();

        Mono<ActionExecutionResult> executionResultMono =
                actionExecutionSolution.executeAction(executeActionDTO, executeActionMetaDTO);

        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    assertThat(result.getIsExecutionSuccess()).isFalse();
                    assertThat(result.getStatusCode()).isEqualTo(pluginException.getAppErrorCode());
                    assertThat(result.getTitle()).isEqualTo(pluginException.getTitle());
                    assertThat(result.getRequest().getActionId()).isEqualTo(createdAction.getId());
                    assertThat(result.getRequest().getRequestedAt()).isBefore(Instant.now());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteNullPaginationParameters() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(
                List.of(new Property("random-header-key", "random-header-value"), new Property("", "")));
        actionConfiguration.setPaginationType(PaginationType.URL);
        actionConfiguration.setNext(null);
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteErrorResponse");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);
        executeActionDTO.setPaginationField(PaginationField.NEXT);

        AppsmithPluginException pluginException = new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR);
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterizedWithMetrics(any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(pluginException));
        Mockito.when(pluginExecutor.executeParameterizedWithMetricsAndFlags(any(), any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(pluginException));
        Mockito.when(pluginExecutor.datasourceCreate(any())).thenReturn(Mono.empty());
        Mockito.doReturn(Mono.just(false))
                .when(spyDatasourceService)
                .isEndpointBlockedForConnectionRequest(Mockito.any());

        ExecuteActionMetaDTO executeActionMetaDTO =
                ExecuteActionMetaDTO.builder().build();

        Mono<ActionExecutionResult> executionResultMono =
                actionExecutionSolution.executeAction(executeActionDTO, executeActionMetaDTO);

        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    assertThat(result.getIsExecutionSuccess()).isFalse();
                    assertThat(result.getStatusCode()).isEqualTo(pluginException.getAppErrorCode());
                    assertThat(result.getTitle()).isEqualTo(pluginException.getTitle());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteSecondaryStaleConnection() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(
                List.of(new Property("random-header-key", "random-header-value"), new Property("", "")));
        actionConfiguration.setTimeoutInMillisecond(String.valueOf(1000));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteSecondaryStaleConnection");
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterizedWithMetrics(any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(new StaleConnectionException()))
                .thenReturn(Mono.error(new StaleConnectionException()));
        Mockito.when(pluginExecutor.executeParameterizedWithMetricsAndFlags(any(), any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(new StaleConnectionException()))
                .thenReturn(Mono.error(new StaleConnectionException()));
        Mockito.when(pluginExecutor.datasourceCreate(any())).thenReturn(Mono.empty());
        Mockito.doReturn(Mono.just(false))
                .when(spyDatasourceService)
                .isEndpointBlockedForConnectionRequest(Mockito.any());

        ExecuteActionMetaDTO executeActionMetaDTO =
                ExecuteActionMetaDTO.builder().build();

        Mono<ActionExecutionResult> executionResultMono =
                actionExecutionSolution.executeAction(executeActionDTO, executeActionMetaDTO);

        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    assertThat(result.getIsExecutionSuccess()).isFalse();
                    assertThat(result.getStatusCode())
                            .isEqualTo(AppsmithPluginError.STALE_CONNECTION_ERROR.getAppErrorCode());
                    assertThat(result.getTitle()).isEqualTo(AppsmithPluginError.STALE_CONNECTION_ERROR.getTitle());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHeaders(
                List.of(new Property("random-header-key", "random-header-value"), new Property("", "")));
        actionConfiguration.setTimeoutInMillisecond(String.valueOf(10));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteTimeout");
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterizedWithMetrics(any(), any(), any(), any(), any()))
                .thenAnswer(x -> Mono.delay(Duration.ofMillis(1000)).ofType(ActionExecutionResult.class));
        Mockito.when(pluginExecutor.executeParameterizedWithMetricsAndFlags(any(), any(), any(), any(), any(), any()))
                .thenAnswer(x -> Mono.delay(Duration.ofMillis(1000)).ofType(ActionExecutionResult.class));
        Mockito.when(pluginExecutor.datasourceCreate(any())).thenReturn(Mono.empty());
        Mockito.doReturn(Mono.just(false))
                .when(spyDatasourceService)
                .isEndpointBlockedForConnectionRequest(Mockito.any());

        ExecuteActionMetaDTO executeActionMetaDTO =
                ExecuteActionMetaDTO.builder().build();

        Mono<ActionExecutionResult> executionResultMono =
                actionExecutionSolution.executeAction(executeActionDTO, executeActionMetaDTO);

        StepVerifier.create(executionResultMono)
                .assertNext(result -> {
                    assertThat(result.getIsExecutionSuccess()).isFalse();
                    assertThat(result.getStatusCode())
                            .isEqualTo(AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR.getAppErrorCode());
                    assertThat(result.getTitle()).isEqualTo(AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR.getTitle());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkRecoveryFromStaleConnections() {
        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.executeParameterizedWithMetrics(any(), any(), any(), any(), any()))
                .thenThrow(new StaleConnectionException());
        Mockito.when(pluginExecutor.executeParameterizedWithMetricsAndFlags(any(), any(), any(), any(), any(), any()))
                .thenThrow(new StaleConnectionException());
        Mockito.when(pluginExecutor.datasourceCreate(any())).thenReturn(Mono.empty());
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        Mockito.doReturn(Mono.just(false))
                .when(spyDatasourceService)
                .isEndpointBlockedForConnectionRequest(Mockito.any());

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from users");
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("checkRecoveryFromStaleConnections");
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        ExecuteActionMetaDTO executeActionMetaDTO =
                ExecuteActionMetaDTO.builder().build();

        Mono<ActionExecutionResult> actionExecutionResultMono =
                actionExecutionSolution.executeAction(executeActionDTO, executeActionMetaDTO);

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getBody()).isEqualTo(mockResult.getBody());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void executeActionWithExternalDatasource() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginService.getEditorConfigLabelMap(Mockito.anyString())).thenReturn(Mono.just(new HashMap<>()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("Default Database");
        externalDatasource.setWorkspaceId(workspaceId);
        Plugin restApiPlugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        externalDatasource.setPluginId(restApiPlugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("actionWithExternalDatasource");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(savedDs);

        ExecuteActionMetaDTO executeActionMetaDTO = ExecuteActionMetaDTO.builder()
                .environmentId(defaultEnvironmentId)
                .build();

        Mono<ActionExecutionResult> resultMono = layoutActionService
                .createSingleAction(action, Boolean.FALSE)
                .flatMap(savedAction -> {
                    ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
                    executeActionDTO.setActionId(savedAction.getId());
                    executeActionDTO.setViewMode(false);
                    return actionExecutionSolution.executeAction(executeActionDTO, executeActionMetaDTO);
                });

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getStatusCode()).isEqualTo("200");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteWithTableReturnType() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("[\n" + "{\"name\": \"Richard\", \"profession\": \"medical\"},\n"
                + "{\"name\": \"John\", \"profession\": \"self employed\"},\n"
                + "{\"name\": \"Mary\", \"profession\": \"engineer\"}\n"
                + "]");
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(
                executeActionDTO,
                mockResult,
                List.of(
                        new ParsedDataType(DisplayDataType.TABLE),
                        new ParsedDataType(DisplayDataType.JSON),
                        new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteWithJsonReturnType() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("{\n" + "  \"name\":\"John\",\n"
                + "  \"age\":30,\n"
                + "  \"cars\": {\n"
                + "    \"car1\":\"Ford\",\n"
                + "    \"car2\":\"BMW\",\n"
                + "    \"car3\":\"Fiat\"\n"
                + "  }\n"
                + " }");
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(
                executeActionDTO,
                mockResult,
                List.of(new ParsedDataType(DisplayDataType.JSON), new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteWithPreAssignedReturnType() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("{\n" + "  \"name\":\"John\",\n"
                + "  \"age\":30,\n"
                + "  \"cars\": {\n"
                + "    \"car1\":\"Ford\",\n"
                + "    \"car2\":\"BMW\",\n"
                + "    \"car3\":\"Fiat\"\n"
                + "  }\n"
                + " }");
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionExecuteReturnTypeWithNullResultBody() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, new ArrayList<>());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithChartWidgetData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": [\n" + "  {\n"
                + "    \"x\": \"Mon\",\n"
                + "    \"y\": 10000\n"
                + "  },\n"
                + "  {\n"
                + "    \"x\": \"Tue\",\n"
                + "    \"y\": 12000\n"
                + "  },\n"
                + "  {\n"
                + "    \"x\": \"Wed\",\n"
                + "    \"y\": 32000\n"
                + "  },\n"
                + "  {\n"
                + "    \"x\": \"Thu\",\n"
                + "    \"y\": 28000\n"
                + "  },\n"
                + "  {\n"
                + "    \"x\": \"Fri\",\n"
                + "    \"y\": 14000\n"
                + "  },\n"
                + "  {\n"
                + "    \"x\": \"Sat\",\n"
                + "    \"y\": 19000\n"
                + "  },\n"
                + "  {\n"
                + "    \"x\": \"Sun\",\n"
                + "    \"y\": 36000\n"
                + "  }\n"
                + "]}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET_V2));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.SELECT_WIDGET, "x", "x"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.CHART_WIDGET, "x", "y"));
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithTableWidgetData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": [\n" + "\t{\n"
                + "\t\t\"id\": \"0001\",\n"
                + "\t\t\"type\": \"donut\",\n"
                + "\t\t\"name\": \"Cake\",\n"
                + "\t\t\"ppu\": 0.55,\n"
                + "\t\t\"batters\":\n"
                + "\t\t\t{\n"
                + "\t\t\t\t\"batter\":\n"
                + "\t\t\t\t\t[\n"
                + "\t\t\t\t\t\t{ \"id\": \"1001\", \"type\": \"Regular\" },\n"
                + "\t\t\t\t\t\t{ \"id\": \"1002\", \"type\": \"Chocolate\" },\n"
                + "\t\t\t\t\t\t{ \"id\": \"1003\", \"type\": \"Blueberry\" },\n"
                + "\t\t\t\t\t\t{ \"id\": \"1004\", \"type\": \"Devil's Food\" }\n"
                + "\t\t\t\t\t]\n"
                + "\t\t\t},\n"
                + "\t\t\"topping\":\n"
                + "\t\t\t[\n"
                + "\t\t\t\t{ \"id\": \"5001\", \"type\": \"None\" },\n"
                + "\t\t\t\t{ \"id\": \"5002\", \"type\": \"Glazed\" },\n"
                + "\t\t\t\t{ \"id\": \"5005\", \"type\": \"Sugar\" },\n"
                + "\t\t\t\t{ \"id\": \"5007\", \"type\": \"Powdered Sugar\" },\n"
                + "\t\t\t\t{ \"id\": \"5006\", \"type\": \"Chocolate with Sprinkles\" },\n"
                + "\t\t\t\t{ \"id\": \"5003\", \"type\": \"Chocolate\" },\n"
                + "\t\t\t\t{ \"id\": \"5004\", \"type\": \"Maple\" }\n"
                + "\t\t\t]\n"
                + "\t},\n"
                + "\t{\n"
                + "\t\t\"id\": \"0002\",\n"
                + "\t\t\"type\": \"donut\",\n"
                + "\t\t\"name\": \"Raised\",\n"
                + "\t\t\"ppu\": 0.55,\n"
                + "\t\t\"batters\":\n"
                + "\t\t\t{\n"
                + "\t\t\t\t\"batter\":\n"
                + "\t\t\t\t\t[\n"
                + "\t\t\t\t\t\t{ \"id\": \"1001\", \"type\": \"Regular\" }\n"
                + "\t\t\t\t\t]\n"
                + "\t\t\t},\n"
                + "\t\t\"topping\":\n"
                + "\t\t\t[\n"
                + "\t\t\t\t{ \"id\": \"5001\", \"type\": \"None\" },\n"
                + "\t\t\t\t{ \"id\": \"5002\", \"type\": \"Glazed\" },\n"
                + "\t\t\t\t{ \"id\": \"5005\", \"type\": \"Sugar\" },\n"
                + "\t\t\t\t{ \"id\": \"5003\", \"type\": \"Chocolate\" },\n"
                + "\t\t\t\t{ \"id\": \"5004\", \"type\": \"Maple\" }\n"
                + "\t\t\t]\n"
                + "\t},\n"
                + "\t{\n"
                + "\t\t\"id\": \"0003\",\n"
                + "\t\t\"type\": \"donut\",\n"
                + "\t\t\"name\": \"Old Fashioned\",\n"
                + "\t\t\"ppu\": 0.55,\n"
                + "\t\t\"batters\":\n"
                + "\t\t\t{\n"
                + "\t\t\t\t\"batter\":\n"
                + "\t\t\t\t\t[\n"
                + "\t\t\t\t\t\t{ \"id\": \"1001\", \"type\": \"Regular\" },\n"
                + "\t\t\t\t\t\t{ \"id\": \"1002\", \"type\": \"Chocolate\" }\n"
                + "\t\t\t\t\t]\n"
                + "\t\t\t},\n"
                + "\t\t\"topping\":\n"
                + "\t\t\t[\n"
                + "\t\t\t\t{ \"id\": \"5001\", \"type\": \"None\" },\n"
                + "\t\t\t\t{ \"id\": \"5002\", \"type\": \"Glazed\" },\n"
                + "\t\t\t\t{ \"id\": \"5003\", \"type\": \"Chocolate\" },\n"
                + "\t\t\t\t{ \"id\": \"5004\", \"type\": \"Maple\" }\n"
                + "\t\t\t]\n"
                + "\t}\n"
                + "]}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET_V2));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.SELECT_WIDGET, "id", "type"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.CHART_WIDGET, "id", "ppu"));
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithListWidgetData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": [\n" + "    {\n"
                + "        \"url\": \"images/thumbnails/0001.jpg\",\n"
                + "        \"width\": 32,\n"
                + "        \"height\": 32\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0001.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0002.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0002.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0003.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0004.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0005.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0006.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0007.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0008.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0009.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    },\n"
                + "    {\n"
                + "        \"url\": \"images/0010.jpg\",\n"
                + "        \"width\": 200,\n"
                + "        \"height\": 200\n"
                + "    }\n"
                + "]}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET_V2));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.SELECT_WIDGET, "url", "url"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.CHART_WIDGET, "url", "width"));
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithDropdownWidgetData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": [\n" + "    {\n"
                + "     \"CarType\": \"BMW\",\n"
                + "     \"carID\": \"bmw123\"\n"
                + "     },\n"
                + "      {\n"
                + "     \"CarType\": \"mercedes\",\n"
                + "     \"carID\": \"merc123\"\n"
                + "      },\n"
                + "      {\n"
                + "     \"CarType\": \"volvo\",\n"
                + "     \"carID\": \"vol123r\"\n"
                + "       },\n"
                + "       {\n"
                + "     \"CarType\": \"ford\",\n"
                + "     \"carID\": \"ford123\"\n"
                + "       }\n"
                + "  ]}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET_V2));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.SELECT_WIDGET, "CarType", "carID"));
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithArrayOfStringsDropDownWidget() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\":[\"string1\", \"string2\", \"string3\", \"string4\"] }";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));
        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.INPUT_WIDGET));
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithArrayOfArray() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\":[[\"string1\", \"string2\", \"string3\", \"string4\"],"
                + "[\"string5\", \"string6\", \"string7\", \"string8\"],"
                + "[\"string9\", \"string10\", \"string11\", \"string12\"]] }";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET_V2));
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithEmptyData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\":[] }";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithNumericData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithJsonNodeData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data =
                "{\"data\": {\n" + "    \"next\": \"https://mock-api.appsmith.com/users?page=2&pageSize=10\",\n"
                        + "    \"previous\": null,\n"
                        + "    \"users\": [\n"
                        + "        {\n"
                        + "            \"id\": 3,\n"
                        + "            \"name\": \"Demetre\",\n"
                        + "            \"status\": \"APPROVED\",\n"
                        + "            \"gender\": \"Male\",\n"
                        + "            \"avatar\": \"https://robohash.org/iustooptiocum.jpg?size=100x100&set=set1\",\n"
                        + "            \"email\": \"aaaa@bbb.com\",\n"
                        + "            \"address\": \"262 Saint Paul Park\",\n"
                        + "            \"createdAt\": \"2020-05-01T17:30:50.000Z\",\n"
                        + "            \"updatedAt\": \"2019-10-08T14:55:53.000Z\"\n"
                        + "        },\n"
                        + "        {\n"
                        + "            \"id\": 4,\n"
                        + "            \"name\": \"Currey\",\n"
                        + "            \"status\": \"APPROVED\",\n"
                        + "            \"gender\": \"Female\",\n"
                        + "            \"avatar\": \"https://robohash.org/aspernaturnatusrepellat.jpg?size=100x100&set=set1\",\n"
                        + "            \"email\": \"cbrayson3@taobao.com\",\n"
                        + "            \"address\": \"35180 Lotheville Street!\",\n"
                        + "            \"createdAt\": \"2019-12-30T03:54:23.000Z\",\n"
                        + "            \"updatedAt\": \"2020-08-12T17:43:01.016Z\"\n"
                        + "        }\n"
                        + "    ]\n"
                        + "}}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidgetNestedData(WidgetType.TABLE_WIDGET_V2, "users"));
        widgetTypeList.add(
                WidgetSuggestionHelper.getWidgetNestedData(WidgetType.SELECT_WIDGET, "users", "name", "status"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidgetNestedData(WidgetType.CHART_WIDGET, "users", "name", "id"));
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithJsonObjectData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": {\n" + "            \"id\": 1,\n"
                + "            \"name\": \"Barty Crouch\",\n"
                + "            \"status\": \"APPROVED\",\n"
                + "            \"gender\": \"\",\n"
                + "            \"avatar\": \"https://robohash.org/sednecessitatibuset.png?size=100x100&set=set1\",\n"
                + "            \"email\": \"barty.crouch@gmail.com\",\n"
                + "            \"address\": \"St Petersberg #911 4th main\",\n"
                + "            \"createdAt\": \"2020-03-16T18:00:05.000Z\",\n"
                + "            \"updatedAt\": \"2020-08-12T17:29:31.980Z\"\n"
                + "        } }";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionAfterExecutionWithJsonArrayObjectData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data = "{ \"data\": {\n" + "            \"id\": 1,\n"
                + "            \"name\": \"Barty Crouch\",\n"
                + "            \"status\": \"APPROVED\",\n"
                + "            \"gender\": \"\",\n"
                + "            \"avatar\": \"https://robohash.org/sednecessitatibuset.png?size=100x100&set=set1\",\n"
                + "            \"email\": \"barty.crouch@gmail.com\",\n"
                + "            \"address\": \"St Petersberg #911 4th main\",\n"
                + "            \"createdAt\": \"2020-03-16T18:00:05.000Z\",\n"
                + "            \"updatedAt\": \"2020-08-12T17:29:31.980Z\"\n"
                + "        },"
                + "\"data\": {\n"
                + "            \"id\": 2,\n"
                + "            \"name\": \"Jenelle Kibbys\",\n"
                + "            \"status\": \"APPROVED\",\n"
                + "            \"gender\": \"Female\",\n"
                + "            \"avatar\": \"https://robohash.org/quiaasperiorespariatur.bmp?size=100x100&set=set1\",\n"
                + "            \"email\": \"jkibby1@hp.com\",\n"
                + "            \"address\": \"85 Tennessee Plaza\",\n"
                + "            \"createdAt\": \"2019-10-04T03:22:23.000Z\",\n"
                + "            \"updatedAt\": \"2019-09-11T20:18:38.000Z\"\n"
                + "        } }";
        final JsonNode arrNode = new ObjectMapper().readTree(data);

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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionNestedData() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data =
                "{\"data\": {\n" + "    \"next\": \"https://mock-api.appsmith.com/users?page=2&pageSize=10\",\n"
                        + "    \"previous\": null,\n"
                        + "    \"users\": [1, 2, 3]\n"
                        + "}}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(arrNode);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidgetNestedData(WidgetType.TABLE_WIDGET_V2, "users"));
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetSuggestionNestedDataEmpty() throws JsonProcessingException {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        final String data =
                "{\"data\": {\n" + "    \"next\": \"https://mock-api.appsmith.com/users?page=2&pageSize=10\",\n"
                        + "    \"previous\": null,\n"
                        + "    \"users\": []\n"
                        + "}}";
        final JsonNode arrNode = new ObjectMapper().readTree(data).get("data");

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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void suggestWidget_ArrayListData_SuggestTableTextChartDropDownWidget() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        ArrayList<JSONObject> listData = new ArrayList<>();
        JSONObject jsonObject = new JSONObject(Map.of("url", "images/thumbnails/0001.jpg", "width", 32, "height", 32));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0001.jpg", "width", 42, "height", 22));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0002.jpg", "width", 52, "height", 12));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0003.jpg", "width", 62, "height", 52));
        listData.add(jsonObject);
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(listData);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET_V2));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.SELECT_WIDGET, "url", "url"));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.CHART_WIDGET, "url", "width"));
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void suggestWidget_ArrayListData_SuggestTableTextDropDownWidget() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        ArrayList<JSONObject> listData = new ArrayList<>();
        JSONObject jsonObject =
                new JSONObject(Map.of("url", "images/thumbnails/0001.jpg", "width", "32", "height", "32"));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0001.jpg", "width", "42", "height", "22"));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0002.jpg", "width", "52", "height", "12"));
        listData.add(jsonObject);
        jsonObject = new JSONObject(Map.of("url", "images/0003.jpg", "width", "62", "height", "52"));
        listData.add(jsonObject);
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(listData);
        mockResult.setStatusCode("200");
        mockResult.setHeaders(objectMapper.valueToTree(Map.of("response-header-key", "response-header-value")));
        mockResult.setDataTypes(List.of(new ParsedDataType(DisplayDataType.RAW)));

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TABLE_WIDGET_V2));
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.SELECT_WIDGET, "width", "url"));
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void suggestWidget_ArrayListDataEmpty_SuggestTextWidget() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionExecutionResult mockResult = new ActionExecutionResult();
        ArrayList<JSONObject> listData = new ArrayList<>();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody(listData);
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
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void executeAction_actionOnMockDatasource_success() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginService.getEditorConfigLabelMap(Mockito.anyString())).thenReturn(Mono.just(new HashMap<>()));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");

        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        MockDataSource mockDataSource = new MockDataSource();
        mockDataSource.setName("Users");
        mockDataSource.setWorkspaceId(workspaceId);
        mockDataSource.setPackageName("postgres-plugin");
        mockDataSource.setPluginId(installed_plugin.getId());
        Datasource mockDatasource = mockDataService
                .createMockDataSet(mockDataSource, defaultEnvironmentId)
                .block();

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from users");
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteDbQuery");
        Datasource datasource1 = mockDatasource;
        action.setDatasource(datasource1);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        executeAndAssertAction(executeActionDTO, mockResult, List.of(new ParsedDataType(DisplayDataType.RAW)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void executeActionNoStorageFound() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginService.getEditorConfigLabelMap(Mockito.anyString())).thenReturn(Mono.just(new HashMap<>()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("Default Database");
        externalDatasource.setWorkspaceId(workspaceId);
        Plugin restApiPlugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        externalDatasource.setPluginId(restApiPlugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("actionWithExternalDatasource");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(savedDs);

        ExecuteActionMetaDTO executeActionMetaDTO = ExecuteActionMetaDTO.builder()
                .environmentId(defaultEnvironmentId)
                .build();

        Mono<ActionExecutionResult> resultMono = layoutActionService
                .createSingleAction(action, Boolean.FALSE)
                .flatMap(savedAction -> {
                    ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
                    executeActionDTO.setActionId(savedAction.getId());
                    executeActionDTO.setViewMode(false);
                    return actionExecutionSolution.executeAction(executeActionDTO, executeActionMetaDTO);
                });

        Mockito.doReturn(Mono.empty())
                .when(datasourceStorageService)
                .findByDatasourceAndEnvironmentIdForExecution(any(), any());

        StepVerifier.create(resultMono).assertNext(actionExecutionResult -> {
            assertThat(actionExecutionResult.getIsExecutionSuccess()).isEqualTo(false);
            assertThat(actionExecutionResult.getStatusCode())
                    .isEqualTo(AppsmithError.NO_CONFIGURATION_FOUND_IN_DATASOURCE.getAppErrorCode());
            assertThat(actionExecutionResult.getErrorType())
                    .isEqualTo(AppsmithError.NO_CONFIGURATION_FOUND_IN_DATASOURCE.getErrorType());
        });
    }
}
