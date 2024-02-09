package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.constants.CommonFieldName;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.external.models.WidgetSuggestionDTO;
import com.appsmith.external.models.WidgetType;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.constants.AuditLogConstants;
import com.appsmith.server.constants.AuditLogEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.domains.AuditLogGacEntityMetadata;
import com.appsmith.server.domains.AuditLogGacMetadata;
import com.appsmith.server.domains.AuditLogMetadata;
import com.appsmith.server.domains.AuditLogPermissionGroupMetadata;
import com.appsmith.server.domains.AuditLogResource;
import com.appsmith.server.domains.AuditLogUserGroupMetadata;
import com.appsmith.server.domains.AuditLogUserMetadata;
import com.appsmith.server.domains.AuditLogWorkflowMetadata;
import com.appsmith.server.domains.AuditLogWorkspaceMetadata;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.AuditLogExportDTO;
import com.appsmith.server.dtos.AuditLogFilterDTO;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.InviteUsersToApplicationDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateApplicationRoleDTO;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UserGroupUpdateDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.exports.exportable.ExportService;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.fork.internal.ApplicationForkingService;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.helpers.WidgetSuggestionHelper;
import com.appsmith.server.imports.importable.ImportService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.AuditLogRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.ActionExecutionSolution;
import com.appsmith.server.solutions.CreateDBTablePageSolution;
import com.appsmith.server.solutions.EnvManager;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.UserSignup;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import com.appsmith.server.themes.base.ThemeService;
import com.appsmith.server.workflows.crud.CrudWorkflowService;
import com.appsmith.server.workflows.interact.InteractWorkflowService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.mock.web.server.MockWebSession;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_CUSTOM_DOMAIN;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_DISABLE_TELEMETRY;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_HIDE_WATERMARK;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_INSTANCE_NAME;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_MAIL_FROM;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_MAIL_PASSWORD;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_MAIL_PORT;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GITHUB_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GOOGLE_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_OIDC_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_OIDC_CLIENT_SECRET;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_REPLY_TO;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SSO_SAML_ENABLED;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.CREATE;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.DELETE;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.EDIT;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.EXECUTE;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.EXPORT;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.MAKE_PUBLIC;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.VIEW;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static java.util.Map.entry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
@Slf4j
public class AuditLogServiceTest {
    @Autowired
    AuditLogService auditLogService;

    @Autowired
    UserService userService;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ImportService importService;

    @Autowired
    ExportService exportService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    ApplicationForkingService applicationForkingService;

    @Autowired
    ThemeService themeService;

    @Autowired
    AuditLogRepository auditLogRepository;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    UpdateLayoutService updateLayoutService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ActionExecutionSolution actionExecutionSolution;

    @Autowired
    UserRepository userRepository;

    @Autowired
    EnvManager envManager;

    @Autowired
    UserUtils userUtils;

    @Autowired
    UserSignup userSignup;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    CommonConfig commonConfig;

    @Autowired
    CreateDBTablePageSolution createDBTablePageSolution;

    @Autowired
    DatasourceStructureService datasourceStructureService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginExecutor pluginExecutor;

    @Autowired
    EnvironmentService environmentService;

    ObjectMapper objectMapper = new ObjectMapper();

    @SpyBean
    DatasourceContextServiceImpl datasourceContextService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    RoleConfigurationSolution roleConfigurationSolution;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    private CrudWorkflowService crudWorkflowService;

    @Autowired
    private InteractWorkflowService interactWorkflowService;

    private static String workspaceId;
    private static String defaultEnvironmentId;
    private static Application app;
    private static Application gitConnectedApp;
    private static String workspaceName = "AuditLogsTest";
    private static String originHeader = "http://localhost:8080";

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() throws IOException {

        // If the env file does not exist NoSuchFileException will be thrown from some of the test cases
        // We create empty file to handle this situation primarily in CI
        Path envFilePath = Path.of(commonConfig.getEnvFilePath());
        if (!Files.exists(envFilePath)) {
            Files.createFile(envFilePath);
        }

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_datasource_environments_enabled)))
                .thenReturn(Mono.just(FALSE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(FALSE));

        if (StringUtils.isEmpty(workspaceId)) {

            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName(workspaceName);

            if (!org.springframework.util.StringUtils.hasLength(workspaceId)) {
                Workspace workspace = workspaceService
                        .create(toCreate, apiUser, Boolean.FALSE)
                        .block();
                workspaceId = workspace.getId();

                defaultEnvironmentId = workspaceService
                        .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                        .block();
            }

            // Make api_user super user as AuditLogs are accessible for super users only
            User api_user = userRepository.findByEmail("api_user").block();
            userUtils.makeSuperUser(List.of(api_user)).block();

            app = createApp("testApp").block();
            gitConnectedApp = createGitConnectedApp("getAuditLogs_withNoFilters_Success_git", "master")
                    .block();
        }
    }

    @AfterEach
    public void resetMockFeatureFlags() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(FALSE));
    }

    private FilePart createFilePart(String filePath) {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource(filePath), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filepart;
    }

    private Mono<Application> createApp(String name) {
        Application application = new Application();
        application.setName(name);
        application.setWorkspaceId(workspaceId);
        return applicationPageService.createApplication(application).flatMap(application1 -> {
            PageDTO page = new PageDTO();
            page.setName("New Page");
            page.setApplicationId(application1.getId());
            return applicationPageService.createPage(page).thenReturn(application1);
        });
    }

    private Mono<Application> createGitConnectedApp(String name, String branchName) {
        Application application = new Application();
        application.setName(name);
        application.setWorkspaceId(workspaceId);
        return applicationPageService
                .createApplication(application)
                .flatMap(application1 -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application1.getId());
                    return applicationPageService.createPage(page).thenReturn(application1);
                })
                .flatMap(application1 -> {
                    GitArtifactMetadata gitApplicationMetadata = new GitArtifactMetadata();
                    GitAuth gitAuth = new GitAuth();
                    gitAuth.setPublicKey("testkey");
                    gitAuth.setPrivateKey("privatekey");
                    gitApplicationMetadata.setGitAuth(gitAuth);
                    gitApplicationMetadata.setDefaultApplicationId(application1.getId());
                    gitApplicationMetadata.setRepoName("testRepo");
                    gitApplicationMetadata.setRemoteUrl(String.format("git@github.com:test/%s.git", name));
                    gitApplicationMetadata.setBranchName(branchName);
                    gitApplicationMetadata.setDefaultBranchName(branchName);
                    application1.setGitApplicationMetadata(gitApplicationMetadata);
                    return applicationService.save(application1);
                });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogsFilterData_hasAllValidEvents_Success() {

        List<String> validAuditLogEvents = Arrays.stream(AuditLogEvents.Events.values())
                .map(events -> events.name().toLowerCase().replaceFirst("_", "."))
                .collect(Collectors.toList());

        Mono<AuditLogFilterDTO> auditLogFilter = auditLogService.getAuditLogFilterData();

        StepVerifier.create(auditLogFilter)
                .assertNext(auditLogFilterDTO -> {
                    assertThat(auditLogFilterDTO.getEventName().containsAll(validAuditLogEvents));
                    assertThat(auditLogFilterDTO.getEmails()).contains("api_user");
                    assertThat(auditLogFilterDTO.getEmails()).contains("anonymousUser");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllUsers_allUsers_success() {
        Mono<List<String>> usersMono = auditLogService.getAllUsers();

        StepVerifier.create(usersMono)
                .assertNext(users -> {
                    assertThat(users).containsAll(List.of("api_user", "anonymousUser"));
                })
                .verifyComplete();
    }

    private MultiValueMap<String, String> getAuditLogRequest(
            String emails,
            String events,
            String resourceType,
            String resourceId,
            String sortOrder,
            String cursor,
            String numberOfDays,
            String startDate,
            String endDate) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        if (emails != null && !emails.isEmpty()) {
            params.add(AuditLogConstants.EMAILS, emails);
        }

        if (events != null && !events.isEmpty()) {
            params.add(AuditLogConstants.EVENTS, events);
        }

        if (resourceType != null && !resourceType.isEmpty()) {
            params.add(AuditLogConstants.RESOURCE_TYPE, resourceType);
        }

        if (resourceId != null && !resourceId.isEmpty()) {
            params.add(AuditLogConstants.RESOURCE_ID, resourceId);
        }

        if (sortOrder != null && !sortOrder.isEmpty()) {
            params.add(AuditLogConstants.SORT_ORDER, sortOrder);
        }

        if (cursor != null && !cursor.isEmpty()) {
            params.add(AuditLogConstants.CURSOR, cursor);
        }

        if (numberOfDays != null && !numberOfDays.isEmpty()) {
            params.add(AuditLogConstants.NUMBER_OF_DAYS, numberOfDays);
        }

        if (startDate != null && !startDate.isEmpty() && endDate != null && !endDate.isEmpty()) {
            params.add(AuditLogConstants.START_DATE, startDate);
            params.add(AuditLogConstants.END_DATE, endDate);
        }
        return params;
    }

    // Default sorting is Desc order
    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withNoFilters_Success() {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.size()).isNotEqualTo(0);
                    for (AuditLog log : auditLogs) {
                        assertThat(log.getTimestamp()).isBefore(Instant.now());
                    }
                })
                .verifyComplete();
    }

    /**
     * To validate the ASC sort order of Audit Log events
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withFiltersAscOrder_Success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogTestWorkspace");
        Workspace updateWorkspace = new Workspace();
        updateWorkspace.setName("AuditLogTestWorkspaceUpdated");
        String resourceType = auditLogService.getResourceType(workspace);

        // Create, update and delete workspace sequentially to verify sort order
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        Workspace updatedWorkspace = workspaceService
                .update(createdWorkspace.getId(), updateWorkspace)
                .block();
        workspaceService.archiveById(createdWorkspace.getId()).block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, null, resourceType, createdWorkspace.getId(), "1", null, null, null, null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).hasSize(3);
                    // Validate each events
                    assertThat(auditLogs.get(0).getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.WORKSPACE_CREATED));
                    assertThat(auditLogs.get(0).getResource().getName()).isEqualTo(workspace.getName());

                    assertThat(auditLogs.get(1).getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.WORKSPACE_UPDATED));
                    assertThat(auditLogs.get(1).getResource().getName()).isEqualTo(updateWorkspace.getName());

                    assertThat(auditLogs.get(2).getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.WORKSPACE_DELETED));
                    assertThat(auditLogs.get(2).getResource().getName()).isEqualTo(updatedWorkspace.getName());

                    // Validate time difference and common properties
                    for (int i = 1; i < auditLogs.size(); i++) {
                        assertThat(auditLogs.get(i).getResource().getType())
                                .isEqualTo(auditLogService.getResourceType(new Workspace()));
                        assertThat(auditLogs.get(i).getResource().getId()).isEqualTo(createdWorkspace.getId());
                        assertThat(auditLogs.get(i).getTimestamp())
                                .isAfterOrEqualTo(auditLogs.get(i - 1).getTimestamp());
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withEventType_Success() {
        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "workspace.created", null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.size()).isNotEqualTo(0);
                    for (AuditLog log : auditLogs) {
                        assertThat(log.getEvent())
                                .isEqualTo(AuditLogEvents.Events.WORKSPACE_CREATED
                                        .toString()
                                        .toLowerCase()
                                        .replace("_", "."));
                        assertThat(log.getResource().getType())
                                .isEqualTo(auditLogService.getResourceType(new Workspace()));
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withResourceId_Success() {
        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "page.created", null, null, null, null, null, null, null);

        List<AuditLog> auditLogList = auditLogService.getAuditLogs(params).block();
        String resourceId = auditLogList.get(0).getResource().getId();

        params = getAuditLogRequest(null, null, null, resourceId, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    for (AuditLog log : auditLogs) {
                        assertThat(log.getResource().getType())
                                .isEqualTo(auditLogService.getResourceType(new NewPage()));
                        assertThat(log.getResource().getId()).isEqualTo(resourceId);
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withSingleAndOrMultipleUserEmails_Success() {
        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "page.updated", null, null, null, null, null, null, null);

        AuditLog auditLog = auditLogService.getAuditLogs(params).block().get(0);
        auditLog.setTimestamp(Instant.now());
        auditLog.setId(null);
        auditLog.getUser().setEmail("test@appsmith.com");
        auditLogRepository.save(auditLog).block();

        auditLog.setTimestamp(Instant.now());
        auditLog.setId(null);
        auditLog.getUser().setEmail("test@appsmith.com");
        auditLogRepository.save(auditLog).block();

        auditLog.setTimestamp(Instant.now());
        auditLog.setId(null);
        auditLog.getUser().setEmail("test@test.com");
        auditLogRepository.save(auditLog).block();

        params = getAuditLogRequest("test@appsmith.com", null, null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    for (AuditLog auditLog1 : auditLogs) {
                        assertThat(auditLog1.getUser().getEmail()).isEqualTo("test@appsmith.com");
                    }
                })
                .verifyComplete();

        params = getAuditLogRequest("test@appsmith.com,test@test.com", null, null, null, null, null, null, null, null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    for (AuditLog auditLog1 : auditLogs) {
                        assertThat(auditLog1.getUser().getEmail()).containsAnyOf("test@appsmith.com", "test@test.com");
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withInvalidUser_EmptyResponseSuccess() {
        MultiValueMap<String, String> params =
                getAuditLogRequest("test@appsmith.com", null, null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).hasSize(0);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withAllFilters_Success() {
        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "page.updated", null, null, null, null, null, null, null);

        // Add events for different user
        AuditLog auditLog = auditLogService.getAuditLogs(params).block().get(0);
        auditLog.setTimestamp(LocalDate.now().atStartOfDay().minusDays(1).toInstant(ZoneOffset.UTC));
        auditLog.setId(null);
        auditLog.getUser().setEmail("test@appsmith.com");
        auditLogRepository.save(auditLog).block();

        auditLog.setTimestamp(LocalDate.now().atStartOfDay().minusDays(1).toInstant(ZoneOffset.UTC));
        auditLog.setId(null);
        auditLog.getUser().setEmail("test@appsmith.com");
        auditLogRepository.save(auditLog).block();

        auditLog.setTimestamp(LocalDate.now().atStartOfDay().minusDays(2).toInstant(ZoneOffset.UTC));
        auditLog.setId(null);
        auditLog.getUser().setEmail("test@test.com");
        auditLogRepository.save(auditLog).block();

        params = getAuditLogRequest(
                "api_user,test@appsmith.com", "page.updated", null, null, null, null, "1", null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.size()).isGreaterThan(0);
                    for (AuditLog log : auditLogs) {
                        assertThat(log.getUser().getEmail()).isIn("api_user", "test@appsmith.com", "test@test.com");
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withAllFiltersDateRange_Success() {

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "page.updated", null, null, null, null, null, null, null);

        // Add events for different user
        AuditLog auditLog = auditLogService.getAuditLogs(params).block().get(0);
        auditLog.setTimestamp(LocalDate.now().atStartOfDay().minusDays(1).toInstant(ZoneOffset.UTC));
        auditLog.setId(null);
        auditLog.getUser().setEmail("test@appsmith.com");
        auditLogRepository.save(auditLog).block();

        auditLog.setTimestamp(LocalDate.now().atStartOfDay().minusDays(1).toInstant(ZoneOffset.UTC));
        auditLog.setId(null);
        auditLog.getUser().setEmail("test@appsmith.com");
        auditLogRepository.save(auditLog).block();

        auditLog.setTimestamp(LocalDate.now().atStartOfDay().minusDays(2).toInstant(ZoneOffset.UTC));
        auditLog.setId(null);
        auditLog.getUser().setEmail("test@test.com");
        auditLogRepository.save(auditLog).block();

        params = getAuditLogRequest(
                "api_user,test@appsmith.com",
                "page.updated",
                null,
                null,
                null,
                null,
                null,
                String.valueOf(LocalDate.now()
                        .atStartOfDay()
                        .minusDays(1)
                        .toInstant(ZoneOffset.UTC)
                        .toEpochMilli()),
                String.valueOf(Instant.now().toEpochMilli()));

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.size()).isGreaterThan(0);
                    for (AuditLog log : auditLogs) {
                        assertThat(log.getUser().getEmail()).isIn("api_user", "test@appsmith.com", "test@test.com");
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_invalidEvent_notSavedToDB() {
        Mono<AuditLog> logMono = auditLogService.logEvent(AnalyticsEvents.UNIT_EXECUTION_TIME, new Application(), null);

        StepVerifier.create(logMono)
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.getEvent()).isNull();
                    assertThat(auditLogs.getTimestamp()).isNull();
                    assertThat(auditLogs.getApplication()).isNull();
                    assertThat(auditLogs.getWorkspace()).isNull();
                    assertThat(auditLogs.getMetadata()).isNull();
                    assertThat(auditLogs.getResource()).isNull();
                    assertThat(auditLogs.getUser()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_validEvent_success() {
        Mono<AuditLog> logMono = auditLogService.logEvent(AnalyticsEvents.CREATE, app, null);

        StepVerifier.create(logMono)
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.getEvent()).isEqualTo("application.created");
                    assertThat(auditLogs.getTimestamp()).isNotNull();
                    assertThat(auditLogs.getApplication()).isNull();
                    assertThat(auditLogs.getWorkspace()).isNotNull();
                    assertThat(auditLogs.getWorkspace().getId()).isEqualTo(workspaceId);
                    assertThat(auditLogs.getWorkspace().getName()).contains("AuditLogsTest");
                    assertThat(auditLogs.getResource()).isNotNull();
                    assertThat(auditLogs.getResource().getId()).isEqualTo(app.getId());
                    assertThat(auditLogs.getResource().getName()).isEqualTo("testApp");
                    assertThat(auditLogs.getResource().getType())
                            .isEqualTo(auditLogService.getResourceType(new Application()));
                })
                .verifyComplete();
    }

    // Test case to validate workspace created audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_workspaceCreated_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String resourceType = auditLogService.getResourceType(workspace);

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "workspace.created", resourceType, createdWorkspace.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("workspace.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(workspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate workspace updated audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_workspaceUpdated_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String resourceType = auditLogService.getResourceType(workspace);

        Workspace updateWorkspace = new Workspace();
        updateWorkspace.setName("AuditLogWorkspaceUpdated");
        Workspace updatedWorkspace = workspaceService
                .update(createdWorkspace.getId(), updateWorkspace)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "workspace.updated", resourceType, createdWorkspace.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("workspace.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(updatedWorkspace.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(updatedWorkspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate workspace deleted audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_workspaceDeleted_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String resourceType = auditLogService.getResourceType(workspace);

        Workspace deletedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "workspace.deleted", resourceType, createdWorkspace.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("workspace.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(deletedWorkspace.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(workspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate application created audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_applicationCreated_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();
        String resourceType = auditLogService.getResourceType(application);

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "application.created", resourceType, createdApplication.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(application.getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate application updated audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_applicationUpdated_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();
        String resourceType = auditLogService.getResourceType(application);

        application.setName("AuditLogApplicationUpdated");
        Application updatedApplication =
                applicationService.update(application.getId(), application).block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "application.updated", resourceType, createdApplication.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(application.getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate application deleted audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_applicationDeleted_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();
        String resourceType = auditLogService.getResourceType(application);

        Application deletedApplication = applicationPageService
                .deleteApplication(createdApplication.getId())
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "application.deleted", resourceType, createdApplication.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(application.getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate application imported audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_applicationImported_success() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String resourceType = auditLogService.getResourceType(new Application());

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application.json");
        ApplicationImportDTO applicationImportDTO = importService
                .extractArtifactExchangeJsonAndSaveArtifact(
                        filePart, createdWorkspace.getId(), null, ArtifactJsonType.APPLICATION)
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO)
                .block();
        Application createdApplication = applicationImportDTO.getApplication();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "application.imported", resourceType, createdApplication.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.imported");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate application exported audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_applicationExported_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        application.setWorkspaceId(createdWorkspace.getId());
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();
        String resourceType = auditLogService.getResourceType(application);

        ApplicationJson applicationJSon = exportService
                .exportByArtifactIdAndBranchName(createdApplication.getId(), "", ArtifactJsonType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "application.exported", resourceType, createdApplication.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.exported");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(application.getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate application cloned audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_applicationCloned_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();
        String resourceType = auditLogService.getResourceType(application);

        Application clonedApplication = applicationPageService
                .cloneApplication(createdApplication.getId(), "")
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "application.cloned", resourceType, clonedApplication.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.cloned");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(clonedApplication.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(clonedApplication.getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate application forked audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_applicationForked_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Workspace destinationWorkspace = new Workspace();
        destinationWorkspace.setName("AuditLogDestinationWorkspace");
        Workspace createdDestinationWorkspace =
                workspaceService.create(destinationWorkspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();
        String resourceType = auditLogService.getResourceType(application);

        ApplicationImportDTO forkedApplication = applicationForkingService
                .forkApplicationToWorkspace(createdApplication.getId(), createdDestinationWorkspace.getId(), null)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null,
                "application.forked",
                resourceType,
                forkedApplication.getApplication().getId(),
                null,
                null,
                null,
                null,
                null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.forked");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId())
                            .isEqualTo(forkedApplication.getApplication().getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName())
                            .isEqualTo(forkedApplication.getApplication().getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());

                    // Destination workspace validation
                    assertThat(auditLog.getWorkspace().getDestination().getId())
                            .isEqualTo(createdDestinationWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getDestination().getName())
                            .isEqualTo(destinationWorkspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate application forked to same workspace audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_applicationForkedToSameWorkspace_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();
        String resourceType = auditLogService.getResourceType(application);

        ApplicationImportDTO forkedApplication = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(
                        createdApplication.getId(), createdWorkspace.getId(), environmentId)
                .flatMap(application1 -> importService.getArtifactImportDTO(
                        application1.getWorkspaceId(),
                        application1.getId(),
                        application1,
                        ArtifactJsonType.APPLICATION))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null,
                "application.forked",
                resourceType,
                forkedApplication.getApplication().getId(),
                null,
                null,
                null,
                null,
                null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.forked");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId())
                            .isEqualTo(forkedApplication.getApplication().getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName())
                            .isEqualTo(forkedApplication.getApplication().getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());

                    // Destination workspace validation
                    assertThat(auditLog.getWorkspace().getDestination().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getDestination().getName())
                            .isEqualTo(createdWorkspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate application deployed audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_applicationDeployed_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();
        String resourceType = auditLogService.getResourceType(application);

        Application deployedApplication = applicationPageService
                .publish(createdApplication.getId(), null, true)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "application.deployed", resourceType, createdApplication.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // Since application will be deployed automatically when it is created, there will be two deploy
                    // events
                    // We are specifically looking for the second event which is the deployment triggered by the test
                    // case
                    assertThat(auditLogs).hasSize(2);
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.deployed");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    /**
     * To generate page in an application
     *
     * @param pageName
     * @param application
     * @return Mono of PageDTO
     */
    private Mono<PageDTO> createNewPage(String pageName, Application application) {
        PageDTO page = new PageDTO();
        page.setName(pageName);
        page.setApplicationId(application.getId());
        List<Layout> layoutList = new ArrayList<>();
        layoutList.add(newPageService.createDefaultLayout());
        page.setLayouts(layoutList);

        if (page.getDefaultResources() == null) {
            DefaultResources defaults = new DefaultResources();
            defaults.setApplicationId(page.getApplicationId());
            page.setDefaultResources(defaults);
        }
        // Set the page policies
        applicationPageService.generateAndSetPagePolicies(application, page);

        return newPageService.createDefault(page);
    }

    // Test case to validate page created audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_pageCreated_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        // For testing public visibility of the application
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        applicationService
                .changeViewAccess(createdApplication.getId(), applicationAccessDTO)
                .block();

        PageDTO pageDTO = createNewPage("AuditLogPage", createdApplication).block();
        applicationPageService
                .addPageToApplication(createdApplication, pageDTO, false)
                .block();

        String resourceType = auditLogService.getResourceType(new NewPage());

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "page.created", resourceType, pageDTO.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("page.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(pageDTO.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(pageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PUBLIC);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_EDIT);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate page updated audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_pageUpdated_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO pageDTO = createNewPage("AuditLogPage", createdApplication).block();
        applicationPageService
                .addPageToApplication(createdApplication, pageDTO, false)
                .block();

        String resourceType = auditLogService.getResourceType(new NewPage());

        NewPage newPage = newPageService.getById(pageDTO.getId()).block();
        newPage.getUnpublishedPage().setName("AuditLogPageUpdated");

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "page.updated", resourceType, pageDTO.getId(), null, null, null, null, null);

        // Creating a page will result in page.updated event
        // The updatedAt of first update event should be collected to verify the second update event
        // TODO: Remove this once page.updated system event is removed on page creation
        List<AuditLog> auditLogsBeforeUpdate =
                auditLogService.getAuditLogs(params).block();
        assertThat(auditLogsBeforeUpdate).hasSize(1);
        AuditLog auditLogBeforeUpdate = auditLogsBeforeUpdate.get(0);
        assertThat(auditLogBeforeUpdate.getEvent()).isEqualTo("page.updated");
        Instant firstUpdatedTime = auditLogBeforeUpdate.getTimestamp();
        assertThat(firstUpdatedTime).isBefore(Instant.now());

        NewPage updatedPage = newPageService.update(newPage.getId(), newPage).block();

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).hasSize(1);
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("page.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));
                    // Creating a page will result in page.updated event
                    // The actual update event we look for will the second event in which we update the updatedAt of
                    // first event
                    // TODO: Remove this once page.updated system event is removed on page creation
                    assertThat(auditLog.getTimestamp()).isAfter(firstUpdatedTime);

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(pageDTO.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName())
                            .isEqualTo(newPage.getUnpublishedPage().getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_EDIT);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_pageUpdatedMultipleTimes_success() {
        // Update page name multiple times
        ApplicationPage page = app.getPages().get(0);
        PageDTO pageDTO = new PageDTO();
        pageDTO.setName("testUpdate");
        newPageService.updatePage(page.getId(), pageDTO).block();

        pageDTO.setName("testUpdate1");
        newPageService.updatePage(page.getId(), pageDTO).block();

        pageDTO.setName("testUpdate2");
        newPageService.updatePage(page.getId(), pageDTO).block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "page.updated", null, page.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).hasSize(1);
                    assertThat(auditLogs.get(0).getEvent()).isEqualTo("page.updated");
                    assertThat(auditLogs.get(0).getResource().getId()).isEqualTo(page.getId());
                    assertThat(auditLogs.get(0).getResource().getName()).isEqualTo("testUpdate2");
                })
                .verifyComplete();
    }

    // Test case to validate page view in view mode audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_pageViewInViewMode_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO pageDTO = createNewPage("AuditLogPage", createdApplication).block();
        applicationPageService
                .addPageToApplication(createdApplication, pageDTO, false)
                .block();

        String resourceType = auditLogService.getResourceType(new NewPage());

        applicationPageService
                .getPageAndMigrateDslByBranchAndDefaultPageId(
                        createdApplication.getPublishedPages().get(0).getDefaultPageId(), null, true, false)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null,
                "page.viewed",
                resourceType,
                createdApplication.getPublishedPages().get(0).getDefaultPageId(),
                null,
                null,
                null,
                null,
                null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("page.viewed");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId())
                            .isEqualTo(createdApplication
                                    .getPublishedPages()
                                    .get(0)
                                    .getDefaultPageId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_VIEW);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate page view in edit mode audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_pageViewInEditMode_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO pageDTO = createNewPage("AuditLogPage", createdApplication).block();
        applicationPageService
                .addPageToApplication(createdApplication, pageDTO, false)
                .block();

        String resourceType = auditLogService.getResourceType(new NewPage());

        applicationPageService
                .getPageAndMigrateDslByBranchAndDefaultPageId(
                        createdApplication.getPublishedPages().get(0).getDefaultPageId(), null, false, false)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null,
                "page.viewed",
                resourceType,
                createdApplication.getPublishedPages().get(0).getDefaultPageId(),
                null,
                null,
                null,
                null,
                null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("page.viewed");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId())
                            .isEqualTo(createdApplication
                                    .getPublishedPages()
                                    .get(0)
                                    .getDefaultPageId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_EDIT);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate page deleted audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_pageDeleted_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO pageDTO = createNewPage("AuditLogPage", createdApplication).block();
        applicationPageService
                .deleteUnpublishedPageByBranchAndDefaultPageId(pageDTO.getId(), null)
                .block();

        String resourceType = auditLogService.getResourceType(new NewPage());

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "page.deleted", resourceType, pageDTO.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("page.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(pageDTO.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(pageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_EDIT);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    /**
     * To create a datasource for testing
     *
     * @param workspaceId
     * @param environmentId
     * @return Datasource
     */
    private Datasource createDatasource(String workspaceId, String name, String environmentId) {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource datasource = new Datasource();
        datasource.setName(name);
        datasource.setWorkspaceId(workspaceId);
        String pluginId =
                pluginRepository.findByPackageName("restapi-plugin").block().getId();
        datasource.setPluginId(pluginId);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_ONLY);
        connection.setType(Connection.Type.REPLICA_SET);
        SSLDetails sslDetails = new SSLDetails();
        sslDetails.setAuthType(SSLDetails.AuthType.CA_CERTIFICATE);
        sslDetails.setKeyFile(new UploadedFile("ssl_key_file_id", ""));
        sslDetails.setCertificateFile(new UploadedFile("ssl_cert_file_id", ""));
        connection.setSsl(sslDetails);
        datasourceConfiguration.setConnection(connection);
        DBAuth auth = new DBAuth();
        auth.setUsername("test");
        auth.setPassword("test");
        datasourceConfiguration.setAuthentication(auth);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        return datasourceService.create(datasource).block();
    }

    // Test case to validate datasource created audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_datasourceCreated_success() {
        Datasource finalDatasource = createDatasource(workspaceId, "ds Create", defaultEnvironmentId);

        String resourceType = auditLogService.getResourceType(finalDatasource);

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "datasource.created", resourceType, finalDatasource.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    assertThat(auditLogs).hasSize(2);

                    AuditLog auditLog1 = auditLogs.stream()
                            .filter(auditLog -> auditLog.getEnvironment() == null)
                            .findFirst()
                            .get();
                    AuditLog auditLog2 = auditLogs.stream()
                            .filter(auditLog -> auditLog.getEnvironment() != null)
                            .findFirst()
                            .get();

                    assertThat(auditLog1).isNotNull();
                    assertThat(auditLog2).isNotNull();

                    // First event assertions
                    assertThat(auditLog1.getEvent()).isEqualTo("datasource.created");
                    assertThat(auditLog1.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog1.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog1.getResource().getId()).isEqualTo(finalDatasource.getId());
                    assertThat(auditLog1.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog1.getResource().getName()).isEqualTo(finalDatasource.getName());
                    assertThat(auditLog1.getResource().getDatasourceType()).isEqualTo(finalDatasource.getPluginName());

                    // Workspace validation
                    assertThat(auditLog1.getWorkspace().getId()).isEqualTo(workspaceId);
                    assertThat(auditLog1.getWorkspace().getName()).isEqualTo(workspaceName);

                    // User validation
                    assertThat(auditLog1.getUser().getId()).isNotEmpty();
                    assertThat(auditLog1.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog1.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog1.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog1.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog1.getPage()).isNull();
                    assertThat(auditLog1.getAuthentication()).isNull();
                    assertThat(auditLog1.getApplication()).isNull();
                    assertThat(auditLog1.getInvitedUsers()).isNull();

                    // Second event assertions
                    assertThat(auditLog2.getEvent()).isEqualTo("datasource.created");
                    assertThat(auditLog2.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog2.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog2.getResource().getId()).isEqualTo(finalDatasource.getId());
                    assertThat(auditLog2.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog2.getResource().getName()).isEqualTo(finalDatasource.getName());
                    assertThat(auditLog2.getResource().getDatasourceType()).isEqualTo(finalDatasource.getPluginName());

                    // Workspace validation
                    assertThat(auditLog2.getWorkspace().getId()).isEqualTo(workspaceId);
                    assertThat(auditLog2.getWorkspace().getName()).isEqualTo(workspaceName);

                    // User validation
                    assertThat(auditLog2.getUser().getId()).isNotEmpty();
                    assertThat(auditLog2.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog2.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog2.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog2.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog2.getPage()).isNull();
                    assertThat(auditLog2.getAuthentication()).isNull();
                    assertThat(auditLog2.getApplication()).isNull();
                    assertThat(auditLog2.getInvitedUsers()).isNull();

                    // Environment validation
                    assertThat(auditLog2.getEnvironment().getName()).isEqualTo(CommonFieldName.PRODUCTION_ENVIRONMENT);
                })
                .verifyComplete();
    }

    // Test case to validate datasource updated audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_datasourceUpdated_success() {
        Datasource finalDatasource = createDatasource(workspaceId, "ds Update", defaultEnvironmentId);

        finalDatasource.setName("updatedDatasource");
        Datasource updatedDatasource = datasourceService
                .updateDatasource(finalDatasource.getId(), finalDatasource, defaultEnvironmentId, Boolean.FALSE)
                .block();

        String resourceType = auditLogService.getResourceType(finalDatasource);

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "datasource.updated", resourceType, finalDatasource.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    assertThat(auditLogs).hasSize(1);
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("datasource.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(finalDatasource.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(updatedDatasource.getName());
                    assertThat(auditLog.getResource().getDatasourceType()).isEqualTo(updatedDatasource.getPluginName());

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(workspaceId);
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspaceName);

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();

                    // Environment validation
                    assertThat(auditLog.getEnvironment()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate datasource storage updated audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_datasourceStorageUpdated_success() {
        Datasource finalDatasource = createDatasource(workspaceId, "ds storage Update", defaultEnvironmentId);

        DatasourceStorageDTO storageDTO =
                finalDatasource.getDatasourceStorages().get(defaultEnvironmentId);

        storageDTO.getDatasourceConfiguration().setUrl("New value");
        Datasource updatedDatasource = datasourceService
                .updateDatasourceStorage(storageDTO, defaultEnvironmentId, Boolean.FALSE)
                .block();

        String resourceType = auditLogService.getResourceType(finalDatasource);

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "datasource.updated", resourceType, finalDatasource.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    assertThat(auditLogs).hasSize(1);
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("datasource.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(finalDatasource.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(finalDatasource.getName());
                    assertThat(auditLog.getResource().getDatasourceType()).isEqualTo(finalDatasource.getPluginName());

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(workspaceId);
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspaceName);

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();

                    // Environment validation
                    assertThat(auditLog.getEnvironment()).isNotNull();
                    assertThat(auditLog.getEnvironment().getName()).isEqualTo(CommonFieldName.PRODUCTION_ENVIRONMENT);
                })
                .verifyComplete();
    }

    // Test case to validate datasource deleted audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_datasourceDeleted_success() {
        Datasource finalDatasource = createDatasource(workspaceId, "ds Delete", defaultEnvironmentId);
        Datasource deletedDatasource =
                datasourceService.archiveById(finalDatasource.getId()).block();

        String resourceType = auditLogService.getResourceType(finalDatasource);

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "datasource.deleted", resourceType, finalDatasource.getId(), null, null, null, null, null);

        Plugin datasourcePlugin =
                pluginRepository.findById(deletedDatasource.getPluginId()).block();

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    assertThat(auditLogs).hasSize(1);
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("datasource.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(deletedDatasource.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(deletedDatasource.getName());
                    assertThat(auditLog.getResource().getDatasourceType()).isEqualTo(datasourcePlugin.getName());

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(workspaceId);
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspaceName);

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();

                    // Environment validation
                    assertThat(auditLog.getEnvironment()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate query created audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_queryCreated_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO createdPageDTO =
                createNewPage("AuditLogPage", createdApplication).block();

        Datasource createdDatasource = createDatasource(createdWorkspace.getId(), "query Create", environmentId);

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("AuditLogQuery");
        actionDTO.setDatasource(createdDatasource);
        actionDTO.setPluginId(createdDatasource.getPluginId());
        actionDTO.setApplicationId(createdApplication.getId());
        actionDTO.setPageId(createdPageDTO.getId());

        ActionDTO createdActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();

        String resourceType = auditLogService.getResourceType(new NewAction());

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "query.created", resourceType, createdActionDTO.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(actionDTO.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(actionDTO.getName());
                    assertThat(auditLog.getResource().getExecutionStatus()).isNull();

                    // Page validation
                    assertThat(auditLog.getPage().getId()).isEqualTo(createdPageDTO.getId());
                    assertThat(auditLog.getPage().getName()).isEqualTo(createdPageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_EDIT);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate query updated audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_queryUpdated_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO createdPageDTO =
                createNewPage("AuditLogPage", createdApplication).block();

        Datasource createdDatasource = createDatasource(createdWorkspace.getId(), "query Update", environmentId);

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("AuditLogQuery");
        actionDTO.setDatasource(createdDatasource);
        actionDTO.setPluginId(createdDatasource.getPluginId());
        actionDTO.setApplicationId(createdApplication.getId());
        actionDTO.setPageId(createdPageDTO.getId());

        ActionDTO createdActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();

        String resourceType = auditLogService.getResourceType(new NewAction());

        ActionDTO updateActionDTO = new ActionDTO();
        updateActionDTO.setName("AuditLogQueryUpdated");
        ActionDTO updatedActionDTO = layoutActionService
                .updateAction(createdActionDTO.getId(), updateActionDTO)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "query.updated", resourceType, createdActionDTO.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(actionDTO.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(updateActionDTO.getName());
                    assertThat(auditLog.getResource().getExecutionStatus()).isNull();

                    // Page validation
                    assertThat(auditLog.getPage().getId()).isEqualTo(createdPageDTO.getId());
                    assertThat(auditLog.getPage().getName()).isEqualTo(createdPageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_EDIT);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_queryUpdatedMultipleTimes_success() {
        // Update page name multiple times

        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO createdPageDTO =
                createNewPage("AuditLogPage", createdApplication).block();

        Datasource createdDatasource =
                createDatasource(createdWorkspace.getId(), "query Update Multiple", environmentId);

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("AuditLogQuery");
        actionDTO.setDatasource(createdDatasource);
        actionDTO.setPluginId(createdDatasource.getPluginId());
        actionDTO.setApplicationId(createdApplication.getId());
        actionDTO.setPageId(createdPageDTO.getId());

        ActionDTO createdActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();

        String resourceType = auditLogService.getResourceType(new NewAction());

        ActionDTO updateActionDTO = new ActionDTO();
        updateActionDTO.setName("AuditLogQueryUpdated");
        ActionDTO updatedActionDTO = layoutActionService
                .updateAction(createdActionDTO.getId(), updateActionDTO)
                .block();

        updateActionDTO.setName("AuditLogQueryUpdated1");
        updatedActionDTO = layoutActionService
                .updateAction(createdActionDTO.getId(), updateActionDTO)
                .block();

        updateActionDTO.setName("AuditLogQueryUpdated2");
        updatedActionDTO = layoutActionService
                .updateAction(createdActionDTO.getId(), updateActionDTO)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "query.updated", resourceType, createdActionDTO.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).hasSize(1);
                    assertThat(auditLogs.get(0).getEvent()).isEqualTo("query.updated");
                    assertThat(auditLogs.get(0).getResource().getId()).isEqualTo(createdActionDTO.getId());
                    assertThat(auditLogs.get(0).getResource().getName()).isEqualTo("AuditLogQueryUpdated2");
                })
                .verifyComplete();
    }

    // Test case to validate query deleted audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_queryDeleted_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO createdPageDTO =
                createNewPage("AuditLogPage", createdApplication).block();

        Datasource createdDatasource = createDatasource(createdWorkspace.getId(), "query Delete", environmentId);

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("AuditLogQuery");
        actionDTO.setDatasource(createdDatasource);
        actionDTO.setPluginId(createdDatasource.getPluginId());
        actionDTO.setApplicationId(createdApplication.getId());
        actionDTO.setPageId(createdPageDTO.getId());

        ActionDTO createdActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();

        String resourceType = auditLogService.getResourceType(new NewAction());

        layoutActionService.deleteUnpublishedAction(createdActionDTO.getId()).block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "query.deleted", resourceType, createdActionDTO.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(actionDTO.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(actionDTO.getName());
                    assertThat(auditLog.getResource().getExecutionStatus()).isNull();

                    // Page validation
                    assertThat(auditLog.getPage().getId()).isEqualTo(createdPageDTO.getId());
                    assertThat(auditLog.getPage().getName()).isEqualTo(createdPageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_EDIT);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate query executed in editMode audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_queryExecuted_editMode_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO createdPageDTO =
                createNewPage("AuditLogPage", createdApplication).block();

        doReturn(false).doReturn(false).when(datasourceContextService).getIsStale(any(), any());
        Mockito.when(pluginExecutor.datasourceCreate(any())).thenReturn(Mono.just("connection_1"));

        Datasource datasource = new Datasource();
        datasource.setName("Default Database 1");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
        String username = "username";
        String password = "password";
        authenticationDTO.setUsername(username);
        authenticationDTO.setPassword(password);
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        Mockito.when(pluginExecutor.executeParameterizedWithMetrics(any(), any(), any(), any(), any()))
                .thenReturn(Mono.just(mockResult));

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(createdPageDTO.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        actionExecutionSolution
                .executeAction(executeActionDTO, environmentId, null)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "query.executed", "Query", createdAction.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.executed");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(executeActionDTO.getActionId());
                    assertThat(auditLog.getResource().getType()).isEqualTo("Query");
                    assertThat(auditLog.getResource().getName()).isEqualTo(action.getName());
                    assertThat(auditLog.getResource().getExecutionStatus()).isNotNull();
                    assertThat(auditLog.getResource().getResponseCode()).isNotNull();
                    assertThat(auditLog.getResource().getResponseTime()).isNotNegative();
                    assertThat(auditLog.getResource().getExecutionParams()).isNotNull();

                    // Page validation
                    assertThat(auditLog.getPage().getId()).isEqualTo(createdPageDTO.getId());
                    assertThat(auditLog.getPage().getName()).isEqualTo(createdPageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_EDIT);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();

                    // Datasource related fields
                    assertThat(auditLog.getDatasource().getName()).isNotNull();
                    assertThat(auditLog.getDatasource().getName()).isEqualTo("Default Database 1");

                    // Environment related fields
                    assertThat(auditLog.getEnvironment().getId()).isNotNull();
                    assertThat(auditLog.getEnvironment().getId()).isEqualTo(environmentId);
                    assertThat(auditLog.getEnvironment().getName()).isNotNull();
                    assertThat(auditLog.getEnvironment().getName()).isEqualTo(CommonFieldName.PRODUCTION_ENVIRONMENT);
                })
                .verifyComplete();
    }

    // Test case to validate query executed in viewMode audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_queryExecuted_viewMode_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO createdPageDTO =
                createNewPage("AuditLogPage", createdApplication).block();

        doReturn(false).doReturn(false).when(datasourceContextService).getIsStale(any(), any());
        Mockito.when(pluginExecutor.datasourceCreate(any())).thenReturn(Mono.just("connection_1"));

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
        String username = "username";
        String password = "password";
        authenticationDTO.setUsername(username);
        authenticationDTO.setPassword(password);
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(any(), any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        Mockito.when(pluginExecutor.executeParameterizedWithMetrics(any(), any(), any(), any(), any()))
                .thenReturn(Mono.just(mockResult));

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(createdPageDTO.getId());
        action.setName("testActionExecutev2");
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        // Publish application for testing action execution in view mode
        applicationPageService.publish(createdApplication.getId(), true).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(true);

        ActionExecutionResult actionExecutionResult = actionExecutionSolution
                .executeAction(executeActionDTO, environmentId, null)
                .block();

        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "query.executed", "Query", createdAction.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.executed");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(executeActionDTO.getActionId());
                    assertThat(auditLog.getResource().getType()).isEqualTo("Query");
                    assertThat(auditLog.getResource().getName()).isEqualTo(action.getName());
                    assertThat(auditLog.getResource().getExecutionStatus()).isNotNull();
                    assertThat(auditLog.getResource().getResponseCode()).isNotNull();
                    assertThat(auditLog.getResource().getResponseTime()).isNotNegative();
                    assertThat(auditLog.getResource().getExecutionParams()).isNotNull();

                    // Page validation
                    assertThat(auditLog.getPage().getId()).isEqualTo(createdPageDTO.getId());
                    assertThat(auditLog.getPage().getName()).isEqualTo(createdPageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_VIEW);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();

                    // Datasource related fields
                    assertThat(auditLog.getDatasource().getName()).isNotNull();
                    assertThat(auditLog.getDatasource().getName()).isEqualTo("Default Database");

                    // Environment related fields
                    assertThat(auditLog.getEnvironment().getId()).isNotNull();
                    assertThat(auditLog.getEnvironment().getId()).isEqualTo(environmentId);
                    assertThat(auditLog.getEnvironment().getName()).isNotNull();
                    assertThat(auditLog.getEnvironment().getName()).isEqualTo(CommonFieldName.PRODUCTION_ENVIRONMENT);
                })
                .verifyComplete();
    }

    /**
     * To signup and login a new user
     *
     * @param user
     * @return Mono of User
     */
    private Mono<User> signupAndLoginUser(User user) {
        MockWebSession session = new MockWebSession();
        session.getAttributes().put("session", "testSession");
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/login")
                .header("origin", "test")
                .build();
        MockServerWebExchange exchange =
                MockServerWebExchange.builder(request).session(session).build();

        return userSignup.signupAndLogin(user, exchange).flatMap(user1 -> {
            // Make user super-user since Audit Logs are only accessible by super-users
            return userUtils.makeSuperUser(List.of(user1)).thenReturn(user1);
        });
    }

    // Test case to validate signup event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_userSignedUp_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        User user = new User();
        user.setEmail("auditLogSignUpUser@xyz.com");
        user.setName("AuditLog User");
        user.setPassword("AuditLogUserPassword");
        user.setWorkspaceIds(Set.of(createdWorkspace.getId()));

        User createdUser = signupAndLoginUser(user).block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "user.signed_up", null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("user.signed_up");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // User validation
                    assertThat(auditLog.getUser().getId()).isEqualTo(createdUser.getId());
                    assertThat(auditLog.getUser().getEmail()).isEqualTo(user.getEmail());
                    assertThat(auditLog.getUser().getName()).isEqualTo(user.getName());
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate login event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_userLoggedIn_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        User user = new User();
        user.setEmail("auditLogLogInUser@xyz.com");
        user.setName("AuditLog User");
        user.setPassword("AuditLogUserPassword");
        user.setWorkspaceIds(Set.of(createdWorkspace.getId()));

        User createdUser = signupAndLoginUser(user).block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "user.logged_in", null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("user.logged_in");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isEqualTo(createdUser.getId());
                    assertThat(auditLog.getUser().getEmail()).isEqualTo(user.getEmail());
                    assertThat(auditLog.getUser().getName()).isEqualTo(user.getName());
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate user invited event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_userInvited_success() {
        User apiUser = userService.findByEmail("api_user").block();
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");

        Workspace createdWorkspace = workspaceService.create(workspace).block();

        PermissionGroup defaultRoleForWorkspace = permissionGroupService
                .getById(createdWorkspace.getDefaultPermissionGroups().stream()
                        .findAny()
                        .get())
                .block();

        String resourceType = auditLogService.getResourceType(defaultRoleForWorkspace);

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> invitedUsers = new ArrayList<>();
        invitedUsers.add("auditloguser1@test.com");
        invitedUsers.add("auditloguser2@test.com");
        inviteUsersDTO.setUsernames(invitedUsers);
        inviteUsersDTO.setPermissionGroupId(defaultRoleForWorkspace.getId());

        userAndAccessManagementService
                .inviteUsers(inviteUsersDTO, "https://test.com")
                .block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "user.invited", null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // Since we are pausing the user.invited user and will be only restricting it for when a user is
                    // created in an invitation flow.
                    // TODO: Update the test case when changes for adding audit logs for first time user creation on
                    // invitation flow comes in.
                    assertThat(auditLogs).isEmpty();
                })
                .verifyComplete();

        MultiValueMap<String, String> roleAssignedToUserParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_USERS),
                resourceType,
                defaultRoleForWorkspace.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleAssignedToUser =
                auditLogService.getAuditLogs(roleAssignedToUserParams).block();
        assertThat(auditLogsRoleAssignedToUser).hasSize(1);
        AuditLog auditLogRoleAssignedToUser = auditLogsRoleAssignedToUser.get(0);

        assertThat(auditLogRoleAssignedToUser.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_USERS));
        assertThat(auditLogRoleAssignedToUser.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToUser.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToUser.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleAssignedToUser.getResource()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getMetadata()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getUser()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getRole()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getGroup()).isNull();
        assertThat(auditLogRoleAssignedToUser.getWorkspace()).isNull();
        assertThat(auditLogRoleAssignedToUser.getApplication()).isNull();
        assertThat(auditLogRoleAssignedToUser.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleAssignedToUser = auditLogRoleAssignedToUser.getUser();
        assertThat(userMetadataRoleAssignedToUser.getId()).isEqualTo(apiUser.getId());
        assertThat(userMetadataRoleAssignedToUser.getName()).isEqualTo(apiUser.getName());

        AuditLogMetadata auditLogMetadataRoleAssignedToUser = auditLogRoleAssignedToUser.getMetadata();
        assertThat(auditLogMetadataRoleAssignedToUser.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleAssignedToUser = auditLogRoleAssignedToUser.getResource();

        assertThat(auditLogResourceRoleAssignedToUser.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleAssignedToUser.getId()).isEqualTo(defaultRoleForWorkspace.getId());
        assertThat(auditLogResourceRoleAssignedToUser.getName()).isEqualTo(defaultRoleForWorkspace.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleAssignedToUser =
                auditLogRoleAssignedToUser.getRole();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedUsers()).hasSize(2);
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedUsers())
                .containsExactlyInAnyOrderElementsOf(List.of("auditloguser1@test.com", "auditloguser2@test.com"));
        assertThat(permissionGroupMetadataRoleAssignedToUser.getUnassignedUsers())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getUnassignedGroups())
                .isNull();
    }

    // Test case to validate instance setting update - GitHubAuth event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_InstanceSettingUpdated_GitHubAuth_success() {
        Map<String, String> emptyEnvChanges = new HashMap<>(Map.of(
                APPSMITH_OAUTH2_GITHUB_CLIENT_ID.name(), "",
                APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET.name(), ""));

        Map<String, String> nonEmptyEnvChanges = new HashMap<>(Map.of(
                APPSMITH_OAUTH2_GITHUB_CLIENT_ID.name(), "testClientId",
                APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET.name(), "testClientSecret"));

        envManager.applyChanges(nonEmptyEnvChanges, "origin").block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "instance_setting.updated", null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.GITHUB);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Added");

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();

        // Test removing configuration
        envManager.applyChanges(emptyEnvChanges, "origin").block();

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.GITHUB);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Removed");

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate instance setting update - GoogleAuth event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_InstanceSettingUpdated_GoogleAuth_success() {
        Map<String, String> emptyEnvChanges = new HashMap<>(Map.of(
                APPSMITH_OAUTH2_GOOGLE_CLIENT_ID.name(), "",
                APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET.name(), ""));
        Map<String, String> nonEmptyEnvChanges = new HashMap<>(Map.of(
                APPSMITH_OAUTH2_GOOGLE_CLIENT_ID.name(), "testClientId",
                APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET.name(), "testClientSecret"));

        envManager.applyChanges(nonEmptyEnvChanges, "origin").block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "instance_setting.updated", null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);
                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));
                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.GOOGLE);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Added");
                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
        // Test removing configuration
        envManager.applyChanges(emptyEnvChanges, "origin").block();
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);
                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));
                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.GOOGLE);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Removed");
                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate instance setting update - OIDC event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_InstanceSettingUpdated_OIDCAuth_success() {
        Map<String, String> emptyEnvChanges = new HashMap<>(Map.of(
                APPSMITH_OAUTH2_OIDC_CLIENT_ID.name(), "",
                APPSMITH_OAUTH2_OIDC_CLIENT_SECRET.name(), ""));

        Map<String, String> nonEmptyEnvChanges = new HashMap<>(Map.of(
                APPSMITH_OAUTH2_OIDC_CLIENT_ID.name(), "testClientId",
                APPSMITH_OAUTH2_OIDC_CLIENT_SECRET.name(), "testClientSecret"));

        envManager.applyChanges(nonEmptyEnvChanges, "origin").block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "instance_setting.updated", null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.OIDC);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Added");

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();

        // Test removing configuration
        envManager.applyChanges(emptyEnvChanges, "origin").block();

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.OIDC);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Removed");

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate instance setting update - SAML event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_InstanceSettingUpdated_SAMLAuth_success() {
        Map<String, String> emptyEnvChanges = new HashMap<>(Map.of(APPSMITH_SSO_SAML_ENABLED.name(), "false"));

        Map<String, String> nonEmptyEnvChanges = new HashMap<>(Map.of(APPSMITH_SSO_SAML_ENABLED.name(), "true"));

        // Test adding configuration
        envManager.applyChanges(nonEmptyEnvChanges, "origin").block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "instance_setting.updated", null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.SAML);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Added");

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();

        // Test removing configuration
        envManager.applyChanges(emptyEnvChanges, "origin").block();

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.SAML);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Removed");

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate workspace created on signup have user detail

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_userSignedUpWorkspaceCreatedHasUserInfo_success() {
        User user = new User();
        user.setEmail("auditlogsignupuserworkspace@xyz.com");
        user.setName("AuditLog User");
        user.setPassword("AuditLogUserPassword");

        User createdUser = signupAndLoginUser(user).block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "workspace.created", null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("workspace.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // User validation
                    assertThat(auditLog.getUser().getId()).isEqualTo(createdUser.getId());
                    assertThat(auditLog.getUser().getEmail()).isEqualTo(createdUser.getEmail());
                    assertThat(auditLog.getUser().getName()).isEqualTo(createdUser.getName());
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    /**
     * To generate a CRUD page using Postgres
     *
     * @return Mono of created CRUD pageDTO
     */
    private Mono<PageDTO> createCrudPage() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginExecutorHelper.getPluginExecutorFromPackageName(Mockito.anyString()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("Create-DB-Table-Page-Org");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("DB-Table-Page-Test-Application");
        application.setWorkspaceId(createdWorkspace.getId());
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        Plugin postgreSQLPlugin = pluginRepository.findByName("PostgreSQL").block();
        // This datasource structure includes only 1 table with 2 columns. This is to test the scenario where template
        // table
        // have more number of columns than the user provided table which leads to deleting the column names from action
        // configuration
        List<DatasourceStructure.Column> limitedColumns = List.of(
                new DatasourceStructure.Column("id", "type1", null, true),
                new DatasourceStructure.Column("field1.something", "VARCHAR(23)", null, false));
        List<DatasourceStructure.Key> keys = List.of(new DatasourceStructure.PrimaryKey("pKey", List.of("id")));
        List<DatasourceStructure.Column> columns = List.of(
                new DatasourceStructure.Column("id", "type1", null, true),
                new DatasourceStructure.Column("field1.something", "VARCHAR(23)", null, false),
                new DatasourceStructure.Column("field2", "type3", null, false),
                new DatasourceStructure.Column("field3", "type4", null, false),
                new DatasourceStructure.Column("field4", "type5", null, false));
        List<DatasourceStructure.Table> tables = List.of(
                new DatasourceStructure.Table(
                        DatasourceStructure.TableType.TABLE, "", "sampleTable", columns, keys, new ArrayList<>()),
                new DatasourceStructure.Table(
                        DatasourceStructure.TableType.TABLE,
                        "",
                        "limitedColumnTable",
                        limitedColumns,
                        keys,
                        new ArrayList<>()));
        CRUDPageResourceDTO crudPageResourceDTO = new CRUDPageResourceDTO();
        DatasourceStructure structure = new DatasourceStructure();
        Datasource testDatasource = new Datasource();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        structure.setTables(tables);
        testDatasource.setPluginId(postgreSQLPlugin.getId());
        testDatasource.setWorkspaceId(createdWorkspace.getId());
        testDatasource.setName("CRUD-Page-Table-DS");
        datasourceConfiguration.setUrl("http://test.com");
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration));
        testDatasource.setDatasourceStorages(storages);

        datasourceService
                .create(testDatasource)
                .flatMap(datasource -> {
                    DatasourceStorageStructure datasourceStructure = new DatasourceStorageStructure();
                    datasourceStructure.setDatasourceId(datasource.getId());
                    datasourceStructure.setEnvironmentId(environmentId);
                    datasourceStructure.setStructure(structure);

                    return datasourceStructureService.save(datasourceStructure).thenReturn(datasource);
                })
                .block();

        crudPageResourceDTO.setTableName(structure.getTables().get(0).getName());
        crudPageResourceDTO.setDatasourceId(testDatasource.getId());

        crudPageResourceDTO.setApplicationId(createdApplication.getId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(createdApplication.getId());
        newPage.setName("crud-admin-page");

        return applicationPageService
                .createPage(newPage)
                .flatMap(savedPage -> createDBTablePageSolution.createPageFromDBTable(
                        savedPage.getId(), crudPageResourceDTO, environmentId, ""))
                .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());
    }

    // To verify page and other resources are coming properly for CRUD page delete action for query event
    @Test
    @WithUserDetails(value = "api_user")
    public void validateEvent_crudPageDeleteEvent_queryDeletedHasResourcesSet_Success() {
        PageDTO createdPageDTO = createCrudPage().block();
        List<NewAction> actionsList = newActionService
                .findByPageId(createdPageDTO.getId())
                .collectList()
                .block();
        NewAction createdAction = actionsList.get(0);

        applicationPageService.deleteUnpublishedPage(createdPageDTO.getId()).block();

        String resourceType = auditLogService.getResourceType(new NewAction());
        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "query.deleted", resourceType, createdAction.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdAction.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName())
                            .isEqualTo(createdAction.getUnpublishedAction().getName());
                    assertThat(auditLog.getResource().getExecutionStatus()).isNull();

                    // Page validation
                    assertThat(auditLog.getPage().getId()).isEqualTo(createdPageDTO.getId());
                    assertThat(auditLog.getPage().getName()).isEqualTo(createdPageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isNotNull();
                    assertThat(auditLog.getApplication().getName()).isNotNull();
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_EDIT);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isNotNull();
                    assertThat(auditLog.getWorkspace().getName()).isNotNull();
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate instance setting update - General Admin Settings

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_InstanceSettingUpdated_GeneralAdminSettings_success() {
        Map<String, String> envChanges = new HashMap<>(Map.ofEntries(
                entry(APPSMITH_INSTANCE_NAME.name(), "testInstanceName"),
                entry(APPSMITH_HIDE_WATERMARK.name(), "true"),
                entry(APPSMITH_DISABLE_TELEMETRY.name(), "true"),
                entry(APPSMITH_MAIL_FROM.name(), "testemail@test.com"),
                entry(APPSMITH_MAIL_PASSWORD.name(), "testPassword"),
                entry(APPSMITH_MAIL_PORT.name(), "25"),
                entry(APPSMITH_REPLY_TO.name(), "testemail@test.com"),
                entry(APPSMITH_CUSTOM_DOMAIN.name(), "testCustomDomain")));

        envManager.applyChanges(envChanges, "origin").block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "instance_setting.updated", null, null, null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getInstanceSettings()).isEqualTo(envChanges.keySet());

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    /**
     * To update layout of a page
     *
     * @param pageDTO
     * @return Mono of LayoutDTO
     * @throws JsonProcessingException
     */
    private Mono<LayoutDTO> updatePageLayout(PageDTO pageDTO) throws JsonProcessingException {
        JSONObject parentDsl = new JSONObject(
                objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<Map<String, Object>>() {}));

        ArrayList children = (ArrayList) parentDsl.get("children");

        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "testField")));
        firstWidget.put("dynamicBindingPathList", temp);
        firstWidget.put("testField", "{{ firstWidget.testField }}");
        children.add(firstWidget);

        parentDsl.put("children", children);

        Layout layout = pageDTO.getLayouts().get(0);
        layout.setDsl(parentDsl);

        return updateLayoutService.updateLayout(pageDTO.getId(), pageDTO.getApplicationId(), layout.getId(), layout);
    }

    // To test page.updated event is created when page layout is updated
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_PageUpdated_WhenLayoutIsUpdated_success() throws JsonProcessingException {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        PageDTO pageDTO = createNewPage("AuditLogPage", createdApplication).block();
        applicationPageService
                .addPageToApplication(createdApplication, pageDTO, false)
                .block();

        String resourceType = auditLogService.getResourceType(new NewPage());

        NewPage newPage = newPageService.getById(pageDTO.getId()).block();

        MultiValueMap<String, String> params =
                getAuditLogRequest(null, "page.updated", resourceType, pageDTO.getId(), null, null, null, null, null);

        // Creating a page will result in page.updated event
        // The updatedAt of first update event should be collected to verify the second update event
        // TODO: Remove this once page.updated system event is removed on page creation
        List<AuditLog> auditLogsBeforeUpdate =
                auditLogService.getAuditLogs(params).block();
        assertThat(auditLogsBeforeUpdate).hasSize(1);
        AuditLog auditLogBeforeUpdate = auditLogsBeforeUpdate.get(0);
        assertThat(auditLogBeforeUpdate.getEvent()).isEqualTo("page.updated");
        Instant firstUpdatedTime = auditLogBeforeUpdate.getTimestamp();
        assertThat(firstUpdatedTime).isBefore(Instant.now());

        // Layout updates on page are considered as page.updated
        updatePageLayout(pageDTO).block();

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).hasSize(1);
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("page.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));
                    // Creating a page will result in page.updated event
                    // The actual update event we look for will the second event in which we update the updatedAt of
                    // first event
                    // TODO: Remove this once page.updated system event is removed on page creation
                    assertThat(auditLog.getTimestamp()).isAfter(firstUpdatedTime);

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(pageDTO.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName())
                            .isEqualTo(newPage.getUnpublishedPage().getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    assertThat(auditLog.getApplication().getMode()).isEqualTo(FieldName.AUDIT_LOG_APP_MODE_EDIT);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // To test application.updated event is logged when application theme is updated
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_ApplicationUpdated_WhenThemeIsUpdated_success() {
        Theme classicTheme = themeService.getSystemTheme("Classic").block();

        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        Application publishedApplication =
                applicationPageService.publish(createdApplication.getId(), TRUE).block();

        themeService.updateTheme(createdApplication.getId(), null, classicTheme).block();

        String resourceType = auditLogService.getResourceType(application);
        MultiValueMap<String, String> params = getAuditLogRequest(
                null, "application.updated", resourceType, createdApplication.getId(), null, null, null, null, null);

        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin().equals(FieldName.AUDIT_LOGS_ORIGIN_SERVER));

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(application.getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    // assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    // assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUserGroup_auditLogsTest_allOperations() {
        MultiValueMap<String, String> params;
        UserGroup userGroup = new UserGroup();
        userGroup.setName("testUserGroup_auditLogsTest");
        String resourceType = auditLogService.getResourceType(userGroup);
        User apiUser = userService.findByEmail("api_user").block();

        UserGroupDTO createdUserGroup = userGroupService.createGroup(userGroup).block();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_CREATED),
                resourceType,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_CREATED));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getRole()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();
                    assertThat(auditLogResource.getType()).isEqualTo("Group");
                    assertThat(auditLogResource.getId()).isEqualTo(createdUserGroup.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(createdUserGroup.getName());
                })
                .verifyComplete();

        userGroup.setName("testUserGroup_auditLogsTest name updated");
        UserGroupDTO updatedUserGroup = userGroupService
                .updateGroup(createdUserGroup.getId(), userGroup)
                .block();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_UPDATED),
                resourceType,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_UPDATED));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getRole()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();
                    assertThat(auditLogResource.getType()).isEqualTo("Group");
                    assertThat(auditLogResource.getId()).isEqualTo(updatedUserGroup.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(updatedUserGroup.getName());
                })
                .verifyComplete();

        Set<String> usernames = new HashSet<>();
        usernames.add("test@appsmith.com");
        UsersForGroupDTO invitedUsers = new UsersForGroupDTO(usernames, Set.of(createdUserGroup.getId()));
        List<UserGroupDTO> invitedUserGroupDTOS =
                userGroupService.inviteUsers(invitedUsers, "origin").block();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_INVITE_USERS),
                resourceType,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    UserGroupDTO userGroupDTO = invitedUserGroupDTOS.stream()
                            .filter(dto -> dto.getId().equals(createdUserGroup.getId()))
                            .findFirst()
                            .get();
                    Set<String> usernamesInGroup = userGroupDTO.getUsers().stream()
                            .map(UserCompactDTO::getUsername)
                            .collect(Collectors.toSet());
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_INVITE_USERS));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getGroup()).isNotNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getRole()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();
                    assertThat(auditLogResource.getType()).isEqualTo("Group");
                    assertThat(auditLogResource.getId()).isEqualTo(userGroupDTO.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(userGroupDTO.getName());

                    AuditLogUserGroupMetadata userGroupMetadata = auditLog.getGroup();
                    assertThat(userGroupMetadata.getInvitedUsers()).hasSize(1);
                    userGroupMetadata.getInvitedUsers().forEach(invitedUser -> assertThat(usernamesInGroup)
                            .contains(invitedUser));
                    assertThat(userGroupMetadata.getRemovedUsers()).isNull();
                })
                .verifyComplete();

        UsersForGroupDTO removedUsers = new UsersForGroupDTO(usernames, Set.of(createdUserGroup.getId()));
        List<UserGroupDTO> removedUserGroupDTOS =
                userGroupService.removeUsers(removedUsers).block();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_REMOVE_USERS),
                resourceType,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    UserGroupDTO userGroupDTO = removedUserGroupDTOS.stream()
                            .filter(dto -> dto.getId().equals(createdUserGroup.getId()))
                            .findFirst()
                            .get();
                    Set<String> usernamesInGroup = userGroupDTO.getUsers().stream()
                            .map(UserCompactDTO::getUsername)
                            .collect(Collectors.toSet());
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_REMOVE_USERS));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getGroup()).isNotNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getRole()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();
                    assertThat(auditLogResource.getType()).isEqualTo("Group");
                    assertThat(auditLogResource.getId()).isEqualTo(userGroupDTO.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(userGroupDTO.getName());

                    AuditLogUserGroupMetadata userGroupMetadata = auditLog.getGroup();
                    assertThat(userGroupMetadata.getRemovedUsers()).hasSize(1);
                    userGroupMetadata.getRemovedUsers().forEach(removedUser -> assertThat(usernamesInGroup)
                            .doesNotContain(removedUser));
                    assertThat(userGroupMetadata.getInvitedUsers()).isNull();
                })
                .verifyComplete();

        UserGroup deletedUserGroup =
                userGroupService.archiveById(createdUserGroup.getId()).block();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_DELETED),
                resourceType,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_DELETED));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getRole()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();
                    assertThat(auditLogResource.getType()).isEqualTo("Group");
                    assertThat(auditLogResource.getId()).isEqualTo(deletedUserGroup.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(deletedUserGroup.getName());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testPermissionGroup_auditLogsTest_allOperations() {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_datasource_environments_enabled)))
                .thenReturn(Mono.just(TRUE));

        MultiValueMap<String, String> params;
        UserGroup userGroup = new UserGroup();
        userGroup.setName("testPermissionGroup_auditLogsTest_allOperations");
        UserGroupDTO createdUserGroup = userGroupService.createGroup(userGroup).block();
        User apiUser = userService.findByEmail("api_user").block();

        User user = new User();
        user.setEmail("lalala@appsmith@com");
        user.setPassword("lalala");
        User createdUser = userService.create(user).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("testPermissionGroup_auditLogsTest_allOperations");
        String resourceType = auditLogService.getResourceType(permissionGroup);

        RoleViewDTO roleViewDTO = permissionGroupService
                .createCustomPermissionGroup(permissionGroup)
                .block();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_CREATED),
                resourceType,
                roleViewDTO.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_CREATED));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getRole()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();
                    assertThat(auditLogResource.getType()).isEqualTo("Role");
                    assertThat(auditLogResource.getId()).isEqualTo(roleViewDTO.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(roleViewDTO.getName());
                })
                .verifyComplete();

        permissionGroup.setName("testPermissionGroup_auditLogsTest_allOperations name updated");
        PermissionGroupInfoDTO updatedPermissionGroup = permissionGroupService
                .updatePermissionGroup(roleViewDTO.getId(), permissionGroup)
                .block();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UPDATED),
                resourceType,
                roleViewDTO.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UPDATED));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getRole()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();
                    assertThat(auditLogResource.getType()).isEqualTo("Role");
                    assertThat(auditLogResource.getId()).isEqualTo(updatedPermissionGroup.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(updatedPermissionGroup.getName());
                })
                .verifyComplete();

        UserCompactDTO userCompactDTO =
                new UserCompactDTO(createdUser.getId(), createdUser.getUsername(), createdUser.getName());
        UserGroupCompactDTO userGroupCompactDTO =
                new UserGroupCompactDTO(createdUserGroup.getId(), createdUserGroup.getName());
        PermissionGroupCompactDTO permissionGroupCompactDTO =
                new PermissionGroupCompactDTO(roleViewDTO.getId(), roleViewDTO.getName());

        UpdateRoleAssociationDTO assignUserGroups = new UpdateRoleAssociationDTO();
        assignUserGroups.setGroups(Set.of(userGroupCompactDTO));
        assignUserGroups.setRolesAdded(Set.of(permissionGroupCompactDTO));

        Boolean changeRoleAssociationAssignUserGroups = userAndAccessManagementService
                .changeRoleAssociations(assignUserGroups, "originHeader")
                .block();
        assertThat(changeRoleAssociationAssignUserGroups).isTrue();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_GROUPS),
                resourceType,
                roleViewDTO.getId(),
                null,
                null,
                null,
                null,
                null);
        PermissionGroup dbPermissionGroup = permissionGroupService
                .findById(roleViewDTO.getId(), AclPermission.MANAGE_PERMISSION_GROUPS)
                .block();
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(
                                    auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_GROUPS));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getRole()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();

                    assertThat(auditLogResource.getType()).isEqualTo("Role");
                    assertThat(auditLogResource.getId()).isEqualTo(dbPermissionGroup.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(dbPermissionGroup.getName());

                    AuditLogPermissionGroupMetadata permissionGroupMetadata = auditLog.getRole();
                    assertThat(permissionGroupMetadata.getAssignedGroups()).hasSize(1);
                    assertThat(permissionGroupMetadata.getAssignedGroups().get(0))
                            .isEqualTo(createdUserGroup.getName());
                    assertThat(permissionGroupMetadata.getUnassignedGroups()).isNull();
                    assertThat(permissionGroupMetadata.getAssignedUsers()).isEmpty();
                    assertThat(permissionGroupMetadata.getUnassignedUsers()).isNull();
                })
                .verifyComplete();

        UpdateRoleAssociationDTO unassignUserGroups = new UpdateRoleAssociationDTO();
        unassignUserGroups.setGroups(Set.of(userGroupCompactDTO));
        unassignUserGroups.setRolesRemoved(Set.of(permissionGroupCompactDTO));

        Boolean changeRoleAssociationUnassignUserGroups = userAndAccessManagementService
                .changeRoleAssociations(unassignUserGroups, "originHeader")
                .block();
        assertThat(changeRoleAssociationUnassignUserGroups).isTrue();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_GROUPS),
                resourceType,
                roleViewDTO.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(
                                    auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_GROUPS));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getRole()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();

                    assertThat(auditLogResource.getType()).isEqualTo("Role");
                    assertThat(auditLogResource.getId()).isEqualTo(dbPermissionGroup.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(dbPermissionGroup.getName());

                    AuditLogPermissionGroupMetadata permissionGroupMetadata = auditLog.getRole();
                    assertThat(permissionGroupMetadata.getUnassignedGroups()).hasSize(1);
                    assertThat(permissionGroupMetadata.getUnassignedGroups().get(0))
                            .isEqualTo(createdUserGroup.getName());
                    assertThat(permissionGroupMetadata.getAssignedGroups()).isNull();
                    assertThat(permissionGroupMetadata.getAssignedUsers()).isNull();
                    assertThat(permissionGroupMetadata.getUnassignedUsers()).isEmpty();
                })
                .verifyComplete();

        UpdateRoleAssociationDTO assignUser = new UpdateRoleAssociationDTO();
        assignUser.setUsers(Set.of(userCompactDTO));
        assignUser.setRolesAdded(Set.of(permissionGroupCompactDTO));

        Boolean changeRoleAssociationAssignUser = userAndAccessManagementService
                .changeRoleAssociations(assignUser, "originHeader")
                .block();
        assertThat(changeRoleAssociationAssignUser).isTrue();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_USERS),
                resourceType,
                roleViewDTO.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_USERS));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getRole()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();

                    assertThat(auditLogResource.getType()).isEqualTo("Role");
                    assertThat(auditLogResource.getId()).isEqualTo(dbPermissionGroup.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(dbPermissionGroup.getName());

                    AuditLogPermissionGroupMetadata permissionGroupMetadata = auditLog.getRole();
                    assertThat(permissionGroupMetadata.getAssignedUsers()).hasSize(1);
                    assertThat(permissionGroupMetadata.getAssignedUsers().get(0))
                            .isEqualTo(createdUser.getEmail());
                    assertThat(permissionGroupMetadata.getUnassignedUsers()).isNull();
                    assertThat(permissionGroupMetadata.getAssignedGroups()).isEmpty();
                    assertThat(permissionGroupMetadata.getUnassignedGroups()).isNull();
                })
                .verifyComplete();

        UpdateRoleAssociationDTO unassignUser = new UpdateRoleAssociationDTO();
        unassignUser.setUsers(Set.of(userCompactDTO));
        unassignUser.setRolesRemoved(Set.of(permissionGroupCompactDTO));

        Boolean changeRoleAssociationUnassignUsers = userAndAccessManagementService
                .changeRoleAssociations(unassignUser, originHeader)
                .block();
        assertThat(changeRoleAssociationUnassignUsers).isTrue();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_USERS),
                resourceType,
                roleViewDTO.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(
                                    auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_USERS));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getRole()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();

                    assertThat(auditLogResource.getType()).isEqualTo("Role");
                    assertThat(auditLogResource.getId()).isEqualTo(dbPermissionGroup.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(dbPermissionGroup.getName());

                    AuditLogPermissionGroupMetadata permissionGroupMetadata = auditLog.getRole();
                    assertThat(permissionGroupMetadata.getUnassignedUsers()).hasSize(1);
                    assertThat(permissionGroupMetadata.getUnassignedUsers().get(0))
                            .isEqualTo(createdUser.getEmail());
                    assertThat(permissionGroupMetadata.getAssignedUsers()).isNull();
                    assertThat(permissionGroupMetadata.getAssignedGroups()).isNull();
                    assertThat(permissionGroupMetadata.getUnassignedGroups()).isEmpty();
                })
                .verifyComplete();

        PermissionGroup deletedPermissionGroup =
                permissionGroupService.archiveById(dbPermissionGroup.getId()).block();
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_DELETED),
                resourceType,
                roleViewDTO.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_DELETED));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getRole()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();

                    assertThat(auditLogResource.getType()).isEqualTo("Role");
                    assertThat(auditLogResource.getId()).isEqualTo(deletedPermissionGroup.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(deletedPermissionGroup.getName());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportAuditLogs_Success() {
        clearAuditLogs();
        auditLogService.logEvent(AnalyticsEvents.CREATE, app, null).block();
        auditLogService.logEvent(AnalyticsEvents.CLONE, app, null).block();
        // invalid event
        auditLogService
                .logEvent(AnalyticsEvents.UNIT_EXECUTION_TIME, new Application(), null)
                .block();

        Mono<ExportFileDTO> fileDTOMono = auditLogService.exportAuditLogs(new LinkedMultiValueMap<>());

        StepVerifier.create(fileDTOMono)
                .assertNext(fileDTO -> {
                    assertThat(fileDTO).isNotNull();
                    assertThat(fileDTO.getArtifactResource()).isNotNull();
                    assertThat(fileDTO.getHttpHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
                    AuditLogExportDTO auditLogExport = (AuditLogExportDTO) fileDTO.getArtifactResource();
                    assertThat(auditLogExport.getData()).hasSize(2);
                    List<AuditLog> auditLogs = auditLogExport.getData();
                    List<String> eventTypes =
                            auditLogs.stream().map(AuditLog::getEvent).collect(Collectors.toList());
                    assertThat(eventTypes).contains("application.created");
                    assertThat(eventTypes).contains("application.cloned");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportAuditLogs_NoRecords() {
        clearAuditLogs();

        Mono<ExportFileDTO> fileDTOMono = auditLogService.exportAuditLogs(new LinkedMultiValueMap<>());

        StepVerifier.create(fileDTOMono)
                .assertNext(fileDTO -> {
                    assertThat(fileDTO).isNotNull();
                    assertThat(fileDTO.getArtifactResource()).isNotNull();
                    assertThat(fileDTO.getHttpHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
                    AuditLogExportDTO auditLogExport = (AuditLogExportDTO) fileDTO.getArtifactResource();
                    assertThat(auditLogExport.getData()).hasSize(0);
                    assertThat(auditLogExport.getQuery()).hasSize(0);
                })
                .verifyComplete();
    }

    private void clearAuditLogs() {
        auditLogRepository.deleteAll().block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testPermissionGroup_testUpdateRoles() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_datasource_environments_enabled)))
                .thenReturn(Mono.just(TRUE));

        User apiUser = userService.findByEmail("api_user").block();
        MultiValueMap<String, String> params;
        Workspace workspace = new Workspace();
        workspace.setName("Workspace - testPermissionGroup_testUpdateRoles");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("Application - testPermissionGroup_testUpdateRoles");
        application.setWorkspaceId(createdWorkspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("Action Collection - testPermissionGroup_testUpdateRoles");
        actionCollectionDTO.setPageId(createdApplication.getPages().get(0).getId());
        actionCollectionDTO.setApplicationId(createdApplication.getId());
        actionCollectionDTO.setWorkspaceId(createdWorkspace.getId());
        actionCollectionDTO.setPluginId(pluginRepository
                .findByPackageName("installed-js-plugin")
                .block()
                .getId());
        actionCollectionDTO.setPluginType(PluginType.JS);
        ActionDTO action = new ActionDTO();
        action.setName("Action - testPermissionGroup_testUpdateRoles");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO.setActions(List.of(action));
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setBody("export default { x: 1 }");

        ActionCollectionDTO createdActionCollectionDTO = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("Permission Group - testPermissionGroup_testUpdateRoles");
        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(permissionGroup).block();
        String resourceType = auditLogService.getResourceType(createdPermissionGroup);

        NewPage createdPage = newPageService
                .findById(createdApplication.getPages().get(0).getId(), AclPermission.MANAGE_PAGES)
                .block();

        UpdateRoleEntityDTO workspaceUpdateEntityDto = new UpdateRoleEntityDTO(
                Workspace.class.getSimpleName(),
                createdWorkspace.getId(),
                List.of(1, 1, 1, 1, -1, 1, 1),
                createdWorkspace.getName());
        UpdateRoleEntityDTO applicationUpdateEntityDto = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(),
                createdApplication.getId(),
                List.of(1, 1, 1, 1, -1, 1, 1),
                createdApplication.getName());
        UpdateRoleEntityDTO pageUpdateEntityDto = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(),
                createdPage.getId(),
                List.of(1, 1, 1, 1, -1, -1, -1),
                createdPage.getUnpublishedPage().getName());
        UpdateRoleEntityDTO actionCollectionUpdateEntityDto = new UpdateRoleEntityDTO(
                ActionCollection.class.getSimpleName(),
                createdActionCollectionDTO.getId(),
                List.of(-1, 1, 1, 1, 1, -1, -1),
                createdActionCollectionDTO.getName());

        UpdateRoleConfigDTO roleConfigDTO = new UpdateRoleConfigDTO(
                RoleTab.APPLICATION_RESOURCES.getName(),
                Set.of(
                        workspaceUpdateEntityDto,
                        applicationUpdateEntityDto,
                        pageUpdateEntityDto,
                        actionCollectionUpdateEntityDto));

        RoleViewDTO roleViewDTO = roleConfigurationSolution
                .updateRoles(createdPermissionGroup.getId(), roleConfigDTO)
                .block();

        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UPDATED),
                resourceType,
                createdPermissionGroup.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UPDATED));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getRole()).isNotNull();
                    assertThat(auditLog.getGacMetadata()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();

                    assertThat(auditLogResource.getType()).isEqualTo("Role");
                    assertThat(auditLogResource.getId()).isEqualTo(createdPermissionGroup.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(createdPermissionGroup.getName());

                    AuditLogGacMetadata auditLogGacMetadata = auditLog.getGacMetadata();
                    assertThat(auditLogGacMetadata.getTabUpdated()).isEqualTo(RoleTab.APPLICATION_RESOURCES.getName());
                    assertThat(auditLogGacMetadata.getEntityMetadata()).hasSize(4);
                    Optional<AuditLogGacEntityMetadata> auditLogGacEntityMetadataWorkspace =
                            auditLogGacMetadata.getEntityMetadata().stream()
                                    .filter(entityMetadata ->
                                            entityMetadata.getId().equals(createdWorkspace.getId()))
                                    .findFirst();
                    assertThat(auditLogGacEntityMetadataWorkspace.isPresent()).isTrue();
                    assertThat(auditLogGacEntityMetadataWorkspace.get().getName())
                            .isEqualTo(createdWorkspace.getName());
                    assertThat(auditLogGacEntityMetadataWorkspace.get().getType())
                            .isEqualTo("Workspace");
                    assertThat(auditLogGacEntityMetadataWorkspace.get().getPermissions())
                            .isEqualTo(List.of(CREATE, EDIT, DELETE, VIEW, MAKE_PUBLIC, EXPORT));

                    Optional<AuditLogGacEntityMetadata> auditLogGacEntityMetadataApplication =
                            auditLogGacMetadata.getEntityMetadata().stream()
                                    .filter(entityMetadata ->
                                            entityMetadata.getId().equals(createdApplication.getId()))
                                    .findFirst();
                    assertThat(auditLogGacEntityMetadataApplication.isPresent()).isTrue();
                    assertThat(auditLogGacEntityMetadataApplication.get().getName())
                            .isEqualTo(createdApplication.getName());
                    assertThat(auditLogGacEntityMetadataApplication.get().getType())
                            .isEqualTo("Application");
                    assertThat(auditLogGacEntityMetadataApplication.get().getPermissions())
                            .isEqualTo(List.of(CREATE, EDIT, DELETE, VIEW, MAKE_PUBLIC, EXPORT));

                    Optional<AuditLogGacEntityMetadata> auditLogGacEntityMetadataPage =
                            auditLogGacMetadata.getEntityMetadata().stream()
                                    .filter(entityMetadata ->
                                            entityMetadata.getId().equals(createdPage.getId()))
                                    .findFirst();
                    assertThat(auditLogGacEntityMetadataPage.isPresent()).isTrue();
                    assertThat(auditLogGacEntityMetadataPage.get().getName())
                            .isEqualTo(createdPage.getUnpublishedPage().getName());
                    assertThat(auditLogGacEntityMetadataPage.get().getType()).isEqualTo("Page");
                    assertThat(auditLogGacEntityMetadataPage.get().getPermissions())
                            .isEqualTo(List.of(CREATE, EDIT, DELETE, VIEW));

                    Optional<AuditLogGacEntityMetadata> auditLogGacEntityMetadataActionCollection =
                            auditLogGacMetadata.getEntityMetadata().stream()
                                    .filter(entityMetadata ->
                                            entityMetadata.getId().equals(createdActionCollectionDTO.getId()))
                                    .findFirst();
                    assertThat(auditLogGacEntityMetadataActionCollection.isPresent())
                            .isTrue();
                    assertThat(auditLogGacEntityMetadataActionCollection.get().getName())
                            .isEqualTo(createdActionCollectionDTO.getName());
                    assertThat(auditLogGacEntityMetadataActionCollection.get().getType())
                            .isEqualTo("JS Object");
                    assertThat(auditLogGacEntityMetadataActionCollection.get().getPermissions())
                            .isEqualTo(List.of(EDIT, DELETE, VIEW, EXECUTE));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUserDeleted() {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_datasource_environments_enabled)))
                .thenReturn(Mono.just(TRUE));

        MultiValueMap<String, String> params;

        User apiUser = userService.findByEmail("api_user").block();

        User user = new User();
        user.setEmail("testUserDeleted@testUserDeleted.com");
        user.setPassword("testUserDeleted");
        User createdUser = userService.create(user).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName("testUserGroup_auditLogsTest");
        UserGroupDTO createdUserGroup = userGroupService.createGroup(userGroup).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("testPermissionGroup_auditLogsTest_allOperations");
        RoleViewDTO roleViewDTO = permissionGroupService
                .createCustomPermissionGroup(permissionGroup)
                .block();
        PermissionGroup createdPermissionGroup =
                permissionGroupService.findById(roleViewDTO.getId()).block();

        Set<String> usernames = new HashSet<>();
        usernames.add(createdUser.getUsername());
        UsersForGroupDTO invitedUsers = new UsersForGroupDTO(usernames, Set.of(createdUserGroup.getId()));
        List<UserGroupDTO> invitedUserGroupDTOS =
                userGroupService.inviteUsers(invitedUsers, "origin").block();

        UserCompactDTO userCompactDTO =
                new UserCompactDTO(createdUser.getId(), createdUser.getUsername(), createdUser.getName());
        PermissionGroupCompactDTO permissionGroupCompactDTO =
                new PermissionGroupCompactDTO(createdPermissionGroup.getId(), createdPermissionGroup.getName());
        UpdateRoleAssociationDTO assignUser = new UpdateRoleAssociationDTO();
        assignUser.setUsers(Set.of(userCompactDTO));
        assignUser.setRolesAdded(Set.of(permissionGroupCompactDTO));

        Boolean changeRoleAssociationAssignUser = userAndAccessManagementService
                .changeRoleAssociations(assignUser, "originHeader")
                .block();
        assertThat(changeRoleAssociationAssignUser).isTrue();

        Boolean userDeleted =
                userAndAccessManagementService.deleteUser(createdUser.getId()).block();
        assertThat(userDeleted).isTrue();

        UserGroup createdUserGroupAfterUserDelete = userGroupService
                .findById(createdUserGroup.getId(), AclPermission.MANAGE_USER_GROUPS)
                .block();
        PermissionGroup createdPermissionGroupAfterUserDelete = permissionGroupService
                .findById(createdPermissionGroup.getId(), AclPermission.MANAGE_PERMISSION_GROUPS)
                .block();

        assertThat(createdUserGroupAfterUserDelete.getUsers()).doesNotContain(createdUser.getEmail());
        assertThat(createdPermissionGroupAfterUserDelete.getAssignedToUserIds()).doesNotContain(createdUser.getId());

        String resourceType = auditLogService.getResourceType(createdUserGroup);
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_REMOVE_USERS),
                auditLogService.getResourceType(createdUserGroupAfterUserDelete),
                createdUserGroupAfterUserDelete.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_REMOVE_USERS));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getGroup()).isNotNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getRole()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();
                    assertThat(auditLogResource.getType()).isEqualTo("Group");
                    assertThat(auditLogResource.getId()).isEqualTo(createdUserGroupAfterUserDelete.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(createdUserGroupAfterUserDelete.getName());

                    AuditLogUserGroupMetadata userGroupMetadata = auditLog.getGroup();
                    assertThat(userGroupMetadata.getRemovedUsers()).hasSize(1);
                    userGroupMetadata.getRemovedUsers().forEach(removedUser -> assertThat(
                                    createdUserGroupAfterUserDelete.getUsers())
                            .doesNotContain(removedUser));
                    assertThat(userGroupMetadata.getInvitedUsers()).isNull();
                })
                .verifyComplete();

        resourceType = auditLogService.getResourceType(createdPermissionGroupAfterUserDelete);
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_USERS),
                resourceType,
                createdPermissionGroupAfterUserDelete.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(
                                    auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_USERS));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getRole()).isNotNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();

                    assertThat(auditLogResource.getType()).isEqualTo("Role");
                    assertThat(auditLogResource.getId()).isEqualTo(createdPermissionGroupAfterUserDelete.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(createdPermissionGroupAfterUserDelete.getName());

                    AuditLogPermissionGroupMetadata permissionGroupMetadata = auditLog.getRole();
                    assertThat(permissionGroupMetadata.getUnassignedUsers()).hasSize(1);
                    assertThat(permissionGroupMetadata.getUnassignedUsers().get(0))
                            .isEqualTo(createdUser.getEmail());
                    assertThat(permissionGroupMetadata.getAssignedUsers()).isNull();
                    assertThat(permissionGroupMetadata.getAssignedGroups()).isNull();
                    assertThat(permissionGroupMetadata.getUnassignedGroups()).isNull();
                })
                .verifyComplete();

        resourceType = auditLogService.getResourceType(createdUser);
        params = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.USER_DELETED),
                resourceType,
                createdUser.getId(),
                null,
                null,
                null,
                null,
                null);
        StepVerifier.create(auditLogService.getAuditLogs(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent())
                            .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.USER_DELETED));
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
                    assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

                    assertThat(auditLog.getResource()).isNotNull();
                    assertThat(auditLog.getMetadata()).isNotNull();
                    assertThat(auditLog.getUser()).isNotNull();
                    assertThat(auditLog.getRole()).isNull();
                    assertThat(auditLog.getGroup()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();

                    AuditLogUserMetadata userMetadata = auditLog.getUser();
                    assertThat(userMetadata.getId()).isEqualTo(apiUser.getId());
                    assertThat(userMetadata.getName()).isEqualTo(apiUser.getName());

                    AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
                    assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

                    AuditLogResource auditLogResource = auditLog.getResource();

                    assertThat(auditLogResource.getType()).isEqualTo("User");
                    assertThat(auditLogResource.getId()).isEqualTo(createdUser.getId());
                    assertThat(auditLogResource.getName()).isEqualTo(createdUser.getUsername());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void testInviteUsersAndUserGroupsToApplication() {
        String testName = "testInviteUsersAndUserGroupsToApplication";
        User apiUser = userService.findByEmail("api_user").block();

        User user = new User();
        user.setEmail(testName + "@" + testName + ".com");
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        UserGroupDTO createdUserGroup = userGroupService.createGroup(userGroup).block();

        Workspace workspace = new Workspace();
        workspace.setName(testName);
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(createdWorkspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        InviteUsersToApplicationDTO inviteUsersToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteUsersToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteUsersToApplicationDTO.setUsernames(Set.of(user.getEmail()));
        inviteUsersToApplicationDTO.setGroups(Set.of(createdUserGroup.getId()));
        inviteUsersToApplicationDTO.setRoleType(FieldName.APPLICATION_DEVELOPER);

        List<MemberInfoDTO> membersInvited = applicationService
                .inviteToApplication(inviteUsersToApplicationDTO, originHeader)
                .block();
        List<PermissionGroup> defaultRolesForApplication = permissionGroupService
                .getAllDefaultRolesForApplication(createdApplication, Optional.empty())
                .collectList()
                .block();

        PermissionGroup applicationDeveloperRole = defaultRolesForApplication.stream()
                .filter(role -> role.getName().startsWith(FieldName.APPLICATION_DEVELOPER))
                .findFirst()
                .get();

        String resourceType = auditLogService.getResourceType(applicationDeveloperRole);

        MultiValueMap<String, String> userInvitedParams =
                getAuditLogRequest(null, "user.invited", null, null, null, null, null, null, null);

        List<AuditLog> auditLogsUserInvited =
                auditLogService.getAuditLogs(userInvitedParams).block();
        assertThat(auditLogsUserInvited).isEmpty();

        MultiValueMap<String, String> roleAssignedToUserParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_USERS),
                resourceType,
                applicationDeveloperRole.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleAssignedToUser =
                auditLogService.getAuditLogs(roleAssignedToUserParams).block();
        assertThat(auditLogsRoleAssignedToUser).hasSize(1);
        AuditLog auditLogRoleAssignedToUser = auditLogsRoleAssignedToUser.get(0);

        assertThat(auditLogRoleAssignedToUser.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_USERS));
        assertThat(auditLogRoleAssignedToUser.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToUser.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToUser.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleAssignedToUser.getResource()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getMetadata()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getUser()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getRole()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getGroup()).isNull();
        assertThat(auditLogRoleAssignedToUser.getWorkspace()).isNull();
        assertThat(auditLogRoleAssignedToUser.getApplication()).isNull();
        assertThat(auditLogRoleAssignedToUser.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleAssignedToUser = auditLogRoleAssignedToUser.getUser();
        assertThat(userMetadataRoleAssignedToUser.getId()).isEqualTo(apiUser.getId());
        assertThat(userMetadataRoleAssignedToUser.getName()).isEqualTo(apiUser.getName());

        AuditLogMetadata auditLogMetadataRoleAssignedToUser = auditLogRoleAssignedToUser.getMetadata();
        assertThat(auditLogMetadataRoleAssignedToUser.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleAssignedToUser = auditLogRoleAssignedToUser.getResource();

        assertThat(auditLogResourceRoleAssignedToUser.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleAssignedToUser.getId()).isEqualTo(applicationDeveloperRole.getId());
        assertThat(auditLogResourceRoleAssignedToUser.getName()).isEqualTo(applicationDeveloperRole.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleAssignedToUser =
                auditLogRoleAssignedToUser.getRole();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedUsers()).hasSize(1);
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedUsers().get(0))
                .isEqualTo(createdUser.getEmail());
        assertThat(permissionGroupMetadataRoleAssignedToUser.getUnassignedUsers())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getUnassignedGroups())
                .isNull();

        MultiValueMap<String, String> roleAssignedToGroupParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_GROUPS),
                resourceType,
                applicationDeveloperRole.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleAssignedToGroup =
                auditLogService.getAuditLogs(roleAssignedToGroupParams).block();
        assertThat(auditLogsRoleAssignedToGroup).hasSize(1);
        AuditLog auditLogRoleAssignedToGroup = auditLogsRoleAssignedToGroup.get(0);

        assertThat(auditLogRoleAssignedToGroup.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_GROUPS));
        assertThat(auditLogRoleAssignedToGroup.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToGroup.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToGroup.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleAssignedToGroup.getResource()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getMetadata()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getUser()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getRole()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getGroup()).isNull();
        assertThat(auditLogRoleAssignedToGroup.getWorkspace()).isNull();
        assertThat(auditLogRoleAssignedToGroup.getApplication()).isNull();
        assertThat(auditLogRoleAssignedToGroup.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleAssignedToGroup = auditLogRoleAssignedToGroup.getUser();
        assertThat(userMetadataRoleAssignedToGroup.getId()).isEqualTo(apiUser.getId());
        assertThat(userMetadataRoleAssignedToGroup.getName()).isEqualTo(apiUser.getName());

        AuditLogMetadata auditLogMetadataRoleAssignedToGroup = auditLogRoleAssignedToGroup.getMetadata();
        assertThat(auditLogMetadataRoleAssignedToGroup.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleAssignedToGroup = auditLogRoleAssignedToGroup.getResource();

        assertThat(auditLogResourceRoleAssignedToGroup.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleAssignedToGroup.getId()).isEqualTo(applicationDeveloperRole.getId());
        assertThat(auditLogResourceRoleAssignedToGroup.getName()).isEqualTo(applicationDeveloperRole.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleAssignedToGroup =
                auditLogRoleAssignedToGroup.getRole();
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getAssignedGroups())
                .hasSize(1);
        assertThat(permissionGroupMetadataRoleAssignedToGroup
                        .getAssignedGroups()
                        .get(0))
                .isEqualTo(createdUserGroup.getName());
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getUnassignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getAssignedUsers())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getUnassignedUsers())
                .isNull();
    }

    @Test
    @WithUserDetails("api_user")
    public void testUpdateApplicationRoleForUsersAndGroups() {
        String testName = "testUpdateApplicationRoleForUsersAndGroups";
        User apiUser = userService.findByEmail("api_user").block();

        User user = new User();
        user.setEmail(testName + "@" + testName + ".com");
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        UserGroupDTO createdUserGroup = userGroupService.createGroup(userGroup).block();

        Workspace workspace = new Workspace();
        workspace.setName(testName);
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(createdWorkspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        InviteUsersToApplicationDTO inviteUsersToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteUsersToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteUsersToApplicationDTO.setUsernames(Set.of(user.getEmail()));
        inviteUsersToApplicationDTO.setGroups(Set.of(createdUserGroup.getId()));
        inviteUsersToApplicationDTO.setRoleType(FieldName.APPLICATION_DEVELOPER);

        List<MemberInfoDTO> membersInvited = applicationService
                .inviteToApplication(inviteUsersToApplicationDTO, originHeader)
                .block();
        List<PermissionGroup> defaultRolesForApplication = permissionGroupService
                .getAllDefaultRolesForApplication(createdApplication, Optional.empty())
                .collectList()
                .block();

        PermissionGroup applicationDeveloperRole = defaultRolesForApplication.stream()
                .filter(role -> role.getName().startsWith(FieldName.APPLICATION_DEVELOPER))
                .findFirst()
                .get();

        UpdateApplicationRoleDTO updateApplicationRoleDTOForUser = new UpdateApplicationRoleDTO();
        updateApplicationRoleDTOForUser.setUsername(createdUser.getUsername());
        updateApplicationRoleDTOForUser.setNewRole(FieldName.APPLICATION_VIEWER);
        MemberInfoDTO updatedRoleForUser = applicationService
                .updateRoleForMember(createdApplication.getId(), updateApplicationRoleDTOForUser)
                .block();

        UpdateApplicationRoleDTO updateApplicationRoleDTOForGroup = new UpdateApplicationRoleDTO();
        updateApplicationRoleDTOForGroup.setUserGroupId(createdUserGroup.getId());
        updateApplicationRoleDTOForGroup.setNewRole(FieldName.APPLICATION_VIEWER);
        MemberInfoDTO updatedRoleForGroup = applicationService
                .updateRoleForMember(createdApplication.getId(), updateApplicationRoleDTOForGroup)
                .block();

        defaultRolesForApplication = permissionGroupService
                .getAllDefaultRolesForApplication(createdApplication, Optional.empty())
                .collectList()
                .block();

        PermissionGroup applicationViewerRole = defaultRolesForApplication.stream()
                .filter(role -> role.getName().startsWith(FieldName.APPLICATION_VIEWER))
                .findFirst()
                .get();

        String resourceTypeApplicationDeveloperRole = auditLogService.getResourceType(applicationDeveloperRole);
        String resourceTypeApplicationViewerRole = auditLogService.getResourceType(applicationViewerRole);

        MultiValueMap<String, String> roleUnAssignedFromUserParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_USERS),
                resourceTypeApplicationDeveloperRole,
                applicationDeveloperRole.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleUnAssignedFromUser =
                auditLogService.getAuditLogs(roleUnAssignedFromUserParams).block();
        assertThat(auditLogsRoleUnAssignedFromUser).hasSize(1);
        AuditLog auditLogRoleUnAssignedFromUser = auditLogsRoleUnAssignedFromUser.get(0);

        assertThat(auditLogRoleUnAssignedFromUser.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_USERS));
        assertThat(auditLogRoleUnAssignedFromUser.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleUnAssignedFromUser.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleUnAssignedFromUser.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleUnAssignedFromUser.getResource()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromUser.getMetadata()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromUser.getUser()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromUser.getRole()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromUser.getGroup()).isNull();
        assertThat(auditLogRoleUnAssignedFromUser.getWorkspace()).isNull();
        assertThat(auditLogRoleUnAssignedFromUser.getApplication()).isNull();
        assertThat(auditLogRoleUnAssignedFromUser.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleUnAssignedFromUser = auditLogRoleUnAssignedFromUser.getUser();
        assertThat(userMetadataRoleUnAssignedFromUser.getId()).isEqualTo(apiUser.getId());
        assertThat(userMetadataRoleUnAssignedFromUser.getName()).isEqualTo(apiUser.getName());

        AuditLogMetadata auditLogMetadataRoleUnAssignedFromUser = auditLogRoleUnAssignedFromUser.getMetadata();
        assertThat(auditLogMetadataRoleUnAssignedFromUser.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleUnAssignedFromUser = auditLogRoleUnAssignedFromUser.getResource();

        assertThat(auditLogResourceRoleUnAssignedFromUser.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleUnAssignedFromUser.getId()).isEqualTo(applicationDeveloperRole.getId());
        assertThat(auditLogResourceRoleUnAssignedFromUser.getName()).isEqualTo(applicationDeveloperRole.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleUnAssignedFromUser =
                auditLogRoleUnAssignedFromUser.getRole();
        assertThat(permissionGroupMetadataRoleUnAssignedFromUser.getUnassignedUsers())
                .hasSize(1);
        assertThat(permissionGroupMetadataRoleUnAssignedFromUser
                        .getUnassignedUsers()
                        .get(0))
                .isEqualTo(createdUser.getEmail());
        assertThat(permissionGroupMetadataRoleUnAssignedFromUser.getAssignedUsers())
                .isNull();
        assertThat(permissionGroupMetadataRoleUnAssignedFromUser.getAssignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleUnAssignedFromUser.getUnassignedGroups())
                .isNull();

        MultiValueMap<String, String> roleUnAssignedFromGroupParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_GROUPS),
                resourceTypeApplicationDeveloperRole,
                applicationDeveloperRole.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleUnAssignedFromGroup =
                auditLogService.getAuditLogs(roleUnAssignedFromGroupParams).block();
        assertThat(auditLogsRoleUnAssignedFromGroup).hasSize(1);
        AuditLog auditLogRoleUnAssignedFromGroup = auditLogsRoleUnAssignedFromGroup.get(0);

        assertThat(auditLogRoleUnAssignedFromGroup.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_GROUPS));
        assertThat(auditLogRoleUnAssignedFromGroup.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleUnAssignedFromGroup.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleUnAssignedFromGroup.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleUnAssignedFromGroup.getResource()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getMetadata()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getUser()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getRole()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getGroup()).isNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getWorkspace()).isNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getApplication()).isNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleUnAssignedFromGroup = auditLogRoleUnAssignedFromGroup.getUser();
        assertThat(userMetadataRoleUnAssignedFromGroup.getId()).isEqualTo(apiUser.getId());
        assertThat(userMetadataRoleUnAssignedFromGroup.getName()).isEqualTo(apiUser.getName());

        AuditLogMetadata auditLogMetadataRoleUnAssignedFromGroup = auditLogRoleUnAssignedFromGroup.getMetadata();
        assertThat(auditLogMetadataRoleUnAssignedFromGroup.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleUnAssignedFromGroup = auditLogRoleUnAssignedFromGroup.getResource();

        assertThat(auditLogResourceRoleUnAssignedFromGroup.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleUnAssignedFromGroup.getId()).isEqualTo(applicationDeveloperRole.getId());
        assertThat(auditLogResourceRoleUnAssignedFromGroup.getName()).isEqualTo(applicationDeveloperRole.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleUnAssignedFromGroup =
                auditLogRoleUnAssignedFromGroup.getRole();
        assertThat(permissionGroupMetadataRoleUnAssignedFromGroup.getUnassignedGroups())
                .hasSize(1);
        assertThat(permissionGroupMetadataRoleUnAssignedFromGroup
                        .getUnassignedGroups()
                        .get(0))
                .isEqualTo(createdUserGroup.getName());
        assertThat(permissionGroupMetadataRoleUnAssignedFromGroup.getAssignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleUnAssignedFromGroup.getAssignedUsers())
                .isNull();
        assertThat(permissionGroupMetadataRoleUnAssignedFromGroup.getUnassignedUsers())
                .isNull();

        MultiValueMap<String, String> roleAssignedToUserParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_USERS),
                resourceTypeApplicationViewerRole,
                applicationViewerRole.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleAssignedToUser =
                auditLogService.getAuditLogs(roleAssignedToUserParams).block();
        assertThat(auditLogsRoleAssignedToUser).hasSize(1);
        AuditLog auditLogRoleAssignedToUser = auditLogsRoleAssignedToUser.get(0);

        assertThat(auditLogRoleAssignedToUser.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_USERS));
        assertThat(auditLogRoleAssignedToUser.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToUser.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToUser.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleAssignedToUser.getResource()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getMetadata()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getUser()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getRole()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getGroup()).isNull();
        assertThat(auditLogRoleAssignedToUser.getWorkspace()).isNull();
        assertThat(auditLogRoleAssignedToUser.getApplication()).isNull();
        assertThat(auditLogRoleAssignedToUser.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleAssignedToUser = auditLogRoleAssignedToUser.getUser();
        assertThat(userMetadataRoleAssignedToUser.getId()).isEqualTo(apiUser.getId());
        assertThat(userMetadataRoleAssignedToUser.getName()).isEqualTo(apiUser.getName());

        AuditLogMetadata auditLogMetadataRoleAssignedToUser = auditLogRoleAssignedToUser.getMetadata();
        assertThat(auditLogMetadataRoleAssignedToUser.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleAssignedToUser = auditLogRoleAssignedToUser.getResource();

        assertThat(auditLogResourceRoleAssignedToUser.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleAssignedToUser.getId()).isEqualTo(applicationViewerRole.getId());
        assertThat(auditLogResourceRoleAssignedToUser.getName()).isEqualTo(applicationViewerRole.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleAssignedToUser =
                auditLogRoleAssignedToUser.getRole();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedUsers()).hasSize(1);
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedUsers().get(0))
                .isEqualTo(createdUser.getEmail());
        assertThat(permissionGroupMetadataRoleAssignedToUser.getUnassignedUsers())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getUnassignedGroups())
                .isNull();

        MultiValueMap<String, String> roleAssignedToGroupParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_GROUPS),
                resourceTypeApplicationViewerRole,
                applicationViewerRole.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleAssignedToGroup =
                auditLogService.getAuditLogs(roleAssignedToGroupParams).block();
        assertThat(auditLogsRoleAssignedToGroup).hasSize(1);
        AuditLog auditLogRoleAssignedToGroup = auditLogsRoleAssignedToGroup.get(0);

        assertThat(auditLogRoleAssignedToGroup.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_GROUPS));
        assertThat(auditLogRoleAssignedToGroup.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToGroup.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToGroup.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleAssignedToGroup.getResource()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getMetadata()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getUser()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getRole()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getGroup()).isNull();
        assertThat(auditLogRoleAssignedToGroup.getWorkspace()).isNull();
        assertThat(auditLogRoleAssignedToGroup.getApplication()).isNull();
        assertThat(auditLogRoleAssignedToGroup.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleAssignedToGroup = auditLogRoleAssignedToGroup.getUser();
        assertThat(userMetadataRoleAssignedToGroup.getId()).isEqualTo(apiUser.getId());
        assertThat(userMetadataRoleAssignedToGroup.getName()).isEqualTo(apiUser.getName());

        AuditLogMetadata auditLogMetadataRoleAssignedToGroup = auditLogRoleAssignedToGroup.getMetadata();
        assertThat(auditLogMetadataRoleAssignedToGroup.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleAssignedToGroup = auditLogRoleAssignedToGroup.getResource();

        assertThat(auditLogResourceRoleAssignedToGroup.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleAssignedToGroup.getId()).isEqualTo(applicationViewerRole.getId());
        assertThat(auditLogResourceRoleAssignedToGroup.getName()).isEqualTo(applicationViewerRole.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleAssignedToGroup =
                auditLogRoleAssignedToGroup.getRole();
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getAssignedGroups())
                .hasSize(1);
        assertThat(permissionGroupMetadataRoleAssignedToGroup
                        .getAssignedGroups()
                        .get(0))
                .isEqualTo(createdUserGroup.getName());
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getUnassignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getAssignedUsers())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getUnassignedUsers())
                .isNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAuditLogEventsUpdateWorkspaceRoleMembers() {
        String testName = "testAuditLogEventsUpdateWorkspaceRoleMembers";
        User apiUser = userService.findByEmail("api_user").block();

        User user = new User();
        user.setEmail(testName + "@" + testName + ".com");
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        UserGroupDTO createdUserGroup = userGroupService.createGroup(userGroup).block();

        Workspace workspace = new Workspace();
        workspace.setName(testName);
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(createdWorkspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        List<PermissionGroup> workspaceRoles = permissionGroupService
                .findAllByIds(createdWorkspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        PermissionGroup workspaceAdministratorRole = workspaceRoles.stream()
                .filter(role -> role.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst()
                .get();
        PermissionGroup workspaceDeveloperRole = workspaceRoles.stream()
                .filter(role -> role.getName().startsWith(FieldName.DEVELOPER))
                .findFirst()
                .get();
        PermissionGroup workspaceViewerRole = workspaceRoles.stream()
                .filter(role -> role.getName().startsWith(FieldName.VIEWER))
                .findFirst()
                .get();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of(createdUser.getUsername()));
        inviteUsersDTO.setGroups(Set.of(createdUserGroup.getId()));
        inviteUsersDTO.setPermissionGroupId(workspaceAdministratorRole.getId());

        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        assertAuditLogRoleAssignedToUser(workspaceAdministratorRole, apiUser, createdUser);
        assertAuditLogRoleAssignedToUserGroup(workspaceAdministratorRole, apiUser, createdUserGroup);

        UpdatePermissionGroupDTO updatePermissionGroupDTOForUser = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTOForUser.setUsername(createdUser.getUsername());
        updatePermissionGroupDTOForUser.setNewPermissionGroupId(workspaceDeveloperRole.getId());
        userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTOForUser, "test")
                .block();
        assertAuditLogRoleUnAssignedFromUser(workspaceAdministratorRole, apiUser, createdUser);
        assertAuditLogRoleAssignedToUser(workspaceDeveloperRole, apiUser, createdUser);
        UpdatePermissionGroupDTO deletePermissionGroupDTOForUser = new UpdatePermissionGroupDTO();
        deletePermissionGroupDTOForUser.setUsername(createdUser.getUsername());
        userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), deletePermissionGroupDTOForUser, "test")
                .block();
        assertAuditLogRoleUnAssignedFromUser(workspaceDeveloperRole, apiUser, createdUser);

        UpdatePermissionGroupDTO updatePermissionGroupDTOForGroup = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTOForGroup.setUserGroupId(createdUserGroup.getId());
        updatePermissionGroupDTOForGroup.setNewPermissionGroupId(workspaceViewerRole.getId());
        userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTOForGroup, "test")
                .block();
        assertAuditLogRoleUnAssignedFromUserGroup(workspaceAdministratorRole, apiUser, createdUserGroup);
        assertAuditLogRoleAssignedToUserGroup(workspaceViewerRole, apiUser, createdUserGroup);
        UpdatePermissionGroupDTO deletePermissionGroupDTOForGroup = new UpdatePermissionGroupDTO();
        deletePermissionGroupDTOForGroup.setUserGroupId(createdUserGroup.getId());
        userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), deletePermissionGroupDTOForGroup, "test")
                .block();
        assertAuditLogRoleUnAssignedFromUserGroup(workspaceViewerRole, apiUser, createdUserGroup);
    }

    private void assertAuditLogRoleAssignedToUser(PermissionGroup role, User assignedBy, User assignedToUser) {
        String resourceTypeRole = auditLogService.getResourceType(role);

        MultiValueMap<String, String> workspaceAdministratorRoleAssignedToUserParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_USERS),
                resourceTypeRole,
                role.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleAssignedToUser = auditLogService
                .getAuditLogs(workspaceAdministratorRoleAssignedToUserParams)
                .block();
        assertThat(auditLogsRoleAssignedToUser).hasSize(1);
        AuditLog auditLogRoleAssignedToUser = auditLogsRoleAssignedToUser.get(0);

        assertThat(auditLogRoleAssignedToUser.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_USERS));
        assertThat(auditLogRoleAssignedToUser.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToUser.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToUser.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleAssignedToUser.getResource()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getMetadata()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getUser()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getRole()).isNotNull();
        assertThat(auditLogRoleAssignedToUser.getGroup()).isNull();
        assertThat(auditLogRoleAssignedToUser.getWorkspace()).isNull();
        assertThat(auditLogRoleAssignedToUser.getApplication()).isNull();
        assertThat(auditLogRoleAssignedToUser.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleAssignedToUser = auditLogRoleAssignedToUser.getUser();
        assertThat(userMetadataRoleAssignedToUser.getId()).isEqualTo(assignedBy.getId());
        assertThat(userMetadataRoleAssignedToUser.getName()).isEqualTo(assignedBy.getName());

        AuditLogMetadata auditLogMetadataRoleAssignedToUser = auditLogRoleAssignedToUser.getMetadata();
        assertThat(auditLogMetadataRoleAssignedToUser.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleAssignedToUser = auditLogRoleAssignedToUser.getResource();

        assertThat(auditLogResourceRoleAssignedToUser.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleAssignedToUser.getId()).isEqualTo(role.getId());
        assertThat(auditLogResourceRoleAssignedToUser.getName()).isEqualTo(role.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleAssignedToUser =
                auditLogRoleAssignedToUser.getRole();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedUsers()).hasSize(1);
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedUsers().get(0))
                .isEqualTo(assignedToUser.getEmail());
        assertThat(permissionGroupMetadataRoleAssignedToUser.getUnassignedUsers())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getAssignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToUser.getUnassignedGroups())
                .isNull();
    }

    private void assertAuditLogRoleAssignedToUserGroup(
            PermissionGroup role, User assignedBy, UserGroupDTO assignedToUserGroup) {
        String resourceTypeRole = auditLogService.getResourceType(role);

        MultiValueMap<String, String> roleUnAssignedFromUserParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_GROUPS),
                resourceTypeRole,
                role.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleAssignedToUser =
                auditLogService.getAuditLogs(roleUnAssignedFromUserParams).block();
        assertThat(auditLogsRoleAssignedToUser).hasSize(1);
        AuditLog auditLogRoleAssignedToGroup = auditLogsRoleAssignedToUser.get(0);

        assertThat(auditLogRoleAssignedToGroup.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_ASSIGNED_GROUPS));
        assertThat(auditLogRoleAssignedToGroup.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToGroup.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleAssignedToGroup.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleAssignedToGroup.getResource()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getMetadata()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getUser()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getRole()).isNotNull();
        assertThat(auditLogRoleAssignedToGroup.getGroup()).isNull();
        assertThat(auditLogRoleAssignedToGroup.getWorkspace()).isNull();
        assertThat(auditLogRoleAssignedToGroup.getApplication()).isNull();
        assertThat(auditLogRoleAssignedToGroup.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleAssignedToGroup = auditLogRoleAssignedToGroup.getUser();
        assertThat(userMetadataRoleAssignedToGroup.getId()).isEqualTo(assignedBy.getId());
        assertThat(userMetadataRoleAssignedToGroup.getName()).isEqualTo(assignedBy.getName());

        AuditLogMetadata auditLogMetadataRoleAssignedToGroup = auditLogRoleAssignedToGroup.getMetadata();
        assertThat(auditLogMetadataRoleAssignedToGroup.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleAssignedToGroup = auditLogRoleAssignedToGroup.getResource();

        assertThat(auditLogResourceRoleAssignedToGroup.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleAssignedToGroup.getId()).isEqualTo(role.getId());
        assertThat(auditLogResourceRoleAssignedToGroup.getName()).isEqualTo(role.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleAssignedToGroup =
                auditLogRoleAssignedToGroup.getRole();
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getAssignedGroups())
                .hasSize(1);
        assertThat(permissionGroupMetadataRoleAssignedToGroup
                        .getAssignedGroups()
                        .get(0))
                .isEqualTo(assignedToUserGroup.getName());
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getUnassignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getAssignedUsers())
                .isNullOrEmpty();
        assertThat(permissionGroupMetadataRoleAssignedToGroup.getUnassignedUsers())
                .isNull();
    }

    private void assertAuditLogRoleUnAssignedFromUser(
            PermissionGroup role, User unAssignedBy, User unAssignedFromUser) {
        String resourceTypeRole = auditLogService.getResourceType(role);

        MultiValueMap<String, String> roleUnAssignedFromUserParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_USERS),
                resourceTypeRole,
                role.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleUnAssignedFromUser =
                auditLogService.getAuditLogs(roleUnAssignedFromUserParams).block();
        assertThat(auditLogsRoleUnAssignedFromUser).hasSize(1);
        AuditLog auditLogRoleUnAssignedFromUser = auditLogsRoleUnAssignedFromUser.get(0);

        assertThat(auditLogRoleUnAssignedFromUser.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_USERS));
        assertThat(auditLogRoleUnAssignedFromUser.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleUnAssignedFromUser.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleUnAssignedFromUser.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleUnAssignedFromUser.getResource()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromUser.getMetadata()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromUser.getUser()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromUser.getRole()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromUser.getGroup()).isNull();
        assertThat(auditLogRoleUnAssignedFromUser.getWorkspace()).isNull();
        assertThat(auditLogRoleUnAssignedFromUser.getApplication()).isNull();
        assertThat(auditLogRoleUnAssignedFromUser.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleUnAssignedFromUser = auditLogRoleUnAssignedFromUser.getUser();
        assertThat(userMetadataRoleUnAssignedFromUser.getId()).isEqualTo(unAssignedBy.getId());
        assertThat(userMetadataRoleUnAssignedFromUser.getName()).isEqualTo(unAssignedBy.getName());

        AuditLogMetadata auditLogMetadataRoleUnAssignedFromUser = auditLogRoleUnAssignedFromUser.getMetadata();
        assertThat(auditLogMetadataRoleUnAssignedFromUser.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleUnAssignedFromUser = auditLogRoleUnAssignedFromUser.getResource();

        assertThat(auditLogResourceRoleUnAssignedFromUser.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleUnAssignedFromUser.getId()).isEqualTo(role.getId());
        assertThat(auditLogResourceRoleUnAssignedFromUser.getName()).isEqualTo(role.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleUnAssignedFromUser =
                auditLogRoleUnAssignedFromUser.getRole();
        assertThat(permissionGroupMetadataRoleUnAssignedFromUser.getUnassignedUsers())
                .hasSize(1);
        assertThat(permissionGroupMetadataRoleUnAssignedFromUser
                        .getUnassignedUsers()
                        .get(0))
                .isEqualTo(unAssignedFromUser.getEmail());
        assertThat(permissionGroupMetadataRoleUnAssignedFromUser.getAssignedUsers())
                .isNull();
        assertThat(permissionGroupMetadataRoleUnAssignedFromUser.getAssignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleUnAssignedFromUser.getUnassignedGroups())
                .isNull();
    }

    private void assertAuditLogRoleUnAssignedFromUserGroup(
            PermissionGroup role, User unAssignedBy, UserGroupDTO unAssignedFromUserGroup) {
        String resourceTypeRole = auditLogService.getResourceType(role);
        MultiValueMap<String, String> roleUnAssignedFromGroupParams = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_GROUPS),
                resourceTypeRole,
                role.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsRoleUnAssignedFromGroup =
                auditLogService.getAuditLogs(roleUnAssignedFromGroupParams).block();
        assertThat(auditLogsRoleUnAssignedFromGroup).hasSize(1);
        AuditLog auditLogRoleUnAssignedFromGroup = auditLogsRoleUnAssignedFromGroup.get(0);

        assertThat(auditLogRoleUnAssignedFromGroup.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.ROLE_UNASSIGNED_GROUPS));
        assertThat(auditLogRoleUnAssignedFromGroup.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRoleUnAssignedFromGroup.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRoleUnAssignedFromGroup.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRoleUnAssignedFromGroup.getResource()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getMetadata()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getUser()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getRole()).isNotNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getGroup()).isNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getWorkspace()).isNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getApplication()).isNull();
        assertThat(auditLogRoleUnAssignedFromGroup.getPage()).isNull();

        AuditLogUserMetadata userMetadataRoleUnAssignedFromGroup = auditLogRoleUnAssignedFromGroup.getUser();
        assertThat(userMetadataRoleUnAssignedFromGroup.getId()).isEqualTo(unAssignedBy.getId());
        assertThat(userMetadataRoleUnAssignedFromGroup.getName()).isEqualTo(unAssignedBy.getName());

        AuditLogMetadata auditLogMetadataRoleUnAssignedFromGroup = auditLogRoleUnAssignedFromGroup.getMetadata();
        assertThat(auditLogMetadataRoleUnAssignedFromGroup.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResourceRoleUnAssignedFromGroup = auditLogRoleUnAssignedFromGroup.getResource();

        assertThat(auditLogResourceRoleUnAssignedFromGroup.getType()).isEqualTo("Role");
        assertThat(auditLogResourceRoleUnAssignedFromGroup.getId()).isEqualTo(role.getId());
        assertThat(auditLogResourceRoleUnAssignedFromGroup.getName()).isEqualTo(role.getName());

        AuditLogPermissionGroupMetadata permissionGroupMetadataRoleUnAssignedFromGroup =
                auditLogRoleUnAssignedFromGroup.getRole();
        assertThat(permissionGroupMetadataRoleUnAssignedFromGroup.getUnassignedGroups())
                .hasSize(1);
        assertThat(permissionGroupMetadataRoleUnAssignedFromGroup
                        .getUnassignedGroups()
                        .get(0))
                .isEqualTo(unAssignedFromUserGroup.getName());
        assertThat(permissionGroupMetadataRoleUnAssignedFromGroup.getAssignedGroups())
                .isNull();
        assertThat(permissionGroupMetadataRoleUnAssignedFromGroup.getAssignedUsers())
                .isNull();
        assertThat(permissionGroupMetadataRoleUnAssignedFromGroup.getUnassignedUsers())
                .isNull();
    }

    // Using api_user, instead of provisioningUser, because api_user has access to Audit Logs.
    @Test
    @WithUserDetails(value = "api_user")
    public void testAuditLogs_updateProvisionGroup_sameUserGroupResource_shouldGenerateNoAuditLogs() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(TRUE));
        String testName = "testAuditLogs_updateProvisionGroup_sameUserGroupResource_shouldGenerateNoAuditLogs";

        User user1 = new User();
        user1.setEmail(testName + "_1@appsmith@.com");
        user1.setPassword(testName);
        User createdUser1 = userService.create(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_2@appsmith@.com");
        user2.setPassword(testName);
        User createdUser2 = userService.create(user2).block();

        User user3 = new User();
        user3.setEmail(testName + "_3@appsmith@.com");
        user3.setPassword(testName);
        User createdUser3 = userService.create(user3).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_name");
        userGroup.setDescription(testName + "_description");
        userGroup.setUsers(Set.of(createdUser1.getId(), createdUser2.getId(), createdUser3.getId()));
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO ->
                        userGroupService.findById(userGroupDTO.getId(), AclPermission.MANAGE_USER_GROUPS))
                .block();
        String resourceTypeRole = auditLogService.getResourceType(createdUserGroup);

        UserGroupUpdateDTO userGroupUpdateDTOSameValues = new UserGroupUpdateDTO();
        userGroupUpdateDTOSameValues.setName(createdUserGroup.getName());
        userGroupUpdateDTOSameValues.setDescription(createdUserGroup.getDescription());
        userGroupUpdateDTOSameValues.setUsers(createdUserGroup.getUsers());

        userGroupService
                .updateProvisionGroup(createdUserGroup.getId(), userGroupUpdateDTOSameValues)
                .block();

        MultiValueMap<String, String> auditLogRequest = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_UPDATED),
                resourceTypeRole,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogList =
                auditLogService.getAuditLogs(auditLogRequest).block();
        assertThat(auditLogList).isEmpty();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAuditLogs_updateProvisionGroup_sendNullName_shouldGenerateNoAuditLogs() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(TRUE));
        String testName = "testAuditLogs_updateProvisionGroup_sendNullName_shouldGenerateNoAuditLogs";

        User user1 = new User();
        user1.setEmail(testName + "_1@appsmith@.com");
        user1.setPassword(testName);
        User createdUser1 = userService.create(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_2@appsmith@.com");
        user2.setPassword(testName);
        User createdUser2 = userService.create(user2).block();

        User user3 = new User();
        user3.setEmail(testName + "_3@appsmith@.com");
        user3.setPassword(testName);
        User createdUser3 = userService.create(user3).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_name");
        userGroup.setDescription(testName + "_description");
        userGroup.setUsers(Set.of(createdUser1.getId(), createdUser2.getId(), createdUser3.getId()));
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO ->
                        userGroupService.findById(userGroupDTO.getId(), AclPermission.MANAGE_USER_GROUPS))
                .block();
        String resourceTypeRole = auditLogService.getResourceType(createdUserGroup);

        UserGroupUpdateDTO userGroupUpdateDTONullName = new UserGroupUpdateDTO();
        userGroupUpdateDTONullName.setDescription(createdUserGroup.getDescription());
        userGroupUpdateDTONullName.setUsers(createdUserGroup.getUsers());

        userGroupService
                .updateProvisionGroup(createdUserGroup.getId(), userGroupUpdateDTONullName)
                .block();

        MultiValueMap<String, String> auditLogRequest = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_UPDATED),
                resourceTypeRole,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogList =
                auditLogService.getAuditLogs(auditLogRequest).block();
        assertThat(auditLogList).isEmpty();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAuditLogs_updateProvisionGroup_sendNullDescription_shouldGenerateNoAuditLogs() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(TRUE));
        String testName = "testAuditLogs_updateProvisionGroup_sendNullDescription_shouldGenerateNoAuditLogs";

        User user1 = new User();
        user1.setEmail(testName + "_1@appsmith@.com");
        user1.setPassword(testName);
        User createdUser1 = userService.create(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_2@appsmith@.com");
        user2.setPassword(testName);
        User createdUser2 = userService.create(user2).block();

        User user3 = new User();
        user3.setEmail(testName + "_3@appsmith@.com");
        user3.setPassword(testName);
        User createdUser3 = userService.create(user3).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_name");
        userGroup.setDescription(testName + "_description");
        userGroup.setUsers(Set.of(createdUser1.getId(), createdUser2.getId(), createdUser3.getId()));
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO ->
                        userGroupService.findById(userGroupDTO.getId(), AclPermission.MANAGE_USER_GROUPS))
                .block();
        String resourceTypeRole = auditLogService.getResourceType(createdUserGroup);

        UserGroupUpdateDTO userGroupUpdateDTONullDescription = new UserGroupUpdateDTO();
        userGroupUpdateDTONullDescription.setName(createdUserGroup.getName());
        userGroupUpdateDTONullDescription.setUsers(createdUserGroup.getUsers());

        userGroupService
                .updateProvisionGroup(createdUserGroup.getId(), userGroupUpdateDTONullDescription)
                .block();

        MultiValueMap<String, String> auditLogRequest = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_UPDATED),
                resourceTypeRole,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogList =
                auditLogService.getAuditLogs(auditLogRequest).block();
        assertThat(auditLogList).isEmpty();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAuditLogs_updateProvisionGroup_sendNullUsersList_shouldGenerateNoAuditLogs() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(TRUE));
        String testName = "testAuditLogs_updateProvisionGroup_sendNullUsersList_shouldGenerateNoAuditLogs";

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(TRUE));

        User user1 = new User();
        user1.setEmail(testName + "_1@appsmith@.com");
        user1.setPassword(testName);
        User createdUser1 = userService.create(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_2@appsmith@.com");
        user2.setPassword(testName);
        User createdUser2 = userService.create(user2).block();

        User user3 = new User();
        user3.setEmail(testName + "_3@appsmith@.com");
        user3.setPassword(testName);
        User createdUser3 = userService.create(user3).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_name");
        userGroup.setDescription(testName + "_description");
        userGroup.setUsers(Set.of(createdUser1.getId(), createdUser2.getId(), createdUser3.getId()));
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO ->
                        userGroupService.findById(userGroupDTO.getId(), AclPermission.MANAGE_USER_GROUPS))
                .block();
        String resourceTypeRole = auditLogService.getResourceType(createdUserGroup);

        UserGroupUpdateDTO userGroupUpdateDTONullUsers = new UserGroupUpdateDTO();
        userGroupUpdateDTONullUsers.setName(createdUserGroup.getName());
        userGroupUpdateDTONullUsers.setDescription(createdUserGroup.getDescription());

        userGroupService
                .updateProvisionGroup(createdUserGroup.getId(), userGroupUpdateDTONullUsers)
                .block();

        MultiValueMap<String, String> auditLogRequest = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_UPDATED),
                resourceTypeRole,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogList =
                auditLogService.getAuditLogs(auditLogRequest).block();
        assertThat(auditLogList).isEmpty();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAuditLogs_updateProvisionGroup_sendNameUpdate_shouldGenerateGroupUpdateAuditLog() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(TRUE));
        String testName = "testAuditLogs_updateProvisionGroup_sendNameUpdate_shouldGenerateGroupUpdateAuditLog";

        User user1 = new User();
        user1.setEmail(testName + "_1@appsmith@.com");
        user1.setPassword(testName);
        User createdUser1 = userService.create(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_2@appsmith@.com");
        user2.setPassword(testName);
        User createdUser2 = userService.create(user2).block();

        User user3 = new User();
        user3.setEmail(testName + "_3@appsmith@.com");
        user3.setPassword(testName);
        User createdUser3 = userService.create(user3).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_name");
        userGroup.setDescription(testName + "_description");
        userGroup.setUsers(Set.of(createdUser1.getId(), createdUser2.getId(), createdUser3.getId()));
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO ->
                        userGroupService.findById(userGroupDTO.getId(), AclPermission.MANAGE_USER_GROUPS))
                .block();
        String resourceTypeRole = auditLogService.getResourceType(createdUserGroup);

        UserGroupUpdateDTO userGroupUpdateDTOSendNameUpdate = new UserGroupUpdateDTO();
        userGroupUpdateDTOSendNameUpdate.setName(createdUserGroup.getName() + "_updated");

        userGroupService
                .updateProvisionGroup(createdUserGroup.getId(), userGroupUpdateDTOSendNameUpdate)
                .block();

        MultiValueMap<String, String> auditLogRequest = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_UPDATED),
                resourceTypeRole,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogList =
                auditLogService.getAuditLogs(auditLogRequest).block();

        assertThat(auditLogList).isNotEmpty();
        AuditLog auditLog = auditLogList.get(0);

        assertThat(auditLog.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_UPDATED));
        assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLog.getResource()).isNotNull();
        assertThat(auditLog.getMetadata()).isNotNull();
        assertThat(auditLog.getUser()).isNotNull();
        assertThat(auditLog.getGroup()).isNull();
        assertThat(auditLog.getWorkspace()).isNull();
        assertThat(auditLog.getApplication()).isNull();
        assertThat(auditLog.getRole()).isNull();
        assertThat(auditLog.getPage()).isNull();

        AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
        assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResource = auditLog.getResource();
        assertThat(auditLogResource.getType()).isEqualTo("Group");
        assertThat(auditLogResource.getId()).isEqualTo(createdUserGroup.getId());
        assertThat(auditLogResource.getName()).isEqualTo(createdUserGroup.getName() + "_updated");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            testAuditLogs_updateProvisionGroup_sendAdditionalUserIdInList_shouldGenerateUserInvitedToGroupAuditLog() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(TRUE));
        String testName =
                "testAuditLogs_updateProvisionGroup_sendAdditionalUserIdInList_shouldGenerateUserInvitedToGroupAuditLog";

        User user1 = new User();
        user1.setEmail(testName + "_1@appsmith@.com");
        user1.setPassword(testName);
        User createdUser1 = userService.create(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_2@appsmith@.com");
        user2.setPassword(testName);
        User createdUser2 = userService.create(user2).block();

        User user3 = new User();
        user3.setEmail(testName + "_3@appsmith@.com");
        user3.setPassword(testName);
        User createdUser3 = userService.create(user3).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_name");
        userGroup.setDescription(testName + "_description");
        userGroup.setUsers(Set.of(createdUser1.getId(), createdUser2.getId()));
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO ->
                        userGroupService.findById(userGroupDTO.getId(), AclPermission.MANAGE_USER_GROUPS))
                .block();
        String resourceTypeRole = auditLogService.getResourceType(createdUserGroup);

        UserGroupUpdateDTO userGroupUpdateDTOSendAdditionalUser = new UserGroupUpdateDTO();
        userGroupUpdateDTOSendAdditionalUser.setUsers(
                Set.of(createdUser1.getId(), createdUser2.getId(), createdUser3.getId()));

        userGroupService
                .updateProvisionGroup(createdUserGroup.getId(), userGroupUpdateDTOSendAdditionalUser)
                .block();

        MultiValueMap<String, String> auditLogRequest = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_INVITE_USERS),
                resourceTypeRole,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogList =
                auditLogService.getAuditLogs(auditLogRequest).block();

        assertThat(auditLogList).isNotEmpty();
        AuditLog auditLog = auditLogList.get(0);

        assertThat(auditLog.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_INVITE_USERS));
        assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLog.getResource()).isNotNull();
        assertThat(auditLog.getMetadata()).isNotNull();
        assertThat(auditLog.getUser()).isNotNull();
        assertThat(auditLog.getGroup()).isNotNull();
        assertThat(auditLog.getWorkspace()).isNull();
        assertThat(auditLog.getApplication()).isNull();
        assertThat(auditLog.getRole()).isNull();
        assertThat(auditLog.getPage()).isNull();

        AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
        assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResource = auditLog.getResource();
        assertThat(auditLogResource.getType()).isEqualTo("Group");
        assertThat(auditLogResource.getId()).isEqualTo(createdUserGroup.getId());
        assertThat(auditLogResource.getName()).isEqualTo(createdUserGroup.getName());

        AuditLogUserGroupMetadata userGroupMetadata = auditLog.getGroup();
        assertThat(userGroupMetadata.getInvitedUsers()).hasSize(1);
        userGroupMetadata.getInvitedUsers().forEach(invitedUser -> assertThat(Set.of(createdUser3.getEmail()))
                .contains(invitedUser));
        assertThat(userGroupMetadata.getRemovedUsers()).isNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            testAuditLogs_updateProvisionGroup_sendOneUserLessUserIdInList_shouldGenerateUserRemovedFromGroupAuditLog() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(TRUE));
        String testName =
                "testAuditLogs_updateProvisionGroup_sendOneUserLessUserIdInList_shouldGenerateUserRemovedFromGroupAuditLog";

        User user1 = new User();
        user1.setEmail(testName + "_1@appsmith@.com");
        user1.setPassword(testName);
        User createdUser1 = userService.create(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_2@appsmith@.com");
        user2.setPassword(testName);
        User createdUser2 = userService.create(user2).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_name");
        userGroup.setDescription(testName + "_description");
        userGroup.setUsers(Set.of(createdUser1.getId(), createdUser2.getId()));
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO ->
                        userGroupService.findById(userGroupDTO.getId(), AclPermission.MANAGE_USER_GROUPS))
                .block();
        String resourceTypeRole = auditLogService.getResourceType(createdUserGroup);

        UserGroupUpdateDTO userGroupUpdateDTOSendAdditionalUser = new UserGroupUpdateDTO();
        userGroupUpdateDTOSendAdditionalUser.setUsers(Set.of(createdUser1.getId()));

        userGroupService
                .updateProvisionGroup(createdUserGroup.getId(), userGroupUpdateDTOSendAdditionalUser)
                .block();

        MultiValueMap<String, String> auditLogRequest = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_REMOVE_USERS),
                resourceTypeRole,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogList =
                auditLogService.getAuditLogs(auditLogRequest).block();

        assertThat(auditLogList).isNotEmpty();
        AuditLog auditLog = auditLogList.get(0);

        assertThat(auditLog.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_REMOVE_USERS));
        assertThat(auditLog.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLog.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLog.getResource()).isNotNull();
        assertThat(auditLog.getMetadata()).isNotNull();
        assertThat(auditLog.getUser()).isNotNull();
        assertThat(auditLog.getGroup()).isNotNull();
        assertThat(auditLog.getWorkspace()).isNull();
        assertThat(auditLog.getApplication()).isNull();
        assertThat(auditLog.getRole()).isNull();
        assertThat(auditLog.getPage()).isNull();

        AuditLogMetadata auditLogMetadata = auditLog.getMetadata();
        assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResource = auditLog.getResource();
        assertThat(auditLogResource.getType()).isEqualTo("Group");
        assertThat(auditLogResource.getId()).isEqualTo(createdUserGroup.getId());
        assertThat(auditLogResource.getName()).isEqualTo(createdUserGroup.getName());

        AuditLogUserGroupMetadata userGroupMetadata = auditLog.getGroup();
        assertThat(userGroupMetadata.getRemovedUsers()).hasSize(1);
        userGroupMetadata.getRemovedUsers().forEach(removedUser -> assertThat(Set.of(createdUser2.getEmail()))
                .contains(removedUser));
        assertThat(userGroupMetadata.getInvitedUsers()).isNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            testAuditLogs_updateProvisionGroup_updateNameAndListOfUsers_shouldGenerateUpdateUserGroupUserInvitedToGroupUserRemovedFromGroupAuditLog() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(TRUE));
        String testName =
                "testAuditLogs_updateProvisionGroup_updateNameAndListOfUsers_shouldGenerateUpdateUserGroupUserInvitedToGroupUserRemovedFromGroupAuditLog";

        User user1 = new User();
        user1.setEmail(testName + "_1@appsmith@.com");
        user1.setPassword(testName);
        User createdUser1 = userService.create(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_2@appsmith@.com");
        user2.setPassword(testName);
        User createdUser2 = userService.create(user2).block();

        User user3 = new User();
        user3.setEmail(testName + "_3@appsmith@.com");
        user3.setPassword(testName);
        User createdUser3 = userService.create(user3).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_name");
        userGroup.setDescription(testName + "_description");
        userGroup.setUsers(Set.of(createdUser1.getId(), createdUser2.getId()));
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO ->
                        userGroupService.findById(userGroupDTO.getId(), AclPermission.MANAGE_USER_GROUPS))
                .block();
        String resourceTypeRole = auditLogService.getResourceType(createdUserGroup);

        UserGroupUpdateDTO userGroupUpdateDTO = new UserGroupUpdateDTO();
        userGroupUpdateDTO.setName(createdUserGroup.getName() + "_updated");
        userGroupUpdateDTO.setUsers(Set.of(createdUser1.getId(), createdUser3.getId()));

        userGroupService
                .updateProvisionGroup(createdUserGroup.getId(), userGroupUpdateDTO)
                .block();

        MultiValueMap<String, String> auditLogRequestGroupUpdated = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_UPDATED),
                resourceTypeRole,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogListGroupUpdated =
                auditLogService.getAuditLogs(auditLogRequestGroupUpdated).block();

        assertThat(auditLogListGroupUpdated).isNotEmpty();
        AuditLog auditLogGroupUpdated = auditLogListGroupUpdated.get(0);

        assertThat(auditLogGroupUpdated.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_UPDATED));
        assertThat(auditLogGroupUpdated.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogGroupUpdated.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogGroupUpdated.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogGroupUpdated.getResource()).isNotNull();
        assertThat(auditLogGroupUpdated.getMetadata()).isNotNull();
        assertThat(auditLogGroupUpdated.getUser()).isNotNull();
        assertThat(auditLogGroupUpdated.getGroup()).isNull();
        assertThat(auditLogGroupUpdated.getWorkspace()).isNull();
        assertThat(auditLogGroupUpdated.getApplication()).isNull();
        assertThat(auditLogGroupUpdated.getRole()).isNull();
        assertThat(auditLogGroupUpdated.getPage()).isNull();

        AuditLogMetadata auditLogMetadata = auditLogGroupUpdated.getMetadata();
        assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResource = auditLogGroupUpdated.getResource();
        assertThat(auditLogResource.getType()).isEqualTo("Group");
        assertThat(auditLogResource.getId()).isEqualTo(createdUserGroup.getId());
        assertThat(auditLogResource.getName()).isEqualTo(createdUserGroup.getName() + "_updated");

        MultiValueMap<String, String> auditLogInviteUserToGroupRequest = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_INVITE_USERS),
                resourceTypeRole,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogInviteUserToGroupList =
                auditLogService.getAuditLogs(auditLogInviteUserToGroupRequest).block();

        assertThat(auditLogInviteUserToGroupList).isNotEmpty();
        AuditLog auditLogInviteUserToGroup = auditLogInviteUserToGroupList.get(0);

        assertThat(auditLogInviteUserToGroup.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_INVITE_USERS));
        assertThat(auditLogInviteUserToGroup.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogInviteUserToGroup.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogInviteUserToGroup.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogInviteUserToGroup.getResource()).isNotNull();
        assertThat(auditLogInviteUserToGroup.getMetadata()).isNotNull();
        assertThat(auditLogInviteUserToGroup.getUser()).isNotNull();
        assertThat(auditLogInviteUserToGroup.getGroup()).isNotNull();
        assertThat(auditLogInviteUserToGroup.getWorkspace()).isNull();
        assertThat(auditLogInviteUserToGroup.getApplication()).isNull();
        assertThat(auditLogInviteUserToGroup.getRole()).isNull();
        assertThat(auditLogInviteUserToGroup.getPage()).isNull();

        AuditLogMetadata auditLogMetadata1 = auditLogInviteUserToGroup.getMetadata();
        assertThat(auditLogMetadata1.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResource1 = auditLogInviteUserToGroup.getResource();
        assertThat(auditLogResource1.getType()).isEqualTo("Group");
        assertThat(auditLogResource1.getId()).isEqualTo(createdUserGroup.getId());
        assertThat(auditLogResource1.getName()).isEqualTo(createdUserGroup.getName() + "_updated");

        AuditLogUserGroupMetadata userGroupMetadata1 = auditLogInviteUserToGroup.getGroup();
        assertThat(userGroupMetadata1.getInvitedUsers()).hasSize(1);
        userGroupMetadata1.getInvitedUsers().forEach(invitedUser -> assertThat(Set.of(createdUser3.getEmail()))
                .contains(invitedUser));
        assertThat(userGroupMetadata1.getRemovedUsers()).isNull();

        MultiValueMap<String, String> auditLogRequestRemoveUserFromGroup = getAuditLogRequest(
                null,
                auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_REMOVE_USERS),
                resourceTypeRole,
                createdUserGroup.getId(),
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogListRemoveUserFromGroup =
                auditLogService.getAuditLogs(auditLogRequestRemoveUserFromGroup).block();

        assertThat(auditLogListRemoveUserFromGroup).isNotEmpty();
        AuditLog auditLogRemoveUserFromGroup = auditLogListRemoveUserFromGroup.get(0);

        assertThat(auditLogRemoveUserFromGroup.getEvent())
                .isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.GROUP_REMOVE_USERS));
        assertThat(auditLogRemoveUserFromGroup.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogRemoveUserFromGroup.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogRemoveUserFromGroup.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogRemoveUserFromGroup.getResource()).isNotNull();
        assertThat(auditLogRemoveUserFromGroup.getMetadata()).isNotNull();
        assertThat(auditLogRemoveUserFromGroup.getUser()).isNotNull();
        assertThat(auditLogRemoveUserFromGroup.getGroup()).isNotNull();
        assertThat(auditLogRemoveUserFromGroup.getWorkspace()).isNull();
        assertThat(auditLogRemoveUserFromGroup.getApplication()).isNull();
        assertThat(auditLogRemoveUserFromGroup.getRole()).isNull();
        assertThat(auditLogRemoveUserFromGroup.getPage()).isNull();

        AuditLogMetadata auditLogMetadata2 = auditLogRemoveUserFromGroup.getMetadata();
        assertThat(auditLogMetadata2.getAppsmithVersion()).isNotEmpty();

        AuditLogResource auditLogResource2 = auditLogRemoveUserFromGroup.getResource();
        assertThat(auditLogResource2.getType()).isEqualTo("Group");
        assertThat(auditLogResource2.getId()).isEqualTo(createdUserGroup.getId());
        assertThat(auditLogResource2.getName()).isEqualTo(createdUserGroup.getName() + "_updated");

        AuditLogUserGroupMetadata userGroupMetadata2 = auditLogRemoveUserFromGroup.getGroup();
        assertThat(userGroupMetadata2.getRemovedUsers()).hasSize(1);
        userGroupMetadata2.getRemovedUsers().forEach(removedUser -> assertThat(Set.of(createdUser2.getEmail()))
                .contains(removedUser));
        assertThat(userGroupMetadata2.getInvitedUsers()).isNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAuditLogs_workflowCreateOperation() {
        String testName = "testAuditLogs_workflowCreateOperation";
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_workflows_enabled))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Workspace workspaceToCreate = new Workspace();
        workspaceToCreate.setName("Workspace - " + testName);
        Workspace createdWorkspace = workspaceService.create(workspaceToCreate).block();
        Workflow workflowToCreate = new Workflow();
        workflowToCreate.setName("Workflow - " + testName);
        Workflow createdWorkflow = crudWorkflowService
                .createWorkflow(workflowToCreate, workspaceToCreate.getId())
                .block();

        String workflowId = createdWorkflow.getId();
        String resourceTypeRole = auditLogService.getResourceType(createdWorkflow);
        String createWorkflowEvent = auditLogService.getAuditLogEventName(AuditLogEvents.Events.WORKFLOW_CREATED);

        MultiValueMap<String, String> auditLogRequestCreateWorkflow = getAuditLogRequest(
                null, createWorkflowEvent, resourceTypeRole, workflowId, null, null, null, null, null);

        List<AuditLog> auditLogsCreateWorkflow =
                auditLogService.getAuditLogs(auditLogRequestCreateWorkflow).block();

        assertThat(auditLogsCreateWorkflow).isNotEmpty();
        AuditLog auditLogCreateWorkflow = auditLogsCreateWorkflow.get(0);

        assertThat(auditLogCreateWorkflow.getEvent()).isEqualTo(createWorkflowEvent);
        assertThat(auditLogCreateWorkflow.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogCreateWorkflow.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogCreateWorkflow.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogCreateWorkflow.getResource()).isNotNull();
        AuditLogResource auditLogResource = auditLogCreateWorkflow.getResource();
        assertThat(auditLogResource.getType()).isEqualTo(Workflow.class.getSimpleName());
        assertThat(auditLogResource.getId()).isEqualTo(createdWorkflow.getId());
        assertThat(auditLogResource.getName()).isEqualTo(createdWorkflow.getName());

        assertThat(auditLogCreateWorkflow.getMetadata()).isNotNull();
        AuditLogMetadata auditLogMetadata = auditLogCreateWorkflow.getMetadata();
        assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

        assertThat(auditLogCreateWorkflow.getWorkspace()).isNotNull();
        AuditLogWorkspaceMetadata auditLogWorkspace = auditLogCreateWorkflow.getWorkspace();
        assertThat(auditLogWorkspace.getId()).isEqualTo(createdWorkspace.getId());
        assertThat(auditLogWorkspace.getName()).isEqualTo(createdWorkspace.getName());

        assertThat(auditLogCreateWorkflow.getUser()).isNotNull();
        AuditLogUserMetadata auditLogUser = auditLogCreateWorkflow.getUser();
        assertThat(auditLogUser.getEmail()).isEqualTo("api_user");

        assertThat(auditLogCreateWorkflow.getGroup()).isNull();
        assertThat(auditLogCreateWorkflow.getApplication()).isNull();
        assertThat(auditLogCreateWorkflow.getRole()).isNull();
        assertThat(auditLogCreateWorkflow.getPage()).isNull();

        List<NewAction> actionsInMainJsObject = newActionService
                .findAllJSActionsByCollectionIds(List.of(createdWorkflow.getMainJsObjectId()), null)
                .collectList()
                .block();
        assertThat(actionsInMainJsObject).hasSize(1);

        NewAction actionInMainJsObject = actionsInMainJsObject.get(0);
        String actionIdInMainJsObject = actionInMainJsObject.getId();
        String actionInMainJsObjectResourceTypeRole = auditLogService.getResourceType(actionInMainJsObject);
        String createQueryEvent = auditLogService.getAuditLogEventName(AuditLogEvents.Events.QUERY_CREATED);

        MultiValueMap<String, String> auditLogRequestAction = getAuditLogRequest(
                null,
                createQueryEvent,
                actionInMainJsObjectResourceTypeRole,
                actionIdInMainJsObject,
                null,
                null,
                null,
                null,
                null);

        List<AuditLog> auditLogsAction =
                auditLogService.getAuditLogs(auditLogRequestAction).block();

        assertThat(auditLogsAction).isNotEmpty();
        AuditLog auditLogAction = auditLogsAction.get(0);

        assertThat(auditLogAction.getEvent()).isEqualTo(createQueryEvent);
        assertThat(auditLogAction.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogAction.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogAction.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogAction.getResource()).isNotNull();
        AuditLogResource auditLogResource1 = auditLogAction.getResource();
        assertThat(auditLogResource1.getType()).isEqualTo("Query");
        assertThat(auditLogResource1.getId()).isEqualTo(actionIdInMainJsObject);
        assertThat(auditLogResource1.getName())
                .isEqualTo(actionInMainJsObject.getUnpublishedAction().getName());

        assertThat(auditLogAction.getMetadata()).isNotNull();
        AuditLogMetadata auditLogMetadata1 = auditLogAction.getMetadata();
        assertThat(auditLogMetadata1.getAppsmithVersion()).isNotEmpty();

        assertThat(auditLogAction.getWorkspace()).isNotNull();
        AuditLogWorkspaceMetadata auditLogWorkspace1 = auditLogAction.getWorkspace();
        assertThat(auditLogWorkspace1.getId()).isEqualTo(createdWorkspace.getId());
        assertThat(auditLogWorkspace1.getName()).isEqualTo(createdWorkspace.getName());

        assertThat(auditLogAction.getUser()).isNotNull();
        AuditLogUserMetadata auditLogUser1 = auditLogAction.getUser();
        assertThat(auditLogUser1.getEmail()).isEqualTo("api_user");

        assertThat(auditLogAction.getWorkflow()).isNotNull();
        AuditLogWorkflowMetadata auditLogWorkflow1 = auditLogAction.getWorkflow();
        assertThat(auditLogWorkflow1.getId()).isEqualTo(createdWorkflow.getId());
        assertThat(auditLogWorkflow1.getName()).isEqualTo(createdWorkflow.getName());

        assertThat(auditLogAction.getGroup()).isNull();
        assertThat(auditLogAction.getApplication()).isNull();
        assertThat(auditLogAction.getRole()).isNull();
        assertThat(auditLogAction.getPage()).isNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAuditLog_workflowUpdateOperation() {
        String testName = "testAuditLog_workflowUpdateOperation";
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_workflows_enabled))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Workspace workspaceToCreate = new Workspace();
        workspaceToCreate.setName("Workspace - " + testName);
        Workspace createdWorkspace = workspaceService.create(workspaceToCreate).block();
        Workflow workflowToCreate = new Workflow();
        workflowToCreate.setName("Workflow - " + testName);
        Workflow createdWorkflow = crudWorkflowService
                .createWorkflow(workflowToCreate, workspaceToCreate.getId())
                .block();

        String workflowId = createdWorkflow.getId();
        String resourceTypeRole = auditLogService.getResourceType(createdWorkflow);
        String updateWorkflowEvent = auditLogService.getAuditLogEventName(AuditLogEvents.Events.WORKFLOW_UPDATED);

        Workflow workflowToUpdate = new Workflow();
        workflowToUpdate.setName(createdWorkflow.getName() + "_updated");
        Workflow updatedWorkflow =
                crudWorkflowService.updateWorkflow(workflowToUpdate, workflowId).block();

        MultiValueMap<String, String> auditLogRequestUpdateWorkflow = getAuditLogRequest(
                null, updateWorkflowEvent, resourceTypeRole, workflowId, null, null, null, null, null);

        List<AuditLog> auditLogsUpdateWorkflow =
                auditLogService.getAuditLogs(auditLogRequestUpdateWorkflow).block();

        assertThat(auditLogsUpdateWorkflow).isNotEmpty();
        AuditLog auditLogUpdateWorkflow = auditLogsUpdateWorkflow.get(0);

        assertThat(auditLogUpdateWorkflow.getEvent()).isEqualTo(updateWorkflowEvent);
        assertThat(auditLogUpdateWorkflow.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogUpdateWorkflow.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogUpdateWorkflow.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogUpdateWorkflow.getResource()).isNotNull();
        AuditLogResource auditLogResource = auditLogUpdateWorkflow.getResource();
        assertThat(auditLogResource.getType()).isEqualTo(Workflow.class.getSimpleName());
        assertThat(auditLogResource.getId()).isEqualTo(createdWorkflow.getId());
        assertThat(auditLogResource.getName()).isEqualTo(createdWorkflow.getName() + "_updated");

        assertThat(auditLogUpdateWorkflow.getMetadata()).isNotNull();
        AuditLogMetadata auditLogMetadata = auditLogUpdateWorkflow.getMetadata();
        assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

        assertThat(auditLogUpdateWorkflow.getWorkspace()).isNotNull();
        AuditLogWorkspaceMetadata auditLogWorkspace = auditLogUpdateWorkflow.getWorkspace();
        assertThat(auditLogWorkspace.getId()).isEqualTo(createdWorkspace.getId());
        assertThat(auditLogWorkspace.getName()).isEqualTo(createdWorkspace.getName());

        assertThat(auditLogUpdateWorkflow.getUser()).isNotNull();
        AuditLogUserMetadata auditLogUser = auditLogUpdateWorkflow.getUser();
        assertThat(auditLogUser.getEmail()).isEqualTo("api_user");

        assertThat(auditLogUpdateWorkflow.getGroup()).isNull();
        assertThat(auditLogUpdateWorkflow.getApplication()).isNull();
        assertThat(auditLogUpdateWorkflow.getRole()).isNull();
        assertThat(auditLogUpdateWorkflow.getPage()).isNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAuditLog_workflowDeleteOperation() {
        String testName = "testAuditLog_workflowDeleteOperation";
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_workflows_enabled))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Workspace workspaceToCreate = new Workspace();
        workspaceToCreate.setName("Workspace - " + testName);
        Workspace createdWorkspace = workspaceService.create(workspaceToCreate).block();
        Workflow workflowToCreate = new Workflow();
        workflowToCreate.setName("Workflow - " + testName);
        Workflow createdWorkflow = crudWorkflowService
                .createWorkflow(workflowToCreate, workspaceToCreate.getId())
                .block();

        String workflowId = createdWorkflow.getId();
        String resourceTypeRole = auditLogService.getResourceType(createdWorkflow);
        String deleteWorkflowEvent = auditLogService.getAuditLogEventName(AuditLogEvents.Events.WORKFLOW_DELETED);

        Workflow deletedWorkflow =
                crudWorkflowService.deleteWorkflow(workflowId).block();

        MultiValueMap<String, String> auditLogRequestDeleteWorkflow = getAuditLogRequest(
                null, deleteWorkflowEvent, resourceTypeRole, workflowId, null, null, null, null, null);

        List<AuditLog> auditLogsDeleteWorkflow =
                auditLogService.getAuditLogs(auditLogRequestDeleteWorkflow).block();

        assertThat(auditLogsDeleteWorkflow).isNotEmpty();
        AuditLog auditLogDeleteWorkflow = auditLogsDeleteWorkflow.get(0);

        assertThat(auditLogDeleteWorkflow.getEvent()).isEqualTo(deleteWorkflowEvent);
        assertThat(auditLogDeleteWorkflow.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogDeleteWorkflow.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogDeleteWorkflow.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogDeleteWorkflow.getResource()).isNotNull();
        AuditLogResource auditLogResource = auditLogDeleteWorkflow.getResource();
        assertThat(auditLogResource.getType()).isEqualTo(Workflow.class.getSimpleName());
        assertThat(auditLogResource.getId()).isEqualTo(createdWorkflow.getId());
        assertThat(auditLogResource.getName()).isEqualTo(createdWorkflow.getName());

        assertThat(auditLogDeleteWorkflow.getMetadata()).isNotNull();
        AuditLogMetadata auditLogMetadata = auditLogDeleteWorkflow.getMetadata();
        assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

        assertThat(auditLogDeleteWorkflow.getWorkspace()).isNotNull();
        AuditLogWorkspaceMetadata auditLogWorkspace = auditLogDeleteWorkflow.getWorkspace();
        assertThat(auditLogWorkspace.getId()).isEqualTo(createdWorkspace.getId());
        assertThat(auditLogWorkspace.getName()).isEqualTo(createdWorkspace.getName());

        assertThat(auditLogDeleteWorkflow.getUser()).isNotNull();
        AuditLogUserMetadata auditLogUser = auditLogDeleteWorkflow.getUser();
        assertThat(auditLogUser.getEmail()).isEqualTo("api_user");

        assertThat(auditLogDeleteWorkflow.getGroup()).isNull();
        assertThat(auditLogDeleteWorkflow.getApplication()).isNull();
        assertThat(auditLogDeleteWorkflow.getRole()).isNull();
        assertThat(auditLogDeleteWorkflow.getPage()).isNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAuditLog_workflowDeployOperation() {
        String testName = "testAuditLog_workflowDeployOperation";
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_workflows_enabled))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Workspace workspaceToCreate = new Workspace();
        workspaceToCreate.setName("Workspace - " + testName);
        Workspace createdWorkspace = workspaceService.create(workspaceToCreate).block();
        Workflow workflowToCreate = new Workflow();
        workflowToCreate.setName("Workflow - " + testName);
        Workflow createdWorkflow = crudWorkflowService
                .createWorkflow(workflowToCreate, workspaceToCreate.getId())
                .block();

        String workflowId = createdWorkflow.getId();
        String resourceTypeRole = auditLogService.getResourceType(createdWorkflow);
        String deployWorkflowEvent = auditLogService.getAuditLogEventName(AuditLogEvents.Events.WORKFLOW_DEPLOYED);

        Workflow block =
                interactWorkflowService.publishWorkflow(createdWorkflow.getId()).block();

        MultiValueMap<String, String> auditLogRequestDeployWorkflow = getAuditLogRequest(
                null, deployWorkflowEvent, resourceTypeRole, workflowId, null, null, null, null, null);

        List<AuditLog> auditLogsDeployWorkflow =
                auditLogService.getAuditLogs(auditLogRequestDeployWorkflow).block();

        assertThat(auditLogsDeployWorkflow).isNotEmpty();
        AuditLog auditLogDeployWorkflow = auditLogsDeployWorkflow.get(0);

        assertThat(auditLogDeployWorkflow.getEvent()).isEqualTo(deployWorkflowEvent);
        assertThat(auditLogDeployWorkflow.getTimestamp()).isBefore(Instant.now());
        assertThat(auditLogDeployWorkflow.getCreatedAt()).isBefore(Instant.now());
        assertThat(auditLogDeployWorkflow.getOrigin()).isEqualTo(FieldName.AUDIT_LOGS_ORIGIN_SERVER);

        assertThat(auditLogDeployWorkflow.getResource()).isNotNull();
        AuditLogResource auditLogResource = auditLogDeployWorkflow.getResource();
        assertThat(auditLogResource.getType()).isEqualTo(Workflow.class.getSimpleName());
        assertThat(auditLogResource.getId()).isEqualTo(createdWorkflow.getId());
        assertThat(auditLogResource.getName()).isEqualTo(createdWorkflow.getName());

        assertThat(auditLogDeployWorkflow.getMetadata()).isNotNull();
        AuditLogMetadata auditLogMetadata = auditLogDeployWorkflow.getMetadata();
        assertThat(auditLogMetadata.getAppsmithVersion()).isNotEmpty();

        assertThat(auditLogDeployWorkflow.getWorkspace()).isNotNull();
        AuditLogWorkspaceMetadata auditLogWorkspace = auditLogDeployWorkflow.getWorkspace();
        assertThat(auditLogWorkspace.getId()).isEqualTo(createdWorkspace.getId());
        assertThat(auditLogWorkspace.getName()).isEqualTo(createdWorkspace.getName());

        assertThat(auditLogDeployWorkflow.getUser()).isNotNull();
        AuditLogUserMetadata auditLogUser = auditLogDeployWorkflow.getUser();
        assertThat(auditLogUser.getEmail()).isEqualTo("api_user");

        assertThat(auditLogDeployWorkflow.getGroup()).isNull();
        assertThat(auditLogDeployWorkflow.getApplication()).isNull();
        assertThat(auditLogDeployWorkflow.getRole()).isNull();
        assertThat(auditLogDeployWorkflow.getPage()).isNull();
    }
}
