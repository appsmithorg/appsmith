package com.appsmith.server.solutions.ee.datasources.environments;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutService;
import com.appsmith.server.services.MockDataService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionExecutionSolution;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.core.codec.ByteBufferDecoder;
import org.springframework.core.codec.StringDecoder;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.codec.DecoderHttpMessageReader;
import org.springframework.http.codec.FormHttpMessageReader;
import org.springframework.http.codec.HttpMessageReader;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.multipart.DefaultPartHttpMessageReader;
import org.springframework.http.codec.multipart.MultipartHttpMessageReader;
import org.springframework.http.codec.multipart.Part;
import org.springframework.http.codec.xml.Jaxb2XmlDecoder;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.web.reactive.function.BodyExtractor;
import org.springframework.web.reactive.function.BodyExtractors;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(SpringExtension.class)
@SpringBootTest
public class ActionExecutionOOSPluginsTest {

    @SpyBean
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
    ImportExportApplicationService importExportApplicationService;

    @SpyBean
    PluginService pluginService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    MockDataService mockDataService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @SpyBean
    AstService astService;

    @Autowired
    DatasourceRepository datasourceRepository;

    @SpyBean
    DatasourceStorageService datasourceStorageService;

    @Autowired
    EnvironmentService environmentService;

    Application testApp = null;

    PageDTO testPage = null;

    Application gitConnectedApp = null;

    PageDTO gitConnectedPage = null;

    Datasource datasource;

    String workspaceId;

    String defaultEnvironmentId;
    String stagingEnvironmentId;

    String branchName;

    private BodyExtractor.Context context;
    private Map<String, Object> hints;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {

        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("ActionServiceCE_Test");

        if (workspaceId == null) {
            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();

            defaultEnvironmentId =
                    workspaceService.getDefaultEnvironmentId(workspaceId, null).block();
            stagingEnvironmentId = environmentService
                    .findByWorkspaceId(workspaceId)
                    .filter(environment -> !Boolean.TRUE.equals(environment.getIsDefault()))
                    .blockFirst()
                    .getId();
        }

        if (testApp == null && testPage == null) {
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
        }

        if (gitConnectedApp == null) {
            Application newApp = new Application();
            newApp.setName(UUID.randomUUID().toString());
            GitApplicationMetadata gitData = new GitApplicationMetadata();
            gitData.setBranchName("actionServiceTest");
            newApp.setGitApplicationMetadata(gitData);
            gitConnectedApp = applicationPageService
                    .createApplication(newApp, workspaceId)
                    .flatMap(application -> {
                        application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                        return applicationService
                                .save(application)
                                .zipWhen(application1 -> importExportApplicationService.exportApplicationById(
                                        application1.getId(), gitData.getBranchName()));
                    })
                    // Assign the branchName to all the resources connected to the application
                    .flatMap(tuple -> importExportApplicationService.importApplicationInWorkspaceFromGit(
                            workspaceId, tuple.getT2(), tuple.getT1().getId(), gitData.getBranchName()))
                    .block();

            gitConnectedPage = newPageService
                    .findPageById(gitConnectedApp.getPages().get(0).getId(), READ_PAGES, false)
                    .block();

            branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();
        }

        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());
        DatasourceStorage datasourceStorage =
                datasourceStorageService.createDatasourceStorageFromDatasource(datasource, defaultEnvironmentId);
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId,
                new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceStorage.getDatasourceConfiguration()));
        datasource.setDatasourceStorages(storages);
    }

    @AfterEach
    @WithUserDetails(value = "api_user")
    public void cleanup() {
        applicationPageService.deleteApplication(testApp.getId()).block();
        testApp = null;
        testPage = null;
    }

    @BeforeEach
    public void createContext() {
        final List<HttpMessageReader<?>> messageReaders = new ArrayList<>();
        messageReaders.add(new DecoderHttpMessageReader<>(new ByteBufferDecoder()));
        messageReaders.add(new DecoderHttpMessageReader<>(StringDecoder.allMimeTypes()));
        messageReaders.add(new DecoderHttpMessageReader<>(new Jaxb2XmlDecoder()));
        messageReaders.add(new DecoderHttpMessageReader<>(new Jackson2JsonDecoder()));
        messageReaders.add(new FormHttpMessageReader());
        DefaultPartHttpMessageReader partReader = new DefaultPartHttpMessageReader();
        messageReaders.add(partReader);
        messageReaders.add(new MultipartHttpMessageReader(partReader));

        this.context = new BodyExtractor.Context() {
            @Override
            public List<HttpMessageReader<?>> messageReaders() {
                return messageReaders;
            }

            @Override
            public Optional<ServerHttpResponse> serverResponse() {
                return Optional.empty();
            }

            @Override
            public Map<String, Object> hints() {
                return hints;
            }
        };
        this.hints = new HashMap<>();
    }

    private Mono<ActionExecutionResult> executeAction(ActionDTO savedAction) {

        String usualOrderOfParts =
                """
                        --boundary\r
                        Content-Disposition: form-data; name="executeActionDTO"\r
                        \r
                        {"actionId":"%s","viewMode":false}\r
                        --boundary--\r
                        """
                        .formatted(savedAction.getId());

        MockServerHttpRequest mock = MockServerHttpRequest.method(HttpMethod.POST, URI.create("https://example.com"))
                .contentType(new MediaType("multipart", "form-data", Map.of("boundary", "boundary")))
                .body(usualOrderOfParts);

        final Flux<Part> partsFlux = BodyExtractors.toParts().extract(mock, this.context);

        return actionExecutionSolution.executeAction(partsFlux, null, stagingEnvironmentId);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void executeActionWithOOSPlugin_inStagingEnv_runsWithDefaultEnv() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginService.getEditorConfigLabelMap(Mockito.anyString())).thenReturn(Mono.just(new HashMap<>()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("Default Database");
        externalDatasource.setWorkspaceId(workspaceId);
        Plugin plugin =
                pluginRepository.findByPackageName("google-sheets-plugin").block();
        externalDatasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");
        externalDatasource.setDatasourceConfiguration(datasourceConfiguration);
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

        ActionDTO savedAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        assert savedAction != null;
        Mono<ActionExecutionResult> resultMono = this.executeAction(savedAction);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getStatusCode()).isEqualTo("200");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void executeActionWithInScopePlugin_inStagingEnv_runsWithStagingEnv() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginService.getEditorConfigLabelMap(Mockito.anyString())).thenReturn(Mono.just(new HashMap<>()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("Default Database");
        externalDatasource.setWorkspaceId(workspaceId);
        Plugin plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        externalDatasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");
        externalDatasource.setDatasourceConfiguration(datasourceConfiguration);
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

        ActionDTO savedAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        assert savedAction != null;
        Mono<ActionExecutionResult> resultMono = this.executeAction(savedAction);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getStatusCode())
                            .isEqualTo(AppsmithErrorCode.DATASOURCE_STORAGE_NOT_CONFIGURED.getCode());
                })
                .verifyComplete();
    }
}
