package com.appsmith.server.testhelpers.moduleinstances;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.ModuleInput;
import com.appsmith.external.models.ModuleInputForm;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleActionCollectionDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PluginWorkspaceDTO;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import org.mockito.Mockito;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;

@AllArgsConstructor
public class ModuleInstanceTestHelper {

    CrudPackageService crudPackageService;

    PublishPackageService publishPackageService;

    CrudModuleService crudModuleService;

    UserService userService;

    WorkspaceService workspaceService;

    ApplicationPageService applicationPageService;

    NewPageService newPageService;

    NewActionService newActionService;

    PluginExecutorHelper pluginExecutorHelper;

    EnvironmentPermission environmentPermission;

    FeatureFlagService featureFlagService;

    CommonConfig commonConfig;

    PluginService pluginService;

    CrudModuleInstanceService crudModuleInstanceService;

    ObjectMapper objectMapper;

    CustomJSLibService customJSLibService;

    PluginRepository pluginRepository;
    ActionCollectionRepository actionCollectionRepository;
    LayoutCollectionService layoutCollectionService;

    public void createPrerequisites(ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO) {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(TRUE));

        doReturn(FALSE).when(commonConfig).isCloudHosting();

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_query_module_enabled)))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (moduleInstanceTestHelperDTO.getWorkspaceId() == null) {
            User apiUser = userService.findByEmail("api_user").block();
            createWorkspace(moduleInstanceTestHelperDTO, apiUser, moduleInstanceTestHelperDTO.getWorkspaceName());
        }

        setDefaultEnvironmentId(moduleInstanceTestHelperDTO);
        setupDatasource(moduleInstanceTestHelperDTO);
        mockPluginServiceFormData();

        if (moduleInstanceTestHelperDTO.getPageDTO() == null) {
            Application application =
                    setupApplication(moduleInstanceTestHelperDTO, moduleInstanceTestHelperDTO.getApplicationName());
            moduleInstanceTestHelperDTO.setPageDTO(getPageDTO(application));
        }

        createAndPublishPackage(moduleInstanceTestHelperDTO);

        fetchConsumableModule(moduleInstanceTestHelperDTO);

        fetchPublicAction(moduleInstanceTestHelperDTO);
    }

    private Application setupApplication(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO, String applicationName) {
        Application applicationReq = getCreateAppRequest(moduleInstanceTestHelperDTO, applicationName);
        Application application = createApp(applicationReq);
        return application;
    }

    private void setDefaultEnvironmentId(ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO) {
        String environmentId = workspaceService
                .getDefaultEnvironmentId(
                        moduleInstanceTestHelperDTO.getWorkspaceId(), environmentPermission.getExecutePermission())
                .block();
        moduleInstanceTestHelperDTO.setDefaultEnvironmentId(environmentId);
    }

    private void createWorkspace(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO, User apiUser, String workspaceName) {
        Workspace toCreate = new Workspace();
        toCreate.setName(workspaceName);

        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        moduleInstanceTestHelperDTO.setWorkspaceId(workspace.getId());
    }

    private void fetchConsumableModule(ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO) {
        ConsumablePackagesAndModulesDTO allConsumablePackages = crudPackageService
                .getAllPackagesForConsumer(moduleInstanceTestHelperDTO.getWorkspaceId())
                .block();

        Optional<ModuleDTO> consumableModuleOptional = allConsumablePackages.getModules().stream()
                .filter(moduleDTO -> moduleDTO.getType().equals(ModuleType.QUERY_MODULE))
                .findFirst();
        assertThat(consumableModuleOptional).isPresent();

        moduleInstanceTestHelperDTO.setConsumableModuleOptional(consumableModuleOptional);

        Optional<ModuleDTO> consumableJSModuleOptional = allConsumablePackages.getModules().stream()
                .filter(moduleDTO -> moduleDTO.getType().equals(ModuleType.JS_MODULE))
                .findFirst();
        assertThat(consumableJSModuleOptional).isPresent();

        moduleInstanceTestHelperDTO.setConsumableJSModuleOptional(consumableJSModuleOptional);

        // Fetch consumable JS module

    }

    private void fetchPublicAction(ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO) {
        Optional<ModuleDTO> consumableModuleOptional = moduleInstanceTestHelperDTO.getConsumableModuleOptional();

        ModuleDTO publishedModule = consumableModuleOptional.get();
        NewAction modulePublicAction = newActionService
                .findPublicActionByModuleId(publishedModule.getId(), ResourceModes.VIEW)
                .block();

        assertThat(modulePublicAction.getIsPublic()).isTrue();

        moduleInstanceTestHelperDTO.setModulePublicAction(modulePublicAction);

        // Fetch public action collection for JS module
        Optional<ModuleDTO> consumableJSModuleOptional = moduleInstanceTestHelperDTO.getConsumableJSModuleOptional();

        ModuleDTO publishedJSModule = consumableJSModuleOptional.get();
        ActionCollection modulePublicActionCollection = actionCollectionRepository
                .findPublicActionCollectionByModuleId(publishedJSModule.getId(), ResourceModes.VIEW)
                .block();

        assertThat(modulePublicActionCollection.getIsPublic()).isTrue();

        moduleInstanceTestHelperDTO.setModulePublicActionCollection(modulePublicActionCollection);
    }

    private PageDTO getPageDTO(Application application) {
        return newPageService
                .findByApplicationId(application.getId(), AclPermission.MANAGE_PAGES, false)
                .blockFirst();
    }

    private Application createApp(Application applicationReq) {
        return applicationPageService.createApplication(applicationReq).block();
    }

    private Application getCreateAppRequest(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO, String applicationName) {
        Application applicationReq = new Application();
        applicationReq.setName(applicationName);
        applicationReq.setWorkspaceId(moduleInstanceTestHelperDTO.getWorkspaceId());
        return applicationReq;
    }

    private void setupDatasource(ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO) {
        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(moduleInstanceTestHelperDTO.getWorkspaceId());
        Plugin installed_plugin =
                pluginService.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        moduleInstanceTestHelperDTO.setDatasource(datasource);

        Datasource jsDatasource = new Datasource();
        Plugin installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();
        PluginWorkspaceDTO pluginWorkspaceDTO = new PluginWorkspaceDTO();
        pluginWorkspaceDTO.setPluginId(installedJsPlugin.getId());
        pluginWorkspaceDTO.setWorkspaceId(moduleInstanceTestHelperDTO.getWorkspaceId());
        pluginWorkspaceDTO.setStatus(WorkspacePluginStatus.FREE);
        pluginService.installPlugin(pluginWorkspaceDTO).block();
        jsDatasource.setName("Default JS DS");
        jsDatasource.setWorkspaceId(moduleInstanceTestHelperDTO.getWorkspaceId());
        jsDatasource.setPluginId(installedJsPlugin.getId());

        moduleInstanceTestHelperDTO.setJsDatasource(jsDatasource);
    }

    private PackageDTO getPackageRequestDTO() {
        PackageDTO aPackage = new PackageDTO();
        aPackage.setName("Package Publish Test");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        return aPackage;
    }

    private void createAndPublishPackage(ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO) {

        PackageDTO aPackage = getPackageRequestDTO();

        PackageDTO packageDTO = createPackage(moduleInstanceTestHelperDTO, aPackage);
        moduleInstanceTestHelperDTO.setOriginPackageDTO(packageDTO);

        ModuleDTO moduleReqDTO = createModuleRequestDTO(moduleInstanceTestHelperDTO, packageDTO);
        ModuleDTO jsModuleReqDTO = createJSModuleRequestDTO(moduleInstanceTestHelperDTO, packageDTO);

        ModuleDTO sourceModuleDTO = createModule(moduleReqDTO);
        ModuleDTO sourceJSModuleDTO = createModule(jsModuleReqDTO);

        moduleInstanceTestHelperDTO.setOriginModuleDTO(sourceModuleDTO);
        moduleInstanceTestHelperDTO.setOriginJSModuleDTO(sourceJSModuleDTO);

        ActionCollectionDTO privateActionCollectionDTO = layoutCollectionService
                .createCollection(getPrivateActionCollectionDTO(moduleInstanceTestHelperDTO), null)
                .block();

        CustomJSLib jsLib = new CustomJSLib("name1", Set.of("accessor"), "url", "docsUrl", "version", "defs");
        customJSLibService
                .addJSLibsToContext(packageDTO.getId(), CreatorContextType.PACKAGE, Set.of(jsLib), null, false)
                .block();

        publishPackageService.publishPackage(packageDTO.getId()).block();
    }

    private ModuleDTO createJSModuleRequestDTO(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO, PackageDTO packageDTO) {
        ModuleDTO jsModuleDTO = new ModuleDTO();
        jsModuleDTO.setName("MyJSModule1");
        jsModuleDTO.setType(ModuleType.JS_MODULE);
        jsModuleDTO.setPackageId(packageDTO.getId());

        ModuleActionCollectionDTO moduleActionCollectionDTO = getPublicEntityOfJSModule(moduleInstanceTestHelperDTO);
        jsModuleDTO.setEntity(moduleActionCollectionDTO);

        return jsModuleDTO;
    }

    private ModuleDTO createModule(ModuleDTO moduleReqDTO) {
        return crudModuleService.createModule(moduleReqDTO).block();
    }

    private PackageDTO createPackage(ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO, PackageDTO aPackage) {
        return crudPackageService
                .createPackage(aPackage, moduleInstanceTestHelperDTO.getWorkspaceId())
                .block();
    }

    private ModuleDTO createModuleRequestDTO(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO, PackageDTO packageDTO) {
        ModuleDTO moduleReqDTO = new ModuleDTO();
        moduleReqDTO.setName("GetUsers");
        moduleReqDTO.setPackageId(packageDTO.getId());
        moduleReqDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("Select * from users where gender = Hello {{accessor.func(inputs.genderInput)}}");

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
        Datasource datasource = moduleInstanceTestHelperDTO.getDatasource();
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

    public CreateModuleInstanceResponseDTO createModuleInstance(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO) {
        return createModuleInstanceInternal(moduleInstanceTestHelperDTO, null);
    }

    public CreateModuleInstanceResponseDTO createModuleInstance(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO, String givenName) {
        return createModuleInstanceInternal(moduleInstanceTestHelperDTO, givenName);
    }

    private CreateModuleInstanceResponseDTO createModuleInstanceInternal(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO, String givenName) {

        ModuleDTO consumableModule =
                moduleInstanceTestHelperDTO.getConsumableModuleOptional().get();

        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setContextId(
                moduleInstanceTestHelperDTO.getPageDTO().getId());
        moduleInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        String name = StringUtils.hasLength(givenName) ? givenName : "UniqueName_" + System.currentTimeMillis();
        moduleInstanceReqDTO.setName(name);
        moduleInstanceTestHelperDTO.setModuleInstanceName(name);
        moduleInstanceReqDTO.setSourceModuleId(consumableModule.getId());
        return crudModuleInstanceService
                .createModuleInstance(moduleInstanceReqDTO, null)
                .block();
    }

    public CreateModuleInstanceResponseDTO createJSModuleInstance(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO, String name) {

        ModuleDTO consumableJSModule =
                moduleInstanceTestHelperDTO.getConsumableJSModuleOptional().get();

        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setContextId(
                moduleInstanceTestHelperDTO.getPageDTO().getId());
        moduleInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        moduleInstanceReqDTO.setName(name);
        moduleInstanceTestHelperDTO.setModuleInstanceName(name);
        moduleInstanceReqDTO.setSourceModuleId(consumableJSModule.getId());
        return crudModuleInstanceService
                .createModuleInstance(moduleInstanceReqDTO, null)
                .block();
    }

    private ModuleActionCollectionDTO getPrivateActionCollectionDTO(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO) {
        ModuleActionCollectionDTO actionCollectionDTO = new ModuleActionCollectionDTO();

        actionCollectionDTO.setName("PrivateJSObject1");
        actionCollectionDTO.setModuleId(
                moduleInstanceTestHelperDTO.getOriginJSModuleDTO().getId());
        actionCollectionDTO.setContextType(CreatorContextType.MODULE);
        actionCollectionDTO.setPluginId(
                moduleInstanceTestHelperDTO.getJsDatasource().getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        String body =
                """
        export default {
            myVar1: [],
            myVar2: {},
            getAllUsers () {
                return "Dummy users";
            },
            async myFun2 () {
                return "do nothing"
            }
        }
""";

        actionCollectionDTO.setBody(body);
        ActionDTO getAllUsersActionDTO = new ActionDTO();
        getAllUsersActionDTO.setName("getAllUsers");
        getAllUsersActionDTO.setActionConfiguration(new ActionConfiguration());
        getAllUsersActionDTO
                .getActionConfiguration()
                .setBody("""
    getAllUsers () {
        return "Dummy users";
    }
""");

        ActionDTO myFun2ActionDTO = new ActionDTO();
        myFun2ActionDTO.setName("myFun2");
        myFun2ActionDTO.setActionConfiguration(new ActionConfiguration());
        myFun2ActionDTO
                .getActionConfiguration()
                .setBody("""
    async myFun2 () {
        return "do nothing"
    }
""");
        actionCollectionDTO.setActions(List.of(getAllUsersActionDTO, myFun2ActionDTO));
        actionCollectionDTO.setPluginType(PluginType.JS);

        return actionCollectionDTO;
    }

    private ModuleActionCollectionDTO getPublicEntityOfJSModule(
            ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO) {
        ModuleActionCollectionDTO actionCollectionDTO = new ModuleActionCollectionDTO();

        actionCollectionDTO.setName("MyJSModule1");
        actionCollectionDTO.setPluginId(
                moduleInstanceTestHelperDTO.getJsDatasource().getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        String body =
                """
        export default {
            myVar1: [],
            myVar2: {},
            getAllUsers () {
                return PrivateJSObject1.getAllUsers.data;
            },
            async myFun2 () {
                return PrivateJSObject1.myFun2.data;
            }
        }
""";

        actionCollectionDTO.setBody(body);
        ActionDTO getAllUsersActionDTO = new ActionDTO();
        getAllUsersActionDTO.setName("getAllUsers");
        getAllUsersActionDTO.setActionConfiguration(new ActionConfiguration());
        getAllUsersActionDTO
                .getActionConfiguration()
                .setBody("""
    getAllUsers () {
        return PrivateJSObject1.getAllUsers.data;
    }
""");

        ActionDTO myFun2ActionDTO = new ActionDTO();
        myFun2ActionDTO.setName("myFun2");
        myFun2ActionDTO.setActionConfiguration(new ActionConfiguration());
        myFun2ActionDTO
                .getActionConfiguration()
                .setBody("""
    async myFun2 () {
        return PrivateJSObject1.myFun2.data;
    }
""");
        actionCollectionDTO.setActions(List.of(getAllUsersActionDTO, myFun2ActionDTO));
        actionCollectionDTO.setPluginType(PluginType.JS);

        return actionCollectionDTO;
    }
}
