package com.appsmith.server.services;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
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
import com.appsmith.server.themes.base.ThemeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
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

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class ConsolidatedAPIServiceImplTest {

    @SpyBean
    ConsolidatedAPIService consolidatedAPIService;

    @SpyBean
    SessionUserService sessionUserService;

    @SpyBean
    UserService userService;

    @SpyBean
    UserDataService userDataService;

    @SpyBean
    TenantService tenantService;

    @SpyBean
    ProductAlertService productAlertService;

    @SpyBean
    NewPageService newPageService;

    @SpyBean
    NewActionService newActionService;

    @SpyBean
    ActionCollectionService actionCollectionService;

    @SpyBean
    ThemeService themeService;

    @SpyBean
    ApplicationPageService applicationPageService;

    @SpyBean
    CustomJSLibService customJSLibService;

    @SpyBean
    PluginService pluginService;

    @SpyBean
    ApplicationService applicationService;

    @SpyBean
    DatasourceService datasourceService;

    @SpyBean
    MockDataService mockDataService;

    @Test
    public void testErrorWhenModeIsNullAndPageIdAvailable() {
        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad("pageId", null, null, null);
        StepVerifier.create(consolidatedInfoForPageLoad).verifyErrorSatisfies(error -> {
            assertTrue(error instanceof AppsmithException);
            assertEquals("Please enter a valid parameter appMode.", error.getMessage());
        });
    }

    @Test
    public void testPageLoadResponseWhenPageIdAndApplicationIdMissing() {
        User sampleUser = new User();
        doReturn(Mono.just(sampleUser)).when(sessionUserService).getCurrentUser();

        UserProfileDTO sampleUserProfileDTO = new UserProfileDTO();
        sampleUserProfileDTO.setName("sampleUserProfileDTO");
        doReturn(Mono.just(sampleUserProfileDTO)).when(userService).buildUserProfileDTO(any());

        Map<String, Boolean> sampleFeatureFlagMap = new HashMap<>();
        sampleFeatureFlagMap.put("sampleFeatureFlag", true);
        doReturn(Mono.just(sampleFeatureFlagMap)).when(userDataService).getFeatureFlagsForCurrentUser();

        Tenant sampleTenant = new Tenant();
        sampleTenant.setDisplayName("sampleTenant");
        doReturn(Mono.just(sampleTenant)).when(tenantService).getTenantConfiguration();

        ProductAlertResponseDTO sampleProductAlertResponseDTO = new ProductAlertResponseDTO();
        sampleProductAlertResponseDTO.setTitle("sampleProductAlert");
        doReturn(Mono.just(List.of(sampleProductAlertResponseDTO)))
                .when(productAlertService)
                .getSingleApplicableMessage();

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId", "appId", "branch", ApplicationMode.PUBLISHED);
        StepVerifier.create(consolidatedInfoForPageLoad)
                .assertNext(consolidatedAPIResponseDTO -> {
                    assertNotNull(consolidatedAPIResponseDTO.getV1UsersMeResp());
                    assertEquals(
                            "sampleUserProfileDTO",
                            consolidatedAPIResponseDTO
                                    .getV1UsersMeResp()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1TenantsCurrentResp());
                    assertEquals(
                            "sampleTenant",
                            consolidatedAPIResponseDTO
                                    .getV1TenantsCurrentResp()
                                    .getData()
                                    .getDisplayName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1UsersFeaturesResp());
                    assertTrue(consolidatedAPIResponseDTO
                            .getV1UsersFeaturesResp()
                            .getData()
                            .get("sampleFeatureFlag"));

                    assertNotNull(consolidatedAPIResponseDTO.getV1ProductAlertResp());
                    assertEquals(
                            "sampleProductAlert",
                            consolidatedAPIResponseDTO
                                    .getV1ProductAlertResp()
                                    .getData()
                                    .getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testPageLoadResponseForViewMode() {
        User sampleUser = new User();
        doReturn(Mono.just(sampleUser)).when(sessionUserService).getCurrentUser();

        UserProfileDTO sampleUserProfileDTO = new UserProfileDTO();
        sampleUserProfileDTO.setName("sampleUserProfileDTO");
        doReturn(Mono.just(sampleUserProfileDTO)).when(userService).buildUserProfileDTO(any());

        Map<String, Boolean> sampleFeatureFlagMap = new HashMap<>();
        sampleFeatureFlagMap.put("sampleFeatureFlag", true);
        doReturn(Mono.just(sampleFeatureFlagMap)).when(userDataService).getFeatureFlagsForCurrentUser();

        Tenant sampleTenant = new Tenant();
        sampleTenant.setDisplayName("sampleTenant");
        doReturn(Mono.just(sampleTenant)).when(tenantService).getTenantConfiguration();

        ProductAlertResponseDTO sampleProductAlertResponseDTO = new ProductAlertResponseDTO();
        sampleProductAlertResponseDTO.setTitle("sampleProductAlert");
        doReturn(Mono.just(List.of(sampleProductAlertResponseDTO)))
                .when(productAlertService)
                .getSingleApplicableMessage();

        ApplicationPagesDTO sampleApplicationPagesDTO = new ApplicationPagesDTO();
        sampleApplicationPagesDTO.setWorkspaceId("sampleWorkspaceId");
        doReturn(Mono.just(sampleApplicationPagesDTO))
                .when(newPageService)
                .findApplicationPages(anyString(), any(), anyString(), any());

        Theme sampleTheme = new Theme();
        sampleTheme.setName("sampleTheme");
        doReturn(Mono.just(sampleTheme)).when(themeService).getApplicationTheme(anyString(), any(), anyString());
        doReturn(Flux.just(sampleTheme)).when(themeService).getApplicationThemes(anyString(), anyString());

        CustomJSLib sampleCustomJSLib = new CustomJSLib();
        sampleCustomJSLib.setName("sampleJSLib");
        doReturn(Mono.just(List.of(sampleCustomJSLib)))
                .when(customJSLibService)
                .getAllJSLibsInContext(anyString(), any(), anyString(), anyBoolean());

        PageDTO samplePageDTO = new PageDTO();
        samplePageDTO.setName("samplePageDTO");
        doReturn(Mono.just(samplePageDTO))
                .when(applicationPageService)
                .getPageAndMigrateDslByBranchAndDefaultPageId(anyString(), anyString(), anyBoolean(), anyBoolean());

        ActionViewDTO sampleActionViewDTO = new ActionViewDTO();
        sampleActionViewDTO.setName("sampleActionViewDTO");
        doReturn(Flux.just(sampleActionViewDTO)).when(newActionService).getActionsForViewMode(anyString(), anyString());

        ActionCollectionViewDTO sampleActionCollectionViewDTO = new ActionCollectionViewDTO();
        sampleActionCollectionViewDTO.setName("sampleActionCollectionViewDTO");
        doReturn(Flux.just(sampleActionCollectionViewDTO))
                .when(actionCollectionService)
                .getActionCollectionsForViewMode(anyString(), anyString());

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId", "appId", "branch", ApplicationMode.PUBLISHED);
        StepVerifier.create(consolidatedInfoForPageLoad)
                .assertNext(consolidatedAPIResponseDTO -> {
                    assertNotNull(consolidatedAPIResponseDTO.getV1ActionsViewResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1ActionsViewResp()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionViewDTO",
                            consolidatedAPIResponseDTO
                                    .getV1ActionsViewResp()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1UsersMeResp());
                    assertEquals(
                            "sampleUserProfileDTO",
                            consolidatedAPIResponseDTO
                                    .getV1UsersMeResp()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1TenantsCurrentResp());
                    assertEquals(
                            "sampleTenant",
                            consolidatedAPIResponseDTO
                                    .getV1TenantsCurrentResp()
                                    .getData()
                                    .getDisplayName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1UsersFeaturesResp());
                    assertTrue(consolidatedAPIResponseDTO
                            .getV1UsersFeaturesResp()
                            .getData()
                            .get("sampleFeatureFlag"));

                    assertNotNull(consolidatedAPIResponseDTO.getV1PagesResp());
                    assertEquals(
                            "sampleWorkspaceId",
                            consolidatedAPIResponseDTO
                                    .getV1PagesResp()
                                    .getData()
                                    .getWorkspaceId());

                    assertNotNull(consolidatedAPIResponseDTO.getV1ThemesApplicationCurrentModeResp());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getV1ThemesApplicationCurrentModeResp()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1ThemesResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1ThemesResp()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getV1ThemesResp()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1CollectionsActionsViewResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1CollectionsActionsViewResp()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionCollectionViewDTO",
                            consolidatedAPIResponseDTO
                                    .getV1CollectionsActionsViewResp()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1PublishedPageResp());
                    assertEquals(
                            "samplePageDTO",
                            consolidatedAPIResponseDTO
                                    .getV1PublishedPageResp()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1LibrariesApplicationResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1LibrariesApplicationResp()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleJSLib",
                            consolidatedAPIResponseDTO
                                    .getV1LibrariesApplicationResp()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1ProductAlertResp());
                    assertEquals(
                            "sampleProductAlert",
                            consolidatedAPIResponseDTO
                                    .getV1ProductAlertResp()
                                    .getData()
                                    .getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testPageLoadResponseForEditMode() {
        User sampleUser = new User();
        doReturn(Mono.just(sampleUser)).when(sessionUserService).getCurrentUser();

        UserProfileDTO sampleUserProfileDTO = new UserProfileDTO();
        sampleUserProfileDTO.setName("sampleUserProfileDTO");
        doReturn(Mono.just(sampleUserProfileDTO)).when(userService).buildUserProfileDTO(any());

        Map<String, Boolean> sampleFeatureFlagMap = new HashMap<>();
        sampleFeatureFlagMap.put("sampleFeatureFlag", true);
        doReturn(Mono.just(sampleFeatureFlagMap)).when(userDataService).getFeatureFlagsForCurrentUser();

        Tenant sampleTenant = new Tenant();
        sampleTenant.setDisplayName("sampleTenant");
        doReturn(Mono.just(sampleTenant)).when(tenantService).getTenantConfiguration();

        ProductAlertResponseDTO sampleProductAlertResponseDTO = new ProductAlertResponseDTO();
        sampleProductAlertResponseDTO.setTitle("sampleProductAlert");
        doReturn(Mono.just(List.of(sampleProductAlertResponseDTO)))
                .when(productAlertService)
                .getSingleApplicableMessage();

        ApplicationPagesDTO sampleApplicationPagesDTO = new ApplicationPagesDTO();
        sampleApplicationPagesDTO.setWorkspaceId("sampleWorkspaceId");
        doReturn(Mono.just(sampleApplicationPagesDTO))
                .when(newPageService)
                .findApplicationPages(anyString(), any(), anyString(), any());

        Theme sampleTheme = new Theme();
        sampleTheme.setName("sampleTheme");
        doReturn(Mono.just(sampleTheme)).when(themeService).getApplicationTheme(anyString(), any(), anyString());
        doReturn(Flux.just(sampleTheme)).when(themeService).getApplicationThemes(anyString(), anyString());

        CustomJSLib sampleCustomJSLib = new CustomJSLib();
        sampleCustomJSLib.setName("sampleJSLib");
        doReturn(Mono.just(List.of(sampleCustomJSLib)))
                .when(customJSLibService)
                .getAllJSLibsInContext(anyString(), any(), anyString(), anyBoolean());

        PageDTO samplePageDTO = new PageDTO();
        samplePageDTO.setName("samplePageDTO");
        doReturn(Mono.just(samplePageDTO))
                .when(applicationPageService)
                .getPageAndMigrateDslByBranchAndDefaultPageId(anyString(), anyString(), anyBoolean(), anyBoolean());
        doReturn(Mono.just(samplePageDTO))
                .when(applicationPageService)
                .getPageAndMigrateDslByBranchAndDefaultPageId(anyString(), anyString(), anyBoolean(), anyBoolean());

        ActionDTO sampleActionDTO = new ActionDTO();
        sampleActionDTO.setName("sampleActionDTO");
        doReturn(Flux.just(sampleActionDTO))
                .when(newActionService)
                .getUnpublishedActions(any(), anyString(), anyBoolean());

        ActionCollectionDTO sampleActionCollectionDTO = new ActionCollectionDTO();
        sampleActionCollectionDTO.setName("sampleActionCollectionDTO");
        doReturn(Flux.just(sampleActionCollectionDTO))
                .when(actionCollectionService)
                .getPopulatedActionCollectionsByViewMode(any(), anyBoolean(), anyString());

        PageNameIdDTO samplePageNameIdDTO = new PageNameIdDTO();
        samplePageNameIdDTO.setName("samplePageNameIdDTO");
        samplePageNameIdDTO.setDefaultPageId("pageId");
        sampleApplicationPagesDTO.setPages(List.of(samplePageNameIdDTO));

        Plugin samplePlugin = new Plugin();
        samplePlugin.setName("samplePlugin");
        doReturn(Flux.just(samplePlugin)).when(pluginService).get(any());

        Datasource sampleDatasource = new Datasource();
        sampleDatasource.setName("sampleDatasource");
        sampleDatasource.setPluginId("samplePluginId");
        doReturn(Flux.just(sampleDatasource)).when(datasourceService).getAllWithStorages(any());

        Map<String, Map> sampleFormConfig = new HashMap<>();
        sampleFormConfig.put("key", Map.of());
        doReturn(Mono.just(sampleFormConfig)).when(pluginService).getFormConfig(anyString());

        MockDataSet sampleMockDataSet = new MockDataSet();
        sampleMockDataSet.setName("sampleMockDataSet");
        MockDataDTO sampleMockDataDTO = new MockDataDTO();
        sampleMockDataDTO.setMockdbs(List.of(sampleMockDataSet));
        doReturn(Mono.just(sampleMockDataDTO)).when(mockDataService).getMockDataSet();

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId", "appId", "branch", ApplicationMode.EDIT);
        StepVerifier.create(consolidatedInfoForPageLoad)
                .assertNext(consolidatedAPIResponseDTO -> {
                    assertNotNull(consolidatedAPIResponseDTO.getV1UsersMeResp());
                    assertEquals(
                            "sampleUserProfileDTO",
                            consolidatedAPIResponseDTO
                                    .getV1UsersMeResp()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1TenantsCurrentResp());
                    assertEquals(
                            "sampleTenant",
                            consolidatedAPIResponseDTO
                                    .getV1TenantsCurrentResp()
                                    .getData()
                                    .getDisplayName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1UsersFeaturesResp());
                    assertTrue(consolidatedAPIResponseDTO
                            .getV1UsersFeaturesResp()
                            .getData()
                            .get("sampleFeatureFlag"));

                    assertNotNull(consolidatedAPIResponseDTO.getV1PagesResp());
                    assertEquals(
                            "sampleWorkspaceId",
                            consolidatedAPIResponseDTO
                                    .getV1PagesResp()
                                    .getData()
                                    .getWorkspaceId());

                    assertNotNull(consolidatedAPIResponseDTO.getV1ThemesApplicationCurrentModeResp());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getV1ThemesApplicationCurrentModeResp()
                                    .getData()
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1ThemesResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1ThemesResp()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleTheme",
                            consolidatedAPIResponseDTO
                                    .getV1ThemesResp()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1PagesResp());
                    assertEquals(
                            "sampleWorkspaceId",
                            consolidatedAPIResponseDTO
                                    .getV1PagesResp()
                                    .getData()
                                    .getWorkspaceId());

                    assertNotNull(consolidatedAPIResponseDTO.getV1LibrariesApplicationResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1LibrariesApplicationResp()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleJSLib",
                            consolidatedAPIResponseDTO
                                    .getV1LibrariesApplicationResp()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1ProductAlertResp());
                    assertEquals(
                            "sampleProductAlert",
                            consolidatedAPIResponseDTO
                                    .getV1ProductAlertResp()
                                    .getData()
                                    .getTitle());

                    assertNotNull(consolidatedAPIResponseDTO.getV1ActionsResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1ActionsResp()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionDTO",
                            consolidatedAPIResponseDTO
                                    .getV1ActionsResp()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1CollectionsActionsResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1CollectionsActionsResp()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleActionCollectionDTO",
                            consolidatedAPIResponseDTO
                                    .getV1CollectionsActionsResp()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1PageDSLs());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO.getV1PageDSLs().getData().size());
                    assertEquals(
                            "samplePageDTO",
                            consolidatedAPIResponseDTO
                                    .getV1PageDSLs()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1PluginsResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1PluginsResp()
                                    .getData()
                                    .size());
                    assertEquals(
                            "samplePlugin",
                            consolidatedAPIResponseDTO
                                    .getV1PluginsResp()
                                    .getData()
                                    .get(0)
                                    .getName());

                    assertNotNull(consolidatedAPIResponseDTO.getV1PluginFormConfigsResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1PluginFormConfigsResp()
                                    .getData()
                                    .keySet()
                                    .size());
                    assertTrue(consolidatedAPIResponseDTO
                            .getV1PluginFormConfigsResp()
                            .getData()
                            .containsKey("samplePluginId"));

                    assertNotNull(consolidatedAPIResponseDTO.getV1DatasourcesMockResp());
                    assertEquals(
                            1,
                            consolidatedAPIResponseDTO
                                    .getV1DatasourcesMockResp()
                                    .getData()
                                    .size());
                    assertEquals(
                            "sampleMockDataSet",
                            consolidatedAPIResponseDTO
                                    .getV1DatasourcesMockResp()
                                    .getData()
                                    .get(0)
                                    .getName());
                })
                .verifyComplete();
    }
}
