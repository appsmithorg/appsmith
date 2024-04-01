package com.appsmith.server.git;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.AutoConfigureDataMongo;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@ExtendWith(SpringExtension.class)
@AutoConfigureDataMongo
@SpringBootTest
@DirtiesContext
public class ServerSchemaMigrationEnforcerTest {

    private static final Map<String, Datasource> datasourceMap = new HashMap<>();
    private static Plugin installedPlugin;
    private static String workspaceId;
    private static String defaultEnvironmentId;
    private static String testAppId;
    private static Datasource jsDatasource;
    private static Plugin installedJsPlugin;
    private static Boolean isSetupDone = false;
    private static String exportWithConfigurationAppId;

    @SpyBean
    ImportService importService;

    @Autowired
    ExportService exportService;

    @Autowired
    Gson gson;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    UpdateLayoutService updateLayoutService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    ThemeRepository themeRepository;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    CustomJSLibService customJSLibService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    ApplicationPermission applicationPermission;

    @SpyBean
    PluginService pluginService;

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @Autowired
    SessionUserService sessionUserService;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_ThenExportApplication_MatchJson_equals_Success() throws URISyntaxException {
        FilePart filePart = createFilePart("faulty-dsl.json");
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");
        Mono<Workspace> workspaceMono = workspaceService.create(newWorkspace).cache();

        ApplicationJson applicationJson = importService
                .extractArtifactExchangeJson(filePart)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .block();

        Mockito.doReturn(Mono.just(applicationJson)).when(importService).extractArtifactExchangeJson(Mockito.any());

        final Mono<ApplicationImportDTO> resultMono = workspaceMono
                .flatMap(workspace ->
                        importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspace.getId(), null))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        final Mono<ApplicationJson> exportApplicationMono = resultMono.flatMap(applicationImportDTO -> {
            return exportService
                    .exportByArtifactId(
                            applicationImportDTO.getApplication().getId(),
                            SerialiseArtifactObjective.VERSION_CONTROL,
                            ArtifactType.APPLICATION)
                    .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
        });

        Gson gson = new Gson();
        // The logic over here is that we are comparing the imported json and exported json,
        // if exported changes has diff from the imported one

        StepVerifier.create(exportApplicationMono)
                .assertNext(exportedApplicationJson -> {
                    assertThat(exportedApplicationJson).isNotNull();
                    String exportedJsonString = gson.toJson(exportedApplicationJson, ApplicationJson.class);
                    String importeApplicationJson = gson.toJson(applicationJson, ApplicationJson.class);
                    if (!exportedJsonString.equals(importeApplicationJson)) {
                        assertThat(exportedApplicationJson.getServerSchemaVersion())
                                .isGreaterThan(applicationJson.getServerSchemaVersion());
                    }
                })
                .verifyComplete();
    }

    private FilePart createFilePart(String filePath) throws URISyntaxException {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        URL resource = this.getClass().getResource(filePath);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        Path.of(resource.toURI()), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filepart;
    }
}
