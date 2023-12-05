package com.appsmith.server.packages.jslibs;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PackageDetailsDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.jslibs.context.ContextBasedJsLibService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
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

import java.util.Map;
import java.util.Set;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class PackageJsLibServiceTest {

    @Autowired
    ContextBasedJsLibService<Package> packageJsLibService;

    @Autowired
    CrudPackageService crudPackageService;

    @SpyBean
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @SpyBean
    FeatureFlagService featureFlagService;

    @SpyBean
    CommonConfig commonConfig;

    @SpyBean
    PluginService pluginService;

    @Autowired
    ObjectMapper objectMapper;

    String workspaceId;

    String defaultEnvironmentId;

    String packageId;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {

        User currentUser = sessionUserService.getCurrentUser().block();
        if (!currentUser.getEmail().equals("api_user")) {
            // Don't do any setups
            return;
        }

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(TRUE));

        doReturn(FALSE).when(commonConfig).isCloudHosting();

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_query_module_enabled)))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("PackageJsLibServiceTest");
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();

        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();
        mockPluginServiceFormData();
    }

    @AfterEach
    public void cleanup() {
        crudPackageService.deletePackage(packageId).block();
        workspaceService.archiveById(workspaceId).block();
    }

    private void mockPluginServiceFormData() {
        String jsonString = "{\n" + "  \"setting\": [\n"
                + "    {\n"
                + "      \"sectionName\": \"\",\n"
                + "      \"id\": 1,\n"
                + "      \"children\": [\n"
                + "        {\n"
                + "          \"label\": \"Run query on page load\",\n"
                + "          \"configProperty\": \"executeOnLoad\",\n"
                + "          \"controlType\": \"SWITCH\",\n"
                + "          \"subtitle\": \"Will refresh data each time the page is loaded\"\n"
                + "        },\n"
                + "        {\n"
                + "          \"label\": \"Request confirmation before running query\",\n"
                + "          \"configProperty\": \"confirmBeforeExecute\",\n"
                + "          \"controlType\": \"SWITCH\",\n"
                + "          \"subtitle\": \"Ask confirmation from the user each time before refreshing data\"\n"
                + "        },\n"
                + "        {\n"
                + "          \"label\": \"Use Prepared Statement\",\n"
                + "          \"subtitle\": \"Turning on Prepared Statement makes your queries resilient against bad things like SQL injections. However, it cannot be used if your dynamic binding contains any SQL keywords like 'SELECT', 'WHERE', 'AND', etc.\",\n"
                + "          \"configProperty\": \"actionConfiguration.pluginSpecifiedTemplates[0].value\",\n"
                + "          \"controlType\": \"SWITCH\",\n"
                + "          \"initialValue\": true\n"
                + "        },\n"
                + "        {\n"
                + "          \"label\": \"Query timeout (in milliseconds)\",\n"
                + "          \"subtitle\": \"Maximum time after which the query will return\",\n"
                + "          \"configProperty\": \"actionConfiguration.timeoutInMillisecond\",\n"
                + "          \"controlType\": \"INPUT_TEXT\",\n"
                + "          \"dataType\": \"NUMBER\"\n"
                + "        }\n"
                + "      ]\n"
                + "    }\n"
                + "  ]\n"
                + "}";
        try {
            JsonNode pluginSettingsNode = objectMapper.readTree(jsonString);
            Map configMap = objectMapper.convertValue(pluginSettingsNode, Map.class);
            Mockito.doReturn(Mono.just(configMap)).when(pluginService).getFormConfig(Mockito.any());

        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testAddJsLibToPackage_returnsJsLibInPackageDetails() {
        final PackageDTO firstPackage = new PackageDTO();
        firstPackage.setName("CustomJsLibPackage_addLib");
        firstPackage.setColor("#C2DAF0");
        firstPackage.setIcon("rupee");

        // create package test
        PackageDTO packageDTO =
                crudPackageService.createPackage(firstPackage, workspaceId).block();
        assertThat(packageDTO).isNotNull();
        packageId = packageDTO.getId();

        CustomJSLibContextDTO jsLibContextDTO = new CustomJSLibContextDTO();
        jsLibContextDTO.setUidString("mockUidString_addLib");

        packageJsLibService
                .updateJsLibsInContext(packageId, null, Set.of(jsLibContextDTO))
                .block();

        Mono<PackageDetailsDTO> packageDetailsMono = crudPackageService.getPackageDetails(packageId);

        StepVerifier.create(packageDetailsMono)
                .assertNext(packageDetailsDTO -> {
                    PackageDTO packageData = packageDetailsDTO.getPackageData();
                    assertThat(packageData.getCustomJSLibs()).hasSize(1);
                    assertThat(packageData.getCustomJSLibs()).allMatch(customJSLibContextDTO -> "mockUidString_addLib"
                            .equals(customJSLibContextDTO.getUidString()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testGetJsLibsInPackage_afterAdding_returnsJsLibs() {
        final PackageDTO firstPackage = new PackageDTO();
        firstPackage.setName("CustomJsLibPackage_getLib");
        firstPackage.setColor("#C2DAF0");
        firstPackage.setIcon("rupee");

        // create package test
        PackageDTO packageDTO =
                crudPackageService.createPackage(firstPackage, workspaceId).block();
        assertThat(packageDTO).isNotNull();
        packageId = packageDTO.getId();

        CustomJSLibContextDTO jsLibContextDTO = new CustomJSLibContextDTO();
        jsLibContextDTO.setUidString("mockUidString_getLib");

        packageJsLibService
                .updateJsLibsInContext(packageId, null, Set.of(jsLibContextDTO))
                .block();

        Mono<Set<CustomJSLibContextDTO>> jsLibsMono =
                packageJsLibService.getAllJSLibContextDTOFromContext(packageId, null, false);

        StepVerifier.create(jsLibsMono)
                .assertNext(contextDTOS -> {
                    assertThat(contextDTOS).hasSize(1);
                    assertThat(contextDTOS).allMatch(customJSLibContextDTO -> "mockUidString_getLib"
                            .equals(customJSLibContextDTO.getUidString()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testDeleteJsLibInPackage_doesNotReturnJsLibInPackageDetails() {
        final PackageDTO firstPackage = new PackageDTO();
        firstPackage.setName("CustomJsLibPackage_deleteLib");
        firstPackage.setColor("#C2DAF0");
        firstPackage.setIcon("rupee");

        // create package test
        PackageDTO packageDTO =
                crudPackageService.createPackage(firstPackage, workspaceId).block();
        assertThat(packageDTO).isNotNull();
        packageId = packageDTO.getId();

        CustomJSLibContextDTO jsLibContextDTO = new CustomJSLibContextDTO();
        jsLibContextDTO.setUidString("mockUidString_deleteLib");

        // Add the lib
        packageJsLibService
                .updateJsLibsInContext(packageId, null, Set.of(jsLibContextDTO))
                .block();
        // Then remove it
        packageJsLibService.updateJsLibsInContext(packageId, null, Set.of()).block();

        Mono<PackageDetailsDTO> packageDetailsMono = crudPackageService.getPackageDetails(packageId);

        StepVerifier.create(packageDetailsMono)
                .assertNext(packageDetailsDTO -> {
                    PackageDTO packageData = packageDetailsDTO.getPackageData();
                    assertThat(packageData.getCustomJSLibs()).hasSize(0);
                })
                .verifyComplete();
    }
}
