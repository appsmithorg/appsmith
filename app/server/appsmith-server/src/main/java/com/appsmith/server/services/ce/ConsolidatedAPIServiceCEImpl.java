package com.appsmith.server.services.ce;

import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.ConsolidatedAPIResponseDTO;
import com.appsmith.server.dtos.MockDataDTO;
import com.appsmith.server.dtos.ProductAlertResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.MockDataService;
import com.appsmith.server.services.ProductAlertService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.themes.base.ThemeService;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.util.Pair;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.PluginConstants.PLUGINS_THAT_ALLOW_QUERY_CREATION_WITHOUT_DATASOURCE;
import static com.appsmith.external.constants.spans.ApplicationSpan.APPLICATION_ID_FETCH_REDIS_SPAN;
import static com.appsmith.external.constants.spans.ApplicationSpan.APPLICATION_ID_UPDATE_REDIS_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.ACTIONS_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.ACTION_COLLECTIONS_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.APPLICATION_ID_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CURRENT_PAGE_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CURRENT_THEME_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CUSTOM_JS_LIB_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.DATASOURCES_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.FEATURE_FLAG_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.FORM_CONFIG_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.MOCK_DATASOURCES_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.PAGES_DSL_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.PAGES_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.PLUGINS_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.PRODUCT_ALERT_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.TENANT_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.THEMES_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.USER_PROFILE_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.WORKSPACE_SPAN;
import static com.appsmith.server.constants.ce.FieldNameCE.APPLICATION_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.APP_MODE;
import static com.appsmith.server.constants.ce.FieldNameCE.WORKSPACE_ID;
import static com.appsmith.server.helpers.ObservationUtils.getQualifiedSpanName;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
@RequiredArgsConstructor
@Service
public class ConsolidatedAPIServiceCEImpl implements ConsolidatedAPIServiceCE {
    public static final int INTERNAL_SERVER_ERROR_STATUS = AppsmithError.INTERNAL_SERVER_ERROR.getHttpErrorCode();
    public static final String INTERNAL_SERVER_ERROR_CODE = AppsmithError.INTERNAL_SERVER_ERROR.getAppErrorCode();
    public static final String EMPTY_WORKSPACE_ID_ON_ERROR = "";

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
    private final ApplicationService applicationService;
    private final CustomJSLibService customJSLibService;
    private final PluginService pluginService;
    private final DatasourceService datasourceService;
    private final MockDataService mockDataService;
    private final ObservationRegistry observationRegistry;
    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    <T> ResponseDTO<T> getSuccessResponse(T data) {
        return new ResponseDTO<>(HttpStatus.OK.value(), data, null);
    }

    private <T> Mono<ResponseDTO<T>> getErrorResponseMono(Throwable error) {
        if (error instanceof AppsmithException appsmithException) {
            return Mono.just(new ResponseDTO<>(
                    appsmithException.getHttpStatus(),
                    new ErrorDTO(
                            appsmithException.getAppErrorCode(),
                            appsmithException.getErrorType(),
                            appsmithException.getMessage(),
                            appsmithException.getTitle())));
        }

        return Mono.just(new ResponseDTO<>(
                INTERNAL_SERVER_ERROR_STATUS, new ErrorDTO(INTERNAL_SERVER_ERROR_CODE, error.getMessage())));
    }

    private <T> Mono<ResponseDTO<T>> toResponseDTO(Mono<T> mono) {
        return mono.map(this::getSuccessResponse).onErrorResume(this::getErrorResponseMono);
    }

    /**
     * This method is meant to be used by the client application at the time of 1st page load. Client currently makes
     * several API calls to fetch all the required data. This method consolidates all that data and returns them as
     * response hence enabling the client to fetch the required data via a single API call only.
     * <p>
     * PLEASE TAKE CARE TO USE .cache() FOR Mono THAT GETS REUSED SO THAT FIRST PAGE LOAD PERFORMANCE DOES NOT DEGRADE.
     */
    @Override
    public Mono<ConsolidatedAPIResponseDTO> getConsolidatedInfoForPageLoad(
            String basePageId, String baseApplicationId, String branchName, ApplicationMode mode) {

        /* if either of pageId or defaultApplicationId are provided then application mode must also be provided */
        if (mode == null && (!isBlank(basePageId) || !isBlank(baseApplicationId))) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, APP_MODE));
        }

        /* This object will serve as a container to hold the response of this method*/
        ConsolidatedAPIResponseDTO consolidatedAPIResponseDTO = new ConsolidatedAPIResponseDTO();

        final List<Mono<?>> fetches = new ArrayList<>();

        /* Get user profile data */
        fetches.add(sessionUserService
                .getCurrentUser()
                .flatMap(userService::buildUserProfileDTO)
                .as(this::toResponseDTO)
                .doOnError(e -> log.error("Error fetching user profile", e))
                .doOnSuccess(consolidatedAPIResponseDTO::setUserProfile)
                .name(getQualifiedSpanName(USER_PROFILE_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry)));

        /* Get all feature flags data */
        Mono<ResponseDTO<Map<String, Boolean>>> featureFlagsForCurrentUserResponseDTOMonoCache = userDataService
                .getFeatureFlagsForCurrentUser()
                .as(this::toResponseDTO)
                .doOnError(e -> log.error("Error fetching feature flags", e))
                .doOnSuccess(consolidatedAPIResponseDTO::setFeatureFlags)
                .name(getQualifiedSpanName(FEATURE_FLAG_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry))
                .cache();
        fetches.add(featureFlagsForCurrentUserResponseDTOMonoCache);

        /* Get tenant config data */
        fetches.add(tenantService
                .getTenantConfiguration()
                .as(this::toResponseDTO)
                .doOnError(e -> log.error("Error fetching tenant config", e))
                .doOnSuccess(consolidatedAPIResponseDTO::setTenantConfig)
                .name(getQualifiedSpanName(TENANT_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry)));

        /* Get any product alert info */
        fetches.add(productAlertService
                .getSingleApplicableMessage()
                .map(messages -> {
                    if (!messages.isEmpty()) {
                        return messages.get(0);
                    }

                    return new ProductAlertResponseDTO();
                })
                .as(this::toResponseDTO)
                .doOnSuccess(consolidatedAPIResponseDTO::setProductAlert)
                .name(getQualifiedSpanName(PRODUCT_ALERT_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry)));

        if (isBlank(basePageId) && isBlank(baseApplicationId)) {
            return Mono.when(fetches).thenReturn(consolidatedAPIResponseDTO);
        }

        /* Get view mode - EDIT or PUBLISHED */
        boolean isViewMode = ApplicationMode.PUBLISHED.equals(mode);

        /* Fetch default application id if not provided */
        Mono<Application> branchedApplicationMonoCached;
        Mono<String> baseApplicationIdMono = Mono.just("");
        if (isViewMode) {
            // Attempt to retrieve the application ID associated with the given base page ID from the cache.
            baseApplicationIdMono = cacheableRepositoryHelper
                    .fetchBaseApplicationId(basePageId, baseApplicationId)
                    .switchIfEmpty(Mono.just(""))
                    .cast(String.class);
        }
        baseApplicationIdMono = baseApplicationIdMono
                .name(getQualifiedSpanName(APPLICATION_ID_FETCH_REDIS_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry))
                .cache();

        Mono<NewPage> branchedPageMonoCached = Mono.empty();
        if (!isBlank(basePageId)) {
            branchedPageMonoCached = newPageService
                    .findByBranchNameAndBasePageIdAndApplicationMode(branchName, basePageId, mode)
                    .cache();
        }

        branchedApplicationMonoCached = baseApplicationIdMono.flatMap(cachedBaseApplicationId -> {
            if (!StringUtils.hasText(cachedBaseApplicationId)) {
                // Handle empty or null baseApplicationId
                return newPageService
                        .findByBranchNameAndBasePageIdAndApplicationMode(branchName, basePageId, mode)
                        .flatMap(branchedPage ->
                                // Use the application ID to find the complete application details.
                                applicationService
                                        .findByBranchedApplicationIdAndApplicationMode(
                                                branchedPage.getApplicationId(), mode)
                                        .flatMap(application -> {
                                            if (isViewMode) {
                                                // Update the cache with the new application’s base ID for future
                                                // queries.
                                                return cacheableRepositoryHelper
                                                        .fetchBaseApplicationId(basePageId, application.getBaseId())
                                                        .thenReturn(application)
                                                        .name(getQualifiedSpanName(
                                                                APPLICATION_ID_UPDATE_REDIS_SPAN, mode))
                                                        .tap(Micrometer.observation(observationRegistry));
                                            }
                                            return Mono.just(application);
                                        }));
            } else {
                // Handle non-empty baseApplicationId
                return applicationService.findByBaseIdBranchNameAndApplicationMode(
                        cachedBaseApplicationId, branchName, mode);
            }
        });

        branchedApplicationMonoCached = branchedApplicationMonoCached
                .name(getQualifiedSpanName(APPLICATION_ID_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry))
                .cache();

        Mono<List<NewPage>> pagesFromCurrentApplicationMonoCached = branchedApplicationMonoCached
                .flatMap(branchedApplication ->
                        applicationPageService.getPagesBasedOnApplicationMode(branchedApplication, mode))
                .cache();

        /* Get all applicationPages in application */
        Mono<ResponseDTO<ApplicationPagesDTO>> applicationPagesDTOResponseDTOMonoCache = Mono.zip(
                        branchedApplicationMonoCached, pagesFromCurrentApplicationMonoCached)
                .flatMap(tuple2 -> {
                    Application branchedApplication = tuple2.getT1();
                    List<NewPage> newPages = tuple2.getT2();
                    return newPageService.createApplicationPagesDTO(branchedApplication, newPages, isViewMode, true);
                })
                .as(this::toResponseDTO)
                .doOnSuccess(consolidatedAPIResponseDTO::setPages)
                .doOnError(e -> log.error("Error fetching application pages", e))
                .name(getQualifiedSpanName(PAGES_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry))
                .cache();

        fetches.add(applicationPagesDTOResponseDTOMonoCache);

        /* Get current theme */
        fetches.add(branchedApplicationMonoCached
                .flatMap(branchedApplication -> themeService.getApplicationTheme(branchedApplication.getId(), mode))
                .as(this::toResponseDTO)
                .doOnError(e -> log.error("Error fetching current theme", e))
                .doOnSuccess(consolidatedAPIResponseDTO::setCurrentTheme)
                .name(getQualifiedSpanName(CURRENT_THEME_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry)));

        /* Get all themes */
        fetches.add(branchedApplicationMonoCached
                .flatMap(branchedApplication -> themeService
                        .getApplicationThemes(branchedApplication.getId())
                        .collectList())
                .as(this::toResponseDTO)
                .doOnError(e -> log.error("Error fetching themes", e))
                .doOnSuccess(consolidatedAPIResponseDTO::setThemes)
                .name(getQualifiedSpanName(THEMES_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry)));

        /* Get all custom JS libraries installed in the application */
        fetches.add(branchedApplicationMonoCached
                .flatMap(branchedApplication -> customJSLibService.getAllJSLibsInContext(
                        branchedApplication.getId(), CreatorContextType.APPLICATION, isViewMode))
                .as(this::toResponseDTO)
                .doOnError(e -> log.error("Error fetching custom JS libraries", e))
                .doOnSuccess(consolidatedAPIResponseDTO::setCustomJSLibraries)
                .name(getQualifiedSpanName(CUSTOM_JS_LIB_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry)));

        if (!isBlank(basePageId)) {
            /* Get current page */
            fetches.add(applicationPageService
                    .getPageAndMigrateDslByBranchAndBasePageId(basePageId, branchName, isViewMode, true)
                    .as(this::toResponseDTO)
                    .doOnError(e -> log.error("Error fetching current page", e))
                    .doOnSuccess(consolidatedAPIResponseDTO::setPageWithMigratedDsl)
                    .name(getQualifiedSpanName(CURRENT_PAGE_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));
        }

        /* Fetch view specific data */
        if (isViewMode) {
            /* Get list of all actions of the page in view mode */
            if (!isBlank(basePageId)) {
                // When branchName is null, we don't need to fetch page from DB to derive pageId
                // We can simply reuse the pageId that is passed by client to query actions
                Mono<String> branchedPageIdMono = !StringUtils.hasText(branchName)
                        ? Mono.just(basePageId)
                        : branchedPageMonoCached.map(NewPage::getId);
                fetches.add(branchedPageIdMono
                        .flatMap(branchedPageId -> newActionService
                                .getActionsForViewModeByPageId(branchedPageId)
                                .collectList())
                        .as(this::toResponseDTO)
                        .doOnError(e -> log.error("Error fetching actions for view mode", e))
                        .doOnSuccess(consolidatedAPIResponseDTO::setPublishedActions)
                        .name(getQualifiedSpanName(ACTIONS_SPAN, mode))
                        .tap(Micrometer.observation(observationRegistry)));
            }

            /* Get list of all action collections in view mode */
            fetches.add(branchedApplicationMonoCached
                    .flatMap(branchedApplication -> actionCollectionService
                            .getActionCollectionsForViewMode(branchedApplication.getId())
                            .collectList())
                    .as(this::toResponseDTO)
                    .doOnError(e -> log.error("Error fetching action collections for view mode", e))
                    .doOnSuccess(consolidatedAPIResponseDTO::setPublishedActionCollections)
                    .name(getQualifiedSpanName(ACTION_COLLECTIONS_SPAN, mode)));

        } else {
            /* Get all actions in edit mode */
            fetches.add(branchedApplicationMonoCached
                    .flatMap(branchedApplication -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(APPLICATION_ID, branchedApplication.getId());
                        return newActionService
                                .getUnpublishedActions(params, false)
                                .collectList();
                    })
                    .as(this::toResponseDTO)
                    .doOnError(e -> log.error("Error fetching unpublished actions", e))
                    .doOnSuccess(consolidatedAPIResponseDTO::setUnpublishedActions)
                    .name(getQualifiedSpanName(ACTIONS_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));

            /* Get all action collections in edit mode */
            fetches.add(branchedApplicationMonoCached
                    .flatMapMany(branchedApplication -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(APPLICATION_ID, branchedApplication.getId());
                        return actionCollectionService.getPopulatedActionCollectionsByViewMode(params, false);
                    })
                    .collectList()
                    .as(this::toResponseDTO)
                    .doOnError(e -> log.error("Error fetching unpublished action collections", e))
                    .doOnSuccess(consolidatedAPIResponseDTO::setUnpublishedActionCollections)
                    .name(getQualifiedSpanName(ACTION_COLLECTIONS_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));

            /* Get all pages in edit mode post apply migrate DSL changes */
            fetches.add(pagesFromCurrentApplicationMonoCached
                    .flatMapMany(Flux::fromIterable)
                    .flatMap(page -> applicationPageService.getPageDTOAfterMigratingDSL(page, false, true))
                    .collect(Collectors.toList())
                    .as(this::toResponseDTO)
                    .doOnError(e -> log.error("Error fetching pages with migrated DSL", e))
                    .doOnSuccess(consolidatedAPIResponseDTO::setPagesWithMigratedDsl)
                    .name(getQualifiedSpanName(PAGES_DSL_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));

            /* Get all workspace id */
            Mono<String> workspaceIdMonoCache = applicationPagesDTOResponseDTOMonoCache
                    .map(responseDTO -> {
                        if (INTERNAL_SERVER_ERROR_STATUS
                                == responseDTO.getResponseMeta().getStatus()) {
                            return EMPTY_WORKSPACE_ID_ON_ERROR;
                        }

                        return responseDTO.getData().getWorkspaceId();
                    })
                    .onErrorResume(error -> Mono.just(EMPTY_WORKSPACE_ID_ON_ERROR))
                    .name(getQualifiedSpanName(WORKSPACE_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry))
                    .cache();

            /* Get all plugins in workspace */
            Mono<ResponseDTO<List<Plugin>>> listOfPluginsResponseDTOMonoCache = workspaceIdMonoCache
                    .flatMap(workspaceId -> EMPTY_WORKSPACE_ID_ON_ERROR.equals(workspaceId)
                            ? Mono.empty()
                            : pluginService.getInWorkspace(workspaceId).collectList())
                    .as(this::toResponseDTO)
                    .doOnError(e -> log.error("Error fetching plugins", e))
                    .doOnSuccess(consolidatedAPIResponseDTO::setPlugins)
                    .name(getQualifiedSpanName(PLUGINS_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry))
                    .cache();
            fetches.add(listOfPluginsResponseDTOMonoCache);

            /* Get all datasources in workspace */
            Mono<ResponseDTO<List<Datasource>>> listOfDatasourcesResponseDTOMonoCache = workspaceIdMonoCache
                    .flatMap(workspaceId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        if (!EMPTY_WORKSPACE_ID_ON_ERROR.equals(workspaceId)) {
                            params.add(WORKSPACE_ID, workspaceId);
                        }
                        return datasourceService.getAllWithStorages(params).collectList();
                    })
                    .as(this::toResponseDTO)
                    .doOnError(e -> log.error("Error fetching datasources", e))
                    .doOnSuccess(consolidatedAPIResponseDTO::setDatasources)
                    .name(getQualifiedSpanName(DATASOURCES_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry))
                    .cache();
            fetches.add(listOfDatasourcesResponseDTOMonoCache);

            /* Get form config for all relevant plugins by following this rule:
             *   (a) there is at least one datasource of the plugin type alive in the workspace
             *   (b) include REST API and GraphQL API plugin always
             *   (c) ignore any other plugin
             *  */
            fetches.add(Mono.zip(listOfPluginsResponseDTOMonoCache, listOfDatasourcesResponseDTOMonoCache)
                    .map(tuple2 -> {
                        Set<String> setOfAllPluginIdsToGetFormConfig = new HashSet<>();
                        List<Plugin> pluginList = tuple2.getT1().getData();
                        List<Datasource> datasourcesList = tuple2.getT2().getData();

                        datasourcesList.stream()
                                .filter(datasource -> !isBlank(datasource.getPluginId()))
                                .forEach(datasource -> setOfAllPluginIdsToGetFormConfig.add(datasource.getPluginId()));

                        // There are some plugins that allow query to be created without creating a datasource. For
                        // such datasources, form config is required by the client at the time of page load.
                        pluginList.stream()
                                .filter(this::isPossibleToCreateQueryWithoutDatasource)
                                .forEach(plugin -> setOfAllPluginIdsToGetFormConfig.add(plugin.getId()));

                        return setOfAllPluginIdsToGetFormConfig;
                    })
                    .flatMapMany(Flux::fromIterable)
                    .flatMap(pluginId ->
                            pluginService.getFormConfig(pluginId).map(formConfig -> Pair.of(pluginId, formConfig)))
                    .collectList()
                    .map(listOfFormConfig -> {
                        Map<String, Map<?, ?>> pluginIdToFormConfigMap = new HashMap<>();
                        listOfFormConfig.forEach(individualConfigMap -> {
                            String pluginId = individualConfigMap.getFirst();
                            Map<?, ?> config = individualConfigMap.getSecond();
                            pluginIdToFormConfigMap.put(pluginId, config);
                        });

                        return pluginIdToFormConfigMap;
                    })
                    .as(this::toResponseDTO)
                    .doOnError(e -> log.error("Error fetching plugin form configs", e))
                    .doOnSuccess(consolidatedAPIResponseDTO::setPluginFormConfigs)
                    .name(getQualifiedSpanName(FORM_CONFIG_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));

            /* List of mock datasources available to the user */
            fetches.add(mockDataService
                    .getMockDataSet()
                    .map(MockDataDTO::getMockdbs)
                    .as(this::toResponseDTO)
                    .doOnError(e -> log.error("Error fetching mock datasources", e))
                    .doOnSuccess(consolidatedAPIResponseDTO::setMockDatasources)
                    .name(getQualifiedSpanName(MOCK_DATASOURCES_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));
        }

        return Mono.when(fetches).thenReturn(consolidatedAPIResponseDTO);
    }

    private boolean isPossibleToCreateQueryWithoutDatasource(Plugin plugin) {
        return PLUGINS_THAT_ALLOW_QUERY_CREATION_WITHOUT_DATASOURCE.contains(plugin.getPackageName());
    }
}
