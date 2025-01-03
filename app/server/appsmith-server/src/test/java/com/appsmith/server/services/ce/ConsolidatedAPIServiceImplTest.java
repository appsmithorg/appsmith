package com.appsmith.server.services.ce;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.ConsolidatedAPIResponseDTO;
import com.appsmith.server.dtos.MockDataDTO;
import com.appsmith.server.dtos.MockDataSet;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.dtos.ProductAlertResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.NewPageRepositoryCake;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ConsolidatedAPIService;
import com.appsmith.server.services.MockDataService;
import com.appsmith.server.services.ProductAlertService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.themes.base.ThemeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.PluginConstants.PackageName.APPSMITH_AI_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.GRAPHQL_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.REST_API_PLUGIN;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
@ExtendWith(AfterAllCleanUpExtension.class)
@TestPropertySource(properties = "spring.aop.auto=false")
public class ConsolidatedAPIServiceImplTest {

    @Autowired
    ConsolidatedAPIService consolidatedAPIService;

    @MockBean
    SessionUserService mockSessionUserService;

    @MockBean
    UserService mockUserService;

    @MockBean
    UserDataService mockUserDataService;

    @MockBean
    TenantService mockTenantService;

    @MockBean
    ProductAlertService mockProductAlertService;

    @SpyBean
    NewPageService spyNewPageService;

    @SpyBean
    NewActionService spyNewActionService;

    @SpyBean
    ActionCollectionService spyActionCollectionService;

    @SpyBean
    ThemeService spyThemeService;

    @SpyBean
    ApplicationPageService spyApplicationPageService;

    @SpyBean
    CustomJSLibService spyCustomJSLibService;

    @MockBean
    PluginService mockPluginService;

    @SpyBean
    ApplicationService spyApplicationService;

    @MockBean
    DatasourceService mockDatasourceService;

    @MockBean
    MockDataService mockMockDataService;

    @SpyBean
    ApplicationRepositoryCake spyApplicationRepository;

    @SpyBean
    NewPageRepositoryCake mockNewPageRepository;

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @Test
    public void testErrorWhenModeIsNullAndPageIdAvailable() {
        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad("pageId", null, null, null, null);
        StepVerifier.create(consolidatedInfoForPageLoad).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertEquals("Please enter a valid parameter appMode.", error.getMessage());
        });
    }

    @Test
    public void testPageLoadResponseWhenPageIdAndApplicationIdMissing() {
        User sampleUser = new User();
        when(mockSessionUserService.getCurrentUser()).thenReturn(Mono.just(sampleUser));

        UserProfileDTO sampleUserProfileDTO = new UserProfileDTO();
        sampleUserProfileDTO.setName("sampleUserProfileDTO");
        when(mockUserService.buildUserProfileDTO(any())).thenReturn(Mono.just(sampleUserProfileDTO));

        Map<String, Boolean> sampleFeatureFlagMap = new HashMap<>();
        sampleFeatureFlagMap.put("sampleFeatureFlag", true);
        when(mockUserDataService.getFeatureFlagsForCurrentUser()).thenReturn(Mono.just(sampleFeatureFlagMap));

        Tenant sampleTenant = new Tenant();
        sampleTenant.setDisplayName("sampleTenant");
        when(mockTenantService.getTenantConfiguration()).thenReturn(Mono.just(sampleTenant));

        ProductAlertResponseDTO sampleProductAlertResponseDTO = new ProductAlertResponseDTO();
        sampleProductAlertResponseDTO.setTitle("sampleProductAlert");
        when(mockProductAlertService.getSingleApplicableMessage())
                .thenReturn(Mono.just(List.of(sampleProductAlertResponseDTO)));

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId", "appId", RefType.branch, "branch", ApplicationMode.PUBLISHED);
        StepVerifier.create(consolidatedInfoForPageLoad)
                .assertNext(consolidatedAPIResponseDTO -> {
                    assertNotNull(consolidatedAPIResponseDTO.getUserProfile());
                    assertEquals(
                            "sampleUserProfileDTO",
                            consolidatedAPIResponseDTO
                                    .getUserProfile()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getTenantConfig());
                    assertEquals(
                            "sampleTenant",
                            consolidatedAPIResponseDTO
                                    .getTenantConfig()
                                    .getData()
                                    .getDisplayName());

                    assertNotNull(consolidatedAPIResponseDTO.getFeatureFlags());
                    assertTrue(consolidatedAPIResponseDTO
                            .getFeatureFlags()
                            .getData()
                            .get("sampleFeatureFlag"));

                    assertNotNull(consolidatedAPIResponseDTO.getProductAlert());
                    assertEquals(
                            "sampleProductAlert",
                            consolidatedAPIResponseDTO
                                    .getProductAlert()
                                    .getData()
                                    .getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testPageLoadResponseForViewMode() {
        User sampleUser = new User();
        when(mockSessionUserService.getCurrentUser()).thenReturn(Mono.just(sampleUser));

        UserProfileDTO sampleUserProfileDTO = new UserProfileDTO();
        sampleUserProfileDTO.setName("sampleUserProfileDTO");
        when(mockUserService.buildUserProfileDTO(any())).thenReturn(Mono.just(sampleUserProfileDTO));

        Map<String, Boolean> sampleFeatureFlagMap = new HashMap<>();
        sampleFeatureFlagMap.put("sampleFeatureFlag", true);
        when(mockUserDataService.getFeatureFlagsForCurrentUser()).thenReturn(Mono.just(sampleFeatureFlagMap));

        Tenant sampleTenant = new Tenant();
        sampleTenant.setDisplayName("sampleTenant");
        when(mockTenantService.getTenantConfiguration()).thenReturn(Mono.just(sampleTenant));

        ProductAlertResponseDTO sampleProductAlertResponseDTO = new ProductAlertResponseDTO();
        sampleProductAlertResponseDTO.setTitle("sampleProductAlert");
        when(mockProductAlertService.getSingleApplicableMessage())
                .thenReturn(Mono.just(List.of(sampleProductAlertResponseDTO)));

        ApplicationPagesDTO sampleApplicationPagesDTO = new ApplicationPagesDTO();
        sampleApplicationPagesDTO.setWorkspaceId("sampleWorkspaceId");

        Application mockApplication = new Application();
        mockApplication.setId("mockApplicationId");
        doReturn(Mono.just(mockApplication))
                .when(spyApplicationService)
                .findByBranchedApplicationIdAndApplicationMode(anyString(), any());

        NewPage mockNewPage = new NewPage();
        mockNewPage.setApplicationId("mockApplicationId");
        mockNewPage.setId("mockPageId");
        mockNewPage.setBranchName("branch");
        doReturn(Mono.just(mockNewPage))
                .when(spyNewPageService)
                .findByRefTypeAndRefNameAndBasePageId(any(), anyString(), anyString(), any(), any());

        doReturn(Mono.just(List.of(mockNewPage)))
                .when(spyApplicationPageService)
                .getPagesBasedOnApplicationMode(any(), any());

        doReturn(Mono.just(sampleApplicationPagesDTO))
                .when(spyNewPageService)
                .createApplicationPagesDTO(any(), any(), anyBoolean(), anyBoolean());

        Theme sampleTheme = new Theme();
        sampleTheme.setName("sampleTheme");
        doReturn(Mono.just(sampleTheme)).when(spyThemeService).getApplicationTheme(anyString(), any());
        doReturn(Flux.just(sampleTheme)).when(spyThemeService).getApplicationThemes(anyString());

        CustomJSLib sampleCustomJSLib = new CustomJSLib();
        sampleCustomJSLib.setName("sampleJSLib");
        doReturn(Mono.just(List.of(sampleCustomJSLib)))
                .when(spyCustomJSLibService)
                .getAllJSLibsInContext(anyString(), any(), anyBoolean());

        PageDTO samplePageDTO = new PageDTO();
        samplePageDTO.setName("samplePageDTO");
        doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageAndMigrateDslByBranchedPageId(anyString(), anyBoolean(), anyBoolean());

        ActionViewDTO sampleActionViewDTO = new ActionViewDTO();
        sampleActionViewDTO.setName("sampleActionViewDTO");
        doReturn(Flux.just(sampleActionViewDTO)).when(spyNewActionService).getActionsForViewModeByPageId(anyString());

        ActionCollectionViewDTO sampleActionCollectionViewDTO = new ActionCollectionViewDTO();
        sampleActionCollectionViewDTO.setName("sampleActionCollectionViewDTO");
        doReturn(Flux.just(sampleActionCollectionViewDTO))
                .when(spyActionCollectionService)
                .getActionCollectionsForViewMode(anyString());

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId123", null, RefType.branch, "branch", ApplicationMode.PUBLISHED);
        StepVerifier.create(consolidatedInfoForPageLoad)
                .assertNext(consolidatedAPIResponseDTO -> {
                    assertNotNull(consolidatedAPIResponseDTO.getPublishedActions());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getPublishedActions()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionViewDTO",
                            consolidatedAPIResponseDTO
                                    .getPublishedActions()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getUserProfile());
                    assertEquals(
                            "sampleUserProfileDTO",
                            consolidatedAPIResponseDTO
                                    .getUserProfile()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getTenantConfig());
                    assertEquals(
                            "sampleTenant",
                            consolidatedAPIResponseDTO
                                    .getTenantConfig()
                                    .getData()
                                    .getDisplayName());

                    assertNotNull(consolidatedAPIResponseDTO.getFeatureFlags());
                    assertTrue(consolidatedAPIResponseDTO
                            .getFeatureFlags()
                            .getData()
                            .get("sampleFeatureFlag"));

                    assertNotNull(consolidatedAPIResponseDTO.getPages());
                    assertEquals(
                            "sampleWorkspaceId",
                            consolidatedAPIResponseDTO.getPages().getData().getWorkspaceId());

                    assertNotNull(consolidatedAPIResponseDTO.getCurrentTheme());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getCurrentTheme()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getThemes());
                    assertEquals(
                            1, consolidatedAPIResponseDTO.getThemes().getData().size());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getThemes()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPublishedActionCollections());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getPublishedActionCollections()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionCollectionViewDTO",
                            consolidatedAPIResponseDTO
                                    .getPublishedActionCollections()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPageWithMigratedDsl());
                    assertEquals(
                            "samplePageDTO",
                            consolidatedAPIResponseDTO
                                    .getPageWithMigratedDsl()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getCustomJSLibraries());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getCustomJSLibraries()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleJSLib",
                            consolidatedAPIResponseDTO
                                    .getCustomJSLibraries()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getProductAlert());
                    assertEquals(
                            "sampleProductAlert",
                            consolidatedAPIResponseDTO
                                    .getProductAlert()
                                    .getData()
                                    .getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testPageLoadResponseForEditMode() {
        User sampleUser = new User();
        when(mockSessionUserService.getCurrentUser()).thenReturn(Mono.just(sampleUser));

        UserProfileDTO sampleUserProfileDTO = new UserProfileDTO();
        sampleUserProfileDTO.setName("sampleUserProfileDTO");
        when(mockUserService.buildUserProfileDTO(any())).thenReturn(Mono.just(sampleUserProfileDTO));

        Map<String, Boolean> sampleFeatureFlagMap = new HashMap<>();
        sampleFeatureFlagMap.put("sampleFeatureFlag", true);
        when(mockUserDataService.getFeatureFlagsForCurrentUser()).thenReturn(Mono.just(sampleFeatureFlagMap));

        Tenant sampleTenant = new Tenant();
        sampleTenant.setDisplayName("sampleTenant");
        when(mockTenantService.getTenantConfiguration()).thenReturn(Mono.just(sampleTenant));

        ProductAlertResponseDTO sampleProductAlertResponseDTO = new ProductAlertResponseDTO();
        sampleProductAlertResponseDTO.setTitle("sampleProductAlert");
        when(mockProductAlertService.getSingleApplicableMessage())
                .thenReturn(Mono.just(List.of(sampleProductAlertResponseDTO)));

        ApplicationPagesDTO sampleApplicationPagesDTO = new ApplicationPagesDTO();
        sampleApplicationPagesDTO.setWorkspaceId("sampleWorkspaceId");

        Application mockApplication = new Application();
        mockApplication.setId("mockApplicationId");
        doReturn(Mono.just(mockApplication))
                .when(spyApplicationService)
                .findByBranchedApplicationIdAndApplicationMode(anyString(), any());

        NewPage mockNewPage = new NewPage();
        mockNewPage.setApplicationId("mockApplicationId");
        doReturn(Mono.just(mockNewPage))
                .when(spyNewPageService)
                .findByRefTypeAndRefNameAndBasePageId(any(), anyString(), anyString(), any(), any());

        doReturn(Mono.just(List.of(mockNewPage)))
                .when(spyApplicationPageService)
                .getPagesBasedOnApplicationMode(any(), any());

        doReturn(Mono.just(new PageDTO()))
                .when(spyApplicationPageService)
                .getPageAndMigrateDslByBranchedPageId(anyString(), anyBoolean(), anyBoolean());

        doReturn(Mono.just(sampleApplicationPagesDTO))
                .when(spyNewPageService)
                .createApplicationPagesDTO(any(), any(), anyBoolean(), anyBoolean());

        Theme sampleTheme = new Theme();
        sampleTheme.setName("sampleTheme");
        doReturn(Mono.just(sampleTheme)).when(spyThemeService).getApplicationTheme(anyString(), any());
        doReturn(Flux.just(sampleTheme)).when(spyThemeService).getApplicationThemes(anyString());

        CustomJSLib sampleCustomJSLib = new CustomJSLib();
        sampleCustomJSLib.setName("sampleJSLib");
        doReturn(Mono.just(List.of(sampleCustomJSLib)))
                .when(spyCustomJSLibService)
                .getAllJSLibsInContext(anyString(), any(), anyBoolean());

        PageDTO samplePageDTO = new PageDTO();
        samplePageDTO.setName("samplePageDTO");
        doReturn(Mono.just(samplePageDTO))
                .doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageAndMigrateDslByBranchedPageId(anyString(), anyBoolean(), anyBoolean());

        doReturn(Mono.just(samplePageDTO))
                .doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageDTOAfterMigratingDSL(any(), anyBoolean(), anyBoolean());

        doReturn(Mono.just(samplePageDTO))
                .doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageDTOAfterMigratingDSL(any(), anyBoolean(), anyBoolean());

        ActionDTO sampleActionDTO = new ActionDTO();
        sampleActionDTO.setName("sampleActionDTO");
        sampleActionDTO.setUpdatedAt(Instant.now());
        doReturn(Flux.just(sampleActionDTO)).when(spyNewActionService).getUnpublishedActions(any(), anyBoolean());

        ActionCollectionDTO sampleActionCollectionDTO = new ActionCollectionDTO();
        sampleActionCollectionDTO.setName("sampleActionCollectionDTO");
        doReturn(Flux.just(sampleActionCollectionDTO))
                .when(spyActionCollectionService)
                .getPopulatedActionCollectionsByViewMode(any(), anyBoolean());

        PageNameIdDTO samplePageNameIdDTO = new PageNameIdDTO();
        samplePageNameIdDTO.setName("samplePageNameIdDTO");
        sampleApplicationPagesDTO.setPages(List.of(samplePageNameIdDTO));

        Plugin samplePlugin = new Plugin();
        samplePlugin.setName("samplePlugin");
        samplePlugin.setId("samplePluginId");
        samplePlugin.setPackageName("sample-plugin");
        Plugin sampleRestApiPlugin = new Plugin();
        sampleRestApiPlugin.setName("sampleRestApiPlugin");
        sampleRestApiPlugin.setId("sampleRestApiPluginId");
        sampleRestApiPlugin.setPackageName(REST_API_PLUGIN);
        Plugin sampleGraphqlPlugin = new Plugin();
        sampleGraphqlPlugin.setName("sampleGraphqlPlugin");
        sampleGraphqlPlugin.setId("sampleGraphqlPluginId");
        sampleGraphqlPlugin.setPackageName(GRAPHQL_PLUGIN);
        Plugin sampleAiPlugin = new Plugin();
        sampleAiPlugin.setName("sampleAiPlugin");
        sampleAiPlugin.setId("sampleAiPluginId");
        sampleAiPlugin.setPackageName(APPSMITH_AI_PLUGIN);
        when(mockPluginService.getInWorkspace(anyString()))
                .thenReturn(Flux.just(samplePlugin, sampleRestApiPlugin, sampleGraphqlPlugin, sampleAiPlugin));

        Datasource sampleDatasource = new Datasource();
        sampleDatasource.setName("sampleDatasource");
        sampleDatasource.setPluginId("samplePluginId");
        when(mockDatasourceService.getAllWithStorages(any())).thenReturn(Flux.just(sampleDatasource));

        Map<String, Map<?, ?>> sampleFormConfig = new HashMap<>();
        sampleFormConfig.put("key", Map.of());
        when(mockPluginService.getFormConfig(anyString())).thenReturn(Mono.just(sampleFormConfig));

        MockDataSet sampleMockDataSet = new MockDataSet();
        sampleMockDataSet.setName("sampleMockDataSet");
        MockDataDTO sampleMockDataDTO = new MockDataDTO();
        sampleMockDataDTO.setMockdbs(List.of(sampleMockDataSet));
        when(mockMockDataService.getMockDataSet()).thenReturn(Mono.just(sampleMockDataDTO));

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId", null, RefType.branch, "branch", ApplicationMode.EDIT);
        StepVerifier.create(consolidatedInfoForPageLoad)
                .assertNext(consolidatedAPIResponseDTO -> {
                    assertNotNull(consolidatedAPIResponseDTO.getUserProfile());
                    assertEquals(
                            "sampleUserProfileDTO",
                            consolidatedAPIResponseDTO
                                    .getUserProfile()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getTenantConfig());
                    assertEquals(
                            "sampleTenant",
                            consolidatedAPIResponseDTO
                                    .getTenantConfig()
                                    .getData()
                                    .getDisplayName());

                    assertNotNull(consolidatedAPIResponseDTO.getFeatureFlags());
                    assertTrue(consolidatedAPIResponseDTO
                            .getFeatureFlags()
                            .getData()
                            .get("sampleFeatureFlag"));

                    assertNotNull(consolidatedAPIResponseDTO.getPages());
                    assertEquals(
                            "sampleWorkspaceId",
                            consolidatedAPIResponseDTO.getPages().getData().getWorkspaceId());

                    assertNotNull(consolidatedAPIResponseDTO.getCurrentTheme());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getCurrentTheme()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getThemes());
                    assertEquals(
                            1, consolidatedAPIResponseDTO.getThemes().getData().size());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getThemes()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPages());
                    assertEquals(
                            "sampleWorkspaceId",
                            consolidatedAPIResponseDTO.getPages().getData().getWorkspaceId());

                    assertNotNull(consolidatedAPIResponseDTO.getCustomJSLibraries());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getCustomJSLibraries()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleJSLib",
                            consolidatedAPIResponseDTO
                                    .getCustomJSLibraries()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getProductAlert());
                    assertEquals(
                            "sampleProductAlert",
                            consolidatedAPIResponseDTO
                                    .getProductAlert()
                                    .getData()
                                    .getTitle());

                    assertNotNull(consolidatedAPIResponseDTO.getUnpublishedActions());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getUnpublishedActions()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionDTO",
                            consolidatedAPIResponseDTO
                                    .getUnpublishedActions()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getUnpublishedActionCollections());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getUnpublishedActionCollections()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionCollectionDTO",
                            consolidatedAPIResponseDTO
                                    .getUnpublishedActionCollections()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPagesWithMigratedDsl());
                    assertNotNull(consolidatedAPIResponseDTO.getUnpublishedActions());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getUnpublishedActions()
                                    .getData()
                                    .size());
                    assertNotNull(consolidatedAPIResponseDTO
                            .getUnpublishedActions()
                            .getData()
                            .get(0)
                            .getUpdatedAt());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getPagesWithMigratedDsl()
                                    .getData()
                                    .size());
                    assertEquals(
                            "samplePageDTO",
                            consolidatedAPIResponseDTO
                                    .getPagesWithMigratedDsl()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPlugins());
                    assertEquals(
                            4, consolidatedAPIResponseDTO.getPlugins().getData().size());
                    List<String> pluginPackageNameList = consolidatedAPIResponseDTO.getPlugins().getData().stream()
                            .map(Plugin::getPackageName)
                            .toList();
                    assertTrue(pluginPackageNameList.contains(REST_API_PLUGIN));
                    assertTrue(pluginPackageNameList.contains(GRAPHQL_PLUGIN));
                    assertTrue(pluginPackageNameList.contains(APPSMITH_AI_PLUGIN));

                    assertNotNull(consolidatedAPIResponseDTO.getPluginFormConfigs());
                    assertEquals(
                            4,
                            consolidatedAPIResponseDTO
                                    .getPluginFormConfigs()
                                    .getData()
                                    .keySet()
                                    .size());
                    assertTrue(consolidatedAPIResponseDTO
                            .getPluginFormConfigs()
                            .getData()
                            .containsKey("samplePluginId"));
                    assertTrue(consolidatedAPIResponseDTO
                            .getPluginFormConfigs()
                            .getData()
                            .containsKey("sampleRestApiPluginId"));
                    assertTrue(consolidatedAPIResponseDTO
                            .getPluginFormConfigs()
                            .getData()
                            .containsKey("sampleGraphqlPluginId"));
                    assertTrue(consolidatedAPIResponseDTO
                            .getPluginFormConfigs()
                            .getData()
                            .containsKey("sampleAiPluginId"));

                    assertNotNull(consolidatedAPIResponseDTO.getMockDatasources());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getMockDatasources()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleMockDataSet",
                            consolidatedAPIResponseDTO
                                    .getMockDatasources()
                                    .getData()
                                    .get(0)
                                    .getName());
                })
                .verifyComplete();
    }

    /**
     * To mimic error response the DB fetch call from repository has been mocked in this test i.e. the repository has
     * been mocked to return empty response.
     */
    @Test
    public void testErrorResponseWhenAnonymousUserAccessPrivateApp() {
        User sampleUser = new User();
        when(mockSessionUserService.getCurrentUser()).thenReturn(Mono.just(sampleUser));

        UserProfileDTO sampleUserProfileDTO = new UserProfileDTO();
        sampleUserProfileDTO.setName("sampleUserProfileDTO");
        when(mockUserService.buildUserProfileDTO(any())).thenReturn(Mono.just(sampleUserProfileDTO));

        Map<String, Boolean> sampleFeatureFlagMap = new HashMap<>();
        sampleFeatureFlagMap.put("sampleFeatureFlag", true);
        when(mockUserDataService.getFeatureFlagsForCurrentUser()).thenReturn(Mono.just(sampleFeatureFlagMap));

        Tenant sampleTenant = new Tenant();
        sampleTenant.setDisplayName("sampleTenant");
        when(mockTenantService.getTenantConfiguration()).thenReturn(Mono.just(sampleTenant));

        ProductAlertResponseDTO sampleProductAlertResponseDTO = new ProductAlertResponseDTO();
        sampleProductAlertResponseDTO.setTitle("sampleProductAlert");
        when(mockProductAlertService.getSingleApplicableMessage())
                .thenReturn(Mono.just(List.of(sampleProductAlertResponseDTO)));

        Mockito.doReturn(Mono.empty())
                .when(mockNewPageRepository)
                .findPageByRefTypeAndRefNameAndBasePageId(any(), anyString(), anyString(), any(), any());
        doReturn(Mono.empty())
                .when(spyApplicationRepository)
                .getApplicationByGitBranchAndBaseApplicationId(anyString(), anyString(), any(AclPermission.class));

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId", "appId", RefType.branch, "branch", ApplicationMode.PUBLISHED);
        StepVerifier.create(consolidatedInfoForPageLoad)
                .assertNext(consolidatedAPIResponseDTO -> {
                    assertNotNull(consolidatedAPIResponseDTO.getUserProfile());
                    assertEquals(
                            "sampleUserProfileDTO",
                            consolidatedAPIResponseDTO
                                    .getUserProfile()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getTenantConfig());
                    assertEquals(
                            "sampleTenant",
                            consolidatedAPIResponseDTO
                                    .getTenantConfig()
                                    .getData()
                                    .getDisplayName());

                    assertNotNull(consolidatedAPIResponseDTO.getFeatureFlags());
                    assertTrue(consolidatedAPIResponseDTO
                            .getFeatureFlags()
                            .getData()
                            .get("sampleFeatureFlag"));

                    assertNotNull(consolidatedAPIResponseDTO.getProductAlert());
                    assertEquals(
                            "sampleProductAlert",
                            consolidatedAPIResponseDTO
                                    .getProductAlert()
                                    .getData()
                                    .getTitle());

                    assertNotNull(consolidatedAPIResponseDTO.getPublishedActions());
                    assertEquals(
                            404,
                            consolidatedAPIResponseDTO
                                    .getPublishedActions()
                                    .getResponseMeta()
                                    .getStatus());
                    assertEquals(
                            "No resource found",
                            consolidatedAPIResponseDTO
                                    .getPublishedActions()
                                    .getResponseMeta()
                                    .getError()
                                    .getTitle());

                    assertNotNull(consolidatedAPIResponseDTO.getPages());
                    assertEquals(
                            404,
                            consolidatedAPIResponseDTO
                                    .getPages()
                                    .getResponseMeta()
                                    .getStatus());
                    assertEquals(
                            "No resource found",
                            consolidatedAPIResponseDTO
                                    .getPages()
                                    .getResponseMeta()
                                    .getError()
                                    .getTitle());

                    assertNotNull(consolidatedAPIResponseDTO.getCurrentTheme());
                    assertEquals(
                            404,
                            consolidatedAPIResponseDTO
                                    .getCurrentTheme()
                                    .getResponseMeta()
                                    .getStatus());
                    assertEquals(
                            "No resource found",
                            consolidatedAPIResponseDTO
                                    .getCurrentTheme()
                                    .getResponseMeta()
                                    .getError()
                                    .getTitle());

                    assertNotNull(consolidatedAPIResponseDTO.getThemes());
                    assertEquals(
                            404,
                            consolidatedAPIResponseDTO
                                    .getThemes()
                                    .getResponseMeta()
                                    .getStatus());
                    assertEquals(
                            "No resource found",
                            consolidatedAPIResponseDTO
                                    .getThemes()
                                    .getResponseMeta()
                                    .getError()
                                    .getTitle());

                    assertNotNull(consolidatedAPIResponseDTO.getPublishedActionCollections());
                    assertEquals(
                            404,
                            consolidatedAPIResponseDTO
                                    .getPublishedActionCollections()
                                    .getResponseMeta()
                                    .getStatus());
                    assertEquals(
                            "No resource found",
                            consolidatedAPIResponseDTO
                                    .getPublishedActionCollections()
                                    .getResponseMeta()
                                    .getError()
                                    .getTitle());

                    assertNotNull(consolidatedAPIResponseDTO.getPageWithMigratedDsl());
                    assertEquals(
                            404,
                            consolidatedAPIResponseDTO
                                    .getPageWithMigratedDsl()
                                    .getResponseMeta()
                                    .getStatus());
                    assertEquals(
                            "No resource found",
                            consolidatedAPIResponseDTO
                                    .getPageWithMigratedDsl()
                                    .getResponseMeta()
                                    .getError()
                                    .getTitle());

                    assertNotNull(consolidatedAPIResponseDTO.getCustomJSLibraries());
                    assertEquals(
                            404,
                            consolidatedAPIResponseDTO
                                    .getCustomJSLibraries()
                                    .getResponseMeta()
                                    .getStatus());
                    assertEquals(
                            "No resource found",
                            consolidatedAPIResponseDTO
                                    .getCustomJSLibraries()
                                    .getResponseMeta()
                                    .getError()
                                    .getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testPageLoadResponseForViewMode_whenBranchNameIsPresentInNonGitApp() {
        User sampleUser = new User();
        when(mockSessionUserService.getCurrentUser()).thenReturn(Mono.just(sampleUser));

        UserProfileDTO sampleUserProfileDTO = new UserProfileDTO();
        sampleUserProfileDTO.setName("sampleUserProfileDTO");
        when(mockUserService.buildUserProfileDTO(any())).thenReturn(Mono.just(sampleUserProfileDTO));

        Map<String, Boolean> sampleFeatureFlagMap = new HashMap<>();
        sampleFeatureFlagMap.put("sampleFeatureFlag", true);
        when(mockUserDataService.getFeatureFlagsForCurrentUser()).thenReturn(Mono.just(sampleFeatureFlagMap));

        Tenant sampleTenant = new Tenant();
        sampleTenant.setDisplayName("sampleTenant");
        when(mockTenantService.getTenantConfiguration()).thenReturn(Mono.just(sampleTenant));

        ProductAlertResponseDTO sampleProductAlertResponseDTO = new ProductAlertResponseDTO();
        sampleProductAlertResponseDTO.setTitle("sampleProductAlert");
        when(mockProductAlertService.getSingleApplicableMessage())
                .thenReturn(Mono.just(List.of(sampleProductAlertResponseDTO)));

        ApplicationPagesDTO sampleApplicationPagesDTO = new ApplicationPagesDTO();
        sampleApplicationPagesDTO.setWorkspaceId("sampleWorkspaceId");

        Application mockApplication = new Application();
        mockApplication.setId("mockApplicationId");
        doReturn(Mono.just(mockApplication))
                .when(spyApplicationService)
                .findByBranchedApplicationIdAndApplicationMode(anyString(), any());

        NewPage mockNewPage = new NewPage();
        mockNewPage.setApplicationId("mockApplicationId");
        mockNewPage.setId("mockPageId");

        doReturn(Mono.just(mockNewPage))
                .when(spyNewPageService)
                .findByRefTypeAndRefNameAndBasePageId(any(), eq(null), eq("mockPageId"), any(), any());

        doReturn(Mono.just(List.of(mockNewPage)))
                .when(spyApplicationPageService)
                .getPagesBasedOnApplicationMode(any(), any());

        doReturn(Mono.just(sampleApplicationPagesDTO))
                .when(spyNewPageService)
                .createApplicationPagesDTO(any(), any(), anyBoolean(), anyBoolean());

        Theme sampleTheme = new Theme();
        sampleTheme.setName("sampleTheme");
        doReturn(Mono.just(sampleTheme)).when(spyThemeService).getApplicationTheme(anyString(), any());
        doReturn(Flux.just(sampleTheme)).when(spyThemeService).getApplicationThemes(anyString());

        CustomJSLib sampleCustomJSLib = new CustomJSLib();
        sampleCustomJSLib.setName("sampleJSLib");
        doReturn(Mono.just(List.of(sampleCustomJSLib)))
                .when(spyCustomJSLibService)
                .getAllJSLibsInContext(anyString(), any(), anyBoolean());

        PageDTO samplePageDTO = new PageDTO();
        samplePageDTO.setName("samplePageDTO");
        doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageAndMigrateDslByBranchedPageId(anyString(), anyBoolean(), anyBoolean());

        ActionViewDTO sampleActionViewDTO = new ActionViewDTO();
        sampleActionViewDTO.setName("sampleActionViewDTO");
        doReturn(Flux.just(sampleActionViewDTO)).when(spyNewActionService).getActionsForViewModeByPageId(anyString());

        ActionCollectionViewDTO sampleActionCollectionViewDTO = new ActionCollectionViewDTO();
        sampleActionCollectionViewDTO.setName("sampleActionCollectionViewDTO");
        doReturn(Flux.just(sampleActionCollectionViewDTO))
                .when(spyActionCollectionService)
                .getActionCollectionsForViewMode(anyString());

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "mockPageId", null, RefType.branch, "branch", ApplicationMode.PUBLISHED);
        StepVerifier.create(consolidatedInfoForPageLoad)
                .assertNext(consolidatedAPIResponseDTO -> {
                    assertNotNull(consolidatedAPIResponseDTO.getPublishedActions());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getPublishedActions()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionViewDTO",
                            consolidatedAPIResponseDTO
                                    .getPublishedActions()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getUserProfile());
                    assertEquals(
                            "sampleUserProfileDTO",
                            consolidatedAPIResponseDTO
                                    .getUserProfile()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getTenantConfig());
                    assertEquals(
                            "sampleTenant",
                            consolidatedAPIResponseDTO
                                    .getTenantConfig()
                                    .getData()
                                    .getDisplayName());

                    assertNotNull(consolidatedAPIResponseDTO.getFeatureFlags());
                    assertTrue(consolidatedAPIResponseDTO
                            .getFeatureFlags()
                            .getData()
                            .get("sampleFeatureFlag"));

                    assertNotNull(consolidatedAPIResponseDTO.getPages());
                    assertEquals(
                            "sampleWorkspaceId",
                            consolidatedAPIResponseDTO.getPages().getData().getWorkspaceId());

                    assertNotNull(consolidatedAPIResponseDTO.getCurrentTheme());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getCurrentTheme()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getThemes());
                    assertEquals(
                            1, consolidatedAPIResponseDTO.getThemes().getData().size());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getThemes()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPublishedActionCollections());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getPublishedActionCollections()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionCollectionViewDTO",
                            consolidatedAPIResponseDTO
                                    .getPublishedActionCollections()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPageWithMigratedDsl());
                    assertEquals(
                            "samplePageDTO",
                            consolidatedAPIResponseDTO
                                    .getPageWithMigratedDsl()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getCustomJSLibraries());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getCustomJSLibraries()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleJSLib",
                            consolidatedAPIResponseDTO
                                    .getCustomJSLibraries()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getProductAlert());
                    assertEquals(
                            "sampleProductAlert",
                            consolidatedAPIResponseDTO
                                    .getProductAlert()
                                    .getData()
                                    .getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testPageLoadResponseForEditModeWhenDefaultBranchIsDifferentFromDefault() {
        User sampleUser = new User();
        when(mockSessionUserService.getCurrentUser()).thenReturn(Mono.just(sampleUser));

        UserProfileDTO sampleUserProfileDTO = new UserProfileDTO();
        sampleUserProfileDTO.setName("sampleUserProfileDTO");
        when(mockUserService.buildUserProfileDTO(any())).thenReturn(Mono.just(sampleUserProfileDTO));

        Map<String, Boolean> sampleFeatureFlagMap = new HashMap<>();
        sampleFeatureFlagMap.put("sampleFeatureFlag", true);
        when(mockUserDataService.getFeatureFlagsForCurrentUser()).thenReturn(Mono.just(sampleFeatureFlagMap));

        when(mockUserDataService.updateLastUsedResourceAndWorkspaceList(any(), any(), any()))
                .thenReturn(Mono.just(new UserData()));

        Tenant sampleTenant = new Tenant();
        sampleTenant.setDisplayName("sampleTenant");
        when(mockTenantService.getTenantConfiguration()).thenReturn(Mono.just(sampleTenant));

        ProductAlertResponseDTO sampleProductAlertResponseDTO = new ProductAlertResponseDTO();
        sampleProductAlertResponseDTO.setTitle("sampleProductAlert");
        when(mockProductAlertService.getSingleApplicableMessage())
                .thenReturn(Mono.just(List.of(sampleProductAlertResponseDTO)));

        ApplicationPagesDTO sampleApplicationPagesDTO = new ApplicationPagesDTO();
        sampleApplicationPagesDTO.setWorkspaceId("sampleWorkspaceId");

        Application mockApplicationBaseBranch = new Application();
        GitArtifactMetadata baseMetadata = new GitArtifactMetadata();
        baseMetadata.setRefName("master");
        baseMetadata.setDefaultBranchName("newDefaultBranch");
        baseMetadata.setDefaultApplicationId("mockBaseId");
        mockApplicationBaseBranch.setGitArtifactMetadata(baseMetadata);
        mockApplicationBaseBranch.setId("mockId");

        doReturn(Mono.just(mockApplicationBaseBranch))
                .when(spyApplicationService)
                .findByBranchedApplicationIdAndApplicationMode(anyString(), any());

        ApplicationPage defaultApplicationPage = new ApplicationPage();
        defaultApplicationPage.setIsDefault(true);
        defaultApplicationPage.setId("defaultPageId");

        Application mockDefaultApplication = new Application();
        GitArtifactMetadata defaultMetadata = new GitArtifactMetadata();
        defaultMetadata.setRefName("newDefaultBranch");
        defaultMetadata.setDefaultApplicationId("mockBaseId");
        mockDefaultApplication.setGitArtifactMetadata(defaultMetadata);
        mockDefaultApplication.setId("defaultApplicationId");
        mockDefaultApplication.setPages(List.of(defaultApplicationPage));
        mockDefaultApplication.setWorkspaceId("sampleWorkspaceId");

        doReturn(Mono.just(mockDefaultApplication))
                .when(spyApplicationService)
                .findByBaseIdBranchNameAndApplicationMode(anyString(), anyString(), any());

        NewPage basePage = new NewPage();
        basePage.setApplicationId("mockBaseId");

        PageDTO unpublishedPage = new PageDTO();
        NewPage defaultAppDefaultPage = new NewPage();
        defaultAppDefaultPage.setId("defaultPageId");
        defaultAppDefaultPage.setApplicationId("defaultApplicationId");
        defaultAppDefaultPage.setUnpublishedPage(unpublishedPage);

        doReturn(Mono.just(basePage))
                .when(spyNewPageService)
                .findByRefTypeAndRefNameAndBasePageId(any(), eq(null), anyString(), any(), any());

        doReturn(Mono.just(defaultAppDefaultPage))
                .when(spyNewPageService)
                .findByRefTypeAndRefNameAndBasePageId(any(), anyString(), anyString(), any(), any());

        doReturn(Mono.just(List.of(defaultAppDefaultPage)))
                .when(spyApplicationPageService)
                .getPagesBasedOnApplicationMode(any(), any());

        doReturn(Mono.just(new PageDTO()))
                .when(spyApplicationPageService)
                .getPageAndMigrateDslByBranchedPageId(anyString(), anyBoolean(), anyBoolean());

        Theme sampleTheme = new Theme();
        sampleTheme.setName("sampleTheme");
        doReturn(Mono.just(sampleTheme)).when(spyThemeService).getApplicationTheme(anyString(), any());
        doReturn(Flux.just(sampleTheme)).when(spyThemeService).getApplicationThemes(anyString());

        CustomJSLib sampleCustomJSLib = new CustomJSLib();
        sampleCustomJSLib.setName("sampleJSLib");
        doReturn(Mono.just(List.of(sampleCustomJSLib)))
                .when(spyCustomJSLibService)
                .getAllJSLibsInContext(anyString(), any(), anyBoolean());

        PageDTO samplePageDTO = new PageDTO();
        samplePageDTO.setName("samplePageDTO");
        doReturn(Mono.just(samplePageDTO))
                .doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageAndMigrateDslByBranchedPageId(anyString(), anyBoolean(), anyBoolean());

        doReturn(Mono.just(samplePageDTO))
                .doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageDTOAfterMigratingDSL(any(), anyBoolean(), anyBoolean());

        doReturn(Mono.just(samplePageDTO))
                .doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageDTOAfterMigratingDSL(any(), anyBoolean(), anyBoolean());

        ActionDTO sampleActionDTO = new ActionDTO();
        sampleActionDTO.setName("sampleActionDTO");
        sampleActionDTO.setUpdatedAt(Instant.now());
        doReturn(Flux.just(sampleActionDTO)).when(spyNewActionService).getUnpublishedActions(any(), anyBoolean());

        ActionCollectionDTO sampleActionCollectionDTO = new ActionCollectionDTO();
        sampleActionCollectionDTO.setName("sampleActionCollectionDTO");
        doReturn(Flux.just(sampleActionCollectionDTO))
                .when(spyActionCollectionService)
                .getPopulatedActionCollectionsByViewMode(any(), anyBoolean());

        PageNameIdDTO samplePageNameIdDTO = new PageNameIdDTO();
        samplePageNameIdDTO.setName("samplePageNameIdDTO");
        sampleApplicationPagesDTO.setPages(List.of(samplePageNameIdDTO));

        Plugin samplePlugin = new Plugin();
        samplePlugin.setName("samplePlugin");
        samplePlugin.setId("samplePluginId");
        samplePlugin.setPackageName("sample-plugin");
        Plugin sampleRestApiPlugin = new Plugin();
        sampleRestApiPlugin.setName("sampleRestApiPlugin");
        sampleRestApiPlugin.setId("sampleRestApiPluginId");
        sampleRestApiPlugin.setPackageName(REST_API_PLUGIN);
        Plugin sampleGraphqlPlugin = new Plugin();
        sampleGraphqlPlugin.setName("sampleGraphqlPlugin");
        sampleGraphqlPlugin.setId("sampleGraphqlPluginId");
        sampleGraphqlPlugin.setPackageName(GRAPHQL_PLUGIN);
        Plugin sampleAiPlugin = new Plugin();
        sampleAiPlugin.setName("sampleAiPlugin");
        sampleAiPlugin.setId("sampleAiPluginId");
        sampleAiPlugin.setPackageName(APPSMITH_AI_PLUGIN);
        when(mockPluginService.getInWorkspace(anyString()))
                .thenReturn(Flux.just(samplePlugin, sampleRestApiPlugin, sampleGraphqlPlugin, sampleAiPlugin));

        Datasource sampleDatasource = new Datasource();
        sampleDatasource.setName("sampleDatasource");
        sampleDatasource.setPluginId("samplePluginId");
        when(mockDatasourceService.getAllWithStorages(any())).thenReturn(Flux.just(sampleDatasource));

        Map<String, Map<?, ?>> sampleFormConfig = new HashMap<>();
        sampleFormConfig.put("key", Map.of());
        when(mockPluginService.getFormConfig(anyString())).thenReturn(Mono.just(sampleFormConfig));

        MockDataSet sampleMockDataSet = new MockDataSet();
        sampleMockDataSet.setName("sampleMockDataSet");
        MockDataDTO sampleMockDataDTO = new MockDataDTO();
        sampleMockDataDTO.setMockdbs(List.of(sampleMockDataSet));
        when(mockMockDataService.getMockDataSet()).thenReturn(Mono.just(sampleMockDataDTO));

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad("pageId", null, null, null, ApplicationMode.EDIT);
        StepVerifier.create(consolidatedInfoForPageLoad)
                .assertNext(consolidatedAPIResponseDTO -> {
                    assertNotNull(consolidatedAPIResponseDTO.getUserProfile());
                    assertEquals(
                            "sampleUserProfileDTO",
                            consolidatedAPIResponseDTO
                                    .getUserProfile()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getTenantConfig());
                    assertEquals(
                            "sampleTenant",
                            consolidatedAPIResponseDTO
                                    .getTenantConfig()
                                    .getData()
                                    .getDisplayName());

                    assertNotNull(consolidatedAPIResponseDTO.getFeatureFlags());
                    assertTrue(consolidatedAPIResponseDTO
                            .getFeatureFlags()
                            .getData()
                            .get("sampleFeatureFlag"));

                    assertNotNull(consolidatedAPIResponseDTO.getCurrentTheme());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getCurrentTheme()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getThemes());
                    assertEquals(
                            1, consolidatedAPIResponseDTO.getThemes().getData().size());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getThemes()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getCustomJSLibraries());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getCustomJSLibraries()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleJSLib",
                            consolidatedAPIResponseDTO
                                    .getCustomJSLibraries()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getProductAlert());
                    assertEquals(
                            "sampleProductAlert",
                            consolidatedAPIResponseDTO
                                    .getProductAlert()
                                    .getData()
                                    .getTitle());

                    assertNotNull(consolidatedAPIResponseDTO.getUnpublishedActions());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getUnpublishedActions()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionDTO",
                            consolidatedAPIResponseDTO
                                    .getUnpublishedActions()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getUnpublishedActionCollections());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getUnpublishedActionCollections()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionCollectionDTO",
                            consolidatedAPIResponseDTO
                                    .getUnpublishedActionCollections()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPagesWithMigratedDsl());
                    assertNotNull(consolidatedAPIResponseDTO.getUnpublishedActions());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getUnpublishedActions()
                                    .getData()
                                    .size());
                    assertNotNull(consolidatedAPIResponseDTO
                            .getUnpublishedActions()
                            .getData()
                            .get(0)
                            .getUpdatedAt());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getPagesWithMigratedDsl()
                                    .getData()
                                    .size());
                    assertEquals(
                            "samplePageDTO",
                            consolidatedAPIResponseDTO
                                    .getPagesWithMigratedDsl()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPlugins());
                    assertEquals(
                            4, consolidatedAPIResponseDTO.getPlugins().getData().size());
                    List<String> pluginPackageNameList = consolidatedAPIResponseDTO.getPlugins().getData().stream()
                            .map(Plugin::getPackageName)
                            .toList();
                    assertTrue(pluginPackageNameList.contains(REST_API_PLUGIN));
                    assertTrue(pluginPackageNameList.contains(GRAPHQL_PLUGIN));
                    assertTrue(pluginPackageNameList.contains(APPSMITH_AI_PLUGIN));

                    assertNotNull(consolidatedAPIResponseDTO.getPluginFormConfigs());
                    assertEquals(
                            4,
                            consolidatedAPIResponseDTO
                                    .getPluginFormConfigs()
                                    .getData()
                                    .keySet()
                                    .size());
                    assertTrue(consolidatedAPIResponseDTO
                            .getPluginFormConfigs()
                            .getData()
                            .containsKey("samplePluginId"));
                    assertTrue(consolidatedAPIResponseDTO
                            .getPluginFormConfigs()
                            .getData()
                            .containsKey("sampleRestApiPluginId"));
                    assertTrue(consolidatedAPIResponseDTO
                            .getPluginFormConfigs()
                            .getData()
                            .containsKey("sampleGraphqlPluginId"));
                    assertTrue(consolidatedAPIResponseDTO
                            .getPluginFormConfigs()
                            .getData()
                            .containsKey("sampleAiPluginId"));

                    assertNotNull(consolidatedAPIResponseDTO.getMockDatasources());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getMockDatasources()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleMockDataSet",
                            consolidatedAPIResponseDTO
                                    .getMockDatasources()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPages());
                    assertEquals(
                            "defaultApplicationId",
                            consolidatedAPIResponseDTO
                                    .getPages()
                                    .getData()
                                    .getApplication()
                                    .getId());
                })
                .verifyComplete();
    }

    @Test
    public void testPageLoadWhenPageFromFeatureBranchAndCacheableRepositoryReturnsBaseApplicationId() {
        User sampleUser = new User();
        when(mockSessionUserService.getCurrentUser()).thenReturn(Mono.just(sampleUser));

        UserProfileDTO sampleUserProfileDTO = new UserProfileDTO();
        sampleUserProfileDTO.setName("sampleUserProfileDTO");
        when(mockUserService.buildUserProfileDTO(any())).thenReturn(Mono.just(sampleUserProfileDTO));

        Map<String, Boolean> sampleFeatureFlagMap = new HashMap<>();
        sampleFeatureFlagMap.put("sampleFeatureFlag", true);
        when(mockUserDataService.getFeatureFlagsForCurrentUser()).thenReturn(Mono.just(sampleFeatureFlagMap));

        when(mockUserDataService.updateLastUsedResourceAndWorkspaceList(any(), any(), any()))
                .thenReturn(Mono.just(new UserData()));

        Tenant sampleTenant = new Tenant();
        sampleTenant.setDisplayName("sampleTenant");
        when(mockTenantService.getTenantConfiguration()).thenReturn(Mono.just(sampleTenant));

        ProductAlertResponseDTO sampleProductAlertResponseDTO = new ProductAlertResponseDTO();
        sampleProductAlertResponseDTO.setTitle("sampleProductAlert");
        when(mockProductAlertService.getSingleApplicableMessage())
                .thenReturn(Mono.just(List.of(sampleProductAlertResponseDTO)));

        final String WORKSPACE_ID = "sampleWorkspaceId";
        final String DEFAULT_APPLICATION_ID = "defaultApplicationId";
        final String BASE_APPLICATION_ID = "baseApplicationId";
        final String FEATURE_APPLICATION_ID = "featureApplicationId";
        final String DEFAULT_BRANCH = "defaultBranch";
        final String BASE_BRANCH = "baseBranch";
        final String FEATURE_PAGE_ID = "featurePageId";

        ApplicationPagesDTO sampleApplicationPagesDTO = new ApplicationPagesDTO();
        sampleApplicationPagesDTO.setWorkspaceId(WORKSPACE_ID);

        // base metadata
        GitArtifactMetadata baseMetadata = new GitArtifactMetadata();
        baseMetadata.setRefName(BASE_BRANCH);
        baseMetadata.setDefaultBranchName(DEFAULT_BRANCH);
        baseMetadata.setDefaultApplicationId(DEFAULT_APPLICATION_ID);

        Application baseBranchApplication = new Application();
        baseBranchApplication.setGitArtifactMetadata(baseMetadata);
        baseBranchApplication.setWorkspaceId(WORKSPACE_ID);
        baseBranchApplication.setId(BASE_APPLICATION_ID);

        // caching the base application id for the test case.
        cacheableRepositoryHelper
                .fetchBaseApplicationId(FEATURE_PAGE_ID, BASE_APPLICATION_ID)
                .block();

        doReturn(Mono.just(baseBranchApplication))
                .when(spyApplicationService)
                .findByBaseIdBranchNameAndApplicationMode(eq(BASE_APPLICATION_ID), eq(null), any());

        ApplicationPage defaultApplicationPage = new ApplicationPage();
        defaultApplicationPage.setIsDefault(true);
        defaultApplicationPage.setId("defaultPageId");

        // default metadata
        GitArtifactMetadata defaultMetadata = new GitArtifactMetadata();
        defaultMetadata.setRefName(DEFAULT_BRANCH);
        defaultMetadata.setDefaultBranchName(DEFAULT_BRANCH);
        defaultMetadata.setDefaultApplicationId(DEFAULT_APPLICATION_ID);

        Application defaultBranchApplication = new Application();
        defaultBranchApplication.setGitArtifactMetadata(defaultMetadata);
        defaultBranchApplication.setWorkspaceId(WORKSPACE_ID);
        defaultBranchApplication.setId(DEFAULT_APPLICATION_ID);
        defaultBranchApplication.setPages(List.of(defaultApplicationPage));

        doReturn(Mono.just(defaultBranchApplication))
                .when(spyApplicationService)
                .findByBaseIdBranchNameAndApplicationMode(eq(BASE_APPLICATION_ID), eq(DEFAULT_BRANCH), any());

        NewPage featureBranchPage = new NewPage();
        featureBranchPage.setId(FEATURE_PAGE_ID);
        featureBranchPage.setApplicationId(FEATURE_APPLICATION_ID);
        featureBranchPage.setUnpublishedPage(new PageDTO());

        doReturn(Mono.just(featureBranchPage))
                .when(spyNewPageService)
                .findByRefTypeAndRefNameAndBasePageIdAndApplicationMode(any(), eq(null), eq(FEATURE_PAGE_ID), any());

        doReturn(Mono.just(new PageDTO()))
                .when(spyApplicationPageService)
                .getPageAndMigrateDslByBranchedPageId(anyString(), anyBoolean(), anyBoolean());

        Theme sampleTheme = new Theme();
        sampleTheme.setName("sampleTheme");
        doReturn(Mono.just(sampleTheme)).when(spyThemeService).getApplicationTheme(anyString(), any());
        doReturn(Flux.just(sampleTheme)).when(spyThemeService).getApplicationThemes(anyString());

        CustomJSLib sampleCustomJSLib = new CustomJSLib();
        sampleCustomJSLib.setName("sampleJSLib");
        doReturn(Mono.just(List.of(sampleCustomJSLib)))
                .when(spyCustomJSLibService)
                .getAllJSLibsInContext(anyString(), any(), anyBoolean());

        PageDTO samplePageDTO = new PageDTO();
        samplePageDTO.setName("samplePageDTO");
        doReturn(Mono.just(samplePageDTO))
                .doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageAndMigrateDslByBranchedPageId(anyString(), anyBoolean(), anyBoolean());

        doReturn(Mono.just(samplePageDTO))
                .doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageDTOAfterMigratingDSL(any(), anyBoolean(), anyBoolean());

        doReturn(Mono.just(samplePageDTO))
                .doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageDTOAfterMigratingDSL(any(), anyBoolean(), anyBoolean());

        ActionDTO sampleActionDTO = new ActionDTO();
        sampleActionDTO.setName("sampleActionDTO");
        sampleActionDTO.setUpdatedAt(Instant.now());
        doReturn(Flux.just(sampleActionDTO)).when(spyNewActionService).getUnpublishedActions(any(), anyBoolean());

        ActionCollectionDTO sampleActionCollectionDTO = new ActionCollectionDTO();
        sampleActionCollectionDTO.setName("sampleActionCollectionDTO");
        doReturn(Flux.just(sampleActionCollectionDTO))
                .when(spyActionCollectionService)
                .getPopulatedActionCollectionsByViewMode(any(), anyBoolean());

        PageNameIdDTO samplePageNameIdDTO = new PageNameIdDTO();
        samplePageNameIdDTO.setName("samplePageNameIdDTO");
        sampleApplicationPagesDTO.setPages(List.of(samplePageNameIdDTO));

        Plugin samplePlugin = new Plugin();
        samplePlugin.setName("samplePlugin");
        samplePlugin.setId("samplePluginId");
        samplePlugin.setPackageName("sample-plugin");
        Plugin sampleRestApiPlugin = new Plugin();
        sampleRestApiPlugin.setName("sampleRestApiPlugin");
        sampleRestApiPlugin.setId("sampleRestApiPluginId");
        sampleRestApiPlugin.setPackageName(REST_API_PLUGIN);
        Plugin sampleGraphqlPlugin = new Plugin();
        sampleGraphqlPlugin.setName("sampleGraphqlPlugin");
        sampleGraphqlPlugin.setId("sampleGraphqlPluginId");
        sampleGraphqlPlugin.setPackageName(GRAPHQL_PLUGIN);
        Plugin sampleAiPlugin = new Plugin();
        sampleAiPlugin.setName("sampleAiPlugin");
        sampleAiPlugin.setId("sampleAiPluginId");
        sampleAiPlugin.setPackageName(APPSMITH_AI_PLUGIN);
        when(mockPluginService.getInWorkspace(anyString()))
                .thenReturn(Flux.just(samplePlugin, sampleRestApiPlugin, sampleGraphqlPlugin, sampleAiPlugin));

        Datasource sampleDatasource = new Datasource();
        sampleDatasource.setName("sampleDatasource");
        sampleDatasource.setPluginId("samplePluginId");
        when(mockDatasourceService.getAllWithStorages(any())).thenReturn(Flux.just(sampleDatasource));

        Map<String, Map<?, ?>> sampleFormConfig = new HashMap<>();
        sampleFormConfig.put("key", Map.of());
        when(mockPluginService.getFormConfig(anyString())).thenReturn(Mono.just(sampleFormConfig));

        MockDataSet sampleMockDataSet = new MockDataSet();
        sampleMockDataSet.setName("sampleMockDataSet");
        MockDataDTO sampleMockDataDTO = new MockDataDTO();
        sampleMockDataDTO.setMockdbs(List.of(sampleMockDataSet));
        when(mockMockDataService.getMockDataSet()).thenReturn(Mono.just(sampleMockDataDTO));

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        FEATURE_PAGE_ID, null, null, null, ApplicationMode.PUBLISHED);
        StepVerifier.create(consolidatedInfoForPageLoad)
                .assertNext(consolidatedAPIResponseDTO -> {
                    assertNotNull(consolidatedAPIResponseDTO);

                    ResponseDTO<ApplicationPagesDTO> pages = consolidatedAPIResponseDTO.getPages();
                    ResponseDTO<PageDTO> pageWithMigratedDsl = consolidatedAPIResponseDTO.getPageWithMigratedDsl();

                    assertNull(pages.getData());
                    assertNotNull(pages.getResponseMeta());
                    assertNotNull(pages.getResponseMeta().getError());

                    assertThat(pages.getResponseMeta().getError().getCode())
                            .isEqualTo(AppsmithError.NO_RESOURCE_FOUND.getAppErrorCode());
                    assertThat(pages.getResponseMeta().getError().getMessage())
                            .isEqualTo("Unable to find application featureApplicationId");

                    assertNull(pageWithMigratedDsl.getData());
                    assertNotNull(pageWithMigratedDsl.getResponseMeta());
                    assertNotNull(pageWithMigratedDsl.getResponseMeta().getError());

                    assertThat(pageWithMigratedDsl.getResponseMeta().getError().getCode())
                            .isEqualTo(AppsmithError.NO_RESOURCE_FOUND.getAppErrorCode());
                    assertThat(pageWithMigratedDsl.getResponseMeta().getError().getMessage())
                            .isEqualTo("Unable to find application featureApplicationId");
                })
                .verifyComplete();
    }
}
