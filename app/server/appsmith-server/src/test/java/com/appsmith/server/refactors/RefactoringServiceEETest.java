package com.appsmith.server.refactors;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.ModuleInput;
import com.appsmith.external.models.ModuleInputForm;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermissionChecker;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.crud.entity.CrudModuleEntityService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.permissions.PackagePermissionChecker;
import com.appsmith.server.packages.publish.PublishPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class RefactoringServiceEETest {

    @Autowired
    PackagePermissionChecker packagePermissionChecker;

    @Autowired
    CrudPackageService crudPackageService;

    @Autowired
    PublishPackageService publishPackageService;

    @Autowired
    CrudModuleService crudModuleService;

    @Autowired
    CrudModuleEntityService crudModuleEntityService;

    @SpyBean
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ModuleInstanceRepository moduleInstanceRepository;

    @Autowired
    CrudModuleInstanceService crudModuleInstanceService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    PluginRepository pluginRepository;

    @SpyBean
    FeatureFlagService featureFlagService;

    @SpyBean
    CommonConfig commonConfig;

    @SpyBean
    PluginService pluginService;

    @SpyBean
    ModuleInstancePermissionChecker moduleInstancePermissionChecker;

    @Autowired
    UpdateLayoutService updateLayoutService;

    @SpyBean
    EntityRefactoringService<ModuleInstance> moduleInstanceRefactoringService;

    @Autowired
    RefactoringService refactoringService;

    ObjectMapper objectMapper = new ObjectMapper();

    String workspaceId;
    String defaultEnvironmentId;
    Datasource datasource;
    PageDTO pageDTO = null;
    ModuleDTO sourceModuleDTO = null;
    Optional<ModuleDTO> consumableModuleOptional;
    NewAction modulePublicAction;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {

        User currentUser = sessionUserService.getCurrentUser().block();
        if (!currentUser.getEmail().equals("api_user")) {
            // Don't do any setups
            return;
        }

        Mockito.doReturn(Mono.just(TRUE))
                .when(featureFlagService)
                .check(eq(FeatureFlagEnum.license_audit_logs_enabled));
        Mockito.doReturn(Mono.just(TRUE))
                .when(featureFlagService)
                .check(eq(FeatureFlagEnum.release_query_module_enabled));
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of("release_query_module_enabled", TRUE));
        Mockito.doReturn(cachedFeatures).when(featureFlagService).getCachedTenantFeatureFlags();
        doReturn(FALSE).when(commonConfig).isCloudHosting();

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        User apiUser = userService.findByEmail("api_user").block();

        createWorkspace(apiUser);
        setDefaultEnvironmentId();
        setupDatasource();
        mockPluginServiceFormData();

        Application application = setupApplication();
        pageDTO = getPageDTO(application);

        updatePageDSL(pageDTO);

        pageDTO = getPageDTO(application);

        createAndPublishPackage();

        fetchConsumableModule();
        fetchPublicAction();
    }

    private void updatePageDSL(PageDTO pageDTO) {
        Layout layout = pageDTO.getLayouts().get(0);
        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField")), new JSONObject(Map.of("key", "testField2"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ testModuleInstance1.data }}");
        dsl.put("testField2", "{{jsObject.jsFunction.data}}");

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
        updateLayoutService
                .updateLayout(pageDTO.getId(), pageDTO.getApplicationId(), layout.getId(), layout)
                .block();
    }

    private Application setupApplication() {
        Application applicationReq = getCreateAppRequest();
        Application application = createApp(applicationReq);
        return application;
    }

    private void setDefaultEnvironmentId() {
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();
    }

    private void createWorkspace(User apiUser) {
        Workspace toCreate = new Workspace();
        toCreate.setName("Application For Package Consumption");

        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();
    }

    private void fetchConsumableModule() {
        ConsumablePackagesAndModulesDTO allConsumablePackages =
                crudPackageService.getAllPackagesForConsumer(workspaceId).block();

        consumableModuleOptional = allConsumablePackages.getModules().stream().findFirst();
        assertThat(consumableModuleOptional).isPresent();
    }

    private void fetchPublicAction() {
        ModuleDTO publishedModule = consumableModuleOptional.get();
        modulePublicAction = newActionService
                .findPublicActionByModuleId(publishedModule.getId(), ResourceModes.VIEW)
                .block();

        assertThat(modulePublicAction.getIsPublic()).isTrue();
    }

    private PageDTO getPageDTO(Application application) {
        return newPageService
                .findByApplicationId(application.getId(), AclPermission.MANAGE_PAGES, false)
                .blockFirst();
    }

    private Application createApp(Application applicationReq) {
        return applicationPageService.createApplication(applicationReq).block();
    }

    private Application getCreateAppRequest() {
        Application applicationReq = new Application();
        applicationReq.setName("MyFirstApp");
        applicationReq.setWorkspaceId(workspaceId);
        return applicationReq;
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

    private PackageDTO getPackageRequestDTO() {
        PackageDTO aPackage = new PackageDTO();
        aPackage.setName("Package Publish Test");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        return aPackage;
    }

    private void createAndPublishPackage() {

        PackageDTO aPackage = getPackageRequestDTO();

        PackageDTO packageDTO = createPackage(aPackage);

        ModuleDTO moduleReqDTO = createModuleRequestDTO(packageDTO);

        sourceModuleDTO = createModule(moduleReqDTO);

        publishPackageService.publishPackage(packageDTO.getId()).block();
    }

    private ModuleDTO createModule(ModuleDTO moduleReqDTO) {
        return crudModuleService.createModule(moduleReqDTO).block();
    }

    private PackageDTO createPackage(PackageDTO aPackage) {
        return crudPackageService.createPackage(aPackage, workspaceId).block();
    }

    private ModuleDTO createModuleRequestDTO(PackageDTO packageDTO) {
        ModuleDTO moduleReqDTO = new ModuleDTO();
        moduleReqDTO.setName("GetUsers");
        moduleReqDTO.setPackageId(packageDTO.getId());
        moduleReqDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("Select * from users where gender = {{inputs.genderInput}}");

        moduleActionDTO.setDynamicBindingPathList(List.of(new Property("body", null)));

        // configure inputs
        List<ModuleInputForm> moduleInputsForm = new ArrayList<>();
        ModuleInputForm genderInputForm = new ModuleInputForm();
        genderInputForm.setId(UUID.randomUUID().toString());
        genderInputForm.setSectionName("");
        List<ModuleInput> inputChildren = new ArrayList<>();
        ModuleInput genderInput = new ModuleInput();
        genderInput.setLabel("genderInput");
        genderInput.setPropertyName("inputs.genderInput");
        genderInput.setDefaultValue("{{\"female\"}}");
        genderInput.setControlType("INPUT_TEXT");
        inputChildren.add(genderInput);
        genderInputForm.setChildren(inputChildren);

        moduleInputsForm.add(genderInputForm);
        moduleReqDTO.setInputsForm(moduleInputsForm);

        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property(null, TRUE)));
        moduleActionDTO.setActionConfiguration(actionConfiguration);
        moduleActionDTO.setDatasource(datasource);
        moduleActionDTO.setPluginId(datasource.getPluginId());

        moduleReqDTO.setEntity(moduleActionDTO);
        return moduleReqDTO;
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

    @AfterEach
    public void cleanup() {
        applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();

        workspaceService.archiveById(workspaceId).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testIsNameAllowed_withRepeatedModuleInstanceName_throwsError() {

        Mockito.doReturn(Flux.just("testModuleInstance"))
                .when(moduleInstanceRefactoringService)
                .getExistingEntityNames(Mockito.anyString(), Mockito.any(), Mockito.anyString());

        Mono<Boolean> nameAllowedMono = refactoringService.isNameAllowed(
                pageDTO.getId(),
                CreatorContextType.PAGE,
                pageDTO.getLayouts().get(0).getId(),
                "testModuleInstance");

        StepVerifier.create(nameAllowedMono).assertNext(Assertions::assertFalse).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testRefactorModuleInstance_withOnlyPublicEntity_refactorsAllComposedEntities() {

        // Create a module instance
        ModuleDTO consumableModule = consumableModuleOptional.get();

        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setContextId(pageDTO.getId());
        moduleInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        moduleInstanceReqDTO.setName("testModuleInstance1");
        moduleInstanceReqDTO.setSourceModuleId(consumableModule.getId());
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO = crudModuleInstanceService
                .createModuleInstance(moduleInstanceReqDTO, null)
                .block();

        String moduleInstanceId =
                createModuleInstanceResponseDTO.getModuleInstance().getId();

        // Create refactor request
        RefactorEntityNameDTO refactorEntityNameDTO = new RefactorEntityNameDTO(
                pageDTO.getId(),
                pageDTO.getLayouts().get(0).getId(),
                "testModuleInstance1",
                "testModuleInstance2",
                EntityType.MODULE_INSTANCE,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                moduleInstanceId,
                false);

        // Call composite entity refactoring method
        refactoringService
                .refactorCompositeEntityName(refactorEntityNameDTO, null)
                .block();

        // Check status of all entities after refactor
        Mono<List<NewAction>> updatedActionsMono = newActionService
                .findAllUnpublishedComposedActionsByRootModuleInstanceId(moduleInstanceId, null, false)
                .collectList();

        Mono<ModuleInstance> updatedModuleInstanceMono = moduleInstanceRepository.findById(moduleInstanceId);

        StepVerifier.create(Mono.zip(updatedActionsMono, updatedModuleInstanceMono))
                .assertNext(tuple -> {
                    List<NewAction> newActions = tuple.getT1();
                    ModuleInstanceDTO unpublishedModuleInstance = tuple.getT2().getUnpublishedModuleInstance();

                    assertThat(newActions.size()).isEqualTo(1);
                    ActionDTO unpublishedAction = newActions.get(0).getUnpublishedAction();
                    assertThat(unpublishedAction.getName()).isEqualTo("_$testModuleInstance2$_GetUsers");
                    assertThat(unpublishedAction.getJsonPathKeys().size()).isEqualTo(1);
                    assertThat(unpublishedAction.getJsonPathKeys().contains("testModuleInstance2.inputs.genderInput"))
                            .isTrue();
                    assertThat(unpublishedAction.getActionConfiguration().getBody())
                            .isEqualTo("Select * from users where gender = {{testModuleInstance2.inputs.genderInput}}");

                    assertThat(unpublishedModuleInstance.getName()).isEqualTo("testModuleInstance2");
                    assertThat(unpublishedModuleInstance.getJsonPathKeys().size())
                            .isEqualTo(1);
                    assertThat(unpublishedModuleInstance.getJsonPathKeys().contains("\"female\""))
                            .isTrue();
                    assertThat(unpublishedModuleInstance.getInputs().size()).isEqualTo(1);
                    assertThat(unpublishedModuleInstance.getInputs().containsKey("genderInput"))
                            .isTrue();
                    assertThat(unpublishedModuleInstance.getInputs().get("genderInput"))
                            .isEqualTo("{{\"female\"}}");
                })
                .verifyComplete();
    }
}
