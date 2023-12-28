package com.appsmith.server.services;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.ConsolidatedAPIResponseDTO;
import com.appsmith.server.dtos.MockDataDTO;
import com.appsmith.server.dtos.MockDataSet;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.ProductAlertResponseDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.themes.base.ThemeService;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.PluginConstants.PackageName.GRAPHQL_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.REST_API_PLUGIN;
import static com.appsmith.server.constants.ce.FieldNameCE.APPLICATION_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.WORKSPACE_ID;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
@Service
public class ConsolidatedAPIServiceImpl implements ConsolidatedAPIService {
    private static final String FEATURE_FLAG_RELEASE_SERVER_DSL_MIGRATIONS_ENABLED =
            "release_server_dsl_migrations_enabled";

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
    private final PluginService pluginService;
    private final ApplicationService applicationService;
    private final DatasourceService datasourceService;
    private final MockDataService mockDataService;

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
            CustomJSLibService customJSLibService,
            PluginService pluginService,
            ApplicationService applicationService,
            DatasourceService datasourceService,
            MockDataService mockDataService) {
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
        this.pluginService = pluginService;
        this.applicationService = applicationService;
        this.datasourceService = datasourceService;
        this.mockDataService = mockDataService;
    }

    /**
     * This method is meant to be used by the client application at the time of 1st page load. Client currently makes
     * several API calls to fetch all the required data. This method consolidates all that data and returns them as
     * response hence enabling the client to fetch the required data via a single API call only.
     *
     * PLEASE TAKE CARE TO USE .cache() FOR Mono THAT GETS REUSED SO THAT FIRST PAGE LOAD PERFORMANCE DOES NOT DEGRADE.
     */
    @Override
    public Mono<ConsolidatedAPIResponseDTO> getConsolidatedInfoForPageLoad(
            String defaultPageId, String applicationId, String branchName, @NotNull ApplicationMode mode) {
        if (isBlank(applicationId) && isBlank(defaultPageId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "application id / page id"));
        }

        /* This object will serve as a container to hold the response of this method*/
        ConsolidatedAPIResponseDTO consolidatedAPIResponseDTO = new ConsolidatedAPIResponseDTO();

        /* Get view mode - EDIT or PUBLISHED */
        boolean isViewMode = ApplicationMode.PUBLISHED.equals(mode);

        /* Fetch application id if not provided */
        Mono<String> applicationIdMonoCache;
        if (isBlank(applicationId)) {
            applicationIdMonoCache = applicationPageService
                    .getPage(defaultPageId, isViewMode)
                    .map(PageDTO::getApplicationId)
                    .cache();
        } else {
            applicationIdMonoCache = Mono.just(applicationId).cache();
        }

        /* Get user profile data */
        Mono<UserProfileDTO> userProfileDTOMono =
                sessionUserService.getCurrentUser().flatMap(userService::buildUserProfileDTO);

        /* Get all feature flags data */
        Mono<Map<String, Boolean>> featureFlagsForCurrentUserMonoCache =
                userDataService.getFeatureFlagsForCurrentUser().cache();

        /* Check if release_server_dsl_migrations_enabled flag is true for the user */
        Mono<Boolean> migrateDslMonoCache = featureFlagsForCurrentUserMonoCache
                .map(flagsMap -> {
                    if (!flagsMap.containsKey(FEATURE_FLAG_RELEASE_SERVER_DSL_MIGRATIONS_ENABLED)) {
                        return false;
                    }

                    return flagsMap.get(FEATURE_FLAG_RELEASE_SERVER_DSL_MIGRATIONS_ENABLED);
                })
                .cache();

        /* Get tenant config data */
        Mono<Tenant> tenantMono = tenantService.getTenantConfiguration();

        /* Get any product alert info */
        Mono<ProductAlertResponseDTO> productAlertResponseDTOMono = productAlertService
                .getSingleApplicableMessage()
                .map(messages -> {
                    if (!messages.isEmpty()) {
                        return messages.get(0);
                    }

                    return new ProductAlertResponseDTO();
                });

        /* Get all pages in application */
        Mono<ApplicationPagesDTO> applicationPagesDTOMonoCache = applicationIdMonoCache
                .flatMap(appId -> newPageService.findApplicationPages(appId, null, branchName, mode))
                .cache();

        /* Get current theme */
        Mono<Theme> applicationThemeMono =
                applicationIdMonoCache.flatMap(appId -> themeService.getApplicationTheme(appId, mode, branchName));

        /* Get all themes */
        Mono<List<Theme>> ThemesListMono = applicationIdMonoCache.flatMap(
                appId -> themeService.getApplicationThemes(appId, branchName).collectList());

        /* Get all custom JS libraries installed in the application */
        Mono<List<CustomJSLib>> allJSLibsInContextDTOMono =
                applicationIdMonoCache.flatMap(appId -> customJSLibService.getAllJSLibsInContext(
                        appId, CreatorContextType.APPLICATION, branchName, isViewMode));

        /* Get current page */
        Mono<PageDTO> currentPageDTOMono = migrateDslMonoCache.flatMap(
                migrateDsl -> applicationPageService.getPageAndMigrateDslByBranchAndDefaultPageId(
                        defaultPageId, branchName, isViewMode, migrateDsl));

        /* Fetch view specific data */
        if (isViewMode) {
            /* Get list of all actions in view mode */
            Mono<List<ActionViewDTO>> listOfActionViewDTOs = applicationIdMonoCache.flatMap(appId ->
                    newActionService.getActionsForViewMode(appId, branchName).collectList());

            /* Get list of all action collections in view mode */
            Mono<List<ActionCollectionViewDTO>> listOfActionCollectionViewDTOs =
                    applicationIdMonoCache.flatMap(appId -> actionCollectionService
                            .getActionCollectionsForViewMode(appId, branchName)
                            .collectList());

            /* This list contains the Mono objects corresponding to all the data points required for view mode. All
             * the Mono objects in this list will be evaluated via Mono.zip operator.
             */
            List<Mono<?>> listOfMonosForPublishedApp = List.of(
                    userProfileDTOMono,
                    tenantMono,
                    featureFlagsForCurrentUserMonoCache,
                    applicationPagesDTOMonoCache,
                    applicationThemeMono,
                    ThemesListMono,
                    listOfActionViewDTOs,
                    listOfActionCollectionViewDTOs,
                    currentPageDTOMono,
                    allJSLibsInContextDTOMono,
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
        } else {
            /* Get all actions in edit mode */
            Mono<List<ActionDTO>> listOfActionDTOsMono = applicationIdMonoCache.flatMap(appId -> {
                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.add(APPLICATION_ID, appId);
                return newActionService
                        .getUnpublishedActions(params, branchName, false)
                        .collectList();
            });

            /* Get all action collections in edit mode */
            Mono<List<ActionCollectionDTO>> listOfActionCollectionDTOsMono = applicationIdMonoCache.flatMap(appId -> {
                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.add(APPLICATION_ID, appId);
                return actionCollectionService
                        .getPopulatedActionCollectionsByViewMode(params, false, branchName)
                        .collectList();
            });

            /* Get all pages in edit mode post apply migrate DSL changes */
            Mono<List<PageDTO>> listOfAllPageDTOMono =
                    migrateDslMonoCache.flatMap(migrateDsl -> applicationPagesDTOMonoCache
                            .map(ApplicationPagesDTO::getPages)
                            .flatMapMany(Flux::fromIterable)
                            .flatMap(page -> applicationPageService.getPageAndMigrateDslByBranchAndDefaultPageId(
                                    page.getDefaultPageId(), branchName, false, migrateDsl))
                            .collect(Collectors.toList()));

            /* Get all workspace id */
            Mono<String> workspaceIdMonoCache = applicationPagesDTOMonoCache
                    .map(ApplicationPagesDTO::getWorkspaceId)
                    .cache();

            /* Get all plugins in workspace */
            Mono<List<Plugin>> listOfPluginsMonoCache = workspaceIdMonoCache
                    .flatMap(workspaceId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(WORKSPACE_ID, workspaceId);
                        return pluginService.get(params).collectList();
                    })
                    .cache();

            /* Get all datasources in workspace */
            Mono<List<Datasource>> listOfDatasourcesMonoCache = workspaceIdMonoCache
                    .flatMap(workspaceId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(WORKSPACE_ID, workspaceId);
                        return datasourceService.getAllWithStorages(params).collectList();
                    })
                    .cache();

            /* Get form config for all relevant plugins by following this rule:
             *   (a) there is at least one datasource of the plugin type alive in the workspace
             *   (b) include REST API and GraphQL API plugin always
             *   (c) ignore any other plugin
             *  */
            Mono<Map<String, Map>> listOfFormConfigsMono = Mono.zip(listOfPluginsMonoCache, listOfDatasourcesMonoCache)
                    .map(tuple2 -> {
                        Set<String> setOfAllPluginIdsToGetFormConfig = new HashSet<>();
                        List<Plugin> pluginList = tuple2.getT1();
                        List<Datasource> datasourcesList = tuple2.getT2();

                        datasourcesList.stream()
                                .filter(datasource -> !isBlank(datasource.getPluginId()))
                                .forEach(datasource -> setOfAllPluginIdsToGetFormConfig.add(datasource.getPluginId()));

                        pluginList.stream()
                                .filter(plugin -> REST_API_PLUGIN.equals(plugin.getPackageName())
                                        || GRAPHQL_PLUGIN.equals(plugin.getPackageName()))
                                .forEach(plugin -> setOfAllPluginIdsToGetFormConfig.add(plugin.getId()));

                        return setOfAllPluginIdsToGetFormConfig;
                    })
                    .flatMapMany(Flux::fromIterable)
                    .flatMap(pluginId ->
                            pluginService.getFormConfig(pluginId).map(formConfig -> Pair.of(pluginId, formConfig)))
                    .collectList()
                    .map(listOfFormConfig -> {
                        Map<String, Map> pluginIdToFormConfigMap = new HashMap<>();
                        listOfFormConfig.stream().forEach(individualConfigMap -> {
                            String pluginId = individualConfigMap.getFirst();
                            Map config = individualConfigMap.getSecond();
                            pluginIdToFormConfigMap.put(pluginId, config);
                        });

                        return pluginIdToFormConfigMap;
                    });

            /* List of mock datasources available to the user */
            Mono<List<MockDataSet>> mockDataListMono =
                    mockDataService.getMockDataSet().map(MockDataDTO::getMockdbs);

            /* This list contains the Mono objects corresponding to all the data points required for edit mode. All
             * the Mono objects in this list will be evaluated via Mono.zip operator
             */
            List<Mono<?>> listOfMonoForEditMode = List.of(
                    userProfileDTOMono,
                    tenantMono,
                    featureFlagsForCurrentUserMonoCache,
                    applicationPagesDTOMonoCache,
                    applicationThemeMono,
                    ThemesListMono,
                    currentPageDTOMono,
                    allJSLibsInContextDTOMono,
                    productAlertResponseDTOMono,
                    listOfActionDTOsMono,
                    listOfActionCollectionDTOsMono,
                    listOfAllPageDTOMono,
                    listOfPluginsMonoCache,
                    listOfDatasourcesMonoCache,
                    listOfFormConfigsMono,
                    mockDataListMono);

            return Mono.zip(listOfMonoForEditMode, responseArray -> {
                consolidatedAPIResponseDTO.setV1UsersMeResp((UserProfileDTO) responseArray[0]);
                consolidatedAPIResponseDTO.setV1TenantsCurrentResp((Tenant) responseArray[1]);
                consolidatedAPIResponseDTO.setV1UsersFeaturesResp((Map<String, Boolean>) responseArray[2]);
                consolidatedAPIResponseDTO.setV1PagesResp((ApplicationPagesDTO) responseArray[3]);
                consolidatedAPIResponseDTO.setV1ThemesApplicationCurrentModeResp((Theme) responseArray[4]);
                consolidatedAPIResponseDTO.setV1ThemesResp((List<Theme>) responseArray[5]);
                consolidatedAPIResponseDTO.setV1PageResp((PageDTO) responseArray[6]);
                consolidatedAPIResponseDTO.setV1LibrariesApplicationResp((List<CustomJSLib>) responseArray[7]);
                consolidatedAPIResponseDTO.setV1ProductAlertResp((ProductAlertResponseDTO) responseArray[8]);
                consolidatedAPIResponseDTO.setV1ActionsResp((List<ActionDTO>) responseArray[9]);
                consolidatedAPIResponseDTO.setV1CollectionsActionsResp((List<ActionCollectionDTO>) responseArray[10]);
                consolidatedAPIResponseDTO.setV1PageDSLs((List<PageDTO>) responseArray[11]);
                consolidatedAPIResponseDTO.setV1PluginsResp((List<Plugin>) responseArray[12]);
                consolidatedAPIResponseDTO.setV1DatasourcesResp((List<Datasource>) responseArray[13]);
                consolidatedAPIResponseDTO.setV1PluginFormConfigsResp((Map<String, Map>) responseArray[14]);
                consolidatedAPIResponseDTO.setV1DatasourcesMockResp((List<MockDataSet>) responseArray[15]);

                return consolidatedAPIResponseDTO;
            });
        }
    }
}
