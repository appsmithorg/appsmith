package com.appsmith.server.modules.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.ModuleInput;
import com.appsmith.external.models.ModuleInputForm;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ModuleActionCollectionDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleEntitiesDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermissionChecker;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.crud.entity.CrudModuleEntityService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.permissions.PackagePermissionChecker;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static com.appsmith.server.acl.AclPermission.CREATE_MODULE_EXECUTABLES;
import static com.appsmith.server.acl.AclPermission.CREATE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.DELETE_MODULES;
import static com.appsmith.server.acl.AclPermission.MANAGE_MODULES;
import static com.appsmith.server.acl.AclPermission.READ_MODULES;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
class ModuleServiceTest {

    @Autowired
    PackagePermissionChecker packagePermissionChecker;

    @Autowired
    CrudPackageService crudPackageService;

    @Autowired
    CrudModuleService crudModuleService;

    @Autowired
    CrudModuleEntityService crudModuleEntityService;

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

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @SpyBean
    CommonConfig commonConfig;

    @SpyBean
    PluginService pluginService;

    @SpyBean
    ModuleInstancePermissionChecker moduleInstancePermissionChecker;

    ObjectMapper objectMapper = new ObjectMapper();

    static String workspaceId;
    static String defaultEnvironmentId;
    static String packageId;
    static PackageDTO testPackage = null;
    Datasource datasource;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    void setup() {

        User currentUser = sessionUserService.getCurrentUser().block();
        if (!currentUser.getEmail().equals("api_user")) {
            // Don't do any setups
            return;
        }
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_audit_logs_enabled))
                .thenReturn(Mono.just(TRUE));

        doReturn(FALSE).when(commonConfig).isCloudHosting();

        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_query_module_enabled))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("ApplicationServiceTest");

        if (workspaceId == null) {
            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();

            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        setupDatasource();
        setupTestPackage();
        mockPluginServiceFormData();
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

    private void setupDatasource() {
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());
    }

    void setupTestPackage() {
        PackageDTO newPackage = new PackageDTO();
        newPackage.setName(UUID.randomUUID().toString());
        newPackage.setColor("#C2DAF0");
        newPackage.setIcon("rupee");

        testPackage = crudPackageService.createPackage(newPackage, workspaceId).block();
        packageId = testPackage.getId();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testCreateQueryModule_withValidInput_initializesRequiredProperties() {
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("GetUsersModule");
        moduleDTO.setType(ModuleType.QUERY_MODULE);
        moduleDTO.setPackageId(packageId);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setPluginId(datasource.getPluginId());
        moduleActionDTO.setDatasource(datasource);

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> moduleMono = crudModuleService.createModule(moduleDTO);

        StepVerifier.create(moduleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    assertThat(createdModule.getName()).isEqualTo(moduleDTO.getName());
                    assertThat(createdModule.getSettingsForm()).isNotNull();
                    assertThat(createdModule.getUserPermissions()).isNotEmpty();
                    verifyQueryModuleSettingsForCreator(createdModule);
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testCreateJSModule_withValidInput_initializesRequiredProperties() {
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("MockJSModule");
        moduleDTO.setType(ModuleType.JS_MODULE);
        moduleDTO.setPackageId(packageId);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setName("moduleFunc1");
        moduleActionDTO.setWorkspaceId(workspaceId);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("function () { return \"foo\" }");
        moduleActionDTO.setActionConfiguration(actionConfiguration);
        moduleActionDTO.setClientSideExecution(true);

        ModuleActionCollectionDTO moduleActionCollectionDTO = new ModuleActionCollectionDTO();
        moduleActionCollectionDTO.setPluginType(PluginType.JS);
        moduleActionCollectionDTO.setName("moduleJSObject");
        moduleActionCollectionDTO.setBody("export default { moduleFunc1() { return \"foo\" } }");
        moduleActionCollectionDTO.setWorkspaceId(workspaceId);

        moduleActionCollectionDTO.setActions(List.of(moduleActionDTO));

        Plugin installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();

        moduleActionCollectionDTO.setPluginId(installedJsPlugin.getId());

        moduleDTO.setEntity(moduleActionCollectionDTO);

        Mono<ModuleDTO> moduleMono = crudModuleService.createModule(moduleDTO);
        AtomicReference<String> moduleIdRef = new AtomicReference<>();

        StepVerifier.create(moduleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    moduleIdRef.set(createdModule.getId());
                    assertThat(createdModule.getName()).isEqualTo("MockJSModule");
                    assertThat(createdModule.getSettingsForm()).isNotNull();
                    Set<String> userPermissions = createdModule.getUserPermissions();
                    assertThat(userPermissions).isNotEmpty();
                    assertThat(userPermissions).hasSize(5);
                    assertThat(userPermissions).allMatch(permission -> {
                        Set<AclPermission> permissionSet = Set.of(
                                READ_MODULES,
                                CREATE_MODULE_EXECUTABLES,
                                CREATE_MODULE_INSTANCES,
                                MANAGE_MODULES,
                                DELETE_MODULES);

                        return permissionSet.contains(AclPermission.getPermissionByValue(permission, Module.class));
                    });
                    verifyJSModuleSettingsForCreator(createdModule);
                })
                .verifyComplete();

        // Verify that action collection and child actions are created along with the module
        Mono<ModuleEntitiesDTO> moduleEntitiesMono =
                crudModuleEntityService.getAllEntities(moduleIdRef.get(), CreatorContextType.MODULE, null);
        StepVerifier.create(moduleEntitiesMono)
                .assertNext(moduleEntitiesDTO -> {
                    assertThat(moduleEntitiesDTO.getJsCollections().size()).isEqualTo(1);
                    assertThat(moduleEntitiesDTO.getJsCollections().get(0).getActions())
                            .isNotNull();
                    assertThat(moduleEntitiesDTO
                                    .getJsCollections()
                                    .get(0)
                                    .getActions()
                                    .size())
                            .isEqualTo(1);
                    ActionCollectionDTO actionCollectionDTO =
                            moduleEntitiesDTO.getJsCollections().get(0);
                    ActionDTO jsActionDTO = moduleEntitiesDTO
                            .getJsCollections()
                            .get(0)
                            .getActions()
                            .get(0);
                    assertThat(jsActionDTO.getCollectionId()).isNotNull();
                    assertThat(jsActionDTO.getCollectionId()).isEqualTo(actionCollectionDTO.getId());
                    assertThat(moduleEntitiesDTO.getActions().size()).isEqualTo(0);
                })
                .verifyComplete();
    }

    private void verifyJSModuleSettingsForCreator(ModuleDTO moduleDTO) {
        JsonNode jsonNode = objectMapper.valueToTree(moduleDTO.getSettingsForm());

        assertThat(jsonNode.isEmpty()).isTrue();
    }

    private void verifyQueryModuleSettingsForCreator(ModuleDTO moduleDTO) {
        JsonNode jsonNode = objectMapper.valueToTree(moduleDTO.getSettingsForm());
        // Check if "Run query on page load" is NOT present in the children array
        JsonNode childrenNode = jsonNode.get(0)
                // Assuming there is at least one item in the "setting" array
                .path("children");

        boolean isUnexpectedSettingPresent = false;
        Iterator<JsonNode> elements = childrenNode.elements();
        List<String> unexpectedCreatorSettingNames =
                List.of("Run query on page load", "Request confirmation before running query");
        while (elements.hasNext()) {
            JsonNode element = elements.next();
            if (unexpectedCreatorSettingNames.contains(element.path("label").asText())) {
                isUnexpectedSettingPresent = true;
                break;
            }
        }
        assertThat(isUnexpectedSettingPresent).isFalse();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testUpdateModuleWithValidInput() {
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("GetUsersModuleV2");
        moduleDTO.setType(ModuleType.QUERY_MODULE);
        moduleDTO.setPackageId(packageId);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setPluginId(datasource.getPluginId());
        moduleActionDTO.setDatasource(datasource);

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> moduleMono = crudModuleService.createModule(moduleDTO);
        AtomicReference<String> moduleRef = new AtomicReference<>();

        StepVerifier.create(moduleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    moduleRef.set(createdModule.getId());
                    assertThat(createdModule.getName()).isEqualTo(moduleDTO.getName());
                })
                .verifyComplete();

        // Update name and inputs
        moduleDTO.setName("GetAllUsersModule");
        moduleDTO.setInputsForm(List.of(new ModuleInputForm(
                "id", "", List.of(new ModuleInput("id1", "label", "propertyName", "controlType", "defaultValue")))));
        Mono<ModuleDTO> updateModuleMono = crudModuleService.updateModule(moduleDTO, moduleRef.get());

        StepVerifier.create(updateModuleMono)
                .assertNext(updatedModule -> {
                    assertThat(updatedModule.getName()).isEqualTo(moduleDTO.getName());
                    assertThat(updatedModule.getInputsForm()).isNotEmpty();
                    assertThat(updatedModule.getInputsForm()).hasSize(1);
                    assertThat(updatedModule.getUserPermissions()).isNotEmpty();
                    verifyQueryModuleSettingsForCreator(updatedModule);
                })
                .verifyComplete();

        Mono<List<ActionDTO>> moduleActionsMono = crudModuleEntityService.getModuleActions(moduleRef.get());

        StepVerifier.create(moduleActionsMono)
                .assertNext(moduleConsumables -> {
                    moduleConsumables.forEach(moduleConsumable -> {
                        ModuleActionDTO moduleAction = (ModuleActionDTO) moduleConsumable;
                        assertThat(moduleAction.getDatasource()).isNotNull();
                        assertThat(moduleAction.getDatasource().getName()).isEqualTo(datasource.getName());
                        assertThat(moduleAction.getContextType()).isEqualTo(CreatorContextType.MODULE);
                    });
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testDeleteModuleWithNoModuleInstancesShouldDeleteModule() {
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("DeleteModuleTest");
        moduleDTO.setType(ModuleType.QUERY_MODULE);
        moduleDTO.setPackageId(packageId);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setPluginId(datasource.getPluginId());
        moduleActionDTO.setDatasource(datasource);
        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> moduleMono = crudModuleService.createModule(moduleDTO);
        AtomicReference<String> moduleIdRef = new AtomicReference<>();

        StepVerifier.create(moduleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    moduleIdRef.set(createdModule.getId());
                    assertThat(createdModule.getName()).isEqualTo(moduleDTO.getName());
                })
                .verifyComplete();

        Mono<ModuleDTO> deletedModuleMono = crudModuleService.deleteModule(moduleIdRef.get());

        StepVerifier.create(deletedModuleMono)
                .assertNext(deletedModule -> {
                    assertThat(deletedModule.getId()).isNotEmpty();
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testDeleteModuleWithModuleInstancesShouldNotDeleteModule() {

        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("CannotDeleteModuleTest");
        moduleDTO.setType(ModuleType.QUERY_MODULE);
        moduleDTO.setPackageId(packageId);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setPluginId(datasource.getPluginId());
        moduleActionDTO.setDatasource(datasource);

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> moduleMono = crudModuleService.createModule(moduleDTO);
        AtomicReference<String> moduleUUIDRef = new AtomicReference<>();
        AtomicReference<String> moduleIdRef = new AtomicReference<>();

        StepVerifier.create(moduleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    moduleUUIDRef.set(createdModule.getModuleUUID());
                    moduleIdRef.set(createdModule.getId());
                    assertThat(createdModule.getName()).isEqualTo(moduleDTO.getName());
                })
                .verifyComplete();

        Mockito.doReturn(Mono.just(Long.valueOf(1)))
                .when(moduleInstancePermissionChecker)
                .getModuleInstanceCountByModuleUUID(moduleUUIDRef.get());

        Mono<ModuleDTO> deletedModuleMono = crudModuleService.deleteModule(moduleIdRef.get());

        StepVerifier.create(deletedModuleMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable.getMessage())
                            .isEqualTo("Module cannot be deleted since it has 1 module instance(s) using it.");
                    return true;
                })
                .verify();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testGetEntitiesShouldReturnAtLeastOneEntity() {

        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("PublicEntityTestModule");
        moduleDTO.setType(ModuleType.QUERY_MODULE);
        moduleDTO.setPackageId(packageId);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setPluginId(datasource.getPluginId());
        moduleActionDTO.setDatasource(datasource);

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> moduleMono = crudModuleService.createModule(moduleDTO);
        AtomicReference<String> moduleIdRef = new AtomicReference<>();

        StepVerifier.create(moduleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    moduleIdRef.set(createdModule.getId());
                    assertThat(createdModule.getName()).isEqualTo(moduleDTO.getName());
                })
                .verifyComplete();

        Mono<List<ActionDTO>> moduleActionsMono = crudModuleEntityService.getModuleActions(moduleIdRef.get());

        StepVerifier.create(moduleActionsMono)
                .assertNext(moduleConsumables -> {
                    assertThat(moduleConsumables).isNotNull();
                    assertThat(moduleConsumables).size().isPositive();
                    moduleConsumables.forEach(moduleConsumable -> {
                        ModuleActionDTO moduleActionDTO1 = (ModuleActionDTO) moduleConsumable;
                        assertThat(moduleActionDTO1.getContextType()).isEqualTo(CreatorContextType.MODULE);
                        assertThat(moduleActionDTO1.getModuleId()).isEqualTo(moduleIdRef.get());
                    });
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testDeletePackageShouldPassWhenNoModuleHasAnyInstances() {
        final PackageDTO aPackage = new PackageDTO();
        aPackage.setName("PackagePublishableEntitiesNegativeTest");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        AtomicReference<String> packageId = new AtomicReference<>();
        AtomicReference<PackageDTO> testPackageRef = new AtomicReference<>();

        // create package
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(aPackage, workspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    packageId.set(createdPackage.getId());
                    testPackageRef.set(createdPackage);
                    assertThat(createdPackage.getName()).isEqualTo(aPackage.getName());
                })
                .verifyComplete();

        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("Module1");
        moduleDTO.setType(ModuleType.QUERY_MODULE);
        moduleDTO.setPackageId(packageId.get());

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setPluginId(datasource.getPluginId());
        moduleActionDTO.setDatasource(datasource);

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> moduleMono = crudModuleService.createModule(moduleDTO);
        AtomicReference<String> moduleIdRef = new AtomicReference<>();

        StepVerifier.create(moduleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    moduleIdRef.set(createdModule.getId());
                    assertThat(createdModule.getName()).isEqualTo(moduleDTO.getName());
                })
                .verifyComplete();

        ModuleDTO anotherModuleDTO = new ModuleDTO();
        anotherModuleDTO.setName("Module2");
        anotherModuleDTO.setType(ModuleType.QUERY_MODULE);
        anotherModuleDTO.setPackageId(packageId.get());

        ModuleActionDTO anotherModuleActionDTO = new ModuleActionDTO();

        anotherModuleDTO.setEntity(anotherModuleActionDTO);

        Mono<ModuleDTO> anotherModuleMono = crudModuleService.createModule(anotherModuleDTO);

        StepVerifier.create(anotherModuleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    assertThat(createdModule.getName()).isEqualTo(anotherModuleDTO.getName());
                })
                .verifyComplete();

        Mono<PackageDTO> deletePackageMono = crudPackageService.deletePackage(packageId.get());

        StepVerifier.create(deletePackageMono)
                .assertNext(deletedPackage -> {
                    assertThat(deletedPackage.getId()).isNotNull();
                })
                .verifyComplete();

        Mono<List<Module>> allModulesMono =
                crudModuleService.getAllModules(packageId.get()).collectList();

        StepVerifier.create(allModulesMono)
                .assertNext(allModules -> {
                    assertThat(allModules).isEmpty();
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testDeletePackageShouldFailWhenModuleHasInstances() {
        final PackageDTO aPackage = new PackageDTO();
        aPackage.setName("PackagePublishableEntitiesNegativeTest");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        AtomicReference<String> packageId = new AtomicReference<>();
        AtomicReference<PackageDTO> testPackageRef = new AtomicReference<>();

        // create package
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(aPackage, workspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    packageId.set(createdPackage.getId());
                    testPackageRef.set(createdPackage);
                    assertThat(createdPackage.getName()).isEqualTo(aPackage.getName());
                })
                .verifyComplete();

        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("Module1");
        moduleDTO.setType(ModuleType.QUERY_MODULE);
        moduleDTO.setPackageId(packageId.get());

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setPluginId(datasource.getPluginId());
        moduleActionDTO.setDatasource(datasource);

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> moduleMono = crudModuleService.createModule(moduleDTO);
        AtomicReference<String> moduleUUIDRef = new AtomicReference<>();
        AtomicReference<String> moduleIdRef = new AtomicReference<>();

        StepVerifier.create(moduleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    moduleUUIDRef.set(createdModule.getModuleUUID());
                    moduleIdRef.set(createdModule.getId());
                    assertThat(createdModule.getName()).isEqualTo(moduleDTO.getName());
                })
                .verifyComplete();

        ModuleDTO anotherModuleDTO = new ModuleDTO();
        anotherModuleDTO.setName("Module2");
        anotherModuleDTO.setType(ModuleType.QUERY_MODULE);
        anotherModuleDTO.setPackageId(packageId.get());

        ModuleActionDTO anotherModuleActionDTO = new ModuleActionDTO();

        anotherModuleDTO.setEntity(anotherModuleActionDTO);

        Mono<ModuleDTO> anotherModuleMono = crudModuleService.createModule(anotherModuleDTO);

        StepVerifier.create(anotherModuleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    assertThat(createdModule.getName()).isEqualTo(anotherModuleDTO.getName());
                })
                .verifyComplete();

        Mockito.doReturn(Mono.just(Long.valueOf(1)))
                .when(moduleInstancePermissionChecker)
                .getModuleInstanceCountByModuleUUID(moduleUUIDRef.get());

        Mono<PackageDTO> deletePackageMono = crudPackageService.deletePackage(packageId.get());

        StepVerifier.create(deletePackageMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable.getMessage())
                            .isEqualTo("Module cannot be deleted since it has 1 module instance(s) using it.");
                    return true;
                })
                .verify();

        Mono<List<Module>> allModulesMono =
                crudModuleService.getAllModules(packageId.get()).collectList();

        StepVerifier.create(allModulesMono)
                .assertNext(allModules -> {
                    assertThat(allModules).hasSize(2);
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testCreatePrivateModuleAction() {
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("testCreatePrivateModuleAction");
        moduleDTO.setType(ModuleType.JS_MODULE);
        moduleDTO.setPackageId(packageId);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setPluginId(datasource.getPluginId());
        moduleActionDTO.setDatasource(datasource);

        moduleDTO.setEntity(moduleActionDTO);

        ModuleDTO createdModule = crudModuleService.createModule(moduleDTO).block();

        ModuleActionDTO privateModuleAction = new ModuleActionDTO();
        privateModuleAction.setName("firstPrivateModuleAction");
        privateModuleAction.setPluginId(datasource.getPluginId());
        privateModuleAction.setDatasource(datasource);
        privateModuleAction.setModuleId(createdModule.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from users");
        privateModuleAction.setActionConfiguration(actionConfiguration);
        privateModuleAction.setContextType(CreatorContextType.MODULE);

        Mono<ActionDTO> moduleActionMono =
                layoutActionService.createSingleActionWithBranch(privateModuleAction, "master");

        StepVerifier.create(moduleActionMono)
                .assertNext(createdModuleAction -> {
                    assertThat(createdModuleAction).isNotNull();
                    assertThat(createdModuleAction.getContextType()).isEqualTo(CreatorContextType.MODULE);
                    assertThat(createdModuleAction.getModuleId()).isEqualTo(createdModule.getId());
                    assertThat(createdModuleAction.getIsPublic()).isFalse();
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testCreatePrivateModuleActionCollection() {

        Mockito.doReturn(Mono.just(new Plugin())).when(pluginService).findById(Mockito.any());

        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("testCreatePrivateModuleActionCollection");
        moduleDTO.setType(ModuleType.JS_MODULE);
        moduleDTO.setPackageId(packageId);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setPluginId(datasource.getPluginId());
        moduleActionDTO.setDatasource(datasource);

        moduleDTO.setEntity(moduleActionDTO);

        ModuleDTO createdModule = crudModuleService.createModule(moduleDTO).block();

        ModuleActionCollectionDTO privateModuleActionCollection = new ModuleActionCollectionDTO();
        privateModuleActionCollection.setName("firstPrivateModuleActionCollection");
        privateModuleActionCollection.setPluginId("pluginId");
        privateModuleActionCollection.setPluginType(PluginType.JS);
        privateModuleActionCollection.setModuleId(createdModule.getId());
        privateModuleActionCollection.setContextType(CreatorContextType.MODULE);
        privateModuleActionCollection.setBody("collectionBody");
        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        action1.getActionConfiguration().setIsValid(false);
        privateModuleActionCollection.setActions(List.of(action1));

        Mono<ActionCollectionDTO> moduleActionCollectionMono =
                layoutCollectionService.createCollection(privateModuleActionCollection, null);

        StepVerifier.create(moduleActionCollectionMono)
                .assertNext(createdModuleActionCollection -> {
                    assertThat(createdModuleActionCollection).isNotNull();
                    assertThat(createdModuleActionCollection.getContextType()).isEqualTo(CreatorContextType.MODULE);
                    assertThat(createdModuleActionCollection.getModuleId()).isEqualTo(createdModule.getId());
                    assertThat(createdModuleActionCollection.getIsPublic()).isFalse();

                    assertThat(createdModuleActionCollection.getActions()).isNotNull();
                    assertThat(createdModuleActionCollection.getActions()).hasSize(1);
                    assertThat(createdModuleActionCollection
                                    .getActions()
                                    .get(0)
                                    .getActionConfiguration()
                                    .getBody())
                            .isEqualTo("mockBody");
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testGetEntitiesShouldReturnEntitiesForPackageEditor() {
        final PackageDTO aPackage = new PackageDTO();
        aPackage.setName("PackageEditorGetEntitiesTest");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        AtomicReference<String> packageId = new AtomicReference<>();
        AtomicReference<PackageDTO> testPackageRef = new AtomicReference<>();

        // create package
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(aPackage, workspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    packageId.set(createdPackage.getId());
                    testPackageRef.set(createdPackage);
                    assertThat(createdPackage.getName()).isEqualTo(aPackage.getName());
                })
                .verifyComplete();

        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("Module1");
        moduleDTO.setType(ModuleType.QUERY_MODULE);
        moduleDTO.setPackageId(packageId.get());

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        moduleActionDTO.setPluginId(datasource.getPluginId());
        moduleActionDTO.setDatasource(datasource);

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> moduleMono = crudModuleService.createModule(moduleDTO);
        AtomicReference<String> moduleIdRef = new AtomicReference<>();

        StepVerifier.create(moduleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    moduleIdRef.set(createdModule.getId());
                    assertThat(createdModule.getName()).isEqualTo(moduleDTO.getName());
                })
                .verifyComplete();

        Mono<ModuleEntitiesDTO> getEntitiesMono =
                crudModuleEntityService.getAllEntities(moduleIdRef.get(), CreatorContextType.MODULE, null);

        StepVerifier.create(getEntitiesMono)
                .assertNext(allEntities -> {
                    assertThat(allEntities).isNotNull();
                    assertThat(allEntities.getActions().size()).isEqualTo(1);
                    assertThat(allEntities.getActions().get(0).getName()).isEqualTo("Module1");
                    assertThat(allEntities.getJsCollections().size()).isEqualTo(0);
                })
                .verifyComplete();
    }
}
