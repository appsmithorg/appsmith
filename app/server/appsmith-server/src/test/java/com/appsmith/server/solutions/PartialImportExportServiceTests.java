package com.appsmith.server.solutions;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.CustomJSLibApplicationDTO;
import com.appsmith.server.dtos.PartialImportExportDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.CustomJSLibService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
public class PartialImportExportServiceTests {
    private static final String INVALID_JSON_FILE = "invalid json file";
    private static final Map<String, Datasource> datasourceMap = new HashMap<>();
    private static Plugin installedPlugin;
    private static String workspaceId;
    private static String defaultEnvironmentId;
    private static String savedApplicationId;
    private Application savedApplication;
    CustomJSLib existingLib;

    @Autowired
    PartialImportExportService partialImportExportService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    CustomJSLibService customJSLibService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("Partial-Import-Export-Test-Workspace");
        Workspace savedWorkspace = workspaceService.create(workspace).block();
        workspaceId = savedWorkspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Application testApplication = new Application();
        testApplication.setName("Export-Application-Test-Application");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        savedApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();
        savedApplicationId = savedApplication.getId();

        existingLib = new CustomJSLib("TestLib1", Set.of("accessor1"), "url", "docsUrl", "1.0", "defs_string");
        customJSLibService
                .addJSLibToApplication(savedApplicationId, existingLib, "", false)
                .block();
    }

    private PartialImportExportDTO createEmptyEntities() {
        PartialImportExportDTO entities = new PartialImportExportDTO();
        List<String> emptyList = new ArrayList<>();
        entities.setCustomJSLibList(emptyList);
        entities.setActionList(emptyList);
        entities.setActionCollectionList(emptyList);
        entities.setDatasourceList(emptyList);
        return entities;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportNoEntitiesTest() {
        PartialImportExportDTO entities = createEmptyEntities();
        StepVerifier.create(partialImportExportService.exportApplicationById(savedApplicationId, entities))
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getActionList()).isEmpty();
                    assertThat(applicationJson.getDatasourceList()).isEmpty();
                    assertThat(applicationJson.getCustomJSLibList()).isEmpty();
                    assertThat(applicationJson.getActionCollectionList()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportExistingCustomLibTest() {
        PartialImportExportDTO entities = createEmptyEntities();
        entities.setCustomJSLibList(List.of("TestLib1"));
        StepVerifier.create(partialImportExportService.exportApplicationById(savedApplicationId, entities))
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getActionList()).isEmpty();
                    assertThat(applicationJson.getDatasourceList()).isEmpty();
                    assertThat(applicationJson.getActionCollectionList()).isEmpty();
                    assertThat(applicationJson.getCustomJSLibList().size()).isEqualTo(1);

                    CustomJSLib exportedLib =
                            applicationJson.getCustomJSLibList().get(0);
                    assertThat(exportedLib.getName()).isEqualTo(existingLib.getName());
                    assertThat(exportedLib.getAccessor()).isEqualTo(existingLib.getAccessor());
                    assertThat(exportedLib.getUrl()).isEqualTo(existingLib.getUrl());
                    assertThat(exportedLib.getDocsUrl()).isEqualTo(existingLib.getDocsUrl());
                    assertThat(exportedLib.getVersion()).isEqualTo(existingLib.getVersion());
                    assertThat(exportedLib.getDefs()).isEqualTo(existingLib.getDefs());
                    assertThat(exportedLib.getCreatedAt()).isNull();
                    assertThat(exportedLib.getUpdatedAt()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportNonExistingCustomLibTest() {
        PartialImportExportDTO entities = createEmptyEntities();
        entities.setCustomJSLibList(List.of("some_random_lib"));
        StepVerifier.create(partialImportExportService.exportApplicationById(savedApplicationId, entities))
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getActionList()).isEmpty();
                    assertThat(applicationJson.getDatasourceList()).isEmpty();
                    assertThat(applicationJson.getCustomJSLibList()).isEmpty();
                    assertThat(applicationJson.getActionCollectionList()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importExistingCustomLibTest() {
        ApplicationJson appJson = new ApplicationJson();
        appJson.setExportedApplication(savedApplication);
        appJson.setCustomJSLibList(List.of(existingLib));
        StepVerifier.create(
                        partialImportExportService.importApplicationFromJson(savedApplicationId, workspaceId, appJson))
                .assertNext(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    List<CustomJSLibApplicationDTO> customJSLibApplicationDTOList =
                            application.getUnpublishedCustomJSLibs().stream().toList();
                    assertThat(customJSLibApplicationDTOList.size()).isEqualTo(1);
                    assertThat(customJSLibApplicationDTOList.get(0).getUidString())
                            .isEqualTo("accessor1_url");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importNewCustomLibTest() {
        ApplicationJson appJson = new ApplicationJson();
        appJson.setExportedApplication(savedApplication);
        CustomJSLib newCustomJsLib =
                new CustomJSLib("NewLib", Set.of("accessor_new"), "url_new", "docsUrl_new", "1.0", "defs_string");
        appJson.setCustomJSLibList(List.of(newCustomJsLib));
        StepVerifier.create(
                        partialImportExportService.importApplicationFromJson(savedApplicationId, workspaceId, appJson))
                .assertNext(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    List<CustomJSLibApplicationDTO> customJSLibApplicationDTOList = new ArrayList<>(
                            application.getUnpublishedCustomJSLibs().stream().toList());
                    customJSLibApplicationDTOList.sort(Comparator.comparing(CustomJSLibApplicationDTO::getUidString));
                    assertThat(customJSLibApplicationDTOList.size()).isEqualTo(2);
                    assertThat(customJSLibApplicationDTOList.get(0).getUidString())
                            .isEqualTo("accessor1_url");
                    assertThat(customJSLibApplicationDTOList.get(1).getUidString())
                            .isEqualTo("accessor_new_url_new");
                })
                .verifyComplete();
    }
}
