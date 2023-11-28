package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.ModuleInput;
import com.appsmith.external.models.ModuleInputForm;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermissionChecker;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.crud.entity.CrudModuleEntityService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.permissions.PackagePermissionChecker;
import com.appsmith.server.packages.publish.PublishPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
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
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
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
@DirtiesContext
public class CrudModuleInstanceServiceTest {

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
    ApplicationPageService applicationPageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionService newActionService;

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
    LayoutModuleInstanceService layoutModuleInstanceService;

    @Autowired
    LayoutActionService layoutActionService;

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
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(TRUE));

        doReturn(FALSE).when(commonConfig).isCloudHosting();

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_query_module_enabled)))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        User apiUser = userService.findByEmail("api_user").block();

        createWorkspace(apiUser);
        setDefaultEnvironmentId();
        setupDatasource();
        mockPluginServiceFormData();

        Application application = setupApplication();
        pageDTO = getPageDTO(application);

        createAndPublishPackage();

        fetchConsumableModule();
        fetchPublicAction();
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

    @WithUserDetails(value = "api_user")
    @Test
    public void testCreateModuleInstanceFromAPublishedModule() {
        ModuleDTO consumableModule = consumableModuleOptional.get();

        ModuleInstanceDTO moduleInstanceReqDTO = prepareModuleInstanceReqDTO("GetUsers1", consumableModule);
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                getCreateModuleInstanceResponseDTO(moduleInstanceReqDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        Mono<List<NewAction>> actionsMono = getDBActions(createModuleInstanceResponseDTO);

        StepVerifier.create(actionsMono)
                .assertNext(dbActions -> {
                    doAllAssertions(
                            dbActions, createModuleInstanceResponseDTO, moduleInstanceDTO, moduleInstanceReqDTO);
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testInstantiateSameModuleTwiceOnSamePage() {
        ModuleDTO consumableModule = consumableModuleOptional.get();

        ModuleInstanceDTO firstModuleInstanceReqDTO = prepareModuleInstanceReqDTO("GetUsers1", consumableModule);
        ModuleInstanceDTO secondModuleInstanceReqDTO = prepareModuleInstanceReqDTO("GetUsers2", consumableModule);

        CreateModuleInstanceResponseDTO firstCreateModuleInstanceResponseDTO =
                getCreateModuleInstanceResponseDTO(firstModuleInstanceReqDTO);
        CreateModuleInstanceResponseDTO secondCreateModuleInstanceResponseDTO =
                getCreateModuleInstanceResponseDTO(secondModuleInstanceReqDTO);

        ModuleInstanceDTO firstModuleInstanceDTO = firstCreateModuleInstanceResponseDTO.getModuleInstance();
        ModuleInstanceDTO secondModuleInstanceDTO = secondCreateModuleInstanceResponseDTO.getModuleInstance();

        Mono<List<NewAction>> fristDBActionsMono = getDBActions(firstCreateModuleInstanceResponseDTO);
        Mono<List<NewAction>> secondDBActionsMono = getDBActions(secondCreateModuleInstanceResponseDTO);

        StepVerifier.create(fristDBActionsMono)
                .assertNext(dbActions -> {
                    doAllAssertions(
                            dbActions,
                            firstCreateModuleInstanceResponseDTO,
                            firstModuleInstanceDTO,
                            firstModuleInstanceReqDTO);
                })
                .verifyComplete();

        StepVerifier.create(secondDBActionsMono)
                .assertNext(dbActions -> {
                    doAllAssertions(
                            dbActions,
                            secondCreateModuleInstanceResponseDTO,
                            secondModuleInstanceDTO,
                            secondModuleInstanceReqDTO);
                })
                .verifyComplete();
    }

    private Mono<List<NewAction>> getDBActions(CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO) {
        Mono<List<NewAction>> fristActionsMono = newActionService
                .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                        createModuleInstanceResponseDTO.getModuleInstance().getId(),
                        AclPermission.EXECUTE_ACTIONS,
                        false)
                .collectList();
        return fristActionsMono;
    }

    private void doAllAssertions(
            List<NewAction> dbActions,
            CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO,
            ModuleInstanceDTO firstModuleInstanceDTO,
            ModuleInstanceDTO firstModuleInstanceReqDTO) {
        String moduleInstanceName = firstModuleInstanceReqDTO.getName();
        assertThat(createModuleInstanceResponseDTO).isNotNull();
        assertThat(createModuleInstanceResponseDTO.getModuleInstance()).isNotNull();
        assertThat(createModuleInstanceResponseDTO.getEntities()).isNotNull();
        assertThat(createModuleInstanceResponseDTO.getEntities().getActions()).isNotNull();

        assertThat(firstModuleInstanceDTO.getContextType()).isEqualTo(CreatorContextType.PAGE);
        assertThat(firstModuleInstanceDTO.getContextId()).isEqualTo(pageDTO.getId());
        assertThat(firstModuleInstanceDTO.getName()).isEqualTo(firstModuleInstanceReqDTO.getName());
        assertThat(firstModuleInstanceDTO.getInputs()).isNotNull();
        assertThat(firstModuleInstanceDTO.getInputs().size()).isEqualTo(1);
        assertThat(firstModuleInstanceDTO.getUserPermissions().size()).isEqualTo(4);

        List<ActionViewDTO> actions =
                createModuleInstanceResponseDTO.getEntities().getActions();
        ActionViewDTO moduleInstancePublicActionViewDTO = actions.get(0);
        assertThat(moduleInstancePublicActionViewDTO.getId()).isNotNull();
        assertThat(moduleInstancePublicActionViewDTO.getName()).isEqualTo("_$" + moduleInstanceName + "$_GetUsers");
        assertThat(moduleInstancePublicActionViewDTO.getPluginId()).isEqualTo(datasource.getPluginId());
        assertThat(moduleInstancePublicActionViewDTO.getTimeoutInMillisecond()).isEqualTo(10000);
        assertThat(moduleInstancePublicActionViewDTO.getConfirmBeforeExecute()).isFalse();
        assertThat(moduleInstancePublicActionViewDTO.getJsonPathKeys()).isNotNull();

        assertThat(dbActions.size()).isEqualTo(1);
        NewAction dbAction = dbActions.get(0);
        ActionDTO unpublishedDBAction = dbAction.getUnpublishedAction();

        // Assert dynamic binding references
        List<MustacheBindingToken> mustacheTokens = MustacheHelper.extractMustacheKeysInOrder(
                unpublishedDBAction.getActionConfiguration().getBody());
        assertThat(mustacheTokens.size()).isEqualTo(1);
        assertThat(mustacheTokens.get(0).getValue()).isEqualTo(moduleInstanceName + ".inputs.genderInput");

        // Assert input references
        assertThat(firstModuleInstanceDTO.getInputs().size()).isEqualTo(1);
        assertThat(firstModuleInstanceDTO.getInputs().containsKey("genderInput"))
                .isTrue();

        // Assert jsonPathKeys
        assertThat(firstModuleInstanceDTO.getJsonPathKeys().size()).isEqualTo(1);
        assertThat(firstModuleInstanceDTO.getJsonPathKeys()).matches(keySet -> keySet.contains("\"female\""));

        // Assert that module level settings should remain the same in the instantiated public entity
        assertThat(modulePublicAction
                        .getPublishedAction()
                        .getActionConfiguration()
                        .getTimeoutInMillisecond())
                .isEqualTo(moduleInstancePublicActionViewDTO.getTimeoutInMillisecond());
        assertThat(modulePublicAction.getPublishedAction().getConfirmBeforeExecute())
                .isEqualTo(moduleInstancePublicActionViewDTO.getConfirmBeforeExecute());
        assertThat(modulePublicAction
                        .getPublishedAction()
                        .getActionConfiguration()
                        .getPluginSpecifiedTemplates()
                        .get(0)
                        .getValue())
                .isEqualTo(TRUE);
    }

    private CreateModuleInstanceResponseDTO getCreateModuleInstanceResponseDTO(
            ModuleInstanceDTO firstModuleInstanceReqDTO) {
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO = crudModuleInstanceService
                .createModuleInstance(firstModuleInstanceReqDTO, null)
                .block();
        return createModuleInstanceResponseDTO;
    }

    private ModuleInstanceDTO prepareModuleInstanceReqDTO(String moduleInstanceName, ModuleDTO consumableModule) {
        ModuleInstanceDTO firstModuleInstanceReqDTO = new ModuleInstanceDTO();
        firstModuleInstanceReqDTO.setContextId(pageDTO.getId());
        firstModuleInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        firstModuleInstanceReqDTO.setName(moduleInstanceName);
        firstModuleInstanceReqDTO.setSourceModuleId(consumableModule.getId());
        return firstModuleInstanceReqDTO;
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testInstantiateModuleHavingTheSameNameAsAnotherQueryOnThePageShouldCoExist() {
        ActionDTO action = new ActionDTO();
        action.setName("GetUsers");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setBody("Select * from users where gender = {{Input1.text}}");
        action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
        action.setPageId(pageDTO.getId());
        action.setDatasource(datasource);
        Mono<ActionDTO> createActionMono = layoutActionService.createSingleAction(action, false);

        StepVerifier.create(createActionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getName()).isEqualTo("GetUsers");
                    assertThat(createdAction.getJsonPathKeys().size()).isEqualTo(1);
                    assertThat(createdAction.getJsonPathKeys().contains("Input1.text"));
                })
                .verifyComplete();

        ModuleDTO consumableModule = consumableModuleOptional.get();

        ModuleInstanceDTO moduleInstanceReqDTO = prepareModuleInstanceReqDTO("GetUsers1", consumableModule);
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                getCreateModuleInstanceResponseDTO(moduleInstanceReqDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        Mono<List<NewAction>> actionsMono = getDBActions(createModuleInstanceResponseDTO);

        StepVerifier.create(actionsMono)
                .assertNext(dbActions -> {
                    doAllAssertions(
                            dbActions, createModuleInstanceResponseDTO, moduleInstanceDTO, moduleInstanceReqDTO);
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testDeleteModuleInstanceShouldDeleteAllReferences() {
        ModuleDTO consumableModule = consumableModuleOptional.get();

        ModuleInstanceDTO moduleInstanceReqDTO =
                prepareModuleInstanceReqDTO("UniqueName_" + System.currentTimeMillis(), consumableModule);
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                getCreateModuleInstanceResponseDTO(moduleInstanceReqDTO);

        Mono<ModuleInstanceDTO> deletedModuleInstanceMono = crudModuleInstanceService
                .deleteUnpublishedModuleInstance(
                        createModuleInstanceResponseDTO.getModuleInstance().getId(), null)
                .cache();

        Mono<List<ModuleInstance>> moduleInstancesMono =
                deletedModuleInstanceMono.flatMap(deletedModuleInstance -> layoutModuleInstanceService
                        .findAllUnpublishedComposedModuleInstancesByRootModuleInstanceId(
                                pageDTO.getId(),
                                CreatorContextType.PAGE,
                                deletedModuleInstance.getId(),
                                AclPermission.READ_MODULE_INSTANCES)
                        .collectList());

        Mono<List<NewAction>> actionsMono = deletedModuleInstanceMono.flatMap(deletedModuleInstance -> newActionService
                .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                        deletedModuleInstance.getId(), AclPermission.EXECUTE_ACTIONS, true)
                .collectList());

        StepVerifier.create(Mono.zip(deletedModuleInstanceMono, moduleInstancesMono, actionsMono))
                .assertNext(tuple3 -> {
                    ModuleInstanceDTO deletedModuleInstanceDTO = tuple3.getT1();
                    List<ModuleInstance> moduleInstances = tuple3.getT2();
                    List<NewAction> actions = tuple3.getT3();
                    assertThat(deletedModuleInstanceDTO).isNotNull();

                    assertThat(moduleInstances.size()).isEqualTo(0);
                    assertThat(actions.size()).isEqualTo(0);
                })
                .verifyComplete();
    }
}
