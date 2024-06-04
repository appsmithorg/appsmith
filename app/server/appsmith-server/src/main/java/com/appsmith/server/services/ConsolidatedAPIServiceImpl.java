package com.appsmith.server.services;

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
import com.appsmith.server.themes.base.ThemeService;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.util.Pair;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
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
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.ACTIONS_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.ACTION_COLLECTIONS_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.APPLICATION_ID_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CONSOLIDATED_API_PREFIX;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CURRENT_PAGE_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CURRENT_THEME_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CUSTOM_JS_LIB_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.DATASOURCES_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.EDIT;
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
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.VIEW;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.WORKSPACE_SPAN;
import static com.appsmith.server.constants.ce.FieldNameCE.APPLICATION_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.APP_MODE;
import static com.appsmith.server.constants.ce.FieldNameCE.WORKSPACE_ID;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConsolidatedAPIServiceImpl implements ConsolidatedAPIService {
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

    public static String getQualifiedSpanName(String spanName, ApplicationMode mode) {
        return CONSOLIDATED_API_PREFIX + (ApplicationMode.PUBLISHED.equals(mode) ? VIEW : EDIT) + spanName;
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
            String defaultPageId, String applicationId, String branchName, ApplicationMode mode) {

        /* if either of pageId or applicationId are provided then application mode must also be provided */
        if (mode == null && (!isBlank(defaultPageId) || !isBlank(applicationId))) {
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
                .doOnSuccess(consolidatedAPIResponseDTO::setUserProfile)
                .name(getQualifiedSpanName(USER_PROFILE_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry)));

        /* Get all feature flags data */
        Mono<ResponseDTO<Map<String, Boolean>>> featureFlagsForCurrentUserResponseDTOMonoCache = userDataService
                .getFeatureFlagsForCurrentUser()
                .as(this::toResponseDTO)
                .doOnSuccess(consolidatedAPIResponseDTO::setFeatureFlags)
                .name(getQualifiedSpanName(FEATURE_FLAG_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry))
                .cache();
        fetches.add(featureFlagsForCurrentUserResponseDTOMonoCache);

        /* Get tenant config data */
        fetches.add(tenantService
                .getTenantConfiguration()
                .as(this::toResponseDTO)
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

        if (isBlank(defaultPageId) && isBlank(applicationId)) {
            return Mono.when(fetches).thenReturn(consolidatedAPIResponseDTO);
        }

        /* Get view mode - EDIT or PUBLISHED */
        boolean isViewMode = ApplicationMode.PUBLISHED.equals(mode);

        /* Fetch application id if not provided */
        Mono<String> applicationIdMonoCache;
        if (isBlank(applicationId)) {
            applicationIdMonoCache = newPageService
                    .findRootApplicationIdFromNewPage(branchName, defaultPageId)
                    .name(getQualifiedSpanName(APPLICATION_ID_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry))
                    .cache();
        } else {
            applicationIdMonoCache = Mono.just(applicationId).cache();
        }

        // dslMigration-over-here using the branchName and defaultId
        Mono<Application> branchedApplicationMonoCached = applicationIdMonoCache
                .flatMap(defaultApplicationId -> applicationService.findByDefaultIdBranchNameAndApplicationMode(
                        defaultApplicationId, branchName, mode))
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
                .name(getQualifiedSpanName(PAGES_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry))
                .cache();

        fetches.add(applicationPagesDTOResponseDTOMonoCache);

        /* Get current theme */
        fetches.add(applicationIdMonoCache
                .flatMap(appId -> themeService.getApplicationTheme(appId, mode, branchName))
                .as(this::toResponseDTO)
                .doOnSuccess(consolidatedAPIResponseDTO::setCurrentTheme)
                .name(getQualifiedSpanName(CURRENT_THEME_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry)));

        /* Get all themes */
        fetches.add(applicationIdMonoCache
                .flatMap(appId ->
                        themeService.getApplicationThemes(appId, branchName).collectList())
                .as(this::toResponseDTO)
                .doOnSuccess(consolidatedAPIResponseDTO::setThemes)
                .name(getQualifiedSpanName(THEMES_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry)));

        /* Get all custom JS libraries installed in the application */
        fetches.add(applicationIdMonoCache
                .flatMap(appId -> customJSLibService.getAllJSLibsInContext(
                        appId, CreatorContextType.APPLICATION, branchName, isViewMode))
                .as(this::toResponseDTO)
                .doOnSuccess(consolidatedAPIResponseDTO::setCustomJSLibraries)
                .name(getQualifiedSpanName(CUSTOM_JS_LIB_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry)));

        if (!isBlank(defaultPageId)) {
            /* Get current page */
            fetches.add(pagesFromCurrentApplicationMonoCached
                    .then(applicationPageService.getPageAndMigrateDslByBranchAndDefaultPageId(
                            defaultPageId, branchName, isViewMode, true))
                    .as(this::toResponseDTO)
                    .doOnSuccess(consolidatedAPIResponseDTO::setPageWithMigratedDsl)
                    .name(getQualifiedSpanName(CURRENT_PAGE_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));
        }

        /* Fetch view specific data */
        if (isViewMode) {
            /* Get list of all actions in view mode */
            fetches.add(applicationIdMonoCache
                    .flatMap(appId -> newActionService
                            .getActionsForViewMode(appId, branchName)
                            .collectList())
                    .as(this::toResponseDTO)
                    .doOnSuccess(consolidatedAPIResponseDTO::setPublishedActions)
                    .name(getQualifiedSpanName(ACTIONS_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));

            /* Get list of all action collections in view mode */
            fetches.add(applicationIdMonoCache
                    .flatMap(appId -> actionCollectionService
                            .getActionCollectionsForViewMode(appId, branchName)
                            .collectList())
                    .as(this::toResponseDTO)
                    .doOnSuccess(consolidatedAPIResponseDTO::setPublishedActionCollections)
                    .name(getQualifiedSpanName(ACTION_COLLECTIONS_SPAN, mode)));

        } else {
            /* Get all actions in edit mode */
            fetches.add(applicationIdMonoCache
                    .flatMap(appId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(APPLICATION_ID, appId);
                        return newActionService
                                .getUnpublishedActions(params, branchName, false)
                                .collectList();
                    })
                    .as(this::toResponseDTO)
                    .doOnSuccess(consolidatedAPIResponseDTO::setUnpublishedActions)
                    .name(getQualifiedSpanName(ACTIONS_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));

            /* Get all action collections in edit mode */
            fetches.add(applicationIdMonoCache
                    .flatMapMany(appId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(APPLICATION_ID, appId);
                        return actionCollectionService.getPopulatedActionCollectionsByViewMode(
                                params, false, branchName);
                    })
                    .collectList()
                    .as(this::toResponseDTO)
                    .doOnSuccess(consolidatedAPIResponseDTO::setUnpublishedActionCollections)
                    .name(getQualifiedSpanName(ACTION_COLLECTIONS_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));

            /* Get all pages in edit mode post apply migrate DSL changes */
            fetches.add(pagesFromCurrentApplicationMonoCached
                    .flatMapMany(Flux::fromIterable)
                    .flatMap(page -> applicationPageService.getPageDTOAfterMigratingDSL(page, false, true))
                    .collect(Collectors.toList())
                    .as(this::toResponseDTO)
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
                    .doOnSuccess(consolidatedAPIResponseDTO::setPluginFormConfigs)
                    .name(getQualifiedSpanName(FORM_CONFIG_SPAN, mode))
                    .tap(Micrometer.observation(observationRegistry)));

            /* List of mock datasources available to the user */
            fetches.add(mockDataService
                    .getMockDataSet()
                    .map(MockDataDTO::getMockdbs)
                    .as(this::toResponseDTO)
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
