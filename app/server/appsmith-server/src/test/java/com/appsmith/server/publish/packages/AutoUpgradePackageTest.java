package com.appsmith.server.publish.packages;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.ModuleInput;
import com.appsmith.external.models.ModuleInputForm;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.ModuleActionCollectionDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleEntitiesDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.crud.entity.CrudModuleEntityService;
import com.appsmith.server.modules.helpers.ModuleUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PAGE_LAYOUT;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
class AutoUpgradePackageTest {

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @SpyBean
    FeatureFlagService featureFlagService;

    @SpyBean
    CommonConfig commonConfig;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @SpyBean
    PluginService pluginService;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    CrudPackageService crudPackageService;

    @Autowired
    CrudModuleService crudModuleService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    CrudModuleInstanceService crudModuleInstanceService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    LayoutModuleInstanceService layoutModuleInstanceService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    UpdateLayoutService updateLayoutService;

    @Autowired
    CrudModuleEntityService crudModuleEntityService;

    @Autowired
    PublishPackageService publishPackageService;

    Workspace workspace;
    String environmentId;
    Datasource datasource;

    ModuleDTO sourceQueryModuleDTO;
    ModuleDTO sourceJsModuleDTO;

    Pattern onLoadMessagePattern = Pattern.compile("\\[(.*)\\].*");

    @BeforeEach
    void setUp() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_audit_logs_enabled))
                .thenReturn(Mono.just(TRUE));

        doReturn(FALSE).when(commonConfig).isCloudHosting();

        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_query_module_enabled))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (workspace == null) {
            User apiUser = userService.findByEmail("api_user").block();
            createWorkspace(apiUser);
        }

        setDefaultEnvironmentId();
        setupDatasource();
        mockPluginServiceFormData();
        createAndPublishPackage();
    }

    private void createWorkspace(User apiUser) {
        Workspace toCreate = new Workspace();
        toCreate.setName("AutoUpgradablePackagesTest");

        workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
    }

    private void setDefaultEnvironmentId() {
        environmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();
    }

    private void setupDatasource() {
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspace.getId());
        Plugin installed_plugin =
                pluginService.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());
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

    private void createAndPublishPackage() {

        PackageDTO aPackage = new PackageDTO();
        aPackage.setName("Package Auto Upgrade Test");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        PackageDTO packageDTO =
                crudPackageService.createPackage(aPackage, workspace.getId()).block();

        sourceQueryModuleDTO = createQueryModule(packageDTO);
        sourceJsModuleDTO = createJSModule(packageDTO);

        publishPackageService.publishPackage(packageDTO.getId()).block();
    }

    /**
     * Internal connections in this module are as follows:
     * -------------------
     * Public interface:
     * - QueryModule
     * -------------------
     * Inputs:
     * - genderInput
     * - limit
     * -------------------
     *
     * @param packageDTO
     * @return
     */
    private ModuleDTO createQueryModule(PackageDTO packageDTO) {
        ModuleDTO moduleReqDTO = new ModuleDTO();
        moduleReqDTO.setName("QueryModule");
        moduleReqDTO.setPackageId(packageDTO.getId());
        moduleReqDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("Select * from users where gender = {{inputs.genderInput}} limit {{inputs.limit}}");

        moduleActionDTO.setDynamicBindingPathList(List.of(new Property("body", null)));

        // configure inputs
        List<ModuleInputForm> moduleInputsForm = new ArrayList<>();
        ModuleInputForm inputForm = new ModuleInputForm();
        inputForm.setId(UUID.randomUUID().toString());
        inputForm.setSectionName("");
        List<ModuleInput> inputChildren = new ArrayList<>();

        ModuleInput genderInput = new ModuleInput();
        genderInput.setLabel("genderInput");
        genderInput.setPropertyName("inputs.genderInput");
        genderInput.setDefaultValue("{{\"female\"}}");
        genderInput.setControlType("INPUT_TEXT");
        inputChildren.add(genderInput);

        ModuleInput limitInput = new ModuleInput();
        limitInput.setLabel("limit");
        limitInput.setPropertyName("inputs.limit");
        limitInput.setDefaultValue("10");
        limitInput.setControlType("INPUT_TEXT");
        inputChildren.add(limitInput);

        inputForm.setChildren(inputChildren);
        moduleInputsForm.add(inputForm);
        moduleReqDTO.setInputsForm(moduleInputsForm);

        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property(null, TRUE)));
        moduleActionDTO.setActionConfiguration(actionConfiguration);
        moduleActionDTO.setDatasource(datasource);
        moduleActionDTO.setPluginId(datasource.getPluginId());

        moduleReqDTO.setEntity(moduleActionDTO);
        return crudModuleService.createModule(moduleReqDTO).block();
    }

    /**
     * Internal connections in this module are as follows:
     * -------------------
     * Public interface:
     * - JSModule.func1
     * - JSModule.func2
     * -------------------
     * Private entities:
     * - internalJS1.func1
     * - internalJS2.func1
     * - internalJS2.func2
     * - internalQuery1
     * - internalQuery2
     * -------------------
     * Dependencies: (arrow indicates left depends on right)
     * - JSModule.func1 -> internalJS1.func1 -> internalJS2.func1 -> internalQuery1
     * - JSModule.func2 -> internalJS2.func2 -> internalQuery2
     * -------------------
     *
     * @param packageDTO
     * @return
     */
    private ModuleDTO createJSModule(PackageDTO packageDTO) {
        ModuleDTO moduleReqDTO = new ModuleDTO();
        moduleReqDTO.setName("JSModule");
        moduleReqDTO.setPackageId(packageDTO.getId());
        moduleReqDTO.setType(ModuleType.JS_MODULE);

        ModuleActionDTO moduleActionDTO1 = new ModuleActionDTO();
        moduleActionDTO1.setName("func1");
        moduleActionDTO1.setWorkspaceId(workspace.getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setBody("function () { return internalJS1.func1.data }");
        moduleActionDTO1.setActionConfiguration(actionConfiguration1);
        moduleActionDTO1.setClientSideExecution(true);
        moduleActionDTO1.setDynamicBindingPathList(List.of(new Property("body", null)));

        ModuleActionDTO moduleActionDTO2 = new ModuleActionDTO();
        moduleActionDTO2.setName("func2");
        moduleActionDTO2.setWorkspaceId(workspace.getId());
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setBody("function () { return internalJS2.func2.data }");
        moduleActionDTO2.setActionConfiguration(actionConfiguration2);
        moduleActionDTO2.setClientSideExecution(true);
        moduleActionDTO2.setDynamicBindingPathList(List.of(new Property("body", null)));

        ModuleActionCollectionDTO moduleActionCollectionDTO = new ModuleActionCollectionDTO();
        moduleActionCollectionDTO.setPluginType(PluginType.JS);
        moduleActionCollectionDTO.setName("JSModule");
        moduleActionCollectionDTO.setBody(
                "export default { func1() { internalJS1.func1.data }, func2() { return internalJS2.func2.data } }");
        moduleActionCollectionDTO.setWorkspaceId(workspace.getId());

        moduleActionCollectionDTO.setActions(List.of(moduleActionDTO1, moduleActionDTO2));

        Plugin installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();

        moduleActionCollectionDTO.setPluginId(installedJsPlugin.getId());

        moduleReqDTO.setEntity(moduleActionCollectionDTO);
        ModuleDTO moduleDTO = crudModuleService.createModule(moduleReqDTO).block();

        // internalJS1
        ActionDTO internalJS1func1 = new ActionDTO();
        internalJS1func1.setName("func1");
        internalJS1func1.setWorkspaceId(workspace.getId());
        ActionConfiguration actionConfiguration5 = new ActionConfiguration();
        actionConfiguration5.setBody("function () { return internalJS2.func1.data }");
        internalJS1func1.setActionConfiguration(actionConfiguration5);
        internalJS1func1.setClientSideExecution(true);
        internalJS1func1.setDynamicBindingPathList(List.of(new Property("body", null)));

        ActionCollectionDTO internalJS1Request = new ActionCollectionDTO();
        internalJS1Request.setPluginType(PluginType.JS);
        internalJS1Request.setName("internalJS1");
        internalJS1Request.setBody("export default { func1() { internalJS2.func1.data } }");
        internalJS1Request.setWorkspaceId(workspace.getId());
        internalJS1Request.setActions(List.of(internalJS1func1));
        internalJS1Request.setPluginId(installedJsPlugin.getId());
        internalJS1Request.setContextType(CreatorContextType.MODULE);
        internalJS1Request.setModuleId(moduleDTO.getId());

        layoutCollectionService.createCollection(internalJS1Request, null).block();

        // internalJS2
        ActionDTO internalJS2func1 = new ActionDTO();
        internalJS2func1.setName("func1");
        internalJS2func1.setWorkspaceId(workspace.getId());
        ActionConfiguration actionConfiguration6 = new ActionConfiguration();
        actionConfiguration6.setBody("function () { return internalQuery1.data }");
        internalJS2func1.setActionConfiguration(actionConfiguration6);
        internalJS2func1.setClientSideExecution(true);
        internalJS2func1.setDynamicBindingPathList(List.of(new Property("body", null)));

        ActionDTO internalJS2func2 = new ActionDTO();
        internalJS2func2.setName("func2");
        internalJS2func2.setWorkspaceId(workspace.getId());
        ActionConfiguration actionConfiguration7 = new ActionConfiguration();
        actionConfiguration7.setBody("function () { return internalQuery2.data }");
        internalJS2func2.setActionConfiguration(actionConfiguration7);
        internalJS2func2.setClientSideExecution(true);
        internalJS2func2.setDynamicBindingPathList(List.of(new Property("body", null)));

        ActionCollectionDTO internalJS2Request = new ActionCollectionDTO();
        internalJS2Request.setPluginType(PluginType.JS);
        internalJS2Request.setName("internalJS2");
        internalJS2Request.setBody(
                "export default { func1() { internalQuery1.data }, func2() { return internalQuery2.data } }");
        internalJS2Request.setWorkspaceId(workspace.getId());
        internalJS2Request.setActions(List.of(internalJS2func1, internalJS2func2));
        internalJS2Request.setPluginId(installedJsPlugin.getId());
        internalJS2Request.setContextType(CreatorContextType.MODULE);
        internalJS2Request.setModuleId(moduleDTO.getId());

        layoutCollectionService.createCollection(internalJS2Request, null).block();

        // internalQuery1
        ModuleActionDTO query1 = new ModuleActionDTO();
        query1.setName("internalQuery1");
        query1.setPluginId(datasource.getPluginId());
        query1.setDatasource(datasource);
        query1.setModuleId(moduleDTO.getId());
        ActionConfiguration actionConfiguration3 = new ActionConfiguration();
        actionConfiguration3.setBody("select * from users");
        query1.setActionConfiguration(actionConfiguration3);
        query1.setContextType(CreatorContextType.MODULE);

        layoutActionService.createSingleAction(query1, false).block();

        // internalQuery2
        ModuleActionDTO query2 = new ModuleActionDTO();
        query2.setName("internalQuery2");
        query2.setPluginId(datasource.getPluginId());
        query2.setDatasource(datasource);
        query2.setModuleId(moduleDTO.getId());
        ActionConfiguration actionConfiguration4 = new ActionConfiguration();
        actionConfiguration4.setBody("select * from users");
        query2.setActionConfiguration(actionConfiguration4);
        query2.setContextType(CreatorContextType.MODULE);

        layoutActionService.createSingleAction(query2, false).block();

        return moduleDTO;
    }

    /**
     * Internal connections in this module are as follows:
     * -------------------
     * Public interface:
     * - QueryModule
     * -------------------
     * Inputs:
     * - genderInput2
     * - limit
     * -------------------
     * @return
     */
    private ModuleDTO updateQueryModule() {

        // configure inputs
        // remove genderInput, add genderInput2, and change default value of limit from 10 to 12
        List<ModuleInputForm> moduleInputsForm = new ArrayList<>();
        ModuleInputForm inputForm = new ModuleInputForm();
        inputForm.setId(UUID.randomUUID().toString());
        inputForm.setSectionName("");
        List<ModuleInput> inputChildren = new ArrayList<>();

        ModuleInput genderInput = new ModuleInput();
        genderInput.setLabel("genderInput2");
        genderInput.setPropertyName("inputs.genderInput2");
        genderInput.setDefaultValue("{{\"male\"}}");
        genderInput.setControlType("INPUT_TEXT");
        inputChildren.add(genderInput);

        ModuleInput limitInput = new ModuleInput();
        limitInput.setLabel("limit");
        limitInput.setPropertyName("inputs.limit");
        limitInput.setDefaultValue("12");
        limitInput.setControlType("INPUT_TEXT");
        inputChildren.add(limitInput);

        inputForm.setChildren(inputChildren);
        moduleInputsForm.add(inputForm);
        sourceQueryModuleDTO.setInputsForm(moduleInputsForm);

        ModuleDTO updatedSourceQueryModuleDTO = crudModuleService
                .updateModule(sourceQueryModuleDTO, sourceQueryModuleDTO.getId())
                .block();

        ModuleEntitiesDTO entitiesDTO = crudModuleEntityService
                .getAllEntities(sourceQueryModuleDTO.getId(), CreatorContextType.MODULE, null)
                .block();
        assertThat(entitiesDTO.getActions()).hasSize(1);
        ActionDTO queryAction = entitiesDTO.getActions().get(0);

        queryAction
                .getActionConfiguration()
                .setBody("Select * from users where gender = {{inputs.genderInput2}} limit {{inputs.limit}}");
        crudModuleEntityService
                .updateModuleAction((ModuleActionDTO) queryAction, sourceQueryModuleDTO.getId(), queryAction.getId())
                .block();

        return updatedSourceQueryModuleDTO;
    }

    /**
     * Internal connections in this module are as follows:
     * -------------------
     * Public interface:
     * - JSModule.func2
     * - JSModule.func3
     * -------------------
     * Private entities:
     * - internalJS3.func1
     * - internalJS2.func2
     * - internalJS2.func3
     * - internalQuery2
     * - internalQuery3
     * -------------------
     * Original dependencies: (arrow indicates left depends on right)
     * - JSModule.func1 -> internalJS1.func1 -> internalJS2.func1 -> internalQuery1
     * - JSModule.func2 -> internalJS2.func2 -> internalQuery2
     * Modified dependencies: (arrow indicates left depends on right)
     * - JSModule.func3 -> internalJS2.func2 -> internalQuery2
     * - JSModule.func2 -> internalJS3.func1 -> internalJS2.func3 -> internalQuery3
     * -------------------
     *
     * @return
     */
    private ModuleDTO updateJsModule() {

        ModuleEntitiesDTO entitiesDTO = crudModuleEntityService
                .getAllEntities(sourceJsModuleDTO.getId(), CreatorContextType.MODULE, null)
                .block();
        // 1. Updates on actions
        assertThat(entitiesDTO.getActions()).hasSize(2);

        // 2. Update internal query actions to required state
        // Delete internalQuery1
        Optional<ActionDTO> internalQuery1Optional = entitiesDTO.getActions().stream()
                .filter(actionDTO -> "internalQuery1".equals(actionDTO.getName()))
                .findFirst();
        assertThat(internalQuery1Optional).isPresent();
        ActionDTO internalQuery1 = internalQuery1Optional.get();
        layoutActionService.deleteUnpublishedAction(internalQuery1.getId()).block();

        // Update internalQuery2
        Optional<ActionDTO> internalQuery2Optional = entitiesDTO.getActions().stream()
                .filter(actionDTO -> "internalQuery2".equals(actionDTO.getName()))
                .findFirst();
        assertThat(internalQuery2Optional).isPresent();
        ActionDTO internalQuery2 = internalQuery2Optional.get();
        internalQuery2.getActionConfiguration().setBody("select * from users limit 10");
        crudModuleEntityService
                .updateModuleAction((ModuleActionDTO) internalQuery2, sourceJsModuleDTO.getId(), internalQuery2.getId())
                .block();

        // Create internalQuery3
        ModuleActionDTO query3 = new ModuleActionDTO();
        query3.setName("internalQuery3");
        query3.setPluginId(datasource.getPluginId());
        query3.setDatasource(datasource);
        query3.setModuleId(sourceJsModuleDTO.getId());
        ActionConfiguration actionConfiguration3 = new ActionConfiguration();
        actionConfiguration3.setBody("select * from users limit 100");
        query3.setActionConfiguration(actionConfiguration3);
        query3.setContextType(CreatorContextType.MODULE);

        layoutActionService.createSingleAction(query3, false).block();

        // 3. Move on to collections
        assertThat(entitiesDTO.getJsCollections()).hasSize(3);

        // 4. Updates for public JSModule
        Optional<ActionCollectionDTO> jsModuleOptional = entitiesDTO.getJsCollections().stream()
                .filter(collectionDTO -> "JSModule".equals(collectionDTO.getName()))
                .findFirst();
        assertThat(jsModuleOptional).isPresent();
        ActionCollectionDTO jsModuleCollectionDTO = jsModuleOptional.get();
        assertThat(jsModuleCollectionDTO.getIsPublic()).isTrue();

        assertThat(jsModuleCollectionDTO.getActions()).hasSize(2);

        // Delete jsModule.func1, create jsModule.func3 and update jsModule.func2
        // func1
        Optional<ActionDTO> jsModuleFunc1Optional = jsModuleCollectionDTO.getActions().stream()
                .filter(actionDTO -> "JSModule.func1".equals(actionDTO.getFullyQualifiedName()))
                .findFirst();
        assertThat(jsModuleFunc1Optional).isPresent();
        ActionDTO jsModuleFunc1DTO = jsModuleFunc1Optional.get();
        assertThat(jsModuleFunc1DTO.isOnLoadMessageAllowed()).isTrue();

        // func2
        Optional<ActionDTO> jsModuleFunc2Optional = jsModuleCollectionDTO.getActions().stream()
                .filter(actionDTO -> "JSModule.func2".equals(actionDTO.getFullyQualifiedName()))
                .findFirst();
        assertThat(jsModuleFunc2Optional).isPresent();
        ActionDTO jsModuleFunc2DTO = jsModuleFunc2Optional.get();
        assertThat(jsModuleFunc2DTO.isOnLoadMessageAllowed()).isTrue();
        jsModuleFunc2DTO.getActionConfiguration().setBody("function () { return internalJS3.func1.data }");

        // func3
        ModuleActionDTO jsModuleFunc3DTO = new ModuleActionDTO();
        jsModuleFunc3DTO.setName("func3");
        jsModuleFunc3DTO.setWorkspaceId(workspace.getId());
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setBody("function () { return internalJS2.func2.data }");
        jsModuleFunc3DTO.setActionConfiguration(actionConfiguration2);
        jsModuleFunc3DTO.setClientSideExecution(true);
        jsModuleFunc3DTO.setDynamicBindingPathList(List.of(new Property("body", null)));

        // Also update JS collection body to reflect this change
        jsModuleCollectionDTO.setBody(
                "export default { func3() { return internalJS2.func2.data }, func2() { return internalJS3.func1.data } }");
        jsModuleCollectionDTO.setActions(List.of(jsModuleFunc2DTO, jsModuleFunc3DTO));

        layoutCollectionService
                .updateUnpublishedActionCollection(jsModuleCollectionDTO.getId(), jsModuleCollectionDTO, null)
                .block();

        // Delete internalJS1
        Optional<ActionCollectionDTO> internalJS1Optional = entitiesDTO.getJsCollections().stream()
                .filter(collectionDTO -> "internalJS1".equals(collectionDTO.getName()))
                .findFirst();
        assertThat(internalJS1Optional).isPresent();
        ActionCollectionDTO internalJS1CollectionDTO = internalJS1Optional.get();
        assertThat(internalJS1CollectionDTO.getIsPublic()).isFalse();

        actionCollectionService
                .deleteUnpublishedActionCollection(internalJS1CollectionDTO.getId())
                .block();

        // Update internalJS2
        // Delete func1, update func2 (nothing changes), create func3
        Optional<ActionCollectionDTO> internalJS2Optional = entitiesDTO.getJsCollections().stream()
                .filter(collectionDTO -> "internalJS2".equals(collectionDTO.getName()))
                .findFirst();
        assertThat(internalJS2Optional).isPresent();
        ActionCollectionDTO internalJS2CollectionDTO = internalJS2Optional.get();
        assertThat(internalJS2CollectionDTO.getIsPublic()).isFalse();

        // func1
        Optional<ActionDTO> internalJS2Func1Optional = internalJS2CollectionDTO.getActions().stream()
                .filter(actionDTO -> "internalJS2.func1".equals(actionDTO.getFullyQualifiedName()))
                .findFirst();
        assertThat(internalJS2Func1Optional).isPresent();
        ActionDTO internalJS2Func1DTO = internalJS2Func1Optional.get();
        assertThat(internalJS2Func1DTO.isOnLoadMessageAllowed()).isFalse();

        // func2
        Optional<ActionDTO> internalJS2Func2Optional = internalJS2CollectionDTO.getActions().stream()
                .filter(actionDTO -> "internalJS2.func2".equals(actionDTO.getFullyQualifiedName()))
                .findFirst();
        assertThat(internalJS2Func2Optional).isPresent();
        ActionDTO internalJS2Func2DTO = internalJS2Func2Optional.get();
        assertThat(internalJS2Func2DTO.isOnLoadMessageAllowed()).isFalse();

        // func3
        ModuleActionDTO internalJS2Func3DTO = new ModuleActionDTO();
        internalJS2Func3DTO.setName("func3");
        internalJS2Func3DTO.setWorkspaceId(workspace.getId());
        ActionConfiguration actionConfiguration4 = new ActionConfiguration();
        actionConfiguration4.setBody("function () { return internalQuery3.data }");
        internalJS2Func3DTO.setActionConfiguration(actionConfiguration4);
        internalJS2Func3DTO.setClientSideExecution(true);
        internalJS2Func3DTO.setDynamicBindingPathList(List.of(new Property("body", null)));

        // Also update JS collection body to reflect this change
        internalJS2CollectionDTO.setBody(
                "export default { func3() { return internalQuery3.data }, func2() { return internalQuery2.data } }");
        internalJS2CollectionDTO.setActions(List.of(internalJS2Func2DTO, internalJS2Func3DTO));

        layoutCollectionService
                .updateUnpublishedActionCollection(internalJS2CollectionDTO.getId(), internalJS2CollectionDTO, null)
                .block();

        // Create internalJS3
        ActionDTO internalJS3func1 = new ActionDTO();
        internalJS3func1.setName("func1");
        internalJS3func1.setWorkspaceId(workspace.getId());
        ActionConfiguration actionConfiguration5 = new ActionConfiguration();
        actionConfiguration5.setBody("function () { return internalJS2.func3.data }");
        internalJS3func1.setActionConfiguration(actionConfiguration5);
        internalJS3func1.setClientSideExecution(true);
        internalJS3func1.setDynamicBindingPathList(List.of(new Property("body", null)));

        Plugin installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();

        ActionCollectionDTO internalJS3Request = new ActionCollectionDTO();
        internalJS3Request.setPluginType(PluginType.JS);
        internalJS3Request.setName("internalJS3");
        internalJS3Request.setBody("export default { func1() { return internalJS2.func3.data } }");
        internalJS3Request.setWorkspaceId(workspace.getId());
        internalJS3Request.setActions(List.of(internalJS3func1));
        internalJS3Request.setPluginId(installedJsPlugin.getId());
        internalJS3Request.setContextType(CreatorContextType.MODULE);
        internalJS3Request.setModuleId(sourceJsModuleDTO.getId());

        layoutCollectionService.createCollection(internalJS3Request, null).block();

        return sourceJsModuleDTO;
    }

    @WithUserDetails(value = "api_user")
    @Test
    void testPackageRepublish_withQueryAndJSModules_shouldUpgradeInstancesAndUpdatePageLayout()
            throws JsonProcessingException {
        // 1. Gather info on current consumables
        ConsumablePackagesAndModulesDTO consumables =
                crudPackageService.getAllPackagesForConsumer(workspace.getId()).block();

        List<ModuleDTO> modules = consumables.getModules();

        Optional<ModuleDTO> originalJsModuleOptional = modules.stream()
                .filter(moduleDTO -> ModuleType.JS_MODULE.equals(moduleDTO.getType()))
                .findFirst();
        assertThat(originalJsModuleOptional).isPresent();
        ModuleDTO originalJsModule = originalJsModuleOptional.get();

        Optional<ModuleDTO> originalQueryModuleOptional = modules.stream()
                .filter(moduleDTO -> ModuleType.QUERY_MODULE.equals(moduleDTO.getType()))
                .findFirst();
        assertThat(originalQueryModuleOptional).isPresent();
        ModuleDTO originalQueryModule = originalQueryModuleOptional.get();

        // 2. Create application
        Application applicationReq = new Application();
        applicationReq.setName("Consumer application for republish");
        applicationReq.setWorkspaceId(workspace.getId());
        Application application =
                applicationPageService.createApplication(applicationReq).block();

        // 3. Create module instances
        ModuleInstanceDTO queryInstanceReqDTO = new ModuleInstanceDTO();
        queryInstanceReqDTO.setContextId(application.getPages().get(0).getId());
        queryInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        String queryModuleInstanceName = "Query_" + System.currentTimeMillis();
        queryInstanceReqDTO.setName(queryModuleInstanceName);
        queryInstanceReqDTO.setSourceModuleId(originalQueryModule.getId());
        CreateModuleInstanceResponseDTO queryInstanceResponse = crudModuleInstanceService
                .createModuleInstance(queryInstanceReqDTO, null)
                .block();
        ModuleInstanceDTO queryInstance = queryInstanceResponse.getModuleInstance();
        updatePublicActionProperties(queryInstance);

        // Override the default value of the input in the app
        Map<String, String> moduleInstanceInputs = queryInstance.getInputs();
        moduleInstanceInputs.put("genderInput", "{{appGenderInput.text}}");
        moduleInstanceInputs.put("limit", "11");

        // Update the module instance with the overridden input value
        queryInstance = layoutModuleInstanceService
                .updateUnpublishedModuleInstance(queryInstance, queryInstance.getId(), null, false)
                .block();

        ModuleInstanceDTO jsInstanceReqDTO = new ModuleInstanceDTO();
        jsInstanceReqDTO.setContextId(application.getPages().get(0).getId());
        jsInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        String jsModuleInstanceName = "JS_" + System.currentTimeMillis();
        jsInstanceReqDTO.setName(jsModuleInstanceName);
        jsInstanceReqDTO.setSourceModuleId(originalJsModule.getId());
        CreateModuleInstanceResponseDTO jsInstanceResponse = crudModuleInstanceService
                .createModuleInstance(jsInstanceReqDTO, null)
                .block();

        // 4. Update layout with references to instances
        JSONObject parentDsl = new JSONObject(
                objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));

        ArrayList children = (ArrayList) parentDsl.get("children");

        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", "text1");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "testField1")));
        temp.add(new JSONObject(Map.of("key", "testField2")));
        temp.add(new JSONObject(Map.of("key", "testField3")));
        firstWidget.put("dynamicBindingPathList", temp);
        firstWidget.put("testField1", "{{ " + queryModuleInstanceName + ".data }}");
        firstWidget.put("testField2", "{{ " + jsModuleInstanceName + ".func1.data }}");
        firstWidget.put("testField3", "{{ " + jsModuleInstanceName + ".func2.data }}");
        children.add(firstWidget);

        parentDsl.put("children", children);
        PageDTO testPageDTO = newPageService
                .findByApplicationId(application.getId(), AclPermission.MANAGE_PAGES, false)
                .blockFirst();

        Layout layout = testPageDTO.getLayouts().get(0);
        layout.setDsl(parentDsl);

        LayoutDTO updatedLayout = updateLayoutService
                .updateLayout(testPageDTO.getId(), testPageDTO.getApplicationId(), layout.getId(), layout)
                .block();

        assertThat(updatedLayout).isNotNull();

        Mono<ModuleInstanceEntitiesDTO> allEntitiesMono =
                crudModuleInstanceService.getAllEntities(testPageDTO.getId(), CreatorContextType.PAGE, null, false);

        Mono<List<ModuleInstance>> moduleInstanceListMono = crudModuleInstanceService
                .findByPageIds(List.of(testPageDTO.getId()), Optional.empty())
                .collectList();

        // 5. Gather all module action names for assertions
        String queryModule_moduleActionName = ModuleUtils.getValidName(queryModuleInstanceName, "QueryModule");
        String internalQuery1_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalQuery1");
        String internalQuery2_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalQuery2");
        String internalJS2Func1_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalJS2.func1");
        String internalJS2Func2_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalJS2.func2");
        String internalJS1Func1_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalJS1.func1");
        String jsModuleFunc2_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "JSModule.func2");
        String jsModuleFunc1_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "JSModule.func1");
        String jsModule_moduleCollectionName = ModuleUtils.getValidName(jsModuleInstanceName, "JSModule");
        String internalJS1Module_moduleCollectionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalJS1");
        String internalJS2Module_moduleCollectionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalJS2");

        // 6. Check the state of on page load actions and all instance entities after first publish
        StepVerifier.create(Mono.zip(allEntitiesMono, moduleInstanceListMono))
                .assertNext(tuple2 -> {
                    ModuleInstanceEntitiesDTO allEntities = tuple2.getT1();
                    List<ModuleInstance> moduleInstances = tuple2.getT2();

                    // 1. Check on page load layout status
                    List<Set<String>> onLoadMatrix = updatedLayout.getLayoutOnLoadActions().stream()
                            .map(layer -> layer.stream()
                                    .map(DslExecutableDTO::getName)
                                    .collect(Collectors.toSet()))
                            .collect(Collectors.toList());
                    List<Set<String>> expectedOnloadMatrix = List.of(
                            Set.of(
                                    queryModule_moduleActionName,
                                    internalQuery1_moduleActionName,
                                    internalQuery2_moduleActionName),
                            Set.of(internalJS2Func1_moduleActionName, internalJS2Func2_moduleActionName),
                            Set.of(internalJS1Func1_moduleActionName, jsModuleFunc2_moduleActionName),
                            Set.of(jsModuleFunc1_moduleActionName));
                    //
                    // assertThat(onLoadMatrix).usingRecursiveComparison().isEqualTo(expectedOnloadMatrix);
                    assertThat(updatedLayout.getActionUpdates()).hasSize(8);
                    assertThat(updatedLayout.getMessages()).hasSize(1);
                    Matcher matcher = onLoadMessagePattern.matcher(
                            updatedLayout.getMessages().get(0));
                    assertThat(matcher.find()).isTrue();
                    String onLoadActions = matcher.group(1);
                    Set<String> actionNames = Arrays.stream(onLoadActions.split(","))
                            .map(String::trim)
                            .collect(Collectors.toSet());
                    assertThat(actionNames).hasSize(3);
                    assertThat(actionNames)
                            .contains(
                                    jsModuleInstanceName + ".func1",
                                    jsModuleInstanceName + ".func2",
                                    queryModuleInstanceName);

                    // 2. Check entities show correct values
                    assertThat(allEntities).isNotNull();

                    List<ActionViewDTO> entitiesActions = allEntities.getActions();
                    assertThat(entitiesActions).hasSize(3);

                    // Check query module action
                    Optional<ActionViewDTO> queryModuleActionOptional = entitiesActions.stream()
                            .filter(actionViewDTO -> queryModule_moduleActionName.equals(actionViewDTO.getName()))
                            .findFirst();
                    assertThat(queryModuleActionOptional).isPresent();
                    ActionViewDTO queryModuleAction = queryModuleActionOptional.get();
                    assertThat(queryModuleAction.getExecuteOnLoad()).isTrue();
                    assertThat(queryModuleAction.getConfirmBeforeExecute()).isTrue();
                    assertThat(queryModuleAction.getJsonPathKeys())
                            .contains(
                                    queryModuleInstanceName + ".inputs.genderInput",
                                    queryModuleInstanceName + ".inputs.limit");

                    // Check internalQuery1 module action
                    Optional<ActionViewDTO> internalQuery1ModuleActionOptional = entitiesActions.stream()
                            .filter(actionViewDTO -> internalQuery1_moduleActionName.equals(actionViewDTO.getName()))
                            .findFirst();
                    assertThat(internalQuery1ModuleActionOptional).isPresent();
                    ActionViewDTO internalQuery1ModuleAction = internalQuery1ModuleActionOptional.get();
                    assertThat(internalQuery1ModuleAction.getExecuteOnLoad()).isTrue();
                    assertThat(internalQuery1ModuleAction.getConfirmBeforeExecute())
                            .isFalse();
                    assertThat(internalQuery1ModuleAction.getJsonPathKeys()).isNull();

                    // Check internalQuery2 module action
                    Optional<ActionViewDTO> internalQuery2ModuleActionOptional = entitiesActions.stream()
                            .filter(actionViewDTO -> internalQuery2_moduleActionName.equals(actionViewDTO.getName()))
                            .findFirst();
                    assertThat(internalQuery2ModuleActionOptional).isPresent();
                    ActionViewDTO internalQuery2ModuleAction = internalQuery2ModuleActionOptional.get();
                    assertThat(internalQuery2ModuleAction.getExecuteOnLoad()).isTrue();
                    assertThat(internalQuery2ModuleAction.getConfirmBeforeExecute())
                            .isFalse();
                    assertThat(internalQuery2ModuleAction.getJsonPathKeys()).isNull();

                    List<ActionCollectionDTO> entitiesJsCollections = allEntities.getJsCollections();
                    assertThat(entitiesJsCollections).hasSize(3);

                    // Check internalJS1 module collection
                    Optional<ActionCollectionDTO> internalJS1ModuleCollectionOptional = entitiesJsCollections.stream()
                            .filter(collectionDTO ->
                                    internalJS1Module_moduleCollectionName.equals(collectionDTO.getName()))
                            .findFirst();
                    assertThat(internalJS1ModuleCollectionOptional).isPresent();
                    ActionCollectionDTO internalJS1ModuleCollection = internalJS1ModuleCollectionOptional.get();
                    assertThat(internalJS1ModuleCollection.getBody())
                            .isEqualTo("export default { func1() { " + internalJS2Func1_moduleActionName + ".data } }");

                    // Check internalJS1.func1
                    List<ActionDTO> internalJS1ModuleActions = internalJS1ModuleCollection.getActions();
                    assertThat(internalJS1ModuleActions).hasSize(1);
                    ActionDTO internalJS1ModuleFunc1Action = internalJS1ModuleActions.get(0);
                    assertThat(internalJS1ModuleFunc1Action.getFullyQualifiedName())
                            .isEqualTo(internalJS1Func1_moduleActionName);
                    assertThat(internalJS1ModuleFunc1Action.getExecuteOnLoad()).isTrue();
                    assertThat(internalJS1ModuleFunc1Action.getConfirmBeforeExecute())
                            .isFalse();
                    assertThat(internalJS1ModuleFunc1Action
                                    .getActionConfiguration()
                                    .getBody())
                            .isEqualTo("function () { return " + internalJS2Func1_moduleActionName + ".data }");
                    assertThat(internalJS1ModuleFunc1Action.getJsonPathKeys()).hasSize(1);
                    assertThat(internalJS1ModuleFunc1Action.getJsonPathKeys())
                            .contains("function () { return " + internalJS2Func1_moduleActionName + ".data }");

                    // Check internalJS2 module collection
                    Optional<ActionCollectionDTO> internalJS2ModuleCollectionOptional = entitiesJsCollections.stream()
                            .filter(collectionDTO ->
                                    internalJS2Module_moduleCollectionName.equals(collectionDTO.getName()))
                            .findFirst();
                    assertThat(internalJS2ModuleCollectionOptional).isPresent();
                    ActionCollectionDTO internalJS2ModuleCollection = internalJS2ModuleCollectionOptional.get();
                    assertThat(internalJS2ModuleCollection.getBody())
                            .isEqualTo("export default { func1() { " + internalQuery1_moduleActionName
                                    + ".data }, func2() { return " + internalQuery2_moduleActionName + ".data } }");

                    List<ActionDTO> internalJS2ModuleActions = internalJS2ModuleCollection.getActions();
                    assertThat(internalJS2ModuleActions).hasSize(2);

                    // Check internalJS2.func1
                    Optional<ActionDTO> internalJS2ModuleFunc1ActionOptional = internalJS2ModuleActions.stream()
                            .filter(action -> internalJS2Func1_moduleActionName.equals(action.getFullyQualifiedName()))
                            .findFirst();
                    assertThat(internalJS2ModuleFunc1ActionOptional).isPresent();
                    ActionDTO internalJS2ModuleFunc1Action = internalJS2ModuleFunc1ActionOptional.get();
                    assertThat(internalJS2ModuleFunc1Action.getExecuteOnLoad()).isTrue();
                    assertThat(internalJS2ModuleFunc1Action.getConfirmBeforeExecute())
                            .isFalse();
                    assertThat(internalJS2ModuleFunc1Action
                                    .getActionConfiguration()
                                    .getBody())
                            .isEqualTo("function () { return " + internalQuery1_moduleActionName + ".data }");
                    assertThat(internalJS2ModuleFunc1Action.getJsonPathKeys()).hasSize(1);
                    assertThat(internalJS2ModuleFunc1Action.getJsonPathKeys())
                            .contains("function () { return " + internalQuery1_moduleActionName + ".data }");

                    // Check internalJS2.func2
                    Optional<ActionDTO> internalJS2ModuleFunc2ActionOptional = internalJS2ModuleActions.stream()
                            .filter(action -> internalJS2Func2_moduleActionName.equals(action.getFullyQualifiedName()))
                            .findFirst();
                    assertThat(internalJS2ModuleFunc2ActionOptional).isPresent();
                    ActionDTO internalJS2ModuleFunc2Action = internalJS2ModuleFunc2ActionOptional.get();
                    assertThat(internalJS2ModuleFunc2Action.getExecuteOnLoad()).isTrue();
                    assertThat(internalJS2ModuleFunc2Action.getConfirmBeforeExecute())
                            .isFalse();
                    assertThat(internalJS2ModuleFunc2Action
                                    .getActionConfiguration()
                                    .getBody())
                            .isEqualTo("function () { return " + internalQuery2_moduleActionName + ".data }");
                    assertThat(internalJS2ModuleFunc2Action.getJsonPathKeys()).hasSize(1);
                    assertThat(internalJS2ModuleFunc2Action.getJsonPathKeys())
                            .contains("function () { return " + internalQuery2_moduleActionName + ".data }");

                    // Check JSModule module collection
                    Optional<ActionCollectionDTO> jsModuleCollectionOptional = entitiesJsCollections.stream()
                            .filter(collectionDTO -> jsModule_moduleCollectionName.equals(collectionDTO.getName()))
                            .findFirst();
                    assertThat(jsModuleCollectionOptional).isPresent();
                    ActionCollectionDTO jsModuleCollection = jsModuleCollectionOptional.get();
                    assertThat(jsModuleCollection.getBody())
                            .isEqualTo("export default { func1() { " + internalJS1Func1_moduleActionName
                                    + ".data }, func2() { return " + internalJS2Func2_moduleActionName + ".data } }");

                    List<ActionDTO> jsModuleActions = jsModuleCollection.getActions();
                    assertThat(jsModuleActions).hasSize(2);

                    // Check jsModule.func1
                    Optional<ActionDTO> jsModuleFunc1ActionOptional = jsModuleActions.stream()
                            .filter(action -> jsModuleFunc1_moduleActionName.equals(action.getFullyQualifiedName()))
                            .findFirst();
                    assertThat(jsModuleFunc1ActionOptional).isPresent();
                    ActionDTO jsModuleFunc1Action = jsModuleFunc1ActionOptional.get();
                    assertThat(jsModuleFunc1Action.getExecuteOnLoad()).isTrue();
                    assertThat(jsModuleFunc1Action.getConfirmBeforeExecute()).isFalse();
                    assertThat(jsModuleFunc1Action.getActionConfiguration().getBody())
                            .isEqualTo("function () { return " + internalJS1Func1_moduleActionName + ".data }");
                    assertThat(jsModuleFunc1Action.getJsonPathKeys()).hasSize(1);
                    assertThat(jsModuleFunc1Action.getJsonPathKeys())
                            .contains("function () { return " + internalJS1Func1_moduleActionName + ".data }");

                    // Check jsModule.func2
                    Optional<ActionDTO> jsModuleFunc2ActionOptional = jsModuleActions.stream()
                            .filter(action -> jsModuleFunc2_moduleActionName.equals(action.getFullyQualifiedName()))
                            .findFirst();
                    assertThat(jsModuleFunc2ActionOptional).isPresent();
                    ActionDTO jsModuleFunc2Action = jsModuleFunc2ActionOptional.get();
                    assertThat(jsModuleFunc2Action.getExecuteOnLoad()).isTrue();
                    assertThat(jsModuleFunc2Action.getConfirmBeforeExecute()).isFalse();
                    assertThat(jsModuleFunc2Action.getActionConfiguration().getBody())
                            .isEqualTo("function () { return " + internalJS2Func2_moduleActionName + ".data }");
                    assertThat(jsModuleFunc2Action.getJsonPathKeys()).hasSize(1);
                    assertThat(jsModuleFunc2Action.getJsonPathKeys())
                            .contains("function () { return " + internalJS2Func2_moduleActionName + ".data }");

                    // 3. Check module instances
                    assertThat(moduleInstances).hasSize(2);

                    // Check query module instance
                    Optional<ModuleInstance> queryInstanceOptional = moduleInstances.stream()
                            .filter(instance -> ModuleType.QUERY_MODULE.equals(instance.getType()))
                            .findFirst();
                    assertThat(queryInstanceOptional).isPresent();
                    ModuleInstanceDTO queryInstanceDTO =
                            queryInstanceOptional.get().getUnpublishedModuleInstance();
                    assertThat(queryInstanceDTO.getName()).isEqualTo(queryModuleInstanceName);
                    assertThat(queryInstanceDTO.getInputs()).hasSize(2);
                    assertThat(queryInstanceDTO.getInputs())
                            .containsExactlyInAnyOrderEntriesOf(
                                    Map.of("genderInput", "{{appGenderInput.text}}", "limit", "11"));
                    assertThat(queryInstanceDTO.getJsonPathKeys()).hasSize(1);
                    assertThat(queryInstanceDTO.getJsonPathKeys()).contains("appGenderInput.text");

                    // Check js module instance
                    Optional<ModuleInstance> jsInstanceOptional = moduleInstances.stream()
                            .filter(instance -> ModuleType.JS_MODULE.equals(instance.getType()))
                            .findFirst();
                    assertThat(jsInstanceOptional).isPresent();
                    ModuleInstanceDTO jsInstanceDTO = jsInstanceOptional.get().getUnpublishedModuleInstance();
                    assertThat(jsInstanceDTO.getName()).isEqualTo(jsModuleInstanceName);
                    assertThat(jsInstanceDTO.getInputs()).isEmpty();
                    assertThat(jsInstanceDTO.getJsonPathKeys()).isEmpty();
                })
                .verifyComplete();

        // 7. Now modify the package itself to conform to new state
        updateQueryModule();
        updateJsModule();

        // 8. Publish package to new version, auto upgrade should trigger
        publishPackageService
                .publishPackage(sourceQueryModuleDTO.getPackageId())
                .block();

        // 9. Check updated version on new consumables
        ConsumablePackagesAndModulesDTO newConsumables =
                crudPackageService.getAllPackagesForConsumer(workspace.getId()).block();

        assertThat(newConsumables.getPackages()).hasSize(1);
        assertThat(newConsumables.getModules()).hasSize(2);

        // TODO : send version in package consumable and verify value here

        // 10. Gather new module action names for assertions
        String internalQuery3_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalQuery3");
        String internalJS2Func3_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalJS2.func3");
        String internalJS3Func1_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalJS3.func1");
        String jsModuleFunc3_moduleActionName = ModuleUtils.getValidName(jsModuleInstanceName, "JSModule.func3");
        String internalJS3Module_moduleCollectionName = ModuleUtils.getValidName(jsModuleInstanceName, "internalJS3");

        // 11. Check layout for consumer
        PageDTO updatedPageDTO =
                applicationPageService.getPage(testPageDTO.getId(), false).block();
        Layout newLayout = updatedPageDTO.getLayouts().get(0);

        assertThat(newLayout).isNotNull();
        List<Set<String>> newOnLoadMatrix = newLayout.getLayoutOnLoadActions().stream()
                .map(layer -> layer.stream().map(DslExecutableDTO::getName).collect(Collectors.toSet()))
                .collect(Collectors.toList());
        List<Set<String>> expectedNewOnloadMatrix = List.of(
                Set.of(queryModule_moduleActionName, internalQuery3_moduleActionName),
                Set.of(internalJS2Func3_moduleActionName),
                Set.of(internalJS3Func1_moduleActionName),
                Set.of(jsModuleFunc2_moduleActionName));
        //        assertThat(newOnLoadMatrix).usingRecursiveComparison().isEqualTo(expectedNewOnloadMatrix);

        // 12. Check all entities for consumer
        Mono<ModuleInstanceEntitiesDTO> newAllEntitiesMono =
                crudModuleInstanceService.getAllEntities(testPageDTO.getId(), CreatorContextType.PAGE, null, false);

        Mono<List<ModuleInstance>> newModuleInstanceListMono = crudModuleInstanceService
                .findByPageIds(List.of(testPageDTO.getId()), Optional.empty())
                .collectList();

        StepVerifier.create(Mono.zip(newAllEntitiesMono, newModuleInstanceListMono))
                .assertNext(tuple2 -> {
                    ModuleInstanceEntitiesDTO allEntities = tuple2.getT1();
                    List<ModuleInstance> moduleInstances = tuple2.getT2();

                    // 2. Check entities show correct values
                    assertThat(allEntities).isNotNull();

                    List<ActionViewDTO> entitiesActions = allEntities.getActions();
                    assertThat(entitiesActions).hasSize(3);

                    // Check query module action
                    Optional<ActionViewDTO> queryModuleActionOptional = entitiesActions.stream()
                            .filter(actionViewDTO -> queryModule_moduleActionName.equals(actionViewDTO.getName()))
                            .findFirst();
                    assertThat(queryModuleActionOptional).isPresent();
                    ActionViewDTO queryModuleAction = queryModuleActionOptional.get();
                    assertThat(queryModuleAction.getExecuteOnLoad()).isTrue();
                    assertThat(queryModuleAction.getConfirmBeforeExecute()).isTrue();
                    // ------- jsonPathKey for genderInput should be replaced
                    assertThat(queryModuleAction.getJsonPathKeys())
                            .contains(
                                    queryModuleInstanceName + ".inputs.genderInput2",
                                    queryModuleInstanceName + ".inputs.limit");

                    // ------- internalQuery1 will be absent

                    // Check internalQuery2 module action
                    Optional<ActionViewDTO> internalQuery2ModuleActionOptional = entitiesActions.stream()
                            .filter(actionViewDTO -> internalQuery2_moduleActionName.equals(actionViewDTO.getName()))
                            .findFirst();
                    assertThat(internalQuery2ModuleActionOptional).isPresent();
                    ActionViewDTO internalQuery2ModuleAction = internalQuery2ModuleActionOptional.get();
                    assertThat(internalQuery2ModuleAction.getExecuteOnLoad()).isFalse();
                    assertThat(internalQuery2ModuleAction.getConfirmBeforeExecute())
                            .isFalse();
                    assertThat(internalQuery2ModuleAction.getJsonPathKeys()).isNull();

                    // Check internalQuery3 module action
                    // ------- this is new
                    Optional<ActionViewDTO> internalQuery3ModuleActionOptional = entitiesActions.stream()
                            .filter(actionViewDTO -> internalQuery3_moduleActionName.equals(actionViewDTO.getName()))
                            .findFirst();
                    assertThat(internalQuery3ModuleActionOptional).isPresent();
                    ActionViewDTO internalQuery3ModuleAction = internalQuery3ModuleActionOptional.get();
                    assertThat(internalQuery3ModuleAction.getExecuteOnLoad()).isTrue();
                    assertThat(internalQuery3ModuleAction.getConfirmBeforeExecute())
                            .isFalse();
                    assertThat(internalQuery3ModuleAction.getJsonPathKeys()).isNull();

                    List<ActionCollectionDTO> entitiesJsCollections = allEntities.getJsCollections();
                    assertThat(entitiesJsCollections).hasSize(3);

                    // ------- internalJS1 will be absent

                    // Check internalJS2 module collection
                    Optional<ActionCollectionDTO> internalJS2ModuleCollectionOptional = entitiesJsCollections.stream()
                            .filter(collectionDTO ->
                                    internalJS2Module_moduleCollectionName.equals(collectionDTO.getName()))
                            .findFirst();
                    assertThat(internalJS2ModuleCollectionOptional).isPresent();
                    ActionCollectionDTO internalJS2ModuleCollection = internalJS2ModuleCollectionOptional.get();
                    assertThat(internalJS2ModuleCollection.getBody())
                            .isEqualTo("export default { func3() { return " + internalQuery3_moduleActionName
                                    + ".data }, func2() { return " + internalQuery2_moduleActionName + ".data } }");

                    List<ActionDTO> internalJS2ModuleActions = internalJS2ModuleCollection.getActions();
                    assertThat(internalJS2ModuleActions).hasSize(2);

                    // ------ internalJS2.func1 will be absent

                    // Check internalJS2.func2
                    Optional<ActionDTO> internalJS2ModuleFunc2ActionOptional = internalJS2ModuleActions.stream()
                            .filter(action -> internalJS2Func2_moduleActionName.equals(action.getFullyQualifiedName()))
                            .findFirst();
                    assertThat(internalJS2ModuleFunc2ActionOptional).isPresent();
                    ActionDTO internalJS2ModuleFunc2Action = internalJS2ModuleFunc2ActionOptional.get();
                    assertThat(internalJS2ModuleFunc2Action.getExecuteOnLoad()).isFalse();
                    assertThat(internalJS2ModuleFunc2Action.getConfirmBeforeExecute())
                            .isFalse();
                    assertThat(internalJS2ModuleFunc2Action
                                    .getActionConfiguration()
                                    .getBody())
                            .isEqualTo("function () { return " + internalQuery2_moduleActionName + ".data }");
                    assertThat(internalJS2ModuleFunc2Action.getJsonPathKeys()).hasSize(1);
                    assertThat(internalJS2ModuleFunc2Action.getJsonPathKeys())
                            .contains("function () { return " + internalQuery2_moduleActionName + ".data }");

                    // Check internalJS2.func3
                    Optional<ActionDTO> internalJS2ModuleFunc3ActionOptional = internalJS2ModuleActions.stream()
                            .filter(action -> internalJS2Func3_moduleActionName.equals(action.getFullyQualifiedName()))
                            .findFirst();
                    assertThat(internalJS2ModuleFunc3ActionOptional).isPresent();
                    ActionDTO internalJS2ModuleFunc3Action = internalJS2ModuleFunc3ActionOptional.get();
                    assertThat(internalJS2ModuleFunc3Action.getExecuteOnLoad()).isTrue();
                    assertThat(internalJS2ModuleFunc3Action.getConfirmBeforeExecute())
                            .isFalse();
                    assertThat(internalJS2ModuleFunc3Action
                                    .getActionConfiguration()
                                    .getBody())
                            .isEqualTo("function () { return " + internalQuery3_moduleActionName + ".data }");
                    assertThat(internalJS2ModuleFunc3Action.getJsonPathKeys()).hasSize(1);
                    assertThat(internalJS2ModuleFunc3Action.getJsonPathKeys())
                            .contains("function () { return " + internalQuery3_moduleActionName + ".data }");

                    // Check internalJS3 module collection
                    Optional<ActionCollectionDTO> internalJS3ModuleCollectionOptional = entitiesJsCollections.stream()
                            .filter(collectionDTO ->
                                    internalJS3Module_moduleCollectionName.equals(collectionDTO.getName()))
                            .findFirst();
                    assertThat(internalJS3ModuleCollectionOptional).isPresent();
                    ActionCollectionDTO internalJS3ModuleCollection = internalJS3ModuleCollectionOptional.get();
                    assertThat(internalJS3ModuleCollection.getBody())
                            .isEqualTo("export default { func1() { return " + internalJS2Func3_moduleActionName
                                    + ".data } }");

                    // Check internalJS3.func1
                    List<ActionDTO> internalJS3ModuleActions = internalJS3ModuleCollection.getActions();
                    assertThat(internalJS3ModuleActions).hasSize(1);
                    ActionDTO internalJS3ModuleFunc1Action = internalJS3ModuleActions.get(0);
                    assertThat(internalJS3ModuleFunc1Action.getFullyQualifiedName())
                            .isEqualTo(internalJS3Func1_moduleActionName);
                    assertThat(internalJS3ModuleFunc1Action.getExecuteOnLoad()).isTrue();
                    assertThat(internalJS3ModuleFunc1Action.getConfirmBeforeExecute())
                            .isFalse();
                    assertThat(internalJS3ModuleFunc1Action
                                    .getActionConfiguration()
                                    .getBody())
                            .isEqualTo("function () { return " + internalJS2Func3_moduleActionName + ".data }");
                    assertThat(internalJS3ModuleFunc1Action.getJsonPathKeys()).hasSize(1);
                    assertThat(internalJS3ModuleFunc1Action.getJsonPathKeys())
                            .contains("function () { return " + internalJS2Func3_moduleActionName + ".data }");

                    // Check JSModule module collection
                    Optional<ActionCollectionDTO> jsModuleCollectionOptional = entitiesJsCollections.stream()
                            .filter(collectionDTO -> jsModule_moduleCollectionName.equals(collectionDTO.getName()))
                            .findFirst();
                    assertThat(jsModuleCollectionOptional).isPresent();
                    ActionCollectionDTO jsModuleCollection = jsModuleCollectionOptional.get();
                    assertThat(jsModuleCollection.getBody())
                            .isEqualTo("export default { func3() { return " + internalJS2Func2_moduleActionName
                                    + ".data }, func2() { return " + internalJS3Func1_moduleActionName + ".data } }");

                    List<ActionDTO> jsModuleActions = jsModuleCollection.getActions();
                    assertThat(jsModuleActions).hasSize(2);

                    // ------ jsModule.func1 will be absent

                    // Check jsModule.func2
                    Optional<ActionDTO> jsModuleFunc2ActionOptional = jsModuleActions.stream()
                            .filter(action -> jsModuleFunc2_moduleActionName.equals(action.getFullyQualifiedName()))
                            .findFirst();
                    assertThat(jsModuleFunc2ActionOptional).isPresent();
                    ActionDTO jsModuleFunc2Action = jsModuleFunc2ActionOptional.get();
                    assertThat(jsModuleFunc2Action.getExecuteOnLoad()).isTrue();
                    assertThat(jsModuleFunc2Action.getConfirmBeforeExecute()).isFalse();
                    assertThat(jsModuleFunc2Action.getActionConfiguration().getBody())
                            .isEqualTo("function () { return " + internalJS3Func1_moduleActionName + ".data }");
                    assertThat(jsModuleFunc2Action.getJsonPathKeys()).hasSize(1);
                    assertThat(jsModuleFunc2Action.getJsonPathKeys())
                            .contains("function () { return " + internalJS3Func1_moduleActionName + ".data }");

                    // Check jsModule.func3
                    Optional<ActionDTO> jsModuleFunc3ActionOptional = jsModuleActions.stream()
                            .filter(action -> jsModuleFunc3_moduleActionName.equals(action.getFullyQualifiedName()))
                            .findFirst();
                    assertThat(jsModuleFunc3ActionOptional).isPresent();
                    ActionDTO jsModuleFunc3Action = jsModuleFunc3ActionOptional.get();
                    assertThat(jsModuleFunc3Action.getExecuteOnLoad()).isFalse();
                    assertThat(jsModuleFunc3Action.getConfirmBeforeExecute()).isFalse();
                    assertThat(jsModuleFunc3Action.getActionConfiguration().getBody())
                            .isEqualTo("function () { return " + internalJS2Func2_moduleActionName + ".data }");
                    assertThat(jsModuleFunc3Action.getJsonPathKeys()).hasSize(1);
                    assertThat(jsModuleFunc3Action.getJsonPathKeys())
                            .contains("function () { return " + internalJS2Func2_moduleActionName + ".data }");

                    // 3. Check module instances
                    assertThat(moduleInstances).hasSize(2);

                    // Check query module instance
                    Optional<ModuleInstance> queryInstanceOptional = moduleInstances.stream()
                            .filter(instance -> ModuleType.QUERY_MODULE.equals(instance.getType()))
                            .findFirst();
                    assertThat(queryInstanceOptional).isPresent();
                    ModuleInstanceDTO queryInstanceDTO =
                            queryInstanceOptional.get().getUnpublishedModuleInstance();
                    assertThat(queryInstanceDTO.getName()).isEqualTo(queryModuleInstanceName);
                    assertThat(queryInstanceDTO.getInputs()).hasSize(2);
                    assertThat(queryInstanceDTO.getInputs())
                            .containsExactlyInAnyOrderEntriesOf(Map.of("genderInput2", "{{\"male\"}}", "limit", "11"));
                    assertThat(queryInstanceDTO.getJsonPathKeys()).contains("\"male\"");

                    // Check js module instance
                    Optional<ModuleInstance> jsInstanceOptional = moduleInstances.stream()
                            .filter(instance -> ModuleType.JS_MODULE.equals(instance.getType()))
                            .findFirst();
                    assertThat(jsInstanceOptional).isPresent();
                    ModuleInstanceDTO jsInstanceDTO = jsInstanceOptional.get().getUnpublishedModuleInstance();
                    assertThat(jsInstanceDTO.getName()).isEqualTo(jsModuleInstanceName);
                    assertThat(jsInstanceDTO.getInputs()).isEmpty();
                    assertThat(jsInstanceDTO.getJsonPathKeys()).isEmpty();
                })
                .verifyComplete();
    }

    // TODO:
    //  - Add permission checks in test
    //  - On load logic seems non-deterministic, revisit
    //  - Default resources related checks for every domain

    private void updatePublicActionProperties(ModuleInstanceDTO moduleInstanceDTO) {
        List<ActionDTO> actions = newActionService
                .findAllUnpublishedComposedActionsByRootModuleInstanceId(moduleInstanceDTO.getId(), READ_ACTIONS, false)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .collectList()
                .block();

        assertThat(actions).isNotNull();
        assert actions != null;
        assertThat(actions).hasSize(1);
        ActionDTO moduleActionDTO = actions.get(0);
        moduleActionDTO.setConfirmBeforeExecute(true);

        Tuple2<ActionDTO, NewAction> updatedAction = newActionService
                .updateUnpublishedActionWithoutAnalytics(
                        moduleActionDTO.getId(), moduleActionDTO, Optional.of(MANAGE_ACTIONS))
                .block();

        assert updatedAction != null;
        assertThat(updatedAction.getT2().getUnpublishedAction().getConfirmBeforeExecute())
                .isTrue();
    }
}
