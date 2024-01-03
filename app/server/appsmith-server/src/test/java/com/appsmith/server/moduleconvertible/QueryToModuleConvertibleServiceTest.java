package com.appsmith.server.moduleconvertible;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ConvertToModuleRequestDTO;
import com.appsmith.server.dtos.CreateExistingEntityToModuleResponseDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PackageDetailsDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
import com.appsmith.server.moduleinstances.moduleconvertible.EntityToModuleConverterService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.PackageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelper;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelperDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class QueryToModuleConvertibleServiceTest {
    @Autowired
    private PackageRepository packageRepository;

    @Autowired
    NewActionService newActionService;

    @Autowired
    CrudModuleInstanceService crudModuleInstanceService;

    @Autowired
    LayoutModuleInstanceService layoutModuleInstanceService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    ModuleInstanceRepository moduleInstanceRepository;

    @Autowired
    CrudModuleService crudModuleService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    EnvironmentPermission environmentPermission;

    @SpyBean
    FeatureFlagService featureFlagService;

    @SpyBean
    CommonConfig commonConfig;

    @SpyBean
    PluginService pluginService;

    ModuleInstanceTestHelper moduleInstanceTestHelper;

    ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO;

    @Autowired
    CrudPackageService crudPackageService;

    @Autowired
    PublishPackageService publishPackageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    CustomJSLibService customJSLibService;

    @Autowired
    UpdateLayoutService updateLayoutService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    EntityToModuleConverterService entityToModuleConverterService;

    @BeforeEach
    void setup() {
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
        moduleInstanceTestHelperDTO.setWorkspaceName("Convert_Query_To_Module_Workspace");
        moduleInstanceTestHelperDTO.setApplicationName("Convert_Query_To_Module_Application");
        moduleInstanceTestHelper.createPrerequisites(moduleInstanceTestHelperDTO);
    }

    @WithUserDetails(value = "api_user")
    @Test
    void
            testConvertActionToModule_withQueryAndAPI_whenNoPackageIdProvidedShouldCreateNewPackageElseShouldAddModuleToPackage()
                    throws JsonProcessingException {
        // Create Query Action
        ActionDTO queryAction = getActionDTOForQuery();
        Mono<ActionDTO> createQueryMono = layoutActionService.createSingleAction(queryAction, false);

        // Create API Action
        ActionDTO apiAction = getActionDTOForAPI();
        Mono<ActionDTO> createApiMono = layoutActionService.createSingleAction(apiAction, false);

        // References for created public entities
        AtomicReference<String> publicEntityRef1 = new AtomicReference<>();
        AtomicReference<String> publicEntityRef2 = new AtomicReference<>();

        // Verify Query Action creation
        StepVerifier.create(createQueryMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getName()).isEqualTo("TopTenUsers");
                    assertThat(createdAction.getJsonPathKeys()).containsExactlyInAnyOrder("countryInput.text", "10");
                    publicEntityRef1.set(createdAction.getId());
                })
                .verifyComplete();

        // Verify API Action creation
        StepVerifier.create(createApiMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getName()).isEqualTo("PostApi");
                    assertThat(createdAction.getJsonPathKeys()).hasSize(6);
                    publicEntityRef2.set(createdAction.getId());
                })
                .verifyComplete();

        // Set execute on load for Query Action
        layoutActionService.setExecuteOnLoad(publicEntityRef1.get(), true).block();

        // Convert Query Action to Module
        ConvertToModuleRequestDTO convertQueryToModuleRequestDTO = new ConvertToModuleRequestDTO();
        convertQueryToModuleRequestDTO.setModuleType(ModuleType.QUERY_MODULE);
        convertQueryToModuleRequestDTO.setPublicEntityId(publicEntityRef1.get());
        Mono<CreateExistingEntityToModuleResponseDTO> queryConvertedToModuleResponseDTOMono =
                entityToModuleConverterService.convertExistingEntityToModule(convertQueryToModuleRequestDTO, null);

        AtomicReference<String> publishedPackageIdRef = new AtomicReference<>();
        final DslExecutableDTO dslExecutableDTOForPostQuery = new DslExecutableDTO();
        StepVerifier.create(queryConvertedToModuleResponseDTOMono)
                .assertNext(createExistingEntityToModuleResponseDTO -> {
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
                            moduleInstanceDTO, moduleDTO, entities, dslExecutableDTOForPostQuery);
                })
                .verifyComplete();

        Package sourcePackage = verifyPackagePublishAndGetSourcePackage(publishedPackageIdRef);

        // Convert API action to module
        ConvertToModuleRequestDTO convertApiToModuleRequestDTO = new ConvertToModuleRequestDTO();
        convertApiToModuleRequestDTO.setPackageId(sourcePackage.getId());
        convertApiToModuleRequestDTO.setModuleType(ModuleType.QUERY_MODULE);
        convertApiToModuleRequestDTO.setPublicEntityId(publicEntityRef2.get());
        Mono<CreateExistingEntityToModuleResponseDTO> apiConvertedToModuleResponseDTOMono =
                entityToModuleConverterService.convertExistingEntityToModule(convertApiToModuleRequestDTO, null);

        // Update layout with direct reference to Api before the API is converted to module
        updateLayoutWithReferences();
        final DslExecutableDTO dslExecutableDTOForPostApi = new DslExecutableDTO();
        StepVerifier.create(apiConvertedToModuleResponseDTOMono)
                .assertNext(createExistingEntityToModuleResponseDTO -> {
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
                            moduleInstanceDTO, moduleDTO, entities, dslExecutableDTOForPostApi);
                })
                .verifyComplete();

        // Original query and API should be marked as deleted
        verifyDeletionOfOriginalActions(publicEntityRef1, publicEntityRef2);

        verifySourcePackagePostConversion(sourcePackage);

        // Verify onPageLoad configurations post conversion
        Layout pageLayout = newPageService
                .findById(moduleInstanceTestHelperDTO.getPageDTO().getId(), Optional.empty())
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
    }

    private Package verifyPackagePublishAndGetSourcePackage(AtomicReference<String> packageIdRef) {
        Package publishedPackage =
                packageRepository.findById(packageIdRef.get()).block();
        assertThat(publishedPackage).isNotNull();
        Package sourcePackage = packageRepository
                .findById(publishedPackage.getSourcePackageId())
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

    private void verifyDeletionOfOriginalActions(
            AtomicReference<String> publicEntityRef1, AtomicReference<String> publicEntityRef2) {
        NewAction originalDBQuery =
                newActionService.findById(publicEntityRef1.get()).block();
        assertThat(originalDBQuery).isNull();
        NewAction originalAPI =
                newActionService.findById(publicEntityRef2.get()).block();
        assertThat(originalAPI).isNull();
    }

    private void verifyModuleInstanceAssertionsForQuery(
            ModuleInstanceDTO moduleInstanceDTO,
            ModuleDTO moduleDTO,
            ModuleInstanceEntitiesDTO entities,
            DslExecutableDTO dslExecutableDTO) {
        assertThat(moduleInstanceDTO.getName()).isEqualTo("TopTenUsers");
        assertThat(moduleInstanceDTO.getUserPermissions()).hasSize(4);
        assertThat(moduleInstanceDTO.getSourceModuleId()).isEqualTo(moduleDTO.getId());
        assertThat(moduleInstanceDTO.getInputs().keySet()).containsExactlyInAnyOrder("input1", "input2");
        assertThat(moduleInstanceDTO.getInputs().values()).containsExactlyInAnyOrder("{{countryInput.text}}", "{{10}}");
        assertThat(entities.getActions()).hasSize(1);

        ActionViewDTO publicAction = entities.getActions().get(0);
        assertThat(publicAction.getIsPublic()).isTrue();
        assertThat(publicAction.getPageId())
                .isEqualTo(moduleInstanceTestHelperDTO.getPageDTO().getId());
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
            DslExecutableDTO dslExecutableDTO) {
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
                .isEqualTo(moduleInstanceTestHelperDTO.getPageDTO().getId());
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
        assertThat(moduleDTO.getUserPermissions()).hasSize(2);
        moduleDTO.getInputsForm().get(0).getChildren().forEach(moduleInput -> {
            assertThat(moduleInput.getId()).isNotNull();
            assertThat(moduleInput.getLabel()).isNotNull();
            assertThat(moduleInput.getControlType()).isEqualTo("INPUT_TEXT");
            assertThat(moduleInput.getPropertyName()).isEqualTo("inputs." + moduleInput.getLabel());
            assertThat(moduleInput.getDefaultValue()).isNotNull();
        });
    }

    private void verifyPackageAssertions(PackageDTO packageDTO) {
        assertThat(packageDTO.getId()).isNotNull();
        assertThat(packageDTO.getName()).isEqualTo("Untitled Package 1");
        assertThat(packageDTO.getColor()).isNotNull();
        assertThat(packageDTO.getLastPublishedAt()).isNotNull();
        assertThat(packageDTO.getUserPermissions()).hasSize(2);
    }

    private void updateLayoutWithReferences() throws JsonProcessingException {
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

        PageDTO testPageDTO = newPageService
                .findByApplicationId(
                        moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(), AclPermission.MANAGE_PAGES, false)
                .blockFirst();

        Layout layout = testPageDTO.getLayouts().get(0);
        layout.setDsl(parentDsl);

        LayoutDTO updatedLayout = updateLayoutService
                .updateLayout(testPageDTO.getId(), testPageDTO.getApplicationId(), layout.getId(), layout)
                .block();

        assertThat(updatedLayout).isNotNull();
    }

    private ActionDTO getActionDTOForQuery() {
        ActionDTO action = new ActionDTO();
        action.setName("TopTenUsers");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration()
                .setBody("Select * from users where country = {{countryInput.text}} LIMIT {{10}}");
        action.setPageId(moduleInstanceTestHelperDTO.getPageDTO().getId());
        action.setDatasource(moduleInstanceTestHelperDTO.getDatasource());
        action.setDynamicBindingPathList(List.of(new Property("body", null)));
        return action;
    }

    private ActionDTO getActionDTOForAPI() {
        ActionDTO action = new ActionDTO();
        action.setName("PostApi");
        action.setActionConfiguration(new ActionConfiguration());
        action.setConfirmBeforeExecute(true);
        action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
        action.getActionConfiguration()
                .setBody(
                        """
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
        action.setPageId(moduleInstanceTestHelperDTO.getPageDTO().getId());
        action.setDatasource(moduleInstanceTestHelperDTO.getDatasource());
        action.setDynamicBindingPathList(List.of(
                new Property("body", null),
                new Property("headers[0].value", null),
                new Property("headers[1].value", null),
                new Property("queryParameters[0].value", null),
                new Property("queryParameters[1].value", null)));
        return action;
    }
}
