package com.appsmith.server.services.ce;

import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.GitArtifactMetadata;
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
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.micrometer.observation.ObservationRegistry;
import io.micrometer.tracing.Span;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.util.Pair;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
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
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.ETAG_SPAN;
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
    private final ObservationHelper observationHelper;

    protected <T> ResponseDTO<T> getSuccessResponse(T data) {
        return new ResponseDTO<>(HttpStatus.OK.value(), data, null);
    }

    protected <T> Mono<ResponseDTO<T>> getErrorResponseMono(Throwable error) {
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

    protected <T> Mono<ResponseDTO<T>> toResponseDTO(Mono<T> mono) {
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
            String basePageId, String baseApplicationId, RefType refType, String refName, ApplicationMode mode) {

        /* if either of pageId or defaultApplicationId are provided then application mode must also be provided */
        if (mode == null && (!isBlank(basePageId) || !isBlank(baseApplicationId))) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, APP_MODE));
        }

        /* This object will serve as a container to hold the response of this method*/
        ConsolidatedAPIResponseDTO consolidatedAPIResponseDTO = new ConsolidatedAPIResponseDTO();

        List<Mono<?>> fetches =
                getAllFetchableMonos(consolidatedAPIResponseDTO, basePageId, baseApplicationId, refType, refName, mode);

        return Mono.when(fetches).thenReturn(consolidatedAPIResponseDTO);
    }

    protected List<Mono<?>> getAllFetchableMonos(
            ConsolidatedAPIResponseDTO consolidatedAPIResponseDTO,
            String basePageId,
            String baseApplicationId,
            RefType refType,
            String refName,
            ApplicationMode mode) {
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
            return fetches;
        }

        /* Get view mode - EDIT or PUBLISHED */
        boolean isViewMode = isViewMode(mode);

        /* Fetch default application id if not provided */
        if (isBlank(basePageId)) {
            return fetches;
        }

        Mono<String> baseApplicationIdMono = getBaseApplicationIdMono(basePageId, baseApplicationId, mode, isViewMode);

        Mono<Tuple2<Application, NewPage>> applicationAndPageTupleMono =
                getApplicationAndPageTupleMono(basePageId, refType, refName, mode, baseApplicationIdMono, isViewMode);

        Mono<NewPage> branchedPageMonoCached =
                applicationAndPageTupleMono.map(Tuple2::getT2).cache();

        Mono<Application> branchedApplicationMonoCached = getBranchedApplicationMono(mode, applicationAndPageTupleMono);

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
            fetches.add(branchedPageMonoCached
                    .flatMap(branchedPage -> applicationPageService.getPageAndMigrateDslByBranchedPageId(
                            branchedPage.getId(), isViewMode, true))
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
                // For a git connected application the desired branch name may differ from the base if no
                // branch name is provided hence, we would still need to check this.
                Mono<String> branchedPageIdMono = branchedPageMonoCached.map(NewPage::getId);
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
        return fetches;
    }

    protected Mono<String> getBaseApplicationIdMono(
            String basePageId, String baseApplicationId, ApplicationMode mode, boolean isViewMode) {
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
        return baseApplicationIdMono;
    }

    protected boolean isViewMode(ApplicationMode mode) {
        return ApplicationMode.PUBLISHED.equals(mode);
    }

    protected Mono<Application> getBranchedApplicationMono(
            ApplicationMode mode, Mono<Tuple2<Application, NewPage>> applicationAndPageTupleMono) {
        Mono<Application> branchedApplicationMonoCached =
                applicationAndPageTupleMono.map(Tuple2::getT1).cache();

        branchedApplicationMonoCached = branchedApplicationMonoCached
                .name(getQualifiedSpanName(APPLICATION_ID_SPAN, mode))
                .tap(Micrometer.observation(observationRegistry))
                .cache();
        return branchedApplicationMonoCached;
    }

    protected Mono<Tuple2<Application, NewPage>> getApplicationAndPageTupleMono(
            String basePageId,
            RefType refType,
            String refName,
            ApplicationMode mode,
            Mono<String> baseApplicationIdMono,
            boolean isViewMode) {
        Mono<Tuple2<Application, NewPage>> applicationAndPageTupleMono = baseApplicationIdMono
                .flatMap(cachedBaseApplicationId -> {
                    Mono<Application> applicationMono;
                    Mono<NewPage> branchedPageMonoCached;

                    branchedPageMonoCached = newPageService
                            .findByRefTypeAndRefNameAndBasePageIdAndApplicationMode(refType, refName, basePageId, mode)
                            .cache();

                    if (StringUtils.hasText(cachedBaseApplicationId)) {
                        // Handle non-empty baseApplicationId
                        applicationMono = applicationService.findByBaseIdBranchNameAndApplicationMode(
                                cachedBaseApplicationId, refName, mode);
                    } else {
                        // Handle empty or null baseApplicationId
                        applicationMono = branchedPageMonoCached.flatMap(branchedPage ->
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
                    }

                    if (StringUtils.hasText(refName)) {

                        // If in case the application is a non git connected application and the branch name url param
                        // is present, then we must default to the app without any branches.
                        return applicationMono.zipWith(branchedPageMonoCached).onErrorResume(error -> {
                            // This situation would arise if page or application is not returned.
                            // here we would land on error instead of empty because both apis which are being
                            // called errors out on empty returns.

                            log.info(
                                    "application or page has for base pageId {} and refName {} has not been found.",
                                    basePageId,
                                    refName);
                            if (error instanceof AppsmithException) {
                                Mono<NewPage> basePageMono =
                                        newPageService.findByRefTypeAndRefNameAndBasePageIdAndApplicationMode(
                                                null, null, basePageId, mode);

                                return basePageMono.flatMap(basePage -> {
                                    if (StringUtils.hasText(basePage.getRefName())) {
                                        // If the branch name is present then the application is git connected
                                        // the error should be thrown.
                                        // TODO: verify if branch name could be residue from old git connection
                                        // Application metadata is absolute check for the same.
                                        return Mono.error(error);
                                    }

                                    return applicationService
                                            .findByBranchedApplicationIdAndApplicationMode(
                                                    basePage.getApplicationId(), mode)
                                            .zipWith(basePageMono)
                                            .map(tuple2 -> {
                                                log.info(
                                                        "The refName url param should not be associated with application {} as this is not a git connected application",
                                                        tuple2.getT1().getId());
                                                return tuple2;
                                            });
                                });
                            }

                            return Mono.error(error);
                        });
                    }

                    return applicationMono.zipWith(branchedPageMonoCached).flatMap(tuple2 -> {
                        Application application = tuple2.getT1();
                        NewPage branchedPage = tuple2.getT2();

                        GitArtifactMetadata gitMetadata = application.getGitArtifactMetadata();

                        boolean isNotAGitApp = gitMetadata == null;
                        boolean isDefaultBranchNameAbsent =
                                isNotAGitApp || !StringUtils.hasText(gitMetadata.getDefaultBranchName());
                        boolean isBranchDefault = !isDefaultBranchNameAbsent
                                && gitMetadata.getDefaultBranchName().equals(gitMetadata.getRefName());

                        // This last check is specially for view mode, when a queried page which is not present
                        // in default branch, and cacheable repository refers to the base application
                        // from given page id. then the branched page may not belong to the base application
                        // hence a validation is required.
                        // This condition is always true for a non git app
                        boolean isPageFromSameApplication = application.getId().equals(branchedPage.getApplicationId());

                        if ((isNotAGitApp || isDefaultBranchNameAbsent || isBranchDefault)
                                && (!isViewMode || isPageFromSameApplication)) {
                            return applicationMono.zipWith(branchedPageMonoCached);
                        }

                        log.info(
                                "ConsolidatedApi for page id {}, and application id {} has been queried without a branch url param",
                                branchedPage.getId(),
                                application.getId());

                        // The git connected application has not been queried with branch param,
                        // and the base branch is not same as the default branch.
                        // we need to find return the default branch from here.

                        String defaultBranchName = gitMetadata.getDefaultBranchName();

                        return applicationService
                                .findByBaseIdBranchNameAndApplicationMode(application.getId(), defaultBranchName, mode)
                                .zipWith(newPageService.findByRefTypeAndRefNameAndBasePageIdAndApplicationMode(
                                        RefType.branch, defaultBranchName, basePageId, mode));
                    });
                })
                .cache();
        return applicationAndPageTupleMono;
    }

    private boolean isPossibleToCreateQueryWithoutDatasource(Plugin plugin) {
        return PLUGINS_THAT_ALLOW_QUERY_CREATION_WITHOUT_DATASOURCE.contains(plugin.getPackageName());
    }

    @NotNull public String computeConsolidatedAPIResponseEtag(
            ConsolidatedAPIResponseDTO consolidatedAPIResponseDTO, String defaultPageId, String applicationId) {
        if (isBlank(defaultPageId) && isBlank(applicationId)) {
            log.debug("Skipping etag computation: Both defaultPageId and applicationId are blank");
            return "";
        }

        Span computeEtagSpan = observationHelper.createSpan(ETAG_SPAN).start();

        try {
            String lastDeployedAt = consolidatedAPIResponseDTO.getPages() != null
                    ? consolidatedAPIResponseDTO
                            .getPages()
                            .getData()
                            .getApplication()
                            .getLastDeployedAt()
                            .toString()
                    : null;

            if (lastDeployedAt == null) {
                log.debug("Skipping etag computation: lastDeployedAt is null");
                return "";
            }

            Object currentTheme = consolidatedAPIResponseDTO.getCurrentTheme() != null
                    ? consolidatedAPIResponseDTO.getCurrentTheme()
                    : "";
            Object themes = consolidatedAPIResponseDTO.getThemes() != null
                    ? consolidatedAPIResponseDTO.getThemes()
                    : Collections.emptyList();

            Map<String, Object> consolidateAPISignature = Map.of(
                    "userProfile", consolidatedAPIResponseDTO.getUserProfile(),
                    "featureFlags", consolidatedAPIResponseDTO.getFeatureFlags(),
                    "tenantConfig", consolidatedAPIResponseDTO.getTenantConfig(),
                    "productAlert", consolidatedAPIResponseDTO.getProductAlert(),
                    "currentTheme", currentTheme,
                    "themes", themes,
                    "lastDeployedAt", lastDeployedAt);

            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());

            String consolidateAPISignatureJSON = objectMapper.writeValueAsString(consolidateAPISignature);

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(consolidateAPISignatureJSON.getBytes(StandardCharsets.UTF_8));
            String etag = Base64.getEncoder().encodeToString(hashBytes);

            // Strong Etags are removed by nginx if gzip is enabled. Hence, we are using weak etags.
            // Ref: https://github.com/kubernetes/ingress-nginx/issues/1390
            // Weak Etag format is: W/"<etag>"
            // Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
            return "W/\"" + etag + "\"";
        } catch (Exception e) {
            log.error("Error while computing etag for ConsolidatedAPIResponseDTO", e);
            return "";
        } finally {
            observationHelper.endSpan(computeEtagSpan, true);
        }
    }
}
