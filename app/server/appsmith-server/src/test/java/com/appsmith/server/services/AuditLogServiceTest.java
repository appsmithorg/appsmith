package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.external.models.WidgetSuggestionDTO;
import com.appsmith.external.models.WidgetType;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.AuditLogConstants;
import com.appsmith.server.constants.AuditLogEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.AuditLogFilterDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.helpers.WidgetSuggestionHelper;
import com.appsmith.server.repositories.AuditLogRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.ApplicationForkingService;
import com.appsmith.server.solutions.EnvManager;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.UserSignup;
import org.apache.commons.lang.StringUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GITHUB_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GOOGLE_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_OIDC_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_OIDC_CLIENT_SECRET;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SSO_SAML_ENABLED;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;


@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
public class AuditLogServiceTest {
    /**
     * Temporarily using configuration value to control logging.
     * This will help us continuously ship code without affecting production instances.
     * TODO: Remove this once the feature is fully ready to ship.
     */
    @Value("${appsmith.auditlog.enabled:false}")
    private boolean isAuditLogEnabled;
    @Autowired
    AuditLogService auditLogService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ImportExportApplicationService importExportApplicationService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    ApplicationForkingService applicationForkingService;

    @Autowired
    AuditLogRepository auditLogRepository;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    NewActionService newActionService;

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

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginExecutor pluginExecutor;

    private static String workspaceId;
    private static Application app;
    private static Application gitConnectedApp;
    private static String workspaceName = "AuditLogsTest";

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() throws IOException {

        // Run the tests only if Audit Logs is enabled on the instance
        assumeTrue(isAuditLogEnabled);

        // If the env file does not exist NoSuchFileException will be thrown from some of the test cases
        // We create empty file to handle this situation primarily in CI
        Path envFilePath = Path.of(commonConfig.getEnvFilePath());
        if (!Files.exists(envFilePath)) {
            Files.createFile(envFilePath);
        }

        if (StringUtils.isEmpty(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName(workspaceName);

            if (!org.springframework.util.StringUtils.hasLength(workspaceId)) {
                Workspace workspace = workspaceService.create(toCreate, apiUser).block();
                workspaceId = workspace.getId();
            }

            // Make api_user super user as AuditLogs are accessible for super users only
            User api_user = userRepository.findByEmail("api_user").block();
            userUtils.makeSuperUser(List.of(api_user)).block();

            app = createApp("testApp").block();
            gitConnectedApp = createGitConnectedApp("getAuditLogs_withNoFilters_Success_git", "master").block();
        }
    }

    private FilePart createFilePart(String filePath) {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(
                        new ClassPathResource(filePath),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filepart;

    }

    private Mono<Application> createApp(String name) {
        Application application = new Application();
        application.setName(name);
        application.setWorkspaceId(workspaceId);
        return applicationPageService.createApplication(application)
                .flatMap(application1 -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application1.getId());
                    return applicationPageService.createPage(page)
                            .thenReturn(application1);
                });
    }

    private Mono<Application> createGitConnectedApp(String name, String branchName) {
        Application application = new Application();
        application.setName(name);
        application.setWorkspaceId(workspaceId);
        return applicationPageService.createApplication(application)
                .flatMap(application1 -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application1.getId());
                    return applicationPageService.createPage(page)
                            .thenReturn(application1);
                })
                .flatMap(application1 -> {
                    GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
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
                .map(events -> events.name().toLowerCase().replaceFirst("_", ".")).collect(Collectors.toList());

        Mono<AuditLogFilterDTO> auditLogFilter = auditLogService.getAuditLogFilterData();

        StepVerifier
                .create(auditLogFilter)
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

        StepVerifier
                .create(usersMono)
                .assertNext(users -> {
                    assertThat(users).containsAll(List.of("api_user", "anonymousUser"));
                })
                .verifyComplete();
    }

    private MultiValueMap<String, String> getAuditLogRequest(String emails, String events, String resourceType, String resourceId, String sortOrder, String cursor, String numberOfDays) {
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
        return params;
    }

    // Default sorting is Desc order
    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withNoFilters_Success() {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();

        StepVerifier
                .create(auditLogService.get(params))
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
        Workspace updatedWorkspace = workspaceService.update(createdWorkspace.getId(), updateWorkspace).block();
        workspaceService.archiveById(createdWorkspace.getId()).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, null, resourceType, createdWorkspace.getId(), "1", null, null);
        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.size()).isEqualTo(3);
                    // Validate each events
                    assertThat(auditLogs.get(0).getEvent()).isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.WORKSPACE_CREATED));
                    assertThat(auditLogs.get(0).getResource().getName()).isEqualTo(workspace.getName());

                    assertThat(auditLogs.get(1).getEvent()).isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.WORKSPACE_UPDATED));
                    assertThat(auditLogs.get(1).getResource().getName()).isEqualTo(updateWorkspace.getName());

                    assertThat(auditLogs.get(2).getEvent()).isEqualTo(auditLogService.getAuditLogEventName(AuditLogEvents.Events.WORKSPACE_DELETED));
                    assertThat(auditLogs.get(2).getResource().getName()).isEqualTo(updatedWorkspace.getName());

                    // Validate time difference and common properties
                    for (int i = 1; i < auditLogs.size(); i++) {
                        assertThat(auditLogs.get(i).getResource().getType()).isEqualTo(auditLogService.getResourceType(new Workspace()));
                        assertThat(auditLogs.get(i).getResource().getId()).isEqualTo(createdWorkspace.getId());
                        assertThat(auditLogs.get(i).getTimestamp()).isAfterOrEqualTo(auditLogs.get(i - 1).getTimestamp());
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withEventType_Success() {
        MultiValueMap<String, String> params = getAuditLogRequest(null, "workspace.created", null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.size()).isNotEqualTo(0);
                    for (AuditLog log : auditLogs) {
                        assertThat(log.getEvent()).isEqualTo(AuditLogEvents.Events.WORKSPACE_CREATED.toString().toLowerCase().replace("_", "."));
                        assertThat(log.getResource().getType()).isEqualTo(auditLogService.getResourceType(new Workspace()));
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withResourceId_Success() {
        MultiValueMap<String, String> params = getAuditLogRequest(null, "page.created", null, null, null, null, null);

        List<AuditLog> auditLogList = auditLogService.get(params).block();
        String resourceId = auditLogList.get(0).getResource().getId();

        params = getAuditLogRequest(null, null, null, resourceId, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    for (AuditLog log : auditLogs) {
                        assertThat(log.getResource().getType()).isEqualTo(auditLogService.getResourceType(new NewPage()));
                        assertThat(log.getResource().getId()).isEqualTo(resourceId);
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withSingleAndOrMultipleUserEmails_Success() {
        MultiValueMap<String, String> params = getAuditLogRequest(null, "page.updated", null, null, null, null, null);

        AuditLog auditLog = auditLogService.get(params).block().get(0);
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

        params = getAuditLogRequest("test@appsmith.com", null, null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    for (AuditLog auditLog1 : auditLogs) {
                        assertThat(auditLog1.getUser().getEmail()).isEqualTo("test@appsmith.com");
                    }
                })
                .verifyComplete();

        params = getAuditLogRequest("test@appsmith.com,test@test.com", null, null, null, null, null, null);
        StepVerifier
                .create(auditLogService.get(params))
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
        MultiValueMap<String, String> params = getAuditLogRequest("test@appsmith.com", null, null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.size()).isEqualTo(0);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAuditLogs_withAllFilters_Success() {
        MultiValueMap<String, String> params = getAuditLogRequest(null, "page.updated", null, null, null, null, null);

        // Add events for different user
        AuditLog auditLog = auditLogService.get(params).block().get(0);
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

        params = getAuditLogRequest("api_user,test@appsmith.com", "page.updated", null, null, null, null, "1");

        StepVerifier
                .create(auditLogService.get(params))
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

        StepVerifier
                .create(logMono)
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

        StepVerifier
                .create(logMono)
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
                    assertThat(auditLogs.getResource().getType()).isEqualTo(auditLogService.getResourceType(new Application()));
                })
                .verifyComplete();
    }

    //Test case to validate workspace created audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_workspaceCreated_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String resourceType = auditLogService.getResourceType(workspace);

        MultiValueMap<String, String> params = getAuditLogRequest(null, "workspace.created", resourceType, createdWorkspace.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("workspace.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(workspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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

    //Test case to validate workspace updated audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_workspaceUpdated_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String resourceType = auditLogService.getResourceType(workspace);

        Workspace updateWorkspace = new Workspace();
        updateWorkspace.setName("AuditLogWorkspaceUpdated");
        Workspace updatedWorkspace = workspaceService.update(createdWorkspace.getId(), updateWorkspace).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "workspace.updated", resourceType, createdWorkspace.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("workspace.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(updatedWorkspace.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(updatedWorkspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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

    //Test case to validate workspace deleted audit log event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_workspaceDeleted_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String resourceType = auditLogService.getResourceType(workspace);

        Workspace deletedWorkspace = workspaceService.archiveById(workspace.getId()).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "workspace.deleted", resourceType, createdWorkspace.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("workspace.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(deletedWorkspace.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(workspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();
        String resourceType = auditLogService.getResourceType(application);

        MultiValueMap<String, String> params = getAuditLogRequest(null, "application.created", resourceType, createdApplication.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();
        String resourceType = auditLogService.getResourceType(application);

        application.setName("AuditLogApplicationUpdated");
        Application updatedApplication = applicationService.update(application.getId(), application).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "application.updated", resourceType, createdApplication.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();
        String resourceType = auditLogService.getResourceType(application);

        Application deletedApplication = applicationPageService.deleteApplication(createdApplication.getId()).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "application.deleted", resourceType, createdApplication.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String resourceType = auditLogService.getResourceType(new Application());

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application.json");
        ApplicationImportDTO applicationImportDTO = importExportApplicationService.extractFileAndSaveApplication(createdWorkspace.getId(), filePart).block();
        Application createdApplication = applicationImportDTO.getApplication();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "application.imported", resourceType, createdApplication.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.imported");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();
        String resourceType = auditLogService.getResourceType(application);

        ApplicationJson applicationJSon = importExportApplicationService.exportApplicationById(createdApplication.getId(), "").block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "application.exported", resourceType, createdApplication.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.exported");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();
        String resourceType = auditLogService.getResourceType(application);

        Application clonedApplication = applicationPageService.cloneApplication(createdApplication.getId(), "").block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "application.cloned", resourceType, clonedApplication.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.cloned");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Workspace createdDestinationWorkspace = workspaceService.create(destinationWorkspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();
        String resourceType = auditLogService.getResourceType(application);

        Application forkedApplication = applicationForkingService.forkApplicationToWorkspace(createdApplication.getId(), createdDestinationWorkspace.getId()).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "application.forked", resourceType, forkedApplication.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.forked");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(forkedApplication.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(forkedApplication.getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());

                    // Destination workspace validation
                    assertThat(auditLog.getWorkspace().getDestination().getId()).isEqualTo(createdDestinationWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getDestination().getName()).isEqualTo(destinationWorkspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();
        String resourceType = auditLogService.getResourceType(application);

        Application forkedApplication = applicationForkingService.forkApplicationToWorkspace(createdApplication.getId(), createdWorkspace.getId()).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "application.forked", resourceType, forkedApplication.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.forked");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(forkedApplication.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(forkedApplication.getName());
                    assertThat(auditLog.getResource().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());

                    // Destination workspace validation
                    assertThat(auditLog.getWorkspace().getDestination().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getDestination().getName()).isEqualTo(createdWorkspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();
        String resourceType = auditLogService.getResourceType(application);

        Application deployedApplication = applicationPageService.publish(createdApplication.getId(), null, true).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "application.deployed", resourceType, createdApplication.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // Since application will be deployed automatically when it is created, there will be two deploy events
                    // We are specifically looking for the second event which is the deployment triggered by the test case
                    assertThat(auditLogs.size()).isEqualTo(2);
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("application.deployed");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        //Set the page policies
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
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        // For testing public visibility of the application
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        applicationService.changeViewAccess(createdApplication.getId(), applicationAccessDTO).block();

        PageDTO pageDTO = createNewPage("AuditLogPage", createdApplication).block();
        applicationPageService.addPageToApplication(createdApplication, pageDTO, false).block();

        String resourceType = auditLogService.getResourceType(new NewPage());

        MultiValueMap<String, String> params = getAuditLogRequest(null, "page.created", resourceType, pageDTO.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("page.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(pageDTO.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(pageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PUBLIC);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        PageDTO pageDTO = createNewPage("AuditLogPage", createdApplication).block();
        applicationPageService.addPageToApplication(createdApplication, pageDTO, false).block();

        String resourceType = auditLogService.getResourceType(new NewPage());

        NewPage newPage = newPageService.getById(pageDTO.getId()).block();
        newPage.getUnpublishedPage().setName("AuditLogPageUpdated");
        NewPage updatedPage = newPageService.update(newPage.getId(), newPage).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "page.updated", resourceType, pageDTO.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // Since page will be updated automatically when it is created, there will be two updated events
                    // We are specifically looking for the second event which is the update triggered by the test case
                    assertThat(auditLogs.size()).isEqualTo(1);
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("page.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(pageDTO.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(newPage.getUnpublishedPage().getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        //Update page name multiple times
        ApplicationPage page = app.getPages().get(0);
        PageDTO pageDTO = new PageDTO();
        pageDTO.setName("testUpdate");
        newPageService.updatePage(page.getId(), pageDTO).block();

        pageDTO.setName("testUpdate1");
        newPageService.updatePage(page.getId(), pageDTO).block();

        pageDTO.setName("testUpdate2");
        newPageService.updatePage(page.getId(), pageDTO).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "page.updated", null, page.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.size()).isEqualTo(1);
                    assertThat(auditLogs.get(0).getEvent()).isEqualTo("page.updated");
                    assertThat(auditLogs.get(0).getResource().getId()).isEqualTo(page.getId());
                    assertThat(auditLogs.get(0).getResource().getName()).isEqualTo("testUpdate2");
                })
                .verifyComplete();
    }

    // Test case to validate page view audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_pageView_success() {
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        PageDTO pageDTO = createNewPage("AuditLogPage", createdApplication).block();
        applicationPageService.addPageToApplication(createdApplication, pageDTO, false).block();

        String resourceType = auditLogService.getResourceType(new NewPage());

        applicationPageService.getPageByBranchAndDefaultPageId(createdApplication.getPublishedPages().get(0).getDefaultPageId(), null, true).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "page.viewed", resourceType, createdApplication.getPublishedPages().get(0).getDefaultPageId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("page.viewed");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(createdApplication.getPublishedPages().get(0).getDefaultPageId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        PageDTO pageDTO = createNewPage("AuditLogPage", createdApplication).block();
        applicationPageService.deleteUnpublishedPageByBranchAndDefaultPageId(pageDTO.getId(), null).block();

        String resourceType = auditLogService.getResourceType(new NewPage());

        MultiValueMap<String, String> params = getAuditLogRequest(null, "page.deleted", resourceType, pageDTO.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("page.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(pageDTO.getId());
                    assertThat(auditLog.getResource().getType()).isEqualTo(resourceType);
                    assertThat(auditLog.getResource().getName()).isEqualTo(pageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
     * @return Datasource
     */

    private Datasource createDatasource(String workspaceId) {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource datasource = new Datasource();
        datasource.setName("test db datasource empty");
        datasource.setWorkspaceId(workspaceId);
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
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        String pluginId = pluginRepository.findByPackageName("restapi-plugin").block().getId();
        datasource.setPluginId(pluginId);

        return datasourceService.create(datasource).block();
    }

    // Test case to validate datasource created audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_datasourceCreated_success() {
        Datasource finalDatasource = createDatasource(workspaceId);

        String resourceType = auditLogService.getResourceType(finalDatasource);

        MultiValueMap<String, String> params = getAuditLogRequest(null, "datasource.created", resourceType, finalDatasource.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("datasource.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate datasource updated audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_datasourceUpdated_success() {
        Datasource finalDatasource = createDatasource(workspaceId);
        finalDatasource.setName("updatedDatasource");
        Datasource updatedDatasource = datasourceService.update(finalDatasource.getId(), finalDatasource).block();

        String resourceType = auditLogService.getResourceType(finalDatasource);

        MultiValueMap<String, String> params = getAuditLogRequest(null, "datasource.updated", resourceType, finalDatasource.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("datasource.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
                })
                .verifyComplete();
    }

    // Test case to validate datasource deleted audit log event and contents

    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_datasourceDeleted_success() {
        Datasource finalDatasource = createDatasource(workspaceId);
        Datasource deletedDatasource = datasourceService.archiveById(finalDatasource.getId()).block();

        String resourceType = auditLogService.getResourceType(finalDatasource);

        MultiValueMap<String, String> params = getAuditLogRequest(null, "datasource.deleted", resourceType, finalDatasource.getId(), null, null, null);

        Plugin datasourcePlugin = pluginRepository.findById(deletedDatasource.getPluginId()).block();

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("datasource.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
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

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        PageDTO createdPageDTO = createNewPage("AuditLogPage", createdApplication).block();

        Datasource createdDatasource = createDatasource(createdWorkspace.getId());

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("AuditLogQuery");
        actionDTO.setDatasource(createdDatasource);
        actionDTO.setPluginId(createdDatasource.getPluginId());
        actionDTO.setApplicationId(createdApplication.getId());
        actionDTO.setPageId(createdPageDTO.getId());

        ActionDTO createdActionDTO = layoutActionService.createSingleActionWithBranch(actionDTO, null).block();

        String resourceType = auditLogService.getResourceType(new NewAction());

        MultiValueMap<String, String> params = getAuditLogRequest(null, "query.created", resourceType, createdActionDTO.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        PageDTO createdPageDTO = createNewPage("AuditLogPage", createdApplication).block();

        Datasource createdDatasource = createDatasource(createdWorkspace.getId());

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("AuditLogQuery");
        actionDTO.setDatasource(createdDatasource);
        actionDTO.setPluginId(createdDatasource.getPluginId());
        actionDTO.setApplicationId(createdApplication.getId());
        actionDTO.setPageId(createdPageDTO.getId());

        ActionDTO createdActionDTO = layoutActionService.createSingleActionWithBranch(actionDTO, null).block();

        String resourceType = auditLogService.getResourceType(new NewAction());

        ActionDTO updateActionDTO = new ActionDTO();
        updateActionDTO.setName("AuditLogQueryUpdated");
        ActionDTO updatedActionDTO = layoutActionService.updateAction(createdActionDTO.getId(), updateActionDTO).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "query.updated", resourceType, createdActionDTO.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        //Update page name multiple times

        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        PageDTO createdPageDTO = createNewPage("AuditLogPage", createdApplication).block();

        Datasource createdDatasource = createDatasource(createdWorkspace.getId());

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("AuditLogQuery");
        actionDTO.setDatasource(createdDatasource);
        actionDTO.setPluginId(createdDatasource.getPluginId());
        actionDTO.setApplicationId(createdApplication.getId());
        actionDTO.setPageId(createdPageDTO.getId());

        ActionDTO createdActionDTO = layoutActionService.createSingleActionWithBranch(actionDTO, null).block();

        String resourceType = auditLogService.getResourceType(new NewAction());

        ActionDTO updateActionDTO = new ActionDTO();
        updateActionDTO.setName("AuditLogQueryUpdated");
        ActionDTO updatedActionDTO = layoutActionService.updateAction(createdActionDTO.getId(), updateActionDTO).block();

        updateActionDTO.setName("AuditLogQueryUpdated1");
        updatedActionDTO = layoutActionService.updateAction(createdActionDTO.getId(), updateActionDTO).block();

        updateActionDTO.setName("AuditLogQueryUpdated2");
        updatedActionDTO = layoutActionService.updateAction(createdActionDTO.getId(), updateActionDTO).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "query.updated", resourceType, createdActionDTO.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    assertThat(auditLogs.size()).isEqualTo(1);
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

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        PageDTO createdPageDTO = createNewPage("AuditLogPage", createdApplication).block();

        Datasource createdDatasource = createDatasource(createdWorkspace.getId());

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("AuditLogQuery");
        actionDTO.setDatasource(createdDatasource);
        actionDTO.setPluginId(createdDatasource.getPluginId());
        actionDTO.setApplicationId(createdApplication.getId());
        actionDTO.setPageId(createdPageDTO.getId());

        ActionDTO createdActionDTO = layoutActionService.createSingleActionWithBranch(actionDTO, null).block();

        String resourceType = auditLogService.getResourceType(new NewAction());

        layoutActionService.deleteUnpublishedAction(createdActionDTO.getId()).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "query.deleted", resourceType, createdActionDTO.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.deleted");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

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

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        PageDTO createdPageDTO = createNewPage("AuditLogPage", createdApplication).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database 1");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(createdPageDTO.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        ActionExecutionResult actionExecutionResult = newActionService.executeAction(executeActionDTO).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "query.executed", "Query", createdAction.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.executed");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(executeActionDTO.getActionId());
                    assertThat(auditLog.getResource().getType()).isEqualTo("Query");
                    assertThat(auditLog.getResource().getName()).isEqualTo(action.getName());
                    assertThat(auditLog.getResource().getResponseCode()).isNotNull();
                    assertThat(auditLog.getResource().getResponseTime()).isNotNegative();

                    // Page validation
                    assertThat(auditLog.getPage().getId()).isEqualTo(createdPageDTO.getId());
                    assertThat(auditLog.getPage().getName()).isEqualTo(createdPageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    // TODO: Add Query Execution mode view/edit

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
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

        Application application = new Application();
        application.setName("AuditLogApplication");
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        PageDTO createdPageDTO = createNewPage("AuditLogPage", createdApplication).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("response-body");
        mockResult.setStatusCode("200");

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(WidgetSuggestionHelper.getWidget(WidgetType.TEXT_WIDGET));
        mockResult.setSuggestedWidgets(widgetTypeList);

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(createdPageDTO.getId());
        action.setName("testActionExecutev2");
        action.setDatasource(datasource);
        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId(createdAction.getId());
        executeActionDTO.setViewMode(false);

        ActionExecutionResult actionExecutionResult = newActionService.executeAction(executeActionDTO).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "query.executed", "Query", createdAction.getId(), null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("query.executed");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // Resource validation
                    assertThat(auditLog.getResource().getId()).isEqualTo(executeActionDTO.getActionId());
                    assertThat(auditLog.getResource().getType()).isEqualTo("Query");
                    assertThat(auditLog.getResource().getName()).isEqualTo(action.getName());
                    // TODO: Add checks for executionStatus, responseTime, responseCode

                    // Page validation
                    assertThat(auditLog.getPage().getId()).isEqualTo(createdPageDTO.getId());
                    assertThat(auditLog.getPage().getName()).isEqualTo(createdPageDTO.getName());

                    // Application validation
                    assertThat(auditLog.getApplication().getId()).isEqualTo(createdApplication.getId());
                    assertThat(auditLog.getApplication().getName()).isEqualTo(createdApplication.getName());
                    assertThat(auditLog.getApplication().getVisibility()).isEqualTo(FieldName.PRIVATE);
                    // TODO: Add Query Execution mode view/edit

                    // Workspace validation
                    assertThat(auditLog.getWorkspace().getId()).isEqualTo(createdWorkspace.getId());
                    assertThat(auditLog.getWorkspace().getName()).isEqualTo(workspace.getName());
                    assertThat(auditLog.getWorkspace().getDestination()).isNull();

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotEmpty();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getAuthentication()).isNull();
                    assertThat(auditLog.getInvitedUsers()).isNull();
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
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/login")
                .header("origin", "test").build();
        MockServerWebExchange exchange = MockServerWebExchange.builder(request).session(session).build();

        return userSignup.signupAndLogin(user, exchange)
                .flatMap(user1 -> {
                    // Make user super-user since Audit Logs are only accessible by super-users
                    return userUtils.makeSuperUser(List.of(user1))
                            .thenReturn(user1);
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

        MultiValueMap<String, String> params = getAuditLogRequest(null, "user.signed_up", null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("user.signed_up");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isEqualTo(createdUser.getId());
                    assertThat(auditLog.getUser().getEmail()).isEqualTo(user.getEmail());
                    assertThat(auditLog.getUser().getName()).isEqualTo(user.getName());
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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

        MultiValueMap<String, String> params = getAuditLogRequest(null, "user.logged_in", null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
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
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Workspace workspace = new Workspace();
        workspace.setName("AuditLogWorkspace");

        Workspace createdWorkspace = workspaceService.create(workspace).block();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> invitedUsers = new ArrayList<>();
        invitedUsers.add("auditloguser1@test.com");
        invitedUsers.add("auditloguser2@test.com");
        inviteUsersDTO.setUsernames(invitedUsers);
        inviteUsersDTO.setPermissionGroupId(createdWorkspace.getDefaultPermissionGroups().stream().findFirst().get());

        userService.inviteUsers(inviteUsersDTO, "https://test.com").block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "user.invited", null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("user.invited");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Invited users validation
                    assertThat(auditLog.getInvitedUsers().size()).isEqualTo(invitedUsers.size());
                    assertThat(auditLog.getInvitedUsers().get(0)).isIn(invitedUsers);
                    assertThat(auditLog.getInvitedUsers().get(1)).isIn(invitedUsers);

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
                    assertThat(auditLog.getMetadata().getAppsmithVersion()).isNotEmpty();
                    assertThat(auditLog.getCreatedAt()).isBefore(Instant.now());

                    // Misc. fields validation
                    assertThat(auditLog.getResource()).isNull();
                    assertThat(auditLog.getWorkspace()).isNull();
                    assertThat(auditLog.getApplication()).isNull();
                    assertThat(auditLog.getPage()).isNull();
                    assertThat(auditLog.getAuthentication()).isNull();
                })
                .verifyComplete();
    }


    // Test case to validate instance setting update - GitHubAuth event and contents
    @Test
    @WithUserDetails(value = "api_user")
    public void logEvent_InstanceSettingUpdated_GitHubAuth_success() {
        Map<String, String> emptyEnvChanges = Map.of(
                APPSMITH_OAUTH2_GITHUB_CLIENT_ID.name(), "",
                APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET.name(), ""
        );

        Map<String, String> nonEmptyEnvChanges = Map.of(
                APPSMITH_OAUTH2_GITHUB_CLIENT_ID.name(), "testClientId",
                APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET.name(), "testClientSecret"
        );

        envManager.applyChanges(nonEmptyEnvChanges).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "instance_setting.updated", null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.GITHUB);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Added");

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        envManager.applyChanges(emptyEnvChanges).block();

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.GITHUB);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Removed");

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Map<String, String> emptyEnvChanges = Map.of(
                APPSMITH_OAUTH2_GOOGLE_CLIENT_ID.name(), "",
                APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET.name(), ""
        );

        Map<String, String> nonEmptyEnvChanges = Map.of(
                APPSMITH_OAUTH2_GOOGLE_CLIENT_ID.name(), "testClientId",
                APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET.name(), "testClientSecret"
        );

        envManager.applyChanges(nonEmptyEnvChanges).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "instance_setting.updated", null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.GOOGLE);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Added");

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        envManager.applyChanges(emptyEnvChanges).block();

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.GOOGLE);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Removed");

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Map<String, String> emptyEnvChanges = Map.of(
                APPSMITH_OAUTH2_OIDC_CLIENT_ID.name(), "",
                APPSMITH_OAUTH2_OIDC_CLIENT_SECRET.name(), ""
        );

        Map<String, String> nonEmptyEnvChanges = Map.of(
                APPSMITH_OAUTH2_OIDC_CLIENT_ID.name(), "testClientId",
                APPSMITH_OAUTH2_OIDC_CLIENT_SECRET.name(), "testClientSecret"
        );

        envManager.applyChanges(nonEmptyEnvChanges).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "instance_setting.updated", null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.OIDC);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Added");

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        envManager.applyChanges(emptyEnvChanges).block();

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.OIDC);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Removed");

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        Map<String, String> emptyEnvChanges = Map.of(
                APPSMITH_SSO_SAML_ENABLED.name(), "false"
        );

        Map<String, String> nonEmptyEnvChanges = Map.of(
                APPSMITH_SSO_SAML_ENABLED.name(), "true"
        );

        // Test adding configuration
        envManager.applyChanges(nonEmptyEnvChanges).block();

        MultiValueMap<String, String> params = getAuditLogRequest(null, "instance_setting.updated", null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.SAML);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Added");

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
        envManager.applyChanges(emptyEnvChanges).block();

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("instance_setting.updated");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isNotNull();
                    assertThat(auditLog.getUser().getEmail()).isEqualTo("api_user");
                    assertThat(auditLog.getUser().getName()).isEqualTo("api_user");
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Instance setting validation
                    assertThat(auditLog.getAuthentication().getMode()).isEqualTo(FieldName.SAML);
                    assertThat(auditLog.getAuthentication().getAction()).isEqualTo("Removed");

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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

        MultiValueMap<String, String> params = getAuditLogRequest(null, "workspace.created", null, null, null, null, null);

        StepVerifier
                .create(auditLogService.get(params))
                .assertNext(auditLogs -> {
                    // We are looking for the first event since Audit Logs sort order is DESC
                    assertThat(auditLogs).isNotEmpty();
                    AuditLog auditLog = auditLogs.get(0);

                    assertThat(auditLog.getEvent()).isEqualTo("workspace.created");
                    assertThat(auditLog.getTimestamp()).isBefore(Instant.now());

                    // User validation
                    assertThat(auditLog.getUser().getId()).isEqualTo(createdUser.getId());
                    assertThat(auditLog.getUser().getEmail()).isEqualTo(createdUser.getEmail());
                    assertThat(auditLog.getUser().getName()).isEqualTo(createdUser.getName());
                    //assertThat(auditLog.getUser().getIpAddress()).isNotEmpty();

                    // Metadata validation
                    //assertThat(auditLog.getMetadata().getIpAddress()).isNotEmpty();
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
}