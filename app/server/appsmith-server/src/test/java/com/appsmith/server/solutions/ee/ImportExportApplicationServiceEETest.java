package com.appsmith.server.solutions.ee;

import com.appsmith.external.constants.CommonFieldName;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.assertj.core.api.Assertions;
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
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PAGE_LAYOUT;
import static org.junit.jupiter.api.Assertions.fail;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
public class ImportExportApplicationServiceEETest {

    @Autowired
    private ImportExportApplicationService importExportApplicationService;

    @Autowired
    private Gson gson;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    private PluginRepository pluginRepository;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private EnvironmentService environmentService;

    @Autowired
    LayoutActionService layoutActionService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @SpyBean
    private FeatureFlagService featureFlagService;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mockito.when(featureFlagService.check(Mockito.any())).thenReturn(Mono.just(true));
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

    private Mono<ApplicationJson> createAppJson(String filePath) {
        FilePart filePart = createFilePart(filePath);

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content()).map(dataBuffer -> {
            byte[] data = new byte[dataBuffer.readableByteCount()];
            dataBuffer.read(data);
            DataBufferUtils.release(dataBuffer);
            return new String(data);
        });

        return stringifiedFile
                .map(data -> gson.fromJson(data, ApplicationJson.class))
                .map(JsonSchemaMigration::migrateApplicationToLatestSchema);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testImportApplicationJSON_withExistingDatasourceInStagingOnly_reusesDatasourceWithoutConfiguration() {
        ApplicationJson applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json")
                .block();

        // Create a new workspace
        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Duplicate datasource with staging configured org");
        testWorkspace = workspaceService.create(testWorkspace).block();

        // Create a new datasource with staging configured
        String stagingEnvironmentId = environmentService
                .getEnvironmentDTOByWorkspaceId(testWorkspace.getId())
                .filter(environmentDTO -> environmentDTO.getName().equals(CommonFieldName.STAGING_ENVIRONMENT))
                .blockFirst()
                .getId();
        Datasource testDatasource = new Datasource();
        // Choose plugin same as mongo, as json static file has mongo plugin for datasource
        Plugin mongoPlugin = pluginRepository.findByName("MongoDB").block();
        testDatasource.setPluginId(mongoPlugin.getId());
        testDatasource.setWorkspaceId(testWorkspace.getId());
        final String datasourceName = applicationJson.getDatasourceList().get(0).getName();
        testDatasource.setName(datasourceName);
        DBAuth auth = new DBAuth();
        auth.setPassword("awesome-password");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(auth);
        testDatasource.setIsConfigured(true);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                stagingEnvironmentId, new DatasourceStorageDTO(null, stagingEnvironmentId, datasourceConfiguration));
        testDatasource.setDatasourceStorages(storages);
        datasourceService.create(testDatasource).block();

        final Mono<Application> resultMono = importExportApplicationService.importNewApplicationInWorkspaceFromJson(
                testWorkspace.getId(), applicationJson);

        Mono<List<Datasource>> datasourcesMono = resultMono.flatMap(application -> datasourceService
                .getAllByWorkspaceIdWithStorages(application.getWorkspaceId(), Optional.of(MANAGE_DATASOURCES))
                .collectList());

        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(testWorkspace.getId(), null)
                .block();

        StepVerifier.create(datasourcesMono)
                .assertNext(datasources -> {
                    Assertions.assertThat(datasources).hasSize(2);
                    Optional<Datasource> datasourceOptional = datasources.stream()
                            .filter(datasource1 -> datasource1.getName().equals(datasourceName))
                            .findFirst();
                    Assertions.assertThat(datasourceOptional.isPresent()).isTrue();
                    Datasource datasource = datasourceOptional.get();
                    Map<String, DatasourceStorageDTO> datasourceStorages = datasource.getDatasourceStorages();
                    Assertions.assertThat(datasourceStorages).containsKey(stagingEnvironmentId);
                    Assertions.assertThat(
                                    datasourceStorages.get(stagingEnvironmentId).getIsConfigured())
                            .isTrue();

                    Assertions.assertThat(datasourceStorages).doesNotContainKey(defaultEnvironmentId);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testExportApplicationJSON_withExistingDatasourceInStagingOnly_stillContainsDatasourceInExportedFile() {

        // Create a new workspace
        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Datasource with staging configured for export org");
        testWorkspace = workspaceService.create(testWorkspace).block();

        // Create a new datasource with staging configured
        String stagingEnvironmentId = environmentService
                .getEnvironmentDTOByWorkspaceId(testWorkspace.getId())
                .filter(environmentDTO -> environmentDTO.getName().equals(CommonFieldName.STAGING_ENVIRONMENT))
                .blockFirst()
                .getId();
        Datasource testDatasource = new Datasource();
        Plugin mongoPlugin = pluginRepository.findByName("MongoDB").block();
        testDatasource.setPluginId(mongoPlugin.getId());
        testDatasource.setWorkspaceId(testWorkspace.getId());
        final String datasourceName = "staging-only datasource";
        testDatasource.setName(datasourceName);
        DBAuth auth = new DBAuth();
        auth.setPassword("awesome-password");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(auth);
        testDatasource.setDatasourceConfiguration(datasourceConfiguration);
        testDatasource.setIsConfigured(true);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                stagingEnvironmentId, new DatasourceStorageDTO(null, stagingEnvironmentId, datasourceConfiguration));
        testDatasource.setDatasourceStorages(storages);
        Datasource savedDatasource = datasourceService.create(testDatasource).block();

        // Create a new application to export
        Application testApplication = new Application();
        testApplication.setName("exportApplication_withExistingDatasourceInStagingOnly");
        testApplication = applicationPageService
                .createApplication(testApplication, testWorkspace.getId())
                .block();
        assert testApplication != null;

        final Mono<ApplicationJson> resultMono = Mono.zip(
                        Mono.just(testApplication),
                        newPageService.findPageById(
                                testApplication.getPages().get(0).getId(), READ_PAGES, false))
                .flatMap(tuple -> {
                    Application testApp = tuple.getT1();
                    PageDTO testPage = tuple.getT2();

                    Layout layout = testPage.getLayouts().get(0);
                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject dsl = new JSONObject();
                    try {
                        dsl = new JSONObject(objectMapper.readValue(
                                DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));
                    } catch (JsonProcessingException e) {
                        e.printStackTrace();
                        fail();
                    }

                    ArrayList children = (ArrayList) dsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.add(new JSONObject(Map.of("key", "testField")));
                    testWidget.put("dynamicBindingPathList", temp);
                    testWidget.put("testField", "{{ validAction.data }}");
                    children.add(testWidget);

                    layout.setDsl(dsl);
                    layout.setPublishedDsl(dsl);

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setPageId(testPage.getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(savedDatasource);

                    ActionDTO action2 = new ActionDTO();
                    action2.setName("validAction2");
                    action2.setPageId(testPage.getId());
                    action2.setExecuteOnLoad(true);
                    action2.setUserSetOnLoad(true);
                    ActionConfiguration actionConfiguration2 = new ActionConfiguration();
                    actionConfiguration2.setHttpMethod(HttpMethod.GET);
                    action2.setActionConfiguration(actionConfiguration2);
                    action2.setDatasource(savedDatasource);

                    return layoutActionService
                            .createSingleAction(action, Boolean.FALSE)
                            .then(layoutActionService.createSingleAction(action2, Boolean.FALSE))
                            .then(layoutActionService.updateLayout(
                                    testPage.getId(), testPage.getApplicationId(), layout.getId(), layout))
                            .then(importExportApplicationService.exportApplicationById(testApp.getId(), ""));
                });

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    List<DatasourceStorage> datasourceList = applicationJson.getDatasourceList();
                    Assertions.assertThat(datasourceList).hasSize(1);
                    Optional<DatasourceStorage> storageOptional = datasourceList.stream()
                            .filter(datasource1 -> datasource1.getName().equals(datasourceName))
                            .findFirst();
                    Assertions.assertThat(storageOptional.isPresent()).isTrue();
                    DatasourceStorage storage = storageOptional.get();
                    Assertions.assertThat(storage.getName()).isEqualTo(savedDatasource.getName());
                    Assertions.assertThat(storage.getPluginId()).isEqualTo("mongo-plugin");
                    Assertions.assertThat(storage.getGitSyncId()).isEqualTo(savedDatasource.getGitSyncId());
                })
                .verifyComplete();
    }
}
