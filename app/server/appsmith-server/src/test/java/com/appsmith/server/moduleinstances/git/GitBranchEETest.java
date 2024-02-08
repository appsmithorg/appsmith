package com.appsmith.server.moduleinstances.git;

import com.appsmith.external.dtos.DslExecutableDTO;
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
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.ConvertToModuleRequestDTO;
import com.appsmith.server.dtos.CreateExistingEntityToModuleResponseDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.ModuleActionCollectionDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PackageDetailsDTO;
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
import com.appsmith.server.moduleinstances.moduleconvertible.EntityToModuleConverterService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.repositories.PackageRepository;
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
import org.springframework.http.HttpMethod;
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
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

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

    @Autowired
    EntityToModuleConverterService entityToModuleConverterService;

    @Autowired
    PackageRepository packageRepository;

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
        String jsonString =
                """
                {
                  "setting": [
                    {
                      "sectionName": "",
                      "id": 1,
                      "children": [
                        {
                          "label": "Run query on page load",
                          "configProperty": "executeOnLoad",
                          "controlType": "SWITCH",
                          "subtitle": "Will refresh data each time the page is loaded"
                        },
                        {
                          "label": "Request confirmation before running query",
                          "configProperty": "confirmBeforeExecute",
                          "controlType": "SWITCH",
                          "subtitle": "Ask confirmation from the user each time before refreshing data"
                        },
                        {
                          "label": "Use Prepared Statement",
                          "subtitle": "Turning on Prepared Statement makes your queries resilient against bad things like SQL injections. However, it cannot be used if your dynamic binding contains any SQL keywords like 'SELECT', 'WHERE', 'AND', etc.",
                          "configProperty": "actionConfiguration.pluginSpecifiedTemplates[0].value",
                          "controlType": "SWITCH",
                          "initialValue": true
                        },
                        {
                          "label": "Query timeout (in milliseconds)",
                          "subtitle": "Maximum time after which the query will return",
                          "configProperty": "actionConfiguration.timeoutInMillisecond",
                          "controlType": "INPUT_TEXT",
                          "dataType": "NUMBER"
                        }
                      ]
                    }
                  ]
                }""";
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
        createGitBranchDTO.setBranchName("valid_branch");
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
                        assertThat(newAction.getDefaultResources().getApplicationId())
                                .as("Default application id")
                                .isEqualTo(parentApplication.getId());
                        assertThat(newAction.getDefaultResources().getBranchName())
                                .as("Branch name")
                                .isEqualTo(createGitBranchDTO.getBranchName());

                        if (!Boolean.FALSE.equals(newAction.getIsPublic())) {
                            assertThat(newAction.getDefaultResources().getActionId())
                                    .as("Default action id")
                                    .isNotEqualTo(newAction.getId());
                            assertThat(newAction.getDefaultResources().getRootModuleInstanceId())
                                    .as("Default root module instance id")
                                    .isNotEqualTo(newAction.getRootModuleInstanceId());
                            assertThat(newAction.getDefaultResources().getModuleInstanceId())
                                    .as("Default module instance id")
                                    .isNotEqualTo(newAction.getModuleInstanceId());
                        } else {
                            assertThat(newAction.getDefaultResources().getActionId())
                                    .as("Default action id")
                                    .isEqualTo(newAction.getId());
                            assertThat(newAction.getDefaultResources().getRootModuleInstanceId())
                                    .as("Default root module instance id")
                                    .isEqualTo(newAction.getRootModuleInstanceId());
                            assertThat(newAction.getDefaultResources().getModuleInstanceId())
                                    .as("Default module instance id")
                                    .isEqualTo(newAction.getModuleInstanceId());
                        }

                        ActionDTO action = newAction.getUnpublishedAction();
                        assertThat(action.getDefaultResources())
                                .as("Dto default resources")
                                .isNotNull();
                        assertThat(action.getDefaultResources().getPageId())
                                .as("Default page id")
                                .isEqualTo(parentApplication.getPages().get(0).getId());
                        if (!StringUtils.isEmpty(action.getDefaultResources().getCollectionId())) {
                            if (!Boolean.FALSE.equals(newAction.getIsPublic())) {
                                assertThat(action.getDefaultResources().getCollectionId())
                                        .as("Default collection id")
                                        .isNotEqualTo(action.getCollectionId());
                            } else {
                                assertThat(action.getDefaultResources().getCollectionId())
                                        .as("Default collection id")
                                        .isEqualTo(action.getCollectionId());
                            }
                        }
                    });

                    assertThat(actionCollectionList).hasSize(3).allSatisfy(actionCollection -> {
                        assertThat(actionCollection.getDefaultResources())
                                .as("Domain default resources")
                                .isNotNull();
                        assertThat(actionCollection.getDefaultResources().getApplicationId())
                                .as("Default application id")
                                .isEqualTo(parentApplication.getId());
                        assertThat(actionCollection.getDefaultResources().getBranchName())
                                .as("Branch name")
                                .isEqualTo(createGitBranchDTO.getBranchName());

                        if (!Boolean.FALSE.equals(actionCollection.getIsPublic())) {
                            assertThat(actionCollection.getDefaultResources().getCollectionId())
                                    .as("Default collection id")
                                    .isNotEqualTo(actionCollection.getId());
                            assertThat(actionCollection.getDefaultResources().getRootModuleInstanceId())
                                    .as("Default root module instance id")
                                    .isNotEqualTo(actionCollection.getRootModuleInstanceId());
                            assertThat(actionCollection.getDefaultResources().getModuleInstanceId())
                                    .as("Default module instance id")
                                    .isNotEqualTo(actionCollection.getModuleInstanceId());
                        } else {
                            assertThat(actionCollection.getDefaultResources().getCollectionId())
                                    .as("Default collection id")
                                    .isEqualTo(actionCollection.getId());
                            assertThat(actionCollection.getDefaultResources().getRootModuleInstanceId())
                                    .as("Default root module instance id")
                                    .isEqualTo(actionCollection.getRootModuleInstanceId());
                            assertThat(actionCollection.getDefaultResources().getModuleInstanceId())
                                    .as("Default module instance id")
                                    .isEqualTo(actionCollection.getModuleInstanceId());
                        }

                        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                        if (!Boolean.FALSE.equals(actionCollection.getIsPublic())) {
                            unpublishedCollection
                                    .getDefaultToBranchedActionIdsMap()
                                    .forEach((key, value) -> assertThat(key)
                                            .as("Default to branched action id %s", key)
                                            .isNotEqualTo(value));
                        } else {
                            unpublishedCollection
                                    .getDefaultToBranchedActionIdsMap()
                                    .forEach((key, value) -> assertThat(key)
                                            .as("Default to branched action id %s", key)
                                            .isEqualTo(value));
                        }

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
        createGitBranchDTO.setBranchName("valid_branch");
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
        createGitBranchDTO.setBranchName("valid_branch");
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

    @WithUserDetails(value = "api_user")
    @Test
    void testConvertActionToModule_withQueryAndApiInBranch_containsValidReferences()
            throws IOException, GitAPIException {
        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("valid_branch");
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

        // References for created public entities
        AtomicReference<String> basePublicEntityRef1 = new AtomicReference<>();
        AtomicReference<String> branchedPublicEntityRef2 = new AtomicReference<>();

        // 3. Create Query Action in base application
        ActionDTO queryAction = getActionDTOForQuery(baseApplication);
        Mono<ActionDTO> createQueryMono =
                layoutActionService.createSingleActionWithBranch(queryAction, gitApplicationMetadata.getBranchName());
        // 3.1. Verify Query Action creation in base application
        StepVerifier.create(createQueryMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getName()).isEqualTo("TopTenUsers");
                    assertThat(createdAction.getJsonPathKeys()).containsExactlyInAnyOrder("countryInput.text", "10");
                    basePublicEntityRef1.set(createdAction.getId());
                })
                .verifyComplete();
        // 3.2. Set execute on load for Query Action
        layoutActionService
                .setExecuteOnLoad(basePublicEntityRef1.get(), gitApplicationMetadata.getBranchName(), true)
                .block();

        // 4. Create new branch from base branch
        Application branchedApplication = gitService
                .createBranch(
                        connectedApp.getId(),
                        createGitBranchDTO,
                        connectedApp.getGitApplicationMetadata().getBranchName())
                .then(applicationService.findByBranchNameAndDefaultApplicationId(
                        createGitBranchDTO.getBranchName(), connectedApp.getId(), READ_APPLICATIONS))
                .block();

        NewAction branchedQuery = newActionService
                .findByBranchNameAndDefaultActionId(
                        createGitBranchDTO.getBranchName(), basePublicEntityRef1.get(), null)
                .block();
        assertThat(branchedQuery).isNotNull();
        assertThat(branchedQuery.getId()).isNotEqualTo(basePublicEntityRef1.get());
        String branchedPublicQueryId = branchedQuery.getId();
        assertThat(branchedQuery.getDefaultResources().getBranchName()).isEqualTo(createGitBranchDTO.getBranchName());
        assertThat(branchedQuery.getDefaultResources().getActionId()).isEqualTo(basePublicEntityRef1.get());

        // 5. Create API Action
        ActionDTO apiAction = getActionDTOForAPI(branchedApplication);
        Mono<ActionDTO> createApiMono =
                layoutActionService.createSingleActionWithBranch(apiAction, createGitBranchDTO.getBranchName());

        // 5.1. Verify API Action creation
        StepVerifier.create(createApiMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getName()).isEqualTo("PostApi");
                    assertThat(createdAction.getJsonPathKeys()).hasSize(6);
                    branchedPublicEntityRef2.set(createdAction.getId());
                })
                .verifyComplete();

        // 6. Convert Query Action to Module in branch
        ConvertToModuleRequestDTO convertQueryToModuleRequestDTO = new ConvertToModuleRequestDTO();
        convertQueryToModuleRequestDTO.setModuleType(ModuleType.QUERY_MODULE);
        convertQueryToModuleRequestDTO.setPublicEntityId(basePublicEntityRef1.get());
        Mono<CreateExistingEntityToModuleResponseDTO> queryConvertedToModuleResponseDTOMono =
                entityToModuleConverterService.convertExistingEntityToModule(
                        convertQueryToModuleRequestDTO, createGitBranchDTO.getBranchName());

        Mono<PageDTO> branchedPageMono = newPageService.findPageById(
                branchedApplication.getPages().get(0).getId(), READ_PAGES, false);

        AtomicReference<String> publishedPackageIdRef = new AtomicReference<>();
        final DslExecutableDTO dslExecutableDTOForPostQuery = new DslExecutableDTO();
        StepVerifier.create(Mono.zip(queryConvertedToModuleResponseDTOMono, branchedPageMono))
                .assertNext(tuple2 -> {
                    CreateExistingEntityToModuleResponseDTO createExistingEntityToModuleResponseDTO = tuple2.getT1();
                    PageDTO branchedPageDTO = tuple2.getT2();
                    ModuleInstanceDTO moduleInstanceDTO = createExistingEntityToModuleResponseDTO
                            .getModuleInstanceData()
                            .getModuleInstance();
                    ModuleDTO moduleDTO = createExistingEntityToModuleResponseDTO.getModule();
                    PackageDTO packageDTO = createExistingEntityToModuleResponseDTO.getPackageData();
                    ModuleInstanceEntitiesDTO entities = createExistingEntityToModuleResponseDTO
                            .getModuleInstanceData()
                            .getEntities();
                    assertThat(moduleInstanceDTO).isNotNull();
                    assertThat(moduleDTO).isNotNull();
                    assertThat(packageDTO).isNotNull();
                    assertThat(entities).isNotNull();

                    // Package assertions
                    publishedPackageIdRef.set(packageDTO.getId());
                    verifyPackageAssertions(packageDTO);

                    // Module assertions
                    verifyModuleAssertions(moduleDTO, "TopTenUsersModule", 2);

                    // ModuleInstance assertions
                    verifyModuleInstanceAssertionsForQuery(
                            moduleInstanceDTO, moduleDTO, entities, dslExecutableDTOForPostQuery, branchedPageDTO);
                })
                .verifyComplete();

        Package sourcePackage = verifyPackagePublishAndGetSourcePackage(publishedPackageIdRef);

        verifyLastPublishedAtGreaterThanModifiedAt(sourcePackage.getId());

        // 7. Convert API action to module in branch
        ConvertToModuleRequestDTO convertApiToModuleRequestDTO = new ConvertToModuleRequestDTO();
        convertApiToModuleRequestDTO.setPackageId(sourcePackage.getId());
        convertApiToModuleRequestDTO.setModuleType(ModuleType.QUERY_MODULE);
        convertApiToModuleRequestDTO.setPublicEntityId(branchedPublicEntityRef2.get());
        Mono<CreateExistingEntityToModuleResponseDTO> apiConvertedToModuleResponseDTOMono =
                entityToModuleConverterService.convertExistingEntityToModule(
                        convertApiToModuleRequestDTO, createGitBranchDTO.getBranchName());

        // 8. Update layout with direct reference to Api before the API is converted to module in branch
        updateLayoutWithReferences(branchedApplication);
        final DslExecutableDTO dslExecutableDTOForPostApi = new DslExecutableDTO();
        StepVerifier.create(Mono.zip(apiConvertedToModuleResponseDTOMono, branchedPageMono))
                .assertNext(tuple2 -> {
                    CreateExistingEntityToModuleResponseDTO createExistingEntityToModuleResponseDTO = tuple2.getT1();
                    PageDTO branchedPageDTO = tuple2.getT2();
                    ModuleInstanceDTO moduleInstanceDTO = createExistingEntityToModuleResponseDTO
                            .getModuleInstanceData()
                            .getModuleInstance();
                    ModuleDTO moduleDTO = createExistingEntityToModuleResponseDTO.getModule();
                    PackageDTO packageDTO = createExistingEntityToModuleResponseDTO.getPackageData();
                    ModuleInstanceEntitiesDTO entities = createExistingEntityToModuleResponseDTO
                            .getModuleInstanceData()
                            .getEntities();
                    assertThat(moduleInstanceDTO).isNotNull();
                    assertThat(moduleDTO).isNotNull();
                    assertThat(packageDTO).isNotNull();
                    assertThat(entities).isNotNull();

                    // Package assertions
                    verifyPackageAssertions(packageDTO);

                    // Module assertions
                    verifyModuleAssertions(moduleDTO, "PostApiModule", 6);

                    // ModuleInstance assertions
                    verifyModuleInstanceAssertionsForAPI(
                            moduleInstanceDTO, moduleDTO, entities, dslExecutableDTOForPostApi, branchedPageDTO);
                })
                .verifyComplete();

        applicationPageService
                .publish(baseApplication.getId(), "valid_branch", true)
                .block();
        // 9. Verify deletion of the original query and API in branch
        verifyDeletionOfOriginalActions(branchedPublicQueryId, branchedPublicEntityRef2.get());

        // 10. Verify the newly created modules and the associated package
        verifySourcePackagePostConversion(sourcePackage);

        // 11. Verify onPageLoad configurations post conversion
        PageDTO pageDTO = getPageDTO(branchedApplication);
        Layout pageLayout = newPageService
                .findById(pageDTO.getId(), Optional.empty())
                .block()
                .getUnpublishedPage()
                .getLayouts()
                .get(0);

        assertThat(pageLayout.getLayoutOnLoadActions()).hasSize(1);
        final Set<DslExecutableDTO> firstSet =
                pageLayout.getLayoutOnLoadActions().get(0);
        assertThat(firstSet).hasSize(2);

        Map<String, DslExecutableDTO> mapForDslExecutableAsReference = Map.of(
                "_$TopTenUsers$_TopTenUsersModule",
                dslExecutableDTOForPostQuery,
                "_$PostApi$_PostApiModule",
                dslExecutableDTOForPostApi);

        firstSet.stream().allMatch(actualDslExecutableDTO -> {
            DslExecutableDTO expectedDslExecutableDTO =
                    mapForDslExecutableAsReference.get(actualDslExecutableDTO.getName());
            assertThat(expectedDslExecutableDTO.getName()).isEqualTo(actualDslExecutableDTO.getName());
            assertThat(expectedDslExecutableDTO.getId()).isEqualTo(actualDslExecutableDTO.getId());
            assertThat(expectedDslExecutableDTO.getConfirmBeforeExecute())
                    .isEqualTo(actualDslExecutableDTO.getConfirmBeforeExecute());
            assertThat(expectedDslExecutableDTO.getPluginType()).isEqualTo(actualDslExecutableDTO.getPluginType());
            return true;
        });

        // 12. Check resource attributes in new branch

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
                    assertThat(layouts.get(0).getLayoutOnLoadActions()).isNotEmpty();

                    assertThat(moduleInstanceList).hasSize(2);
                    assertThat(actionList).hasSize(2);
                    assertThat(actionCollectionList).isEmpty();
                })
                .verifyComplete();

        // 13. Create another branch from the child branch
        GitBranchDTO secondBranchDTO = new GitBranchDTO();
        secondBranchDTO.setBranchName("foo");

        initializeGitMocks(secondBranchDTO);

        Application fooBranchedApplication = gitService
                .createBranch(connectedApp.getId(), secondBranchDTO, "valid_branch")
                .then(applicationService.findByBranchNameAndDefaultApplicationId(
                        secondBranchDTO.getBranchName(), connectedApp.getId(), READ_APPLICATIONS))
                .block();

        Mono<Application> fooBranchedApplicationMono = applicationService
                .findByBranchNameAndDefaultApplicationId(
                        secondBranchDTO.getBranchName(), connectedApp.getId(), READ_APPLICATIONS)
                .cache();

        Mono<List<NewAction>> fooActionListMono = fooBranchedApplicationMono
                .flatMapMany(application -> newActionService.findAllByApplicationIdAndViewMode(
                        application.getId(), false, Optional.empty(), Optional.empty()))
                .collectList();

        Mono<List<ActionCollection>> fooCollectionListMono = fooBranchedApplicationMono
                .flatMapMany(application -> actionCollectionService.findAllByApplicationIdAndViewMode(
                        application.getId(), false, null, null))
                .collectList();

        Mono<List<NewPage>> fooPageListMono = fooBranchedApplicationMono
                .flatMapMany(application -> newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES))
                .collectList()
                .cache();

        Mono<List<ModuleInstance>> fooModuleInstanceListMono = fooPageListMono
                .flatMapIterable(pageList -> pageList)
                .map(page -> page.getId())
                .collectList()
                .flatMapMany(pageIds -> crudModuleInstanceService.findByPageIds(pageIds, Optional.empty()))
                .collectList();

        StepVerifier.create(
                        Mono.zip(fooPageListMono, fooActionListMono, fooCollectionListMono, fooModuleInstanceListMono))
                .assertNext(tuple -> {
                    List<NewPage> pageList = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2();
                    List<ActionCollection> actionCollectionList = tuple.getT3();
                    List<ModuleInstance> moduleInstanceList = tuple.getT4();

                    assertThat(pageList).hasSize(1);
                    List<Layout> layouts = pageList.get(0).getUnpublishedPage().getLayouts();
                    assertThat(layouts).hasSize(1);
                    assertThat(layouts.get(0).getLayoutOnLoadActions()).isNotEmpty();

                    assertThat(moduleInstanceList).hasSize(2);
                    assertThat(actionList).hasSize(2);
                    assertThat(actionCollectionList).isEmpty();
                })
                .verifyComplete();

        // 14. Verify action count in base branch and other branches
        // 14.1. base branch
        List<NewAction> baseBranchActions = newActionService
                .findAllByApplicationIdAndViewMode(baseApplication.getId(), false, Optional.empty(), Optional.empty())
                .collectList()
                .block();

        assertThat(baseBranchActions).hasSize(1);

        // 14.2. valid_branch
        List<NewAction> firstBranchActions = newActionService
                .findAllByApplicationIdAndViewMode(
                        branchedApplication.getId(), false, Optional.empty(), Optional.empty())
                .filter(newAction -> newAction.getRootModuleInstanceId() == null)
                .collectList()
                .block();

        assertThat(firstBranchActions).hasSize(0);

        ModuleInstanceEntitiesDTO branchedEntities = crudModuleInstanceService
                .getAllEntities(
                        getPageDTO(baseApplication).getId(),
                        CreatorContextType.PAGE,
                        createGitBranchDTO.getBranchName(),
                        false)
                .block();
        List<ModuleInstanceDTO> branchedModuleInstances = layoutModuleInstanceService
                .getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
                        getPageDTO(baseApplication).getId(),
                        CreatorContextType.PAGE,
                        ResourceModes.EDIT,
                        createGitBranchDTO.getBranchName())
                .block();

        assertThat(branchedModuleInstances).hasSize(2);
        assertThat(branchedEntities.getActions()).hasSize(2);
        assertThat(branchedEntities.getJsCollections()).hasSize(0);

        // 14.3. foo
        List<NewAction> fooBranchActions = newActionService
                .findAllByApplicationIdAndViewMode(
                        branchedApplication.getId(), false, Optional.empty(), Optional.empty())
                .filter(newAction -> newAction.getRootModuleInstanceId() == null)
                .collectList()
                .block();

        assertThat(fooBranchActions).hasSize(0);

        ModuleInstanceEntitiesDTO fooBranchedEntities = crudModuleInstanceService
                .getAllEntities(
                        getPageDTO(baseApplication).getId(),
                        CreatorContextType.PAGE,
                        createGitBranchDTO.getBranchName(),
                        false)
                .block();
        List<ModuleInstanceDTO> fooBranchedModuleInstances = layoutModuleInstanceService
                .getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
                        getPageDTO(baseApplication).getId(),
                        CreatorContextType.PAGE,
                        ResourceModes.EDIT,
                        createGitBranchDTO.getBranchName())
                .block();

        assertThat(fooBranchedModuleInstances).hasSize(2);
        assertThat(fooBranchedEntities.getActions()).hasSize(2);
        assertThat(fooBranchedEntities.getJsCollections()).hasSize(0);
    }

    private void verifyLastPublishedAtGreaterThanModifiedAt(String originPackageId) {
        PackageDetailsDTO packageDetailsDTO =
                crudPackageService.getPackageDetails(originPackageId).block();
        Instant lastPublishedAt =
                Instant.parse(packageDetailsDTO.getPackageData().getLastPublishedAt());
        Instant modifiedAt = Instant.parse(packageDetailsDTO.getPackageData().getModifiedAt());
        assertThat(lastPublishedAt.isAfter(modifiedAt));
    }

    private Package verifyPackagePublishAndGetSourcePackage(AtomicReference<String> packageIdRef) {
        Package publishedPackage =
                packageRepository.findById(packageIdRef.get()).block();
        assertThat(publishedPackage).isNotNull();
        Package sourcePackage = packageRepository
                .findById(publishedPackage.getOriginPackageId())
                .block();
        assertThat(sourcePackage).isNotNull();
        return sourcePackage;
    }

    private void verifySourcePackagePostConversion(Package sourcePackage) {
        PackageDetailsDTO sourcePackageDetails =
                crudPackageService.getPackageDetails(sourcePackage.getId()).block();
        assertThat(sourcePackageDetails.getPackageData()).isNotNull();
        assertThat(sourcePackageDetails.getModules()).hasSize(2);
        assertThat(sourcePackageDetails.getModulesMetadata()).hasSize(2);
    }

    private void verifyDeletionOfOriginalActions(String publicQueryEntityRef1, String publicApiEntityRef2) {
        NewAction originalDBQuery =
                newActionService.findById(publicQueryEntityRef1).block();
        assertThat(originalDBQuery).isNull();
        NewAction originalAPI = newActionService.findById(publicApiEntityRef2).block();
        assertThat(originalAPI).isNull();
    }

    private void verifyModuleInstanceAssertionsForQuery(
            ModuleInstanceDTO moduleInstanceDTO,
            ModuleDTO moduleDTO,
            ModuleInstanceEntitiesDTO entities,
            DslExecutableDTO dslExecutableDTO,
            PageDTO pageDTO) {
        assertThat(moduleInstanceDTO.getName()).isEqualTo("TopTenUsers");
        assertThat(moduleInstanceDTO.getUserPermissions()).hasSize(4);
        assertThat(moduleInstanceDTO.getSourceModuleId()).isEqualTo(moduleDTO.getId());
        assertThat(moduleInstanceDTO.getInputs().keySet()).containsExactlyInAnyOrder("input1", "input2");
        assertThat(moduleInstanceDTO.getInputs().values()).containsExactlyInAnyOrder("{{countryInput.text}}", "{{10}}");
        assertThat(entities.getActions()).hasSize(1);

        ActionViewDTO publicAction = entities.getActions().get(0);
        assertThat(publicAction.getIsPublic()).isTrue();
        assertThat(publicAction.getPageId())
                .isEqualTo(pageDTO.getDefaultResources().getPageId());
        assertThat(publicAction.getName()).isEqualTo("_$TopTenUsers$_TopTenUsersModule");
        assertThat(publicAction.getModuleInstanceId()).isEqualTo(moduleInstanceDTO.getId());
        assertThat(publicAction.getExecuteOnLoad()).isTrue();
        assertThat(publicAction.getConfirmBeforeExecute()).isFalse();

        dslExecutableDTO.setId(publicAction.getId());
        dslExecutableDTO.setName(publicAction.getName());
        dslExecutableDTO.setConfirmBeforeExecute(publicAction.getConfirmBeforeExecute());
        dslExecutableDTO.setPluginType(PluginType.API);
    }

    private void verifyModuleInstanceAssertionsForAPI(
            ModuleInstanceDTO moduleInstanceDTO,
            ModuleDTO moduleDTO,
            ModuleInstanceEntitiesDTO entities,
            DslExecutableDTO dslExecutableDTO,
            PageDTO pageDTO) {
        assertThat(moduleInstanceDTO.getName()).isEqualTo("PostApi");
        assertThat(moduleInstanceDTO.getUserPermissions()).hasSize(4);
        assertThat(moduleInstanceDTO.getSourceModuleId()).isEqualTo(moduleDTO.getId());
        assertThat(moduleInstanceDTO.getInputs()).hasSize(6);
        assertThat(moduleInstanceDTO.getInputs().keySet())
                .containsExactlyInAnyOrder("input1", "input2", "input3", "input4", "input5", "input6");
        assertThat(moduleInstanceDTO.getInputs().values())
                .containsExactlyInAnyOrder(
                        "{{bodyInput2.text}}",
                        "{{bodyInput1.text}}",
                        "{{headerInput1.text}}",
                        "{{headerInput2.text}}",
                        "{{paramInput1.text}}",
                        "{{\"value of param2\"}}");
        assertThat(entities.getActions()).hasSize(1);

        ActionViewDTO publicAction = entities.getActions().get(0);
        assertThat(publicAction.getIsPublic()).isTrue();
        assertThat(publicAction.getPageId())
                .isEqualTo(pageDTO.getDefaultResources().getPageId());
        assertThat(publicAction.getName()).isEqualTo("_$PostApi$_PostApiModule");
        assertThat(publicAction.getModuleInstanceId()).isEqualTo(moduleInstanceDTO.getId());
        assertThat(publicAction.getExecuteOnLoad()).isTrue();
        assertThat(publicAction.getConfirmBeforeExecute()).isTrue();

        dslExecutableDTO.setId(publicAction.getId());
        dslExecutableDTO.setName(publicAction.getName());
        dslExecutableDTO.setConfirmBeforeExecute(publicAction.getConfirmBeforeExecute());
        dslExecutableDTO.setPluginType(PluginType.API);
    }

    private void verifyModuleAssertions(ModuleDTO moduleDTO, String expectedName, int numberOfInputs) {
        assertThat(moduleDTO.getName()).isEqualTo(expectedName);
        assertThat(moduleDTO.getInputsForm().get(0).getChildren()).hasSize(numberOfInputs);
        assertThat(moduleDTO.getUserPermissions()).hasSize(6);
        assertThat(moduleDTO.getOriginModuleId()).isNotNull();
        moduleDTO.getInputsForm().get(0).getChildren().forEach(moduleInput -> {
            assertThat(moduleInput.getId()).isNotNull();
            assertThat(moduleInput.getLabel()).isNotNull();
            assertThat(moduleInput.getControlType()).isEqualTo("INPUT_TEXT");
            assertThat(moduleInput.getPropertyName()).isEqualTo("inputs." + moduleInput.getLabel());
            assertThat(moduleInput.getDefaultValue()).isEmpty();
        });
    }

    private void verifyPackageAssertions(PackageDTO packageDTO) {
        assertThat(packageDTO.getId()).isNotNull();
        assertThat(packageDTO.getName()).isEqualTo("Untitled Package 1");
        assertThat(packageDTO.getColor()).isNotNull();
        assertThat(packageDTO.getLastPublishedAt()).isNotNull();
        assertThat(packageDTO.getUserPermissions()).hasSize(8);
    }

    private void updateLayoutWithReferences(Application branchedApplication) throws JsonProcessingException {
        // Update layout with references to instances
        JSONObject parentDsl = new JSONObject(
                objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));
        ArrayList children = (ArrayList) parentDsl.get("children");

        // Add a widget to the layout
        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", "text1");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "testField1")));
        firstWidget.put("dynamicBindingPathList", temp);
        firstWidget.put("testField1", "{{PostApi.data }}");
        children.add(firstWidget);

        PageDTO testPageDTO = getPageDTO(branchedApplication);

        Layout layout = testPageDTO.getLayouts().get(0);
        layout.setDsl(parentDsl);

        LayoutDTO updatedLayout = updateLayoutService
                .updateLayout(testPageDTO.getId(), testPageDTO.getApplicationId(), layout.getId(), layout)
                .block();

        assertThat(updatedLayout).isNotNull();
    }

    private ActionDTO getActionDTOForQuery(Application branchedApplication) {
        PageDTO pageDTO = getPageDTO(branchedApplication);
        ActionDTO action = new ActionDTO();
        action.setName("TopTenUsers");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration()
                .setBody("Select * from users where country = {{countryInput.text}} LIMIT {{10}}");
        action.setPageId(pageDTO.getDefaultResources().getPageId());
        action.setDatasource(datasource);
        action.setDynamicBindingPathList(List.of(new Property("body", null)));
        return action;
    }

    private PageDTO getPageDTO(Application branchedApplication) {
        PageDTO pageDTO = newPageService
                .findPageById(branchedApplication.getPages().get(0).getId(), READ_PAGES, false)
                .block();
        return pageDTO;
    }

    private ActionDTO getActionDTOForAPI(Application branchedApplication) {
        PageDTO pageDTO = getPageDTO(branchedApplication);
        ActionDTO action = new ActionDTO();
        action.setName("PostApi");
        action.setActionConfiguration(new ActionConfiguration());
        action.setConfirmBeforeExecute(true);
        action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
        action.getActionConfiguration()
                .setBody("""
{
    "bodyKey1": {{bodyInput1.text}},
    "bodyKey2": {{bodyInput2.text}}
}
""");
        action.getActionConfiguration()
                .setHeaders(List.of(
                        new Property("header1", "{{headerInput1.text}}"),
                        new Property("header2", "{{headerInput2.text}}")));
        action.getActionConfiguration()
                .setQueryParameters(List.of(
                        new Property("param1", "{{paramInput1.text}}"),
                        new Property("param2", "{{\"value of param2\"}}")));
        action.setPageId(pageDTO.getDefaultResources().getPageId());
        action.setDatasource(datasource);
        action.setDynamicBindingPathList(List.of(
                new Property("body", null),
                new Property("headers[0].value", null),
                new Property("headers[1].value", null),
                new Property("queryParameters[0].value", null),
                new Property("queryParameters[1].value", null)));
        return action;
    }
}
