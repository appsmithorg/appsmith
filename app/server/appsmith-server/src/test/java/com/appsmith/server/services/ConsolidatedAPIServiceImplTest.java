package com.appsmith.server.services;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
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
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.themes.base.ThemeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

@SpringBootTest
@DirtiesContext
@ExtendWith(SpringExtension.class)
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
    ApplicationRepository spyApplicationRepository;

    @MockBean
    NewPageRepository mockNewPageRepository;

    @Test
    public void testErrorWhenModeIsNullAndPageIdAvailable() {
        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad("pageId", null, null, null, null);
        StepVerifier.create(consolidatedInfoForPageLoad).verifyErrorSatisfies(error -> {
            assertTrue(error instanceof AppsmithException);
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
                        "pageId", "appId", "branch", ApplicationMode.PUBLISHED, null);
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
        when(spyNewPageService.findApplicationPages(anyString(), any(), anyString(), any()))
                .thenReturn(Mono.just(sampleApplicationPagesDTO));

        Theme sampleTheme = new Theme();
        sampleTheme.setName("sampleTheme");
        doReturn(Mono.just(sampleTheme)).when(spyThemeService).getApplicationTheme(anyString(), any(), anyString());
        doReturn(Flux.just(sampleTheme)).when(spyThemeService).getApplicationThemes(anyString(), anyString());

        CustomJSLib sampleCustomJSLib = new CustomJSLib();
        sampleCustomJSLib.setName("sampleJSLib");
        doReturn(Mono.just(List.of(sampleCustomJSLib)))
                .when(spyCustomJSLibService)
                .getAllJSLibsInContext(anyString(), any(), anyString(), anyBoolean());

        PageDTO samplePageDTO = new PageDTO();
        samplePageDTO.setName("samplePageDTO");
        doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageAndMigrateDslByBranchAndDefaultPageId(anyString(), anyString(), anyBoolean(), anyBoolean());

        ActionViewDTO sampleActionViewDTO = new ActionViewDTO();
        sampleActionViewDTO.setName("sampleActionViewDTO");
        doReturn(Flux.just(sampleActionViewDTO))
                .when(spyNewActionService)
                .getActionsForViewMode(anyString(), anyString());

        ActionCollectionViewDTO sampleActionCollectionViewDTO = new ActionCollectionViewDTO();
        sampleActionCollectionViewDTO.setName("sampleActionCollectionViewDTO");
        doReturn(Flux.just(sampleActionCollectionViewDTO))
                .when(spyActionCollectionService)
                .getActionCollectionsForViewMode(anyString(), anyString());

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId", "appId", "branch", ApplicationMode.PUBLISHED, null);
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
        when(spyNewPageService.findApplicationPages(anyString(), any(), anyString(), any()))
                .thenReturn(Mono.just(sampleApplicationPagesDTO));

        Theme sampleTheme = new Theme();
        sampleTheme.setName("sampleTheme");
        doReturn(Mono.just(sampleTheme)).when(spyThemeService).getApplicationTheme(anyString(), any(), anyString());
        doReturn(Flux.just(sampleTheme)).when(spyThemeService).getApplicationThemes(anyString(), anyString());

        CustomJSLib sampleCustomJSLib = new CustomJSLib();
        sampleCustomJSLib.setName("sampleJSLib");
        doReturn(Mono.just(List.of(sampleCustomJSLib)))
                .when(spyCustomJSLibService)
                .getAllJSLibsInContext(anyString(), any(), anyString(), anyBoolean());

        PageDTO samplePageDTO = new PageDTO();
        samplePageDTO.setName("samplePageDTO");
        doReturn(Mono.just(samplePageDTO))
                .doReturn(Mono.just(samplePageDTO))
                .when(spyApplicationPageService)
                .getPageAndMigrateDslByBranchAndDefaultPageId(anyString(), anyString(), anyBoolean(), anyBoolean());

        ActionDTO sampleActionDTO = new ActionDTO();
        sampleActionDTO.setName("sampleActionDTO");
        doReturn(Flux.just(sampleActionDTO))
                .when(spyNewActionService)
                .getUnpublishedActions(any(), anyString(), anyBoolean());

        ActionCollectionDTO sampleActionCollectionDTO = new ActionCollectionDTO();
        sampleActionCollectionDTO.setName("sampleActionCollectionDTO");
        doReturn(Flux.just(sampleActionCollectionDTO))
                .when(spyActionCollectionService)
                .getPopulatedActionCollectionsByViewMode(any(), anyBoolean(), anyString());

        PageNameIdDTO samplePageNameIdDTO = new PageNameIdDTO();
        samplePageNameIdDTO.setName("samplePageNameIdDTO");
        samplePageNameIdDTO.setDefaultPageId("pageId");
        sampleApplicationPagesDTO.setPages(List.of(samplePageNameIdDTO));

        Plugin samplePlugin = new Plugin();
        samplePlugin.setName("samplePlugin");
        when(mockPluginService.get(any())).thenReturn(Flux.just(samplePlugin));

        Datasource sampleDatasource = new Datasource();
        sampleDatasource.setName("sampleDatasource");
        sampleDatasource.setPluginId("samplePluginId");
        when(mockDatasourceService.getAllWithStorages(any())).thenReturn(Flux.just(sampleDatasource));

        Map<String, Map> sampleFormConfig = new HashMap<>();
        sampleFormConfig.put("key", Map.of());
        when(mockPluginService.getFormConfig(anyString())).thenReturn(Mono.just(sampleFormConfig));

        MockDataSet sampleMockDataSet = new MockDataSet();
        sampleMockDataSet.setName("sampleMockDataSet");
        MockDataDTO sampleMockDataDTO = new MockDataDTO();
        sampleMockDataDTO.setMockdbs(List.of(sampleMockDataSet));
        when(mockMockDataService.getMockDataSet()).thenReturn(Mono.just(sampleMockDataDTO));

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId", "appId", "branch", ApplicationMode.EDIT, null);
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
                            1, consolidatedAPIResponseDTO.getPlugins().getData().size());
                    assertEquals(
                            "samplePlugin",
                            consolidatedAPIResponseDTO
                                    .getPlugins()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getPluginFormConfigs());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getPluginFormConfigs()
                                    .getData()
                                    .keySet()
                                    .size());
                    assertTrue(consolidatedAPIResponseDTO
                            .getPluginFormConfigs()
                            .getData()
                            .containsKey("samplePluginId"));

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

        when(mockNewPageRepository.findPageByBranchNameAndDefaultPageId(anyString(), anyString(), any()))
                .thenReturn(Mono.empty());
        doReturn(Mono.empty())
                .when(spyApplicationRepository)
                .getApplicationByGitBranchAndDefaultApplicationId(anyString(), anyString(), any(AclPermission.class));

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId", "appId", "branch", ApplicationMode.PUBLISHED, null);
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
}
