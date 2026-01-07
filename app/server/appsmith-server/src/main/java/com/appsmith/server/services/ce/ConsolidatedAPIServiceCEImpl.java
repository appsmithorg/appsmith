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
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.MockDataService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.ProductAlertService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.staticurl.StaticUrlService;
import com.appsmith.server.themes.base.ThemeService;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
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
import reactor.util.function.Tuples;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.PluginConstants.PLUGINS_THAT_ALLOW_QUERY_CREATION_WITHOUT_DATASOURCE;
import static com.appsmith.external.constants.spans.ApplicationSpan.APPLICATION_ID_FETCH_REDIS_SPAN;
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
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.ORGANIZATION_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.PAGES_DSL_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.PAGES_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.PLUGINS_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.PRODUCT_ALERT_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.THEMES_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.USER_PROFILE_SPAN;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.WORKSPACE_SPAN;
import static com.appsmith.server.constants.FieldName.APPLICATION_ID;
import static com.appsmith.server.constants.FieldName.APP_MODE;
import static com.appsmith.server.constants.FieldName.PAGE;
import static com.appsmith.server.constants.FieldName.WORKSPACE_ID;
import static com.appsmith.server.helpers.ObservationUtils.getQualifiedSpanName;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
@RequiredArgsConstructor
@Service
public class ConsolidatedAPIServiceCEImpl implements ConsolidatedAPIServiceCE {
    public static final int INTERNAL_SERVER_ERROR_STATUS = AppsmithError.INTERNAL_SERVER_ERROR.getHttpErrorCode();
    public static final String INTERNAL_SERVER_ERROR_CODE = AppsmithError.INTERNAL_SERVER_ERROR.getAppErrorCode();
    public static final String EMPTY_WORKSPACE_ID_ON_ERROR = "";

    protected Pattern objectIdPattern = Pattern.compile("^[0-9a-fA-F]+$", Pattern.CASE_INSENSITIVE);

    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final UserDataService userDataService;
    private final OrganizationService organizationService;
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
    protected final StaticUrlService staticUrlService;
    private final MockDataService mockDataService;
    private final ObservationRegistry observationRegistry;
    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final ObservationHelper observationHelper;

    protected <T> ResponseDTO<T> getSuccessResponse(T data) {
        return new ResponseDTO<>(HttpStatus.OK, data);
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

        /* Get organization config data */
        fetches.add(organizationService
                .getOrganizationConfiguration()
                .as(this::toResponseDTO)
                .doOnError(e -> log.error("Error fetching organization config", e))
                .doOnSuccess(consolidatedAPIResponseDTO::setOrganizationConfig)
                .name(getQualifiedSpanName(ORGANIZATION_SPAN, mode))
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

        if (isBlank(basePageId)) {
            return fetches;
        }

        /* Get view mode - EDIT or PUBLISHED */
        boolean isViewMode = isViewMode(mode);
        Boolean isStaticMode = isStaticMode(baseApplicationId, basePageId);
        Mono<Tuple2<Application, NewPage>> applicationAndPageTupleMono;

        if (isStaticMode) {
            applicationAndPageTupleMono = staticUrlService.getApplicationAndPageTupleFromStaticNames(
                    baseApplicationId, basePageId, refName, mode);

        } else {
            applicationAndPageTupleMono = getApplicationAndPageTupleMono(basePageId, refType, refName, mode);
        }

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

    protected Boolean isStaticMode(String baseApplicationId, String basePageId) {
        if (TextUtils.isSlugFormatValid(baseApplicationId)
                && (isBlank(basePageId) || TextUtils.isSlugFormatValid(basePageId))) {
            return Boolean.TRUE;
        }

        return Boolean.FALSE;
    }

    /**
     * @deprecated This method is deprecated and will be removed in a future release.
     * The caching mechanism caused inconsistency issues when page id was passed instead of basePageId.
     * Use {@link #getApplicationAndPageTupleMono(String, RefType, String, ApplicationMode)} instead,
     * which handles both id and basePageId correctly.
     */
    @Deprecated(forRemoval = true)
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

    /**
     * Finds the application and page based on the provided identifier and branch.
     *
     * This method handles both cases where pageIdentifier could be an actual basePageId
     * or a branch-specific page id.
     *
     * Flow:
     * 1. Search for page with pageIdentifier + refName, fallback to search without refName
     * 2. Find application from the found page
     * 3. For non-git apps: return directly (log warning if refName was provided)
     * 4. For git apps: ensure we return the page from the correct target branch
     *
     * @param pageIdentifier Could be basePageId or branch-specific page id
     * @param refType The reference type (e.g., branch)
     * @param refName The branch name (can be null for default branch)
     * @param mode PUBLISHED or EDIT mode
     * @return Tuple of Application and NewPage for the target branch
     */
    protected Mono<Tuple2<Application, NewPage>> getApplicationAndPageTupleMono(
            String pageIdentifier, RefType refType, String refName, ApplicationMode mode) {

        // Step 1: Search for page
        // First try with pageIdentifier + refName (if refName provided)
        Mono<NewPage> pageSearchMono;
        if (StringUtils.hasText(refName)) {
            // Fallback Mono to search without refName (pageIdentifier might be an id, not basePageId)
            Mono<NewPage> fallbackSearch =
                    Mono.defer(() -> newPageService.findByRefTypeAndRefNameAndBasePageIdAndApplicationMode(
                            null, null, pageIdentifier, mode));

            pageSearchMono = newPageService
                    .findByRefTypeAndRefNameAndBasePageIdAndApplicationMode(refType, refName, pageIdentifier, mode)
                    .onErrorResume(error -> fallbackSearch); // Fallback on error (method throws when page not found)
        } else {
            pageSearchMono = newPageService.findByRefTypeAndRefNameAndBasePageIdAndApplicationMode(
                    null, null, pageIdentifier, mode);
        }

        return pageSearchMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, PAGE, pageIdentifier)))
                .flatMap(foundPage ->
                        // Step 2: Find application from page
                        applicationService
                                .findByBranchedApplicationIdAndApplicationMode(foundPage.getApplicationId(), mode)
                                .flatMap(application ->
                                        resolveTargetBranchPageAndApplication(foundPage, application, refName, mode)))
                // TODO: Add observation spans for monitoring (similar to previous implementation)
                .cache();
    }

    /**
     * Resolves the correct page and application for the target branch.
     *
     * For non-git apps: returns the found page directly.
     * For git apps: ensures we return the page from the correct branch.
     *
     * @param foundPage The page found in the initial search
     * @param application The application associated with the found page
     * @param refName The requested branch name (can be null)
     * @param mode PUBLISHED or EDIT mode
     * @return Tuple of Application and NewPage for the target branch
     */
    private Mono<Tuple2<Application, NewPage>> resolveTargetBranchPageAndApplication(
            NewPage foundPage, Application application, String refName, ApplicationMode mode) {

        GitArtifactMetadata gitMetadata = application.getGitArtifactMetadata();

        // Step 3: Check if non-git app
        boolean isNonGitApp = !GitUtils.isArtifactConnectedToGit(gitMetadata);

        if (isNonGitApp) {
            // Non-git app
            if (StringUtils.hasText(refName)) {
                // Log warning - refName provided for non-git app
                log.warn("refName '{}' provided for non-git application {}, ignoring", refName, application.getId());
            }
            // Skip Step 4, return as-is
            return Mono.just(Tuples.of(application, foundPage));
        }

        // Git app - Determine target branch
        String targetRefName;
        if (!StringUtils.hasText(refName)) {
            // No refName provided - use default branch
            targetRefName = gitMetadata.getDefaultBranchName();
        } else {
            // refName provided - use it as target
            targetRefName = refName;
        }

        // Check if we're already on the target branch
        // Always use application's gitMetadata.refName as source of truth
        String currentRefName = gitMetadata.getRefName();
        if (targetRefName.equals(currentRefName)) {
            // Already on correct branch
            return Mono.just(Tuples.of(application, foundPage));
        }

        // Step 4: Need to switch to target branch
        // Use getBaseIdOrFallback() to handle cases where basePageId might be the page id
        String basePageId = foundPage.getBaseIdOrFallback();
        String defaultArtifactId = gitMetadata.getDefaultArtifactId();

        log.info(
                "Switching from branch '{}' to target branch '{}' for page with baseId '{}'",
                currentRefName,
                targetRefName,
                basePageId);

        // Find application in target branch
        return applicationService
                .findByBaseIdBranchNameAndApplicationMode(defaultArtifactId, targetRefName, mode)
                .flatMap(targetApplication ->
                        // Find page in target branch using basePageId
                        // Note: findByRefTypeAndRefNameAndBasePageIdAndApplicationMode already throws
                        // AppsmithException when page not found, no need for additional switchIfEmpty
                        newPageService
                                .findByRefTypeAndRefNameAndBasePageIdAndApplicationMode(
                                        RefType.branch, targetRefName, basePageId, mode)
                                .map(targetPage -> Tuples.of(targetApplication, targetPage)));
    }

    private boolean isPossibleToCreateQueryWithoutDatasource(Plugin plugin) {
        return PLUGINS_THAT_ALLOW_QUERY_CREATION_WITHOUT_DATASOURCE.contains(plugin.getPackageName());
    }

    @NotNull public String computeConsolidatedAPIResponseEtag(
            ConsolidatedAPIResponseDTO consolidatedAPIResponseDTO, String defaultPageId, String applicationId) {
        if (isBlank(defaultPageId) && isBlank(applicationId)) {
            log.debug(
                    "Skipping etag computation: Both defaultPageId '{}', and applicationId '{}' are blank",
                    defaultPageId,
                    applicationId);
            return "";
        }

        Span computeEtagSpan = observationHelper.createSpan(ETAG_SPAN).start();

        try {
            String lastDeployedAt = Optional.ofNullable(consolidatedAPIResponseDTO.getPages())
                    .map(pages -> pages.getData())
                    .map(data -> data.getApplication())
                    .map(application -> application.getLastDeployedAt())
                    .map(lastDeployed -> lastDeployed.toString())
                    .orElse(null);

            if (lastDeployedAt == null) {
                log.debug(
                        "Skipping etag computation: lastDeployedAt is null for applicationId '{}', pageId '{}'",
                        applicationId,
                        defaultPageId);
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
                    "organizationConfig", consolidatedAPIResponseDTO.getOrganizationConfig(),
                    "productAlert", consolidatedAPIResponseDTO.getProductAlert(),
                    "currentTheme", currentTheme,
                    "themes", themes,
                    "lastDeployedAt", lastDeployedAt);

            ObjectMapper objectMapper = new ObjectMapper();
            // For deterministic map key ordering.
            objectMapper.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
            // For deterministic ordering of bean properties.
            objectMapper.configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, true);
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
            observationHelper.endSpan(computeEtagSpan);
        }
    }
}
