package com.appsmith.server.services;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.ConsolidatedAPIResponseDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.ProductAlertResponseDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.themes.base.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
@Service
public class ConsolidatedAPIServiceImpl implements ConsolidatedAPIService {
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final UserDataService userDataService;
    private final TenantService tenantService;
    private final ProductAlertService productAlertService;
    private final NewPageService newPageService;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final ThemeService themeService;
    private final ApplicationPageService applicationPageService;
    private final CustomJSLibService customJSLibService;

    public ConsolidatedAPIServiceImpl(
            SessionUserService sessionUserService,
            UserService userService,
            UserDataService userDataService,
            TenantService tenantService,
            ProductAlertService productAlertService,
            NewPageService newPageService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            ThemeService themeService,
            ApplicationPageService applicationPageService,
            CustomJSLibService customJSLibService) {
        this.sessionUserService = sessionUserService;
        this.userService = userService;
        this.userDataService = userDataService;
        this.tenantService = tenantService;
        this.productAlertService = productAlertService;
        this.newPageService = newPageService;
        this.newActionService = newActionService;
        this.actionCollectionService = actionCollectionService;
        this.themeService = themeService;
        this.applicationPageService = applicationPageService;
        this.customJSLibService = customJSLibService;
    }

    @Override
    public Mono<ConsolidatedAPIResponseDTO> getConsolidatedInfoForPageLoad(
            String pageId, String applicationId, String branchName, ApplicationMode mode, Boolean migrateDsl) {

        ConsolidatedAPIResponseDTO consolidatedAPIResponseDTO = new ConsolidatedAPIResponseDTO();
        Mono<String> applicationIdMonoCache;
        if (isBlank(applicationId)) {
            applicationIdMonoCache = applicationPageService
                    .getPage(pageId, ApplicationMode.PUBLISHED.equals(mode))
                    .map(PageDTO::getApplicationId)
                    .cache();
        } else {
            applicationIdMonoCache = Mono.just(applicationId).cache();
        }

        Mono<UserProfileDTO> userProfileDTOMono =
                sessionUserService.getCurrentUser().flatMap(userService::buildUserProfileDTO);

        Mono<Map<String, Boolean>> featureFlagsForCurrentUserMono = userDataService.getFeatureFlagsForCurrentUser();

        Mono<Tenant> tenantMono = tenantService.getTenantConfiguration();

        Mono<ProductAlertResponseDTO> productAlertResponseDTOMono = productAlertService
                .getSingleApplicableMessage()
                .map(messages -> {
                    if (!messages.isEmpty()) {
                        return messages.get(0);
                    }

                    return new ProductAlertResponseDTO();
                });

        Mono<ApplicationPagesDTO> applicationPagesDTOMono = applicationIdMonoCache.flatMap(
                appId -> newPageService.findApplicationPages(appId, pageId, branchName, mode));

        Mono<Theme> applicationThemeMono =
                applicationIdMonoCache.flatMap(appId -> themeService.getApplicationTheme(appId, mode, branchName));
        Mono<List<Theme>> ThemesListMono = applicationIdMonoCache.flatMap(
                appId -> themeService.getApplicationThemes(appId, branchName).collectList());

        if (ApplicationMode.PUBLISHED.equals(mode)) {
            Mono<List<ActionViewDTO>> listOfActionViewDTOs = applicationIdMonoCache.flatMap(appId ->
                    newActionService.getActionsForViewMode(appId, branchName).collectList());

            Mono<List<ActionCollectionViewDTO>> listOfActionCollectionViewDTOs =
                    applicationIdMonoCache.flatMap(appId -> actionCollectionService
                            .getActionCollectionsForViewMode(appId, branchName)
                            .collectList());

            Mono<PageDTO> pageAndMigrateDslByBranchAndDefaultPageId =
                    applicationPageService.getPageAndMigrateDslByBranchAndDefaultPageId(
                            pageId, branchName, true, migrateDsl);

            Mono<List<CustomJSLib>> allJSLibsInContextDTO = applicationIdMonoCache.flatMap(appId ->
                    customJSLibService.getAllJSLibsInContext(appId, CreatorContextType.APPLICATION, branchName, true));

            List<Mono<?>> listOfMonosForPublishedApp = List.of(
                    userProfileDTOMono,
                    tenantMono,
                    featureFlagsForCurrentUserMono,
                    applicationPagesDTOMono,
                    applicationThemeMono,
                    ThemesListMono,
                    listOfActionViewDTOs,
                    listOfActionCollectionViewDTOs,
                    pageAndMigrateDslByBranchAndDefaultPageId,
                    allJSLibsInContextDTO,
                    productAlertResponseDTOMono);

            return Mono.zip(listOfMonosForPublishedApp, responseArray -> {
                consolidatedAPIResponseDTO.setV1UsersMeResp((UserProfileDTO) responseArray[0]);
                consolidatedAPIResponseDTO.setV1TenantsCurrentResp((Tenant) responseArray[1]);
                consolidatedAPIResponseDTO.setV1UsersFeaturesResp((Map<String, Boolean>) responseArray[2]);
                consolidatedAPIResponseDTO.setV1PagesResp((ApplicationPagesDTO) responseArray[3]);
                consolidatedAPIResponseDTO.setV1ThemesApplicationCurrentModeResp((Theme) responseArray[4]);
                consolidatedAPIResponseDTO.setV1ThemesResp((List<Theme>) responseArray[5]);
                consolidatedAPIResponseDTO.setV1ActionsViewResp((List<ActionViewDTO>) responseArray[6]);
                consolidatedAPIResponseDTO.setV1CollectionsActionsViewResp(
                        (List<ActionCollectionViewDTO>) responseArray[7]);
                consolidatedAPIResponseDTO.setV1PublishedPageResp((PageDTO) responseArray[8]);
                consolidatedAPIResponseDTO.setV1LibrariesApplicationResp((List<CustomJSLib>) responseArray[9]);
                consolidatedAPIResponseDTO.setV1ProductAlertResp((ProductAlertResponseDTO) responseArray[10]);

                return consolidatedAPIResponseDTO;
            });
        }

        return Mono.just(consolidatedAPIResponseDTO);
    }
}
