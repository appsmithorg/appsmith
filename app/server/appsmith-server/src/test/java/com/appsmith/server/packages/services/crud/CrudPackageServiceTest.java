package com.appsmith.server.packages.services.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PublishingMetaDTO;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.packages.publish.PublishPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.publishable.PackagePublishableService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
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
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static com.appsmith.server.constants.ce.FieldNameCE.DEVELOPER;
import static com.appsmith.server.constants.ce.FieldNameCE.VIEWER;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class CrudPackageServiceTest {

    @Autowired
    CrudPackageService crudPackageService;

    @Autowired
    CrudModuleService crudModuleService;

    @Autowired
    PublishPackageService publishPackageService;

    @Autowired
    PackagePublishableService<Module> modulePackagePublishableService;

    @Autowired
    PackagePublishableService<NewAction> newActionPackagePublishableService;

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
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    PackagePermission packagePermission;

    ObjectMapper objectMapper = new ObjectMapper();

    String firstWorkspaceId;
    String secondWorkspaceId;
    String defaultEnvironmentId;

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
        toCreate.setName("PackageServiceTest");

        if (firstWorkspaceId == null) {
            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            firstWorkspaceId = workspace.getId();

            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(firstWorkspaceId, environmentPermission.getExecutePermission())
                    .block();
        }
        Workspace secondWS = new Workspace();
        secondWS.setName("PackageServiceTest2");
        if (secondWorkspaceId == null) {
            Workspace workspace =
                    workspaceService.create(secondWS, apiUser, Boolean.FALSE).block();
            secondWorkspaceId = workspace.getId();

            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(secondWorkspaceId, environmentPermission.getExecutePermission())
                    .block();
        }
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

    @WithUserDetails(value = "api_user")
    @Test
    public void testCreateAndReadPackageWithValidInput() {
        final PackageDTO firstPackage = new PackageDTO();
        firstPackage.setName("Package X");
        firstPackage.setColor("#C2DAF0");
        firstPackage.setIcon("rupee");

        final PackageDTO secondPackage = new PackageDTO();
        secondPackage.setName("Package Y");
        secondPackage.setIcon("rupee");

        // create package test
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(firstPackage, firstWorkspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    assertThat(createdPackage.getName()).isEqualTo(firstPackage.getName());
                    assertThat(createdPackage.getCustomJSLibs()).hasSize(0);
                })
                .verifyComplete();

        Mono<PackageDTO> secondPackageMono = crudPackageService.createPackage(secondPackage, firstWorkspaceId);

        StepVerifier.create(secondPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    assertThat(createdPackage.getName()).isEqualTo(secondPackage.getName());
                    assertThat(createdPackage.getCustomJSLibs()).hasSize(0);
                })
                .verifyComplete();

        Mono<Workspace> workspaceResponse = workspaceService.findById(firstWorkspaceId, READ_WORKSPACES);

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        // get all packages in workspace home test
        Mono<List<PackageDTO>> allPackagesMono = crudPackageService.getAllPackages();

        AtomicReference<String> packageId = new AtomicReference<>();
        StepVerifier.create(Mono.zip(allPackagesMono, defaultPermissionGroupsMono))
                .assertNext(tuple2 -> {
                    List<PackageDTO> allPackages = tuple2.getT1();
                    assertThat(allPackages).isNotNull();
                    allPackages = allPackages.stream()
                            .filter(packageDTO -> packageDTO.getWorkspaceId().equals(firstWorkspaceId))
                            .collect(Collectors.toList());
                    assertThat(allPackages).size().isEqualTo(2);
                    packageId.set(allPackages.get(0).getId());

                    // assert permissions
                    List<PermissionGroup> permissionGroups = tuple2.getT2();
                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR)
                                    && permissionGroup.getDefaultDomainId().equals(firstWorkspaceId))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER)
                                    && permissionGroup.getDefaultDomainId().equals(firstWorkspaceId))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER)
                                    && permissionGroup.getDefaultDomainId().equals(firstWorkspaceId))
                            .findFirst()
                            .get();

                    Policy publishPackagePolicy = Policy.builder()
                            .permission(packagePermission.getPublishPermission().getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy readPackagePolicy = Policy.builder()
                            .permission(packagePermission.getReadPermission().getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    Policy deletePackagePolicy = Policy.builder()
                            .permission(packagePermission.getDeletePermission().getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy createModulesPolicy = Policy.builder()
                            .permission(packagePermission
                                    .getModuleCreatePermission()
                                    .getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    allPackages.forEach(packageDTO -> {
                        assertThat(packageDTO.getPolicies())
                                .contains(
                                        publishPackagePolicy,
                                        readPackagePolicy,
                                        deletePackagePolicy,
                                        createModulesPolicy);
                    });
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void shouldNotCreatePackageWhenPackageNameIsNotProvided() {
        final PackageDTO appsmithPackage = new PackageDTO();
        appsmithPackage.setColor("#C2DAF0");
        appsmithPackage.setIcon("rupee");

        Mono<PackageDTO> packageMono = crudPackageService.createPackage(appsmithPackage, firstWorkspaceId);

        StepVerifier.create(packageMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals("Please enter a valid parameter name."))
                .verify();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void updatePackageWithValidInput() {
        final PackageDTO aPackage = new PackageDTO();
        aPackage.setName("Package X");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        AtomicReference<String> packageId = new AtomicReference<>();
        AtomicReference<PackageDTO> testPackageRef = new AtomicReference<>();

        // create package test
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(aPackage, firstWorkspaceId);

        User currentUser = sessionUserService.getCurrentUser().block();

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    packageId.set(createdPackage.getId());
                    testPackageRef.set(createdPackage);
                    assertThat(createdPackage.getName()).isEqualTo(aPackage.getName());
                })
                .verifyComplete();

        PackageDTO testPackage = testPackageRef.get();
        testPackage.setName("PackageX-V2");
        testPackage.setIcon("package");

        Mono<PackageDTO> updatePackageMono = crudPackageService.updatePackage(testPackage, testPackage.getId());

        StepVerifier.create(updatePackageMono)
                .assertNext(updatedPackage -> {
                    assertThat(updatedPackage.getName()).isEqualTo(testPackage.getName());
                    assertThat(updatedPackage.getIcon()).isEqualTo(testPackage.getIcon());
                    assertThat(updatedPackage.getModifiedBy()).isEqualTo(currentUser.getUsername());
                    assertThat(updatedPackage.getModifiedAt()).isNotEmpty();
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testPublishPackageWithValidInput() {
        final PackageDTO aPackage = new PackageDTO();
        aPackage.setName("Package Publish Test");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        AtomicReference<String> packageId = new AtomicReference<>();
        AtomicReference<PackageDTO> testPackageRef = new AtomicReference<>();

        // create package test
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(aPackage, firstWorkspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    packageId.set(createdPackage.getId());
                    testPackageRef.set(createdPackage);
                    assertThat(createdPackage.getName()).isEqualTo(aPackage.getName());
                })
                .verifyComplete();

        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("ModuleX");
        moduleDTO.setPackageId(packageId.get());
        moduleDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> createModuleMono = crudModuleService.createModule(moduleDTO);

        StepVerifier.create(createModuleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                })
                .verifyComplete();

        Mono<Boolean> publishPackageMono = publishPackageService.publishPackage(packageId.get());

        StepVerifier.create(publishPackageMono)
                .assertNext(publishPackageStatus -> {
                    assertThat(publishPackageStatus.booleanValue()).isTrue();
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testPublishPackageWithoutModuleShouldNotSucceed() {
        final PackageDTO aPackage = new PackageDTO();
        aPackage.setName("Package Publish Failure Test");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        AtomicReference<String> packageId = new AtomicReference<>();
        AtomicReference<PackageDTO> testPackageRef = new AtomicReference<>();

        // create package test
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(aPackage, firstWorkspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    packageId.set(createdPackage.getId());
                    testPackageRef.set(createdPackage);
                    assertThat(createdPackage.getName()).isEqualTo(aPackage.getName());
                })
                .verifyComplete();

        Mono<Boolean> publishPackageMono = publishPackageService.publishPackage(packageId.get());

        StepVerifier.create(publishPackageMono)
                .expectErrorMatches(publishPkgError -> {
                    assertThat(publishPkgError instanceof AppsmithException);
                    assertThat(((AppsmithException) publishPkgError).getError().getAppErrorCode())
                            .isEqualTo(AppsmithErrorCode.PACKAGE_CANNOT_BE_PUBLISHED.getCode());
                    return true;
                })
                .verify();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testGetPublishableEntitiesWithValidInputShouldReturnEntities() {
        final int EXPECTED_ENTITY_SIZE = 2;
        final PackageDTO aPackage = new PackageDTO();
        aPackage.setName("PackagePublishableEntitiesTest");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        AtomicReference<String> packageId = new AtomicReference<>();
        AtomicReference<PackageDTO> testPackageRef = new AtomicReference<>();

        // create package
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(aPackage, firstWorkspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    packageId.set(createdPackage.getId());
                    testPackageRef.set(createdPackage);
                    assertThat(createdPackage.getName()).isEqualTo(aPackage.getName());
                })
                .verifyComplete();

        // create a module
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("ModuleX");
        moduleDTO.setPackageId(packageId.get());
        moduleDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> createModuleMono = crudModuleService.createModule(moduleDTO);

        StepVerifier.create(createModuleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                })
                .verifyComplete();

        // create another module
        ModuleDTO anotherModuleDTO = new ModuleDTO();
        anotherModuleDTO.setName("ModuleY");
        anotherModuleDTO.setPackageId(packageId.get());
        anotherModuleDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO anotherModuleActionDTO = new ModuleActionDTO();

        anotherModuleDTO.setEntity(anotherModuleActionDTO);

        Mono<ModuleDTO> createAnotherModuleMono = crudModuleService.createModule(anotherModuleDTO);

        StepVerifier.create(createAnotherModuleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                })
                .verifyComplete();

        PublishingMetaDTO publishingMetaDTO = new PublishingMetaDTO();
        publishingMetaDTO.setSourcePackageId(packageId.get());
        Package publishedPackage = new Package();
        publishedPackage.setId(new ObjectId().toString());
        publishingMetaDTO.setPublishedPackage(publishedPackage);

        Mono<List<Module>> modulePublishableEntitiesMono =
                modulePackagePublishableService.getPublishableEntities(publishingMetaDTO);

        StepVerifier.create(modulePublishableEntitiesMono)
                .assertNext(publishedModules -> {
                    assertThat(publishedModules).isNotNull();
                    assertThat(publishedModules.size()).isEqualTo(EXPECTED_ENTITY_SIZE);
                })
                .verifyComplete();

        Mono<List<NewAction>> newActionPublishableEntitiesMono =
                newActionPackagePublishableService.getPublishableEntities(publishingMetaDTO);

        StepVerifier.create(newActionPublishableEntitiesMono)
                .assertNext(publishedActions -> {
                    assertThat(publishedActions).isNotNull();
                    assertThat(publishedActions.size()).isEqualTo(EXPECTED_ENTITY_SIZE);
                    publishedActions.forEach(publishedAction -> {
                        assertThat(publishedAction.getPublishedAction().getContextType())
                                .isEqualTo(CreatorContextType.MODULE);
                    });
                })
                .verifyComplete();

        assertThat(publishingMetaDTO.getPublishedModules().size()).isEqualTo(EXPECTED_ENTITY_SIZE);
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testGetPublishableEntitiesShouldReturnEmptyEntitiesWhenThereIsNone() {
        final PackageDTO aPackage = new PackageDTO();
        aPackage.setName("PackagePublishableEntitiesNegativeTest");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        AtomicReference<String> packageId = new AtomicReference<>();
        AtomicReference<PackageDTO> testPackageRef = new AtomicReference<>();

        // create package
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(aPackage, firstWorkspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    packageId.set(createdPackage.getId());
                    testPackageRef.set(createdPackage);
                    assertThat(createdPackage.getName()).isEqualTo(aPackage.getName());
                })
                .verifyComplete();

        PublishingMetaDTO publishingMetaDTO = new PublishingMetaDTO();
        publishingMetaDTO.setSourcePackageId(packageId.get());
        Package publishedPackage = new Package();
        publishedPackage.setId(new ObjectId().toString());
        publishingMetaDTO.setPublishedPackage(publishedPackage);

        Mono<List<Module>> modulePublishableEntitiesMono =
                modulePackagePublishableService.getPublishableEntities(publishingMetaDTO);

        StepVerifier.create(modulePublishableEntitiesMono)
                .assertNext(publishedModules -> {
                    assertThat(publishedModules).isEmpty();
                })
                .verifyComplete();

        Mono<List<NewAction>> newActionPublishableEntitiesMono =
                newActionPackagePublishableService.getPublishableEntities(publishingMetaDTO);

        StepVerifier.create(newActionPublishableEntitiesMono)
                .assertNext(publishedActions -> {
                    assertThat(publishedActions).isEmpty();
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testConsumablePackagesAndModulesShouldReturnEmptyWhenThereIsNoPublishedPackages() {
        final PackageDTO aPackage = new PackageDTO();
        aPackage.setName("ConsumablePackageEmptyTest");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        AtomicReference<String> packageId = new AtomicReference<>();
        AtomicReference<PackageDTO> testPackageRef = new AtomicReference<>();

        // create package
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(aPackage, firstWorkspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    packageId.set(createdPackage.getId());
                    testPackageRef.set(createdPackage);
                    assertThat(createdPackage.getName()).isEqualTo(aPackage.getName());
                })
                .verifyComplete();

        // create a module
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("ModuleX");
        moduleDTO.setPackageId(packageId.get());
        moduleDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> createModuleMono = crudModuleService.createModule(moduleDTO);

        StepVerifier.create(createModuleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                })
                .verifyComplete();

        // create another module
        ModuleDTO anotherModuleDTO = new ModuleDTO();
        anotherModuleDTO.setName("ModuleY");
        anotherModuleDTO.setPackageId(packageId.get());
        anotherModuleDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO anotherModuleActionDTO = new ModuleActionDTO();

        anotherModuleDTO.setEntity(anotherModuleActionDTO);

        Mono<ModuleDTO> createAnotherModuleMono = crudModuleService.createModule(anotherModuleDTO);

        StepVerifier.create(createAnotherModuleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                })
                .verifyComplete();

        // fetch all consumable packages and modules for the given `workspaceId`
        Mono<ConsumablePackagesAndModulesDTO> packagesAndModulesDTOMono =
                crudPackageService.getAllPackagesForConsumer(firstWorkspaceId);

        // verify that there are no consumable packages and modules
        StepVerifier.create(packagesAndModulesDTOMono)
                .assertNext(consumablePackagesAndModulesDTO -> {
                    assertThat(consumablePackagesAndModulesDTO.getPackages()).isEmpty();
                    assertThat(consumablePackagesAndModulesDTO.getModules()).isEmpty();
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    @Test
    public void testConsumablePackagesAndModulesShouldReturnConsumablePackagesAndModulesWhenThereIsPublishedPackage() {
        final PackageDTO aPackage = new PackageDTO();
        aPackage.setName("ConsumablePackageValidTest");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        AtomicReference<String> packageId = new AtomicReference<>();
        AtomicReference<PackageDTO> testPackageRef = new AtomicReference<>();
        AtomicReference<String> firstSourceModuleIdRef = new AtomicReference<>();
        AtomicReference<String> secondSourceModuleIdRef = new AtomicReference<>();

        // create package
        Mono<PackageDTO> firstPackageMono = crudPackageService.createPackage(aPackage, secondWorkspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    packageId.set(createdPackage.getId());
                    testPackageRef.set(createdPackage);
                    assertThat(createdPackage.getName()).isEqualTo(aPackage.getName());
                })
                .verifyComplete();

        // create a module
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setName("ModuleX");
        moduleDTO.setPackageId(packageId.get());
        moduleDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();

        moduleDTO.setEntity(moduleActionDTO);

        Mono<ModuleDTO> createModuleMono = crudModuleService.createModule(moduleDTO);

        StepVerifier.create(createModuleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    firstSourceModuleIdRef.set(createdModule.getId());
                })
                .verifyComplete();

        // create another module
        ModuleDTO anotherModuleDTO = new ModuleDTO();
        anotherModuleDTO.setName("ModuleY");
        anotherModuleDTO.setPackageId(packageId.get());
        anotherModuleDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO anotherModuleActionDTO = new ModuleActionDTO();

        anotherModuleDTO.setEntity(anotherModuleActionDTO);

        Mono<ModuleDTO> createAnotherModuleMono = crudModuleService.createModule(anotherModuleDTO);

        StepVerifier.create(createAnotherModuleMono)
                .assertNext(createdModule -> {
                    assertThat(createdModule.getId()).isNotEmpty();
                    secondSourceModuleIdRef.set(createdModule.getId());
                })
                .verifyComplete();

        // publish the package
        Mono<Boolean> publishPackageMono = publishPackageService.publishPackage(packageId.get());

        StepVerifier.create(publishPackageMono)
                .assertNext(publishPackageStatus -> {
                    assertThat(publishPackageStatus).isTrue();
                })
                .verifyComplete();

        PublishingMetaDTO publishingMetaDTO = new PublishingMetaDTO();
        publishingMetaDTO.setOldModuleIdToNewModuleIdMap(Map.of(
                firstSourceModuleIdRef.get(), new ObjectId().toString(),
                secondSourceModuleIdRef.get(), new ObjectId().toString()));
        publishingMetaDTO.setSourcePackageId(packageId.get());

        Mono<List<NewAction>> newActionPublishableEntitiesMono =
                newActionPackagePublishableService.getPublishableEntities(publishingMetaDTO);

        StepVerifier.create(newActionPublishableEntitiesMono)
                .assertNext(publishedActions -> {
                    assertThat(publishedActions.size()).isEqualTo(2);
                    publishedActions.forEach(publishedAction -> {
                        assertThat(publishedAction.getUnpublishedAction().getModuleId())
                                .isNull();
                        assertThat(publishedAction.getUnpublishedAction().getContextType())
                                .isNull();
                        assertThat(publishedAction.getPublishedAction().getContextType())
                                .isEqualTo(CreatorContextType.MODULE);
                        assertThat(publishedAction.getPublishedAction().getModuleId())
                                .isNotNull();
                        assertThat(publishedAction.getRootModuleInstanceId()).isNull();
                        assertThat(publishedAction.getModuleInstanceId()).isNull();
                    });
                })
                .verifyComplete();

        // fetch consumable packages and modules for the given `workspaceId`
        Mono<ConsumablePackagesAndModulesDTO> packagesAndModulesDTOMono =
                crudPackageService.getAllPackagesForConsumer(secondWorkspaceId);

        // verify that there are consumable packages and modules
        StepVerifier.create(packagesAndModulesDTOMono)
                .assertNext(consumablePackagesAndModulesDTO -> {
                    assertThat(consumablePackagesAndModulesDTO.getPackages().size())
                            .isEqualTo(1);
                    assertThat(consumablePackagesAndModulesDTO.getModules().size())
                            .isEqualTo(2);
                    consumablePackagesAndModulesDTO.getModules().forEach(consumableModuleDTO -> {
                        verifySettingsForConsumer(consumableModuleDTO);
                    });
                })
                .verifyComplete();

        // verify that there aren't any consumable packages and modules in the first workspace
        Mono<ConsumablePackagesAndModulesDTO> packagesAndModulesDTOMono1 =
                crudPackageService.getAllPackagesForConsumer(firstWorkspaceId);

        StepVerifier.create(packagesAndModulesDTOMono1)
                .assertNext(consumablePackagesAndModulesDTO -> {
                    assertThat(consumablePackagesAndModulesDTO.getPackages().size())
                            .isEqualTo(0);
                    assertThat(consumablePackagesAndModulesDTO.getModules().size())
                            .isEqualTo(0);
                })
                .verifyComplete();
    }

    private void verifySettingsForConsumer(ModuleDTO moduleDTO) {
        JsonNode jsonNode = objectMapper.valueToTree(moduleDTO.getSettingsForm());
        // Check if "Run query on page load" is NOT present in the children array
        JsonNode childrenNode = jsonNode.get(0)
                // Assuming there is at least one item in the "setting" array
                .path("children");

        boolean isUnexpectedSettingPresent = false;
        Iterator<JsonNode> elements = childrenNode.elements();
        List<String> expectedConsumerSettingNames =
                List.of("Run query on page load", "Request confirmation before running query");
        while (elements.hasNext()) {
            JsonNode element = elements.next();
            if (!expectedConsumerSettingNames.contains(element.path("label").asText())) {
                isUnexpectedSettingPresent = true;
                break;
            }
        }
        assertThat(isUnexpectedSettingPresent).isFalse();
    }
}
