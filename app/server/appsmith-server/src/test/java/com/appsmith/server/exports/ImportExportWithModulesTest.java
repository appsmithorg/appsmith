package com.appsmith.server.exports;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exports.internal.ExportApplicationService;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.publish.PublishPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelper;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelperDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;

import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
class ImportExportWithModulesTest {

    @Autowired
    private ExportApplicationService exportApplicationService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private UpdateLayoutService updateLayoutService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @SpyBean
    private FeatureFlagService featureFlagService;

    @Autowired
    ModuleInstanceRepository moduleInstanceRepository;

    @Autowired
    NewActionService newActionService;

    @Autowired
    CrudModuleInstanceService crudModuleInstanceService;

    @Autowired
    LayoutModuleInstanceService layoutModuleInstanceService;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    CrudPackageService crudPackageService;

    ModuleInstanceTestHelper moduleInstanceTestHelper;

    ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO;

    @Autowired
    PublishPackageService publishPackageService;

    @Autowired
    CrudModuleService crudModuleService;

    @Autowired
    UserService userService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @SpyBean
    CommonConfig commonConfig;

    @SpyBean
    PluginService pluginService;

    @Autowired
    CustomJSLibService customJSLibService;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mockito.when(featureFlagService.check(Mockito.any())).thenReturn(Mono.just(true));

        moduleInstanceTestHelper = new ModuleInstanceTestHelper(
                crudPackageService,
                publishPackageService,
                crudModuleService,
                userService,
                workspaceService,
                applicationPageService,
                newPageService,
                newActionService,
                pluginExecutorHelper,
                environmentPermission,
                featureFlagService,
                commonConfig,
                pluginService,
                crudModuleInstanceService,
                objectMapper,
                customJSLibService);
        moduleInstanceTestHelperDTO = new ModuleInstanceTestHelperDTO();
        moduleInstanceTestHelperDTO.setWorkspaceName("Export_Module_Instance_Workspace");
        moduleInstanceTestHelperDTO.setApplicationName("Export_Module_Instance_Application");
        moduleInstanceTestHelper.createPrerequisites(moduleInstanceTestHelperDTO);
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testExportApplicationJSON_withoutModuleInstances_doesNotContainEmptyArrayInJson() {

        // Create a new workspace
        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Export without module instances");
        testWorkspace = workspaceService.create(testWorkspace).block();

        assertThat(testWorkspace).isNotNull();

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

                    layout.setDsl(dsl);
                    layout.setPublishedDsl(dsl);

                    return updateLayoutService
                            .updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout)
                            .then(exportApplicationService.exportApplicationById(testApp.getId(), ""));
                });

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getModuleList()).isNull();
                    assertThat(applicationJson.getModuleInstanceList()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testExportApplicationJSON_withModuleInstances_containsModulesInstancesAndModulesArrayInJson() {

        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);

        PageDTO testPage = moduleInstanceTestHelperDTO.getPageDTO();
        String applicationId = testPage.getApplicationId();

        Layout layout = testPage.getLayouts().get(0);
        ObjectMapper objectMapper = new ObjectMapper();
        JSONObject dsl = new JSONObject();
        try {
            dsl = new JSONObject(
                    objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            fail();
        }

        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        String expectedModuleInstanceId = testPage.getName() + "_"
                + createModuleInstanceResponseDTO.getModuleInstance().getName();

        final Mono<ApplicationJson> resultMono = updateLayoutService
                .updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout)
                .then(exportApplicationService.exportApplicationById(applicationId, ""));

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getModuleList()).hasSize(1);
                    assertThat(applicationJson.getModuleInstanceList()).hasSize(1);

                    ModuleInstance moduleInstance =
                            applicationJson.getModuleInstanceList().get(0);

                    assertThat(moduleInstance.getId()).isEqualTo(expectedModuleInstanceId);

                    ModuleInstanceDTO unpublishedModuleInstance = moduleInstance.getUnpublishedModuleInstance();
                    assertThat(unpublishedModuleInstance.getPageId()).isEqualTo(testPage.getName());
                })
                .verifyComplete();
    }
}
