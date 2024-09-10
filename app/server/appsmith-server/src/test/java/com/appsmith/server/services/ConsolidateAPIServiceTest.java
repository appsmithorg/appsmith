package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ConsolidatedAPIResponseDTO;
import com.appsmith.server.dtos.ProductAlertResponseDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.NewPageRepositoryCake;
import com.appsmith.server.themes.base.ThemeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

// TODO - With the introduction of AOP on the cake class,
//  the SpyBean mocking does not work on repository class, we need to investigate this and fix it.
//  Until then the test is refactored into this new class
//  where we are using the @MockBean annotation to mock the entire repository class
@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
@ExtendWith(AfterAllCleanUpExtension.class)
public class ConsolidateAPIServiceTest {

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

    @MockBean
    ApplicationRepositoryCake spyApplicationRepository;

    @MockBean
    NewPageRepositoryCake mockNewPageRepository;

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

        when(mockNewPageRepository.findPageByBranchNameAndBasePageId(anyString(), anyString(), any(), any()))
                .thenReturn(Mono.empty());

        doReturn(Mono.empty())
                .when(spyApplicationRepository)
                .getApplicationByGitBranchAndBaseApplicationId(anyString(), anyString(), any(AclPermission.class));

        when(spyApplicationRepository.getApplicationByGitBranchAndBaseApplicationId(
                        anyString(), any(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.empty());

        Mono<ConsolidatedAPIResponseDTO> consolidatedInfoForPageLoad =
                consolidatedAPIService.getConsolidatedInfoForPageLoad(
                        "pageId", "appId", "branch", ApplicationMode.PUBLISHED);
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
