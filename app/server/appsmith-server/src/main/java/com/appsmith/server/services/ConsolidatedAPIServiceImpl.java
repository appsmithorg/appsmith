package com.appsmith.server.services;

import com.appsmith.external.exceptions.ErrorDTO;
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
import com.appsmith.server.dtos.ResponseDTO;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
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
    public static final int INTERNAL_SERVER_ERROR_STATUS = AppsmithError.INTERNAL_SERVER_ERROR.getHttpErrorCode();
    public static final String INTERNAL_SERVER_ERROR_CODE = AppsmithError.INTERNAL_SERVER_ERROR.getAppErrorCode();

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

    <T> ResponseDTO<T> getSuccessResponse(T data) {
        return new ResponseDTO<>(HttpStatus.OK.value(), data, null);
    }

    <T> Mono<ResponseDTO<T>> getErrorResponseMono(Throwable error, Class<T> type) {
        if (error instanceof AppsmithException appsmithException) {
            return Mono.just(new ResponseDTO<T>(appsmithException.getHttpStatus(),
                new ErrorDTO(appsmithException.getAppErrorCode(),
                appsmithException.getErrorType(), appsmithException.getMessage(), appsmithException.getTitle())));
        }

        return Mono.just(new ResponseDTO<T>(INTERNAL_SERVER_ERROR_STATUS,
            new ErrorDTO(INTERNAL_SERVER_ERROR_CODE, error.getMessage())));
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

        /* This object will serve as a container to hold the response of this method*/
        ConsolidatedAPIResponseDTO consolidatedAPIResponseDTO = new ConsolidatedAPIResponseDTO();

        /* Get user profile data */
        Mono<ResponseDTO<UserProfileDTO>> userProfileDTOResponseDTOMono =
            sessionUserService.getCurrentUser().flatMap(userService::buildUserProfileDTO)
                .map(this::getSuccessResponse)
            .onErrorResume(error -> getErrorResponseMono(error, UserProfileDTO.class));

        /* Get all feature flags data */
        Mono<ResponseDTO<Map>> featureFlagsForCurrentUserResponseDTOMonoCache =
                userDataService.getFeatureFlagsForCurrentUser()
                    .map(res -> (Map)res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, Map.class))
                    .cache();

        /* Get tenant config data */
        Mono<ResponseDTO<Tenant>> tenantResponseDTOMono = tenantService.getTenantConfiguration()
            .map(this::getSuccessResponse)
            .onErrorResume(error -> getErrorResponseMono(error, Tenant.class));

        /* Get any product alert info */
        Mono<ResponseDTO<ProductAlertResponseDTO>> productAlertResponseDTOMono = productAlertService
                .getSingleApplicableMessage()
                .map(messages -> {
                    if (!messages.isEmpty()) {
                        return messages.get(0);
                    }

                    return new ProductAlertResponseDTO();
                })
            .map(this::getSuccessResponse)
            .onErrorResume(error -> getErrorResponseMono(error, ProductAlertResponseDTO.class));

        if (isBlank(defaultPageId) && isBlank(applicationId)) {

            List<Mono<?>> listOfCommonResponseMono = List.of(userProfileDTOResponseDTOMono,
                featureFlagsForCurrentUserResponseDTOMonoCache,
                tenantResponseDTOMono, productAlertResponseDTOMono);

            return Mono.zip(listOfCommonResponseMono, responseArray -> {
               consolidatedAPIResponseDTO.setV1UsersMeResp((ResponseDTO<UserProfileDTO>) responseArray[0]);
               consolidatedAPIResponseDTO.setV1UsersFeaturesResp((ResponseDTO<Map<String, Boolean>>) responseArray[1]);
               consolidatedAPIResponseDTO.setV1TenantsCurrentResp((ResponseDTO<Tenant>) responseArray[2]);
               consolidatedAPIResponseDTO.setV1ProductAlertResp((ResponseDTO<ProductAlertResponseDTO>) responseArray[3]);

               return consolidatedAPIResponseDTO;
            });
        }

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

        /* Get all pages in application */
        Mono<ResponseDTO<ApplicationPagesDTO>> applicationPagesDTOResponseDTOMonoCache = applicationIdMonoCache
                .flatMap(appId -> newPageService.findApplicationPages(appId, null, branchName, mode))
            .map(this::getSuccessResponse)
            .onErrorResume(error -> getErrorResponseMono(error, ApplicationPagesDTO.class))
                .cache();

        /* Get current theme */
        Mono<ResponseDTO<Theme>> applicationThemeResponseDTOMono =
                applicationIdMonoCache.flatMap(appId -> themeService.getApplicationTheme(appId, mode, branchName))
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, Theme.class));

        /* Get all themes */
        Mono<ResponseDTO<List>> ThemesListResponseDTOMono = applicationIdMonoCache.flatMap(
                appId -> themeService.getApplicationThemes(appId, branchName).collectList())
            .map(res -> (List) res)
            .map(this::getSuccessResponse)
            .onErrorResume(error -> getErrorResponseMono(error, List.class));

        /* Get all custom JS libraries installed in the application */
        Mono<ResponseDTO<List>> allJSLibsInContextDTOResponseDTOMono =
                applicationIdMonoCache.flatMap(appId -> customJSLibService.getAllJSLibsInContext(
                        appId, CreatorContextType.APPLICATION, branchName, isViewMode))
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class));

        /* Check if release_server_dsl_migrations_enabled flag is true for the user */
        Mono<Boolean> migrateDslMonoCache = featureFlagsForCurrentUserResponseDTOMonoCache
            .map(ResponseDTO::getData)
            .map(flagsMap -> {
                if (!flagsMap.containsKey(FEATURE_FLAG_RELEASE_SERVER_DSL_MIGRATIONS_ENABLED)) {
                    return false;
                }

                return (Boolean) flagsMap.get(FEATURE_FLAG_RELEASE_SERVER_DSL_MIGRATIONS_ENABLED);
            })
            .cache();

        Mono<ResponseDTO<PageDTO>> currentPageDTOResponseDTOMono = Mono.empty();
        if (!isBlank(defaultPageId)) {
            /* Get current page */
            currentPageDTOResponseDTOMono = migrateDslMonoCache.flatMap(
                    migrateDsl -> applicationPageService.getPageAndMigrateDslByBranchAndDefaultPageId(
                        defaultPageId, branchName, isViewMode, migrateDsl))
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, PageDTO.class));
        }

        /* Fetch view specific data */
        if (isViewMode) {
            /* Get list of all actions in view mode */
            Mono<ResponseDTO<List>> listOfActionViewResponseDTOMono = applicationIdMonoCache.flatMap(appId ->
                    newActionService.getActionsForViewMode(appId, branchName).collectList())
                .map(res -> (List) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, List.class));

            /* Get list of all action collections in view mode */
            Mono<ResponseDTO<List>> listOfActionCollectionViewResponseDTOMono =
                    applicationIdMonoCache.flatMap(appId -> actionCollectionService
                            .getActionCollectionsForViewMode(appId, branchName)
                            .collectList())
                        .map(res -> (List) res)
                        .map(this::getSuccessResponse)
                        .onErrorResume(error -> getErrorResponseMono(error, List.class));

            /* This list contains the Mono objects corresponding to all the data points required for view mode. All
             * the Mono objects in this list will be evaluated via Mono.zip operator.
             */
            List<Mono<?>> listOfMonoForPublishedApp = new ArrayList<>(List.of(
                userProfileDTOResponseDTOMono,
                    tenantResponseDTOMono,
                    featureFlagsForCurrentUserResponseDTOMonoCache,
                    applicationPagesDTOResponseDTOMonoCache,
                    applicationThemeResponseDTOMono,
                    ThemesListResponseDTOMono,
                    listOfActionViewResponseDTOMono,
                    listOfActionCollectionViewResponseDTOMono,
                    allJSLibsInContextDTOResponseDTOMono,
                    productAlertResponseDTOMono));

            if (!isBlank(defaultPageId)) {
                listOfMonoForPublishedApp.add(currentPageDTOResponseDTOMono);
            }

            return Mono.zip(listOfMonoForPublishedApp, responseArray -> {
                consolidatedAPIResponseDTO.setV1UsersMeResp((ResponseDTO<UserProfileDTO>) responseArray[0]);
                consolidatedAPIResponseDTO.setV1TenantsCurrentResp((ResponseDTO<Tenant>) responseArray[1]);
                consolidatedAPIResponseDTO.setV1UsersFeaturesResp((ResponseDTO<Map<String, Boolean>>) responseArray[2]);
                consolidatedAPIResponseDTO.setV1PagesResp((ResponseDTO<ApplicationPagesDTO>) responseArray[3]);
                consolidatedAPIResponseDTO.setV1ThemesApplicationCurrentModeResp((ResponseDTO<Theme>) responseArray[4]);
                consolidatedAPIResponseDTO.setV1ThemesResp((ResponseDTO<List<Theme>>) responseArray[5]);
                consolidatedAPIResponseDTO.setV1ActionsViewResp((ResponseDTO<List<ActionViewDTO>>) responseArray[6]);
                consolidatedAPIResponseDTO.setV1CollectionsActionsViewResp(
                        (ResponseDTO<List<ActionCollectionViewDTO>>) responseArray[7]);
                consolidatedAPIResponseDTO.setV1LibrariesApplicationResp((ResponseDTO<List<CustomJSLib>>) responseArray[8]);
                consolidatedAPIResponseDTO.setV1ProductAlertResp((ResponseDTO<ProductAlertResponseDTO>) responseArray[9]);

                if (!isBlank(defaultPageId)) {
                    consolidatedAPIResponseDTO.setV1PublishedPageResp((ResponseDTO<PageDTO>) responseArray[10]);
                }

                return consolidatedAPIResponseDTO;
            });
        } else {
            /* Get all actions in edit mode */
            Mono<ResponseDTO<List>> listOfActionResponseDTOMono = applicationIdMonoCache.flatMap(appId -> {
                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.add(APPLICATION_ID, appId);
                return newActionService
                        .getUnpublishedActions(params, branchName, false)
                        .collectList();
            })
                .map(res -> (List) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, List.class));

            /* Get all action collections in edit mode */
            Mono<ResponseDTO<List>> listOfActionCollectionResponseDTOMono = applicationIdMonoCache.flatMap(appId -> {
                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.add(APPLICATION_ID, appId);
                return actionCollectionService
                    .getPopulatedActionCollectionsByViewMode(params, false, branchName)
                    .collectList()
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class));
            });

            /* Get all pages in edit mode post apply migrate DSL changes */
            Mono<ResponseDTO<List>> listOfAllPageResponseDTOMono =
                    migrateDslMonoCache.flatMap(migrateDsl -> applicationPagesDTOResponseDTOMonoCache
                        .map(ResponseDTO::getData)
                            .map(ApplicationPagesDTO::getPages)
                            .flatMapMany(Flux::fromIterable)
                            .flatMap(page -> applicationPageService.getPageAndMigrateDslByBranchAndDefaultPageId(
                                    page.getDefaultPageId(), branchName, false, migrateDsl))
                            .collect(Collectors.toList()))
                        .map(res -> (List) res)
                        .map(this::getSuccessResponse)
                        .onErrorResume(error -> getErrorResponseMono(error, List.class));

            /* Get all workspace id */
            Mono<String> workspaceIdMonoCache = applicationPagesDTOResponseDTOMonoCache
                .map(ResponseDTO::getData)
                    .map(ApplicationPagesDTO::getWorkspaceId)
                    .cache();

            /* Get all plugins in workspace */
            Mono<ResponseDTO<List>> listOfPluginsResponseDTOMonoCache = workspaceIdMonoCache
                    .flatMap(workspaceId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(WORKSPACE_ID, workspaceId);
                        return pluginService.get(params).collectList();
                    })
                .map(res -> (List) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .cache();

            /* Get all datasources in workspace */
            Mono<ResponseDTO<List>> listOfDatasourcesResponseDTOMonoCache = workspaceIdMonoCache
                    .flatMap(workspaceId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(WORKSPACE_ID, workspaceId);
                        return datasourceService.getAllWithStorages(params).collectList();
                    })
                .map(res -> (List) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .cache();

            /* Get form config for all relevant plugins by following this rule:
             *   (a) there is at least one datasource of the plugin type alive in the workspace
             *   (b) include REST API and GraphQL API plugin always
             *   (c) ignore any other plugin
             *  */
            Mono<ResponseDTO<Map>> listOfFormConfigsResponseDTOMono = Mono.zip(listOfPluginsResponseDTOMonoCache, listOfDatasourcesResponseDTOMonoCache)
                    .map(tuple2 -> {
                        Set<String> setOfAllPluginIdsToGetFormConfig = new HashSet<>();
                        List<Plugin> pluginList = tuple2.getT1().getData();
                        List<Datasource> datasourcesList = tuple2.getT2().getData();

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
                    })
                .map(res -> (Map) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, Map.class));

            /* List of mock datasources available to the user */
            Mono<ResponseDTO<List>> mockDataListResponseDTOMono =
                    mockDataService
                        .getMockDataSet().map(MockDataDTO::getMockdbs)
                        .map(res -> (List) res)
                        .map(this::getSuccessResponse)
                        .onErrorResume(error -> getErrorResponseMono(error, List.class));

            /* This list contains the Mono objects corresponding to all the data points required for edit mode. All
             * the Mono objects in this list will be evaluated via Mono.zip operator
             */
            List<Mono<?>> listOfMonoForEditMode = new ArrayList<>(List.of(
                userProfileDTOResponseDTOMono,
                    tenantResponseDTOMono,
                    featureFlagsForCurrentUserResponseDTOMonoCache,
                    applicationPagesDTOResponseDTOMonoCache,
                    applicationThemeResponseDTOMono,
                    ThemesListResponseDTOMono,
                    allJSLibsInContextDTOResponseDTOMono,
                    productAlertResponseDTOMono,
                    listOfActionResponseDTOMono,
                    listOfActionCollectionResponseDTOMono,
                    listOfAllPageResponseDTOMono,
                    listOfPluginsResponseDTOMonoCache,
                    listOfDatasourcesResponseDTOMonoCache,
                    listOfFormConfigsResponseDTOMono,
                    mockDataListResponseDTOMono));

            if (!isBlank(defaultPageId)) {
                listOfMonoForEditMode.add(currentPageDTOResponseDTOMono);
            }

            return Mono.zip(listOfMonoForEditMode, responseArray -> {
                consolidatedAPIResponseDTO.setV1UsersMeResp((ResponseDTO<UserProfileDTO>) responseArray[0]);
                consolidatedAPIResponseDTO.setV1TenantsCurrentResp((ResponseDTO<Tenant>) responseArray[1]);
                consolidatedAPIResponseDTO.setV1UsersFeaturesResp((ResponseDTO<Map<String, Boolean>>) responseArray[2]);
                consolidatedAPIResponseDTO.setV1PagesResp((ResponseDTO<ApplicationPagesDTO>) responseArray[3]);
                consolidatedAPIResponseDTO.setV1ThemesApplicationCurrentModeResp((ResponseDTO<Theme>) responseArray[4]);
                consolidatedAPIResponseDTO.setV1ThemesResp((ResponseDTO<List<Theme>>) responseArray[5]);
                consolidatedAPIResponseDTO.setV1LibrariesApplicationResp((ResponseDTO<List<CustomJSLib>>) responseArray[6]);
                consolidatedAPIResponseDTO.setV1ProductAlertResp((ResponseDTO<ProductAlertResponseDTO>) responseArray[7]);
                consolidatedAPIResponseDTO.setV1ActionsResp((ResponseDTO<List<ActionDTO>>) responseArray[8]);
                consolidatedAPIResponseDTO.setV1CollectionsActionsResp((ResponseDTO<List<ActionCollectionDTO>>) responseArray[9]);
                consolidatedAPIResponseDTO.setV1PageDSLs((ResponseDTO<List<PageDTO>>) responseArray[10]);
                consolidatedAPIResponseDTO.setV1PluginsResp((ResponseDTO<List<Plugin>>) responseArray[11]);
                consolidatedAPIResponseDTO.setV1DatasourcesResp((ResponseDTO<List<Datasource>>) responseArray[12]);
                consolidatedAPIResponseDTO.setV1PluginFormConfigsResp((ResponseDTO<Map<String, Map>>) responseArray[13]);
                consolidatedAPIResponseDTO.setV1DatasourcesMockResp((ResponseDTO<List<MockDataSet>>) responseArray[14]);

                if (!isBlank(defaultPageId)) {
                    consolidatedAPIResponseDTO.setV1PageResp((ResponseDTO<PageDTO>) responseArray[15]);
                }

                return consolidatedAPIResponseDTO;
            });
        }
    }
}
