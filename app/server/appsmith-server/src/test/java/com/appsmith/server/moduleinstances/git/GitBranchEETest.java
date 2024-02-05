package com.appsmith.server.moduleinstances.git;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.git.GitExecutor;
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
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.ModuleActionCollectionDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.GitService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.junit.jupiter.api.AfterEach;
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
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PAGE_LAYOUT;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class GitBranchEETest {

    private static final String DEFAULT_BRANCH = "defaultBranchName";
    private static String workspaceId;
    private static final GitProfile testUserProfile = new GitProfile();
    private static final String filePath = "test_assets/ImportExportServiceTest/valid-application-with-empty-page.json";
    private static String defaultEnvironmentId;
    private static Application gitConnectedApplication = new Application();
    private ModuleDTO sourceQueryModuleDTO, sourceJsModuleDTO;

    private Datasource datasource;

    @Autowired
    private GitService gitService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @SpyBean
    private ApplicationService applicationService;

    @Autowired
    private LayoutCollectionService layoutCollectionService;

    @Autowired
    private LayoutActionService layoutActionService;

    @Autowired
    private UpdateLayoutService updateLayoutService;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private ActionCollectionService actionCollectionService;

    @Autowired
    private PluginRepository pluginRepository;

    @Autowired
    private UserService userService;

    @MockBean
    private GitExecutor gitExecutor;

    @MockBean
    private GitFileUtils gitFileUtils;

    @MockBean
    private GitCloudServicesUtils gitCloudServicesUtils;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private EnvironmentPermission environmentPermission;

    @Autowired
    private ApplicationPermission applicationPermission;

    @SpyBean
    private PluginService pluginService;

    @Autowired
    private CrudModuleService crudModuleService;

    @Autowired
    private CrudPackageService crudPackageService;

    @Autowired
    private PublishPackageService publishPackageService;

    @Autowired
    private CrudModuleInstanceService crudModuleInstanceService;

    @Autowired
    private LayoutModuleInstanceService layoutModuleInstanceService;

    @Autowired
    private ObjectMapper objectMapper;

    @SpyBean
    private FeatureFlagService featureFlagService;

    @Autowired
    Gson gson;

    @BeforeEach
    public void setup() throws IOException, GitAPIException {

        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_query_module_enabled))
                .thenReturn(Mono.just(TRUE));
        mockPluginServiceFormData();

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Module Instance Git Branching Test");

        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(eq(workspaceId), Mockito.anyBoolean()))
                .thenReturn(Mono.just(-1));

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));

        testUserProfile.setAuthorEmail("test@email.com");
        testUserProfile.setAuthorName("testUser");

        setupDatasource();
        createAndPublishPackage();
    }

    @AfterEach
    public void cleanup() {
        Mockito.when(gitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));
        applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        workspaceService.archiveById(workspaceId).block();
    }

    private void setupDatasource() {
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginService.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());
    }

    private GitConnectDTO getConnectRequest(String remoteUrl, GitProfile gitProfile) {
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(remoteUrl);
        gitConnectDTO.setGitProfile(gitProfile);
        return gitConnectDTO;
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

    private Mono<ApplicationJson> createAppJson(String filePath) {
        FilePart filePart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource(filePath), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filePart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filePart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

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

    private void addModuleInstancesToApp(Application application) throws JsonProcessingException {
        PageDTO pageDTO = newPageService
                .findPageById(application.getPages().get(0).getId(), READ_PAGES, false)
                .block();

        // 1. Gather info on current consumables
        ConsumablePackagesAndModulesDTO consumables =
                crudPackageService.getAllPackagesForConsumer(workspaceId).block();

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

        // 3. Create module instances
        ModuleInstanceDTO queryInstanceReqDTO = new ModuleInstanceDTO();
        queryInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        String queryModuleInstanceName = "Query_" + System.currentTimeMillis();
        queryInstanceReqDTO.setName(queryModuleInstanceName);
        queryInstanceReqDTO.setSourceModuleId(originalQueryModule.getId());

        String branchName = null;
        if (application.getGitApplicationMetadata() != null) {
            branchName = application.getGitApplicationMetadata().getBranchName();
            queryInstanceReqDTO.setContextId(pageDTO.getDefaultResources().getPageId());
        } else {
            queryInstanceReqDTO.setContextId(pageDTO.getId());
        }

        CreateModuleInstanceResponseDTO queryInstanceResponse = crudModuleInstanceService
                .createModuleInstance(queryInstanceReqDTO, branchName)
                .block();
        ModuleInstanceDTO queryInstance = queryInstanceResponse.getModuleInstance();

        // Override the default value of the input in the app
        Map<String, String> moduleInstanceInputs = queryInstance.getInputs();
        moduleInstanceInputs.put("genderInput", "{{appGenderInput.text}}");
        moduleInstanceInputs.put("limit", "11");

        // Update the module instance with the overridden input value
        queryInstance = layoutModuleInstanceService
                .updateUnpublishedModuleInstance(queryInstance, queryInstance.getId(), Optional.empty(), false)
                .block();

        ModuleInstanceDTO jsInstanceReqDTO = new ModuleInstanceDTO();

        jsInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        String jsModuleInstanceName = "JS_" + System.currentTimeMillis();
        jsInstanceReqDTO.setName(jsModuleInstanceName);
        jsInstanceReqDTO.setSourceModuleId(originalJsModule.getId());

        if (application.getGitApplicationMetadata() != null) {
            jsInstanceReqDTO.setContextId(pageDTO.getDefaultResources().getPageId());
        } else {
            jsInstanceReqDTO.setContextId(pageDTO.getId());
        }

        CreateModuleInstanceResponseDTO jsInstanceResponse = crudModuleInstanceService
                .createModuleInstance(jsInstanceReqDTO, branchName)
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

        Layout layout = pageDTO.getLayouts().get(0);
        layout.setDsl(parentDsl);

        LayoutDTO updatedLayout = updateLayoutService
                .updateLayout(pageDTO.getId(), pageDTO.getApplicationId(), layout.getId(), layout)
                .block();
    }

    private void createAndPublishPackage() {

        PackageDTO aPackage = new PackageDTO();
        aPackage.setName("Package Auto Upgrade Test");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        PackageDTO packageDTO =
                crudPackageService.createPackage(aPackage, workspaceId).block();

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
        moduleActionDTO1.setWorkspaceId(workspaceId);
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setBody("function () { return internalJS1.func1.data }");
        moduleActionDTO1.setActionConfiguration(actionConfiguration1);
        moduleActionDTO1.setClientSideExecution(true);
        moduleActionDTO1.setDynamicBindingPathList(List.of(new Property("body", null)));

        ModuleActionDTO moduleActionDTO2 = new ModuleActionDTO();
        moduleActionDTO2.setName("func2");
        moduleActionDTO2.setWorkspaceId(workspaceId);
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
        moduleActionCollectionDTO.setWorkspaceId(workspaceId);

        moduleActionCollectionDTO.setActions(List.of(moduleActionDTO1, moduleActionDTO2));

        Plugin installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();

        moduleActionCollectionDTO.setPluginId(installedJsPlugin.getId());

        moduleReqDTO.setEntity(moduleActionCollectionDTO);
        ModuleDTO moduleDTO = crudModuleService.createModule(moduleReqDTO).block();

        // internalJS1
        ActionDTO internalJS1func1 = new ActionDTO();
        internalJS1func1.setName("func1");
        internalJS1func1.setWorkspaceId(workspaceId);
        ActionConfiguration actionConfiguration5 = new ActionConfiguration();
        actionConfiguration5.setBody("function () { return internalJS2.func1.data }");
        internalJS1func1.setActionConfiguration(actionConfiguration5);
        internalJS1func1.setClientSideExecution(true);
        internalJS1func1.setDynamicBindingPathList(List.of(new Property("body", null)));

        ActionCollectionDTO internalJS1Request = new ActionCollectionDTO();
        internalJS1Request.setPluginType(PluginType.JS);
        internalJS1Request.setName("internalJS1");
        internalJS1Request.setBody("export default { func1() { internalJS2.func1.data } }");
        internalJS1Request.setWorkspaceId(workspaceId);
        internalJS1Request.setActions(List.of(internalJS1func1));
        internalJS1Request.setPluginId(installedJsPlugin.getId());
        internalJS1Request.setContextType(CreatorContextType.MODULE);
        internalJS1Request.setModuleId(moduleDTO.getId());

        layoutCollectionService.createCollection(internalJS1Request, null).block();

        // internalJS2
        ActionDTO internalJS2func1 = new ActionDTO();
        internalJS2func1.setName("func1");
        internalJS2func1.setWorkspaceId(workspaceId);
        ActionConfiguration actionConfiguration6 = new ActionConfiguration();
        actionConfiguration6.setBody("function () { return internalQuery1.data }");
        internalJS2func1.setActionConfiguration(actionConfiguration6);
        internalJS2func1.setClientSideExecution(true);
        internalJS2func1.setDynamicBindingPathList(List.of(new Property("body", null)));

        ActionDTO internalJS2func2 = new ActionDTO();
        internalJS2func2.setName("func2");
        internalJS2func2.setWorkspaceId(workspaceId);
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
        internalJS2Request.setWorkspaceId(workspaceId);
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

    private void initializeGitMocks(GitBranchDTO createGitBranchDTO) throws IOException, GitAPIException {
        createGitBranchDTO.setBranchName("valid_branch");

        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.listBranches(any())).thenReturn(Mono.just(new ArrayList<>()));
        Mockito.when(gitExecutor.createAndCheckoutToBranch(any(), any()))
                .thenReturn(Mono.just(createGitBranchDTO.getBranchName()));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepoWithAnalytics(
                        any(Path.class), any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("System generated commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Mockito.when(gitExecutor.cloneApplication(any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(DEFAULT_BRANCH));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Mockito.doReturn(Mono.just(true)).when(gitExecutor).rebaseBranch(Mockito.any(), Mockito.anyString());
        ApplicationJson applicationJson = createAppJson(filePath).block();
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void createBranch_withModuleInstancesInBaseBranch_containsValidResourceReferences()
            throws GitAPIException, IOException {

        GitBranchDTO createGitBranchDTO = new GitBranchDTO();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        initializeGitMocks(createGitBranchDTO);

        // 1. Create app
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("moduleInstancesInBaseBranch");
        testApplication.setWorkspaceId(workspaceId);

        Application baseApplication =
                applicationPageService.createApplication(testApplication).block();

        // 2. Add module instance to base branch
        addModuleInstancesToApp(baseApplication);

        // 3. Connect to git
        Application connectedApp = gitService
                .connectApplicationToGit(baseApplication.getId(), gitConnectDTO, "origin")
                .block();

        // 4. Create new branch
        Mono<Application> branchedApplicationMono = gitService
                .createBranch(
                        connectedApp.getId(),
                        createGitBranchDTO,
                        connectedApp.getGitApplicationMetadata().getBranchName())
                .then(applicationService.findByBranchNameAndDefaultApplicationId(
                        createGitBranchDTO.getBranchName(), connectedApp.getId(), READ_APPLICATIONS))
                .cache();

        // 5. Check resource attributes in new branch
        Mono<List<NewAction>> actionListMono = branchedApplicationMono
                .flatMapMany(application -> newActionService.findAllByApplicationIdAndViewMode(
                        application.getId(), false, Optional.empty(), Optional.empty()))
                .collectList();

        Mono<List<ActionCollection>> collectionListMono = branchedApplicationMono
                .flatMapMany(application -> actionCollectionService.findAllByApplicationIdAndViewMode(
                        application.getId(), false, null, null))
                .collectList();

        Mono<List<NewPage>> pageListMono = branchedApplicationMono
                .flatMapMany(application -> newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES))
                .collectList()
                .cache();

        Mono<Application> defaultApplicationMono =
                branchedApplicationMono.flatMap(application -> applicationService.findById(
                        application.getGitApplicationMetadata().getDefaultApplicationId()));

        Mono<List<ModuleInstance>> moduleInstanceListMono = pageListMono
                .flatMapIterable(pageList -> pageList)
                .map(page -> page.getId())
                .collectList()
                .flatMapMany(pageIds -> crudModuleInstanceService.findByPageIds(pageIds, Optional.empty()))
                .collectList();

        StepVerifier.create(
                        Mono.zip(actionListMono, collectionListMono, moduleInstanceListMono, defaultApplicationMono))
                .assertNext(tuple -> {
                    List<NewAction> actionList = tuple.getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2();
                    List<ModuleInstance> moduleInstanceList = tuple.getT3();
                    Application parentApplication = tuple.getT4();

                    assertThat(moduleInstanceList).hasSize(2).allSatisfy(moduleInstance -> {
                        assertThat(moduleInstance.getDefaultResources()).isNotNull();
                        assertThat(moduleInstance.getDefaultResources().getModuleInstanceId())
                                .isNotEqualTo(moduleInstance.getId());
                        assertThat(moduleInstance.getDefaultResources().getApplicationId())
                                .isEqualTo(parentApplication.getId());
                        assertThat(moduleInstance.getDefaultResources().getBranchName())
                                .isEqualTo(createGitBranchDTO.getBranchName());
                    });

                    assertThat(actionList).hasSize(8).allSatisfy(newAction -> {
                        assertThat(newAction.getDefaultResources())
                                .as("Domain default resources")
                                .isNotNull();
                        assertThat(newAction.getDefaultResources().getActionId())
                                .as("Default action id")
                                .isNotEqualTo(newAction.getId());
                        assertThat(newAction.getDefaultResources().getApplicationId())
                                .as("Default application id")
                                .isEqualTo(parentApplication.getId());
                        assertThat(newAction.getDefaultResources().getBranchName())
                                .as("Branch name")
                                .isEqualTo(createGitBranchDTO.getBranchName());

                        assertThat(newAction.getDefaultResources().getRootModuleInstanceId())
                                .as("Default root module instance id")
                                .isNotEqualTo(newAction.getRootModuleInstanceId());
                        assertThat(newAction.getDefaultResources().getModuleInstanceId())
                                .as("Default module instance id")
                                .isNotEqualTo(newAction.getModuleInstanceId());

                        ActionDTO action = newAction.getUnpublishedAction();
                        assertThat(action.getDefaultResources())
                                .as("Dto default resources")
                                .isNotNull();
                        assertThat(action.getDefaultResources().getPageId())
                                .as("Default page id")
                                .isEqualTo(parentApplication.getPages().get(0).getId());
                        if (!StringUtils.isEmpty(action.getDefaultResources().getCollectionId())) {
                            assertThat(action.getDefaultResources().getCollectionId())
                                    .as("Default collection id")
                                    .isNotEqualTo(action.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).hasSize(3).allSatisfy(actionCollection -> {
                        assertThat(actionCollection.getDefaultResources())
                                .as("Domain default resources")
                                .isNotNull();
                        assertThat(actionCollection.getDefaultResources().getCollectionId())
                                .as("Default collection id")
                                .isNotEqualTo(actionCollection.getId());
                        assertThat(actionCollection.getDefaultResources().getApplicationId())
                                .as("Default application id")
                                .isEqualTo(parentApplication.getId());
                        assertThat(actionCollection.getDefaultResources().getBranchName())
                                .as("Branch name")
                                .isEqualTo(createGitBranchDTO.getBranchName());

                        assertThat(actionCollection.getDefaultResources().getRootModuleInstanceId())
                                .as("Default root module instance id")
                                .isNotEqualTo(actionCollection.getRootModuleInstanceId());
                        assertThat(actionCollection.getDefaultResources().getModuleInstanceId())
                                .as("Default module instance id")
                                .isNotEqualTo(actionCollection.getModuleInstanceId());

                        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                        unpublishedCollection.getDefaultToBranchedActionIdsMap().forEach((key, value) -> assertThat(key)
                                .as("Default to branched action id %s", key)
                                .isNotEqualTo(value));

                        assertThat(unpublishedCollection.getDefaultResources())
                                .as("Dto default resources")
                                .isNotNull();
                        assertThat(unpublishedCollection.getDefaultResources().getPageId())
                                .as("Default page id")
                                .isEqualTo(parentApplication.getPages().get(0).getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void createBranch_withModuleInstancesInNewBranch_containsValidReferences() throws GitAPIException, IOException {

        GitBranchDTO createGitBranchDTO = new GitBranchDTO();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        initializeGitMocks(createGitBranchDTO);

        // 1. Create app
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("moduleInstancesInNewBranch");
        testApplication.setWorkspaceId(workspaceId);

        Application baseApplication =
                applicationPageService.createApplication(testApplication).block();

        // 2. Connect to git
        Application connectedApp = gitService
                .connectApplicationToGit(baseApplication.getId(), gitConnectDTO, "origin")
                .block();

        // 3. Create new branch
        Application branchedApplication = gitService
                .createBranch(
                        connectedApp.getId(),
                        createGitBranchDTO,
                        connectedApp.getGitApplicationMetadata().getBranchName())
                .then(applicationService.findByBranchNameAndDefaultApplicationId(
                        createGitBranchDTO.getBranchName(), connectedApp.getId(), READ_APPLICATIONS))
                .block();

        // 4. Add module instance to new branch
        addModuleInstancesToApp(branchedApplication);

        // 5. Check resource attributes in new branch

        Mono<Application> applicationMono = applicationService
                .findByBranchNameAndDefaultApplicationId(
                        createGitBranchDTO.getBranchName(), connectedApp.getId(), READ_APPLICATIONS)
                .cache();

        Mono<List<NewAction>> actionListMono = applicationMono
                .flatMapMany(application -> newActionService.findAllByApplicationIdAndViewMode(
                        application.getId(), false, Optional.empty(), Optional.empty()))
                .collectList();

        Mono<List<ActionCollection>> collectionListMono = applicationMono
                .flatMapMany(application -> actionCollectionService.findAllByApplicationIdAndViewMode(
                        application.getId(), false, null, null))
                .collectList();

        Mono<List<NewPage>> pageListMono = applicationMono
                .flatMapMany(application -> newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES))
                .collectList()
                .cache();

        Mono<Application> defaultApplicationMono = applicationMono.flatMap(application -> applicationService.findById(
                application.getGitApplicationMetadata().getDefaultApplicationId()));

        Mono<List<ModuleInstance>> moduleInstanceListMono = pageListMono
                .flatMapIterable(pageList -> pageList)
                .map(page -> page.getId())
                .collectList()
                .flatMapMany(pageIds -> crudModuleInstanceService.findByPageIds(pageIds, Optional.empty()))
                .collectList();

        StepVerifier.create(
                        Mono.zip(actionListMono, collectionListMono, moduleInstanceListMono, defaultApplicationMono))
                .assertNext(tuple -> {
                    List<NewAction> actionList = tuple.getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2();
                    List<ModuleInstance> moduleInstanceList = tuple.getT3();
                    Application parentApplication = tuple.getT4();

                    assertThat(moduleInstanceList).hasSize(2).allSatisfy(moduleInstance -> {
                        assertThat(moduleInstance.getDefaultResources()).isNotNull();
                        assertThat(moduleInstance.getDefaultResources().getModuleInstanceId())
                                .isEqualTo(moduleInstance.getId());
                        assertThat(moduleInstance.getDefaultResources().getApplicationId())
                                .isEqualTo(parentApplication.getId());
                        assertThat(moduleInstance.getDefaultResources().getBranchName())
                                .isEqualTo(createGitBranchDTO.getBranchName());
                    });

                    assertThat(actionList).hasSize(8).allSatisfy(newAction -> {
                        assertThat(newAction.getDefaultResources()).isNotNull();
                        assertThat(newAction.getDefaultResources().getActionId())
                                .isEqualTo(newAction.getId());
                        assertThat(newAction.getDefaultResources().getApplicationId())
                                .isEqualTo(parentApplication.getId());
                        assertThat(newAction.getDefaultResources().getBranchName())
                                .isEqualTo(createGitBranchDTO.getBranchName());

                        assertThat(newAction.getDefaultResources().getRootModuleInstanceId())
                                .isEqualTo(newAction.getRootModuleInstanceId());
                        assertThat(newAction.getDefaultResources().getModuleInstanceId())
                                .isEqualTo(newAction.getModuleInstanceId());

                        ActionDTO action = newAction.getUnpublishedAction();
                        assertThat(action.getDefaultResources()).isNotNull();
                        assertThat(action.getDefaultResources().getPageId())
                                .isEqualTo(parentApplication.getPages().get(0).getId());
                        if (!StringUtils.isEmpty(action.getDefaultResources().getCollectionId())) {
                            assertThat(action.getDefaultResources().getCollectionId())
                                    .isEqualTo(action.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).hasSize(3).allSatisfy(actionCollection -> {
                        assertThat(actionCollection.getDefaultResources()).isNotNull();
                        assertThat(actionCollection.getDefaultResources().getCollectionId())
                                .isEqualTo(actionCollection.getId());
                        assertThat(actionCollection.getDefaultResources().getApplicationId())
                                .isEqualTo(parentApplication.getId());
                        assertThat(actionCollection.getDefaultResources().getBranchName())
                                .isEqualTo(createGitBranchDTO.getBranchName());

                        assertThat(actionCollection.getDefaultResources().getRootModuleInstanceId())
                                .isEqualTo(actionCollection.getRootModuleInstanceId());
                        assertThat(actionCollection.getDefaultResources().getModuleInstanceId())
                                .isEqualTo(actionCollection.getModuleInstanceId());

                        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                        unpublishedCollection.getDefaultToBranchedActionIdsMap().forEach((key, value) -> assertThat(key)
                                .isEqualTo(value));

                        assertThat(unpublishedCollection.getDefaultResources()).isNotNull();
                        assertThat(unpublishedCollection.getDefaultResources().getPageId())
                                .isEqualTo(parentApplication.getPages().get(0).getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void discardBranch_withModuleInstancesInNewBranch_deletedAllBranchResources() throws GitAPIException, IOException {

        GitBranchDTO createGitBranchDTO = new GitBranchDTO();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        initializeGitMocks(createGitBranchDTO);

        // 1. Create app
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("moduleInstancesDiscardedInNewBranch");
        testApplication.setWorkspaceId(workspaceId);

        Application baseApplication =
                applicationPageService.createApplication(testApplication).block();

        // 2. Connect to git
        Application connectedApp = gitService
                .connectApplicationToGit(baseApplication.getId(), gitConnectDTO, "origin")
                .block();

        // 3. Create new branch
        Application branchedApplication = gitService
                .createBranch(
                        connectedApp.getId(),
                        createGitBranchDTO,
                        connectedApp.getGitApplicationMetadata().getBranchName())
                .then(applicationService.findByBranchNameAndDefaultApplicationId(
                        createGitBranchDTO.getBranchName(), connectedApp.getId(), READ_APPLICATIONS))
                .block();

        // 4. Add module instance to new branch
        addModuleInstancesToApp(branchedApplication);

        // 5. Discard changes in new branch
        gitService
                .discardChanges(baseApplication.getId(), createGitBranchDTO.getBranchName())
                .block();

        // 6. Check resource attributes in new branch

        Mono<Application> branchedApplicationMono = applicationService
                .findByBranchNameAndDefaultApplicationId(
                        createGitBranchDTO.getBranchName(), connectedApp.getId(), READ_APPLICATIONS)
                .cache();

        Mono<List<NewAction>> actionListMono = branchedApplicationMono
                .flatMapMany(application -> newActionService.findAllByApplicationIdAndViewMode(
                        application.getId(), false, Optional.empty(), Optional.empty()))
                .collectList();

        Mono<List<ActionCollection>> collectionListMono = branchedApplicationMono
                .flatMapMany(application -> actionCollectionService.findAllByApplicationIdAndViewMode(
                        application.getId(), false, null, null))
                .collectList();

        Mono<List<NewPage>> pageListMono = branchedApplicationMono
                .flatMapMany(application -> newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES))
                .collectList()
                .cache();

        Mono<List<ModuleInstance>> moduleInstanceListMono = pageListMono
                .flatMapIterable(pageList -> pageList)
                .map(page -> page.getId())
                .collectList()
                .flatMapMany(pageIds -> crudModuleInstanceService.findByPageIds(pageIds, Optional.empty()))
                .collectList();

        StepVerifier.create(Mono.zip(pageListMono, actionListMono, collectionListMono, moduleInstanceListMono))
                .assertNext(tuple -> {
                    List<NewPage> pageList = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2();
                    List<ActionCollection> actionCollectionList = tuple.getT3();
                    List<ModuleInstance> moduleInstanceList = tuple.getT4();

                    assertThat(pageList).hasSize(1);
                    List<Layout> layouts = pageList.get(0).getUnpublishedPage().getLayouts();
                    assertThat(layouts).hasSize(1);
                    assertThat(layouts.get(0).getLayoutOnLoadActions()).isEmpty();

                    assertThat(moduleInstanceList).isEmpty();
                    assertThat(actionList).isEmpty();
                    assertThat(actionCollectionList).isEmpty();
                })
                .verifyComplete();
    }
}
