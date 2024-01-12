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
import com.appsmith.server.helpers.OtlpTelemetry;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.themes.base.ThemeService;
import io.opentelemetry.api.trace.Span;
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
import static com.appsmith.server.constants.OtlpSpanNames.ACTIONS_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.ACTION_COLLECTIONS_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.APPLICATION_ID_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.CONSOLIDATED_API_PREFIX;
import static com.appsmith.server.constants.OtlpSpanNames.CURRENT_PAGE_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.CURRENT_THEME_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.CUSTOM_JS_LIB_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.DATASOURCES_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.EDIT;
import static com.appsmith.server.constants.OtlpSpanNames.FEATURE_FLAG_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.FORM_CONFIG_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.MOCK_DATASOURCES_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.PAGES_DSL_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.PAGES_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.PLUGINS_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.PRODUCT_ALERT_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.TENANT_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.THEMES_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.USER_PROFILE_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.VIEW;
import static com.appsmith.server.constants.OtlpSpanNames.WORKSPACE_SPAN;
import static com.appsmith.server.constants.ce.FieldNameCE.APPLICATION_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.APP_MODE;
import static com.appsmith.server.constants.ce.FieldNameCE.WORKSPACE_ID;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
@Service
public class ConsolidatedAPIServiceImpl implements ConsolidatedAPIService {
    private static final String FEATURE_FLAG_RELEASE_SERVER_DSL_MIGRATIONS_ENABLED =
            "release_server_dsl_migrations_enabled";
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
    private final CustomJSLibService customJSLibService;
    private final PluginService pluginService;
    private final ApplicationService applicationService;
    private final DatasourceService datasourceService;
    private final MockDataService mockDataService;
    private final OtlpTelemetry otlpTelemetry;

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
            MockDataService mockDataService,
            OtlpTelemetry otlpTelemetry) {
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
        this.otlpTelemetry = otlpTelemetry;
    }

    <T> ResponseDTO<T> getSuccessResponse(T data) {
        return new ResponseDTO<>(HttpStatus.OK.value(), data, null);
    }

    <T> Mono<ResponseDTO<T>> getErrorResponseMono(Throwable error, Class<T> type) {
        if (error instanceof AppsmithException appsmithException) {
            return Mono.just(new ResponseDTO<T>(
                    appsmithException.getHttpStatus(),
                    new ErrorDTO(
                            appsmithException.getAppErrorCode(),
                            appsmithException.getErrorType(),
                            appsmithException.getMessage(),
                            appsmithException.getTitle())));
        }

        return Mono.just(new ResponseDTO<T>(
                INTERNAL_SERVER_ERROR_STATUS, new ErrorDTO(INTERNAL_SERVER_ERROR_CODE, error.getMessage())));
    }

    public static String getQualifiedSpanName(String spanName, ApplicationMode mode) {
        return ApplicationMode.PUBLISHED.equals(mode)
                ? CONSOLIDATED_API_PREFIX + VIEW + spanName
                : CONSOLIDATED_API_PREFIX + EDIT + spanName;
    }

    /**
     * This method is meant to be used by the client application at the time of 1st page load. Client currently makes
     * several API calls to fetch all the required data. This method consolidates all that data and returns them as
     * response hence enabling the client to fetch the required data via a single API call only.
     * Please check out this Slack conversation to understand why span objects need be put in a list:
     * https://theappsmith.slack.com/archives/C024GUDM0LT/p1704891881312049
     *
     * PLEASE TAKE CARE TO USE .cache() FOR Mono THAT GETS REUSED SO THAT FIRST PAGE LOAD PERFORMANCE DOES NOT DEGRADE.
     */
    @Override
    public Mono<ConsolidatedAPIResponseDTO> getConsolidatedInfoForPageLoad(
            String defaultPageId, String applicationId, String branchName, ApplicationMode mode, Span parentSpan) {

        /* if either of pageId or applicationId are provided then application mode must also be provided */
        if (mode == null && (!isBlank(defaultPageId) || !isBlank(applicationId))) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, APP_MODE));
        }

        /* This object will serve as a container to hold the response of this method*/
        ConsolidatedAPIResponseDTO consolidatedAPIResponseDTO = new ConsolidatedAPIResponseDTO();

        /* Get user profile data */
        ArrayList<Span> userProfileSpanList = new ArrayList<>();
        Mono<ResponseDTO<UserProfileDTO>> userProfileDTOResponseDTOMono = sessionUserService
                .getCurrentUser()
                .flatMap(userService::buildUserProfileDTO)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, UserProfileDTO.class))
                .doOnSubscribe(subscription -> {
                    userProfileSpanList.add(this.otlpTelemetry.startOTLPSpan(
                            getQualifiedSpanName(USER_PROFILE_SPAN, mode), null, parentSpan));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(userProfileSpanList.get(0)));

        /* Get all feature flags data */
        ArrayList<Span> featureFlagsSpanList = new ArrayList<>();
        Mono<ResponseDTO<Map>> featureFlagsForCurrentUserResponseDTOMonoCache = userDataService
                .getFeatureFlagsForCurrentUser()
                .map(res -> (Map) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, Map.class))
                .doOnSubscribe(subscription -> {
                    featureFlagsSpanList.add(this.otlpTelemetry.startOTLPSpan(
                            getQualifiedSpanName(FEATURE_FLAG_SPAN, mode), null, parentSpan));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(featureFlagsSpanList.get(0)))
                .cache();

        /* Get tenant config data */
        ArrayList<Span> tenantSpanList = new ArrayList<>();
        Mono<ResponseDTO<Tenant>> tenantResponseDTOMono = tenantService
                .getTenantConfiguration()
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, Tenant.class))
                .doOnSubscribe(subscription -> {
                    tenantSpanList.add(this.otlpTelemetry.startOTLPSpan(
                            getQualifiedSpanName(TENANT_SPAN, mode), null, parentSpan));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(tenantSpanList.get(0)));

        /* Get any product alert info */
        ArrayList<Span> productAlertSpanList = new ArrayList<>();
        Mono<ResponseDTO<ProductAlertResponseDTO>> productAlertResponseDTOMono = productAlertService
                .getSingleApplicableMessage()
                .map(messages -> {
                    if (!messages.isEmpty()) {
                        return messages.get(0);
                    }

                    return new ProductAlertResponseDTO();
                })
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, ProductAlertResponseDTO.class))
                .doOnSubscribe(subscription -> {
                    productAlertSpanList.add(this.otlpTelemetry.startOTLPSpan(
                            getQualifiedSpanName(PRODUCT_ALERT_SPAN, mode), null, parentSpan));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(productAlertSpanList.get(0)));

        if (isBlank(defaultPageId) && isBlank(applicationId)) {

            List<Mono<?>> listOfCommonResponseMono = List.of(
                    userProfileDTOResponseDTOMono,
                    featureFlagsForCurrentUserResponseDTOMonoCache,
                    tenantResponseDTOMono,
                    productAlertResponseDTOMono);

            return Mono.zip(listOfCommonResponseMono, responseArray -> {
                consolidatedAPIResponseDTO.setUserProfile((ResponseDTO<UserProfileDTO>) responseArray[0]);
                consolidatedAPIResponseDTO.setFeatureFlags((ResponseDTO<Map<String, Boolean>>) responseArray[1]);
                consolidatedAPIResponseDTO.setTenantConfig((ResponseDTO<Tenant>) responseArray[2]);
                consolidatedAPIResponseDTO.setProductAlert((ResponseDTO<ProductAlertResponseDTO>) responseArray[3]);

                return consolidatedAPIResponseDTO;
            });
        }

        /* Get view mode - EDIT or PUBLISHED */
        boolean isViewMode = ApplicationMode.PUBLISHED.equals(mode);

        /* Fetch application id if not provided */
        Mono<String> applicationIdMonoCache;
        if (isBlank(applicationId)) {
            ArrayList<Span> applicationIdSpanList = new ArrayList<>();
            applicationIdMonoCache = newPageService
                    .findRootApplicationIdFromNewPage(branchName, defaultPageId)
                    .doOnSubscribe(subscription -> {
                        applicationIdSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(APPLICATION_ID_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(applicationIdSpanList.get(0)))
                    .cache();
        } else {
            applicationIdMonoCache = Mono.just(applicationId).cache();
        }

        /* Get all pages in application */
        ArrayList<Span> pagesSpanList = new ArrayList<>();
        Mono<ResponseDTO<ApplicationPagesDTO>> applicationPagesDTOResponseDTOMonoCache = applicationIdMonoCache
                .flatMap(appId -> newPageService.findApplicationPages(appId, null, branchName, mode))
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, ApplicationPagesDTO.class))
                .doOnSubscribe(subscription -> {
                    pagesSpanList.add(
                            this.otlpTelemetry.startOTLPSpan(getQualifiedSpanName(PAGES_SPAN, mode), null, parentSpan));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(pagesSpanList.get(0)))
                .cache();

        /* Get current theme */
        ArrayList<Span> currentThemeSpanList = new ArrayList<>();
        Mono<ResponseDTO<Theme>> applicationThemeResponseDTOMono = applicationIdMonoCache
                .flatMap(appId -> themeService.getApplicationTheme(appId, mode, branchName))
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, Theme.class))
                .doOnSubscribe(subscription -> {
                    currentThemeSpanList.add(this.otlpTelemetry.startOTLPSpan(
                            getQualifiedSpanName(CURRENT_THEME_SPAN, mode), null, parentSpan));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(currentThemeSpanList.get(0)));

        /* Get all themes */
        ArrayList<Span> themesSpanList = new ArrayList<>();
        Mono<ResponseDTO<List>> ThemesListResponseDTOMono = applicationIdMonoCache
                .flatMap(appId ->
                        themeService.getApplicationThemes(appId, branchName).collectList())
                .map(res -> (List) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, List.class))
                .doOnSubscribe(subscription -> {
                    themesSpanList.add(this.otlpTelemetry.startOTLPSpan(
                            getQualifiedSpanName(THEMES_SPAN, mode), null, parentSpan));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(themesSpanList.get(0)));

        /* Get all custom JS libraries installed in the application */
        ArrayList<Span> customJSLibSpanList = new ArrayList<>();
        Mono<ResponseDTO<List>> allJSLibsInContextDTOResponseDTOMono = applicationIdMonoCache
                .flatMap(appId -> customJSLibService.getAllJSLibsInContext(
                        appId, CreatorContextType.APPLICATION, branchName, isViewMode))
                .map(res -> (List) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, List.class))
                .doOnSubscribe(subscription -> {
                    customJSLibSpanList.add(this.otlpTelemetry.startOTLPSpan(
                            getQualifiedSpanName(CUSTOM_JS_LIB_SPAN, mode), null, parentSpan));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(customJSLibSpanList.get(0)));

        /* Check if release_server_dsl_migrations_enabled flag is true for the user */
        Mono<Boolean> migrateDslMonoCache = featureFlagsForCurrentUserResponseDTOMonoCache
                .map(responseDTO -> {
                    if (INTERNAL_SERVER_ERROR_STATUS
                            == responseDTO.getResponseMeta().getStatus()) {
                        return Map.of();
                    }

                    return responseDTO.getData();
                })
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
            ArrayList<Span> currentPageSpanList = new ArrayList<>();
            currentPageDTOResponseDTOMono = migrateDslMonoCache
                    .flatMap(migrateDsl -> applicationPageService.getPageAndMigrateDslByBranchAndDefaultPageId(
                            defaultPageId, branchName, isViewMode, migrateDsl))
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, PageDTO.class))
                    .doOnSubscribe(subscription -> {
                        currentPageSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(CURRENT_PAGE_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(currentPageSpanList.get(0)));
        }

        /* Fetch view specific data */
        if (isViewMode) {
            /* Get list of all actions in view mode */
            ArrayList<Span> actionsSpanList = new ArrayList<>();
            Mono<ResponseDTO<List>> listOfActionViewResponseDTOMono = applicationIdMonoCache
                    .flatMap(appId -> newActionService
                            .getActionsForViewMode(appId, branchName)
                            .collectList())
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        actionsSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(ACTIONS_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(actionsSpanList.get(0)));

            /* Get list of all action collections in view mode */
            ArrayList<Span> actionCollectionsSpanList = new ArrayList<>();
            Mono<ResponseDTO<List>> listOfActionCollectionViewResponseDTOMono = applicationIdMonoCache
                    .flatMap(appId -> actionCollectionService
                            .getActionCollectionsForViewMode(appId, branchName)
                            .collectList())
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        actionCollectionsSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(ACTION_COLLECTIONS_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(actionCollectionsSpanList.get(0)));

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
                consolidatedAPIResponseDTO.setUserProfile((ResponseDTO<UserProfileDTO>) responseArray[0]);
                consolidatedAPIResponseDTO.setTenantConfig((ResponseDTO<Tenant>) responseArray[1]);
                consolidatedAPIResponseDTO.setFeatureFlags((ResponseDTO<Map<String, Boolean>>) responseArray[2]);
                consolidatedAPIResponseDTO.setPages((ResponseDTO<ApplicationPagesDTO>) responseArray[3]);
                consolidatedAPIResponseDTO.setCurrentTheme((ResponseDTO<Theme>) responseArray[4]);
                consolidatedAPIResponseDTO.setThemes((ResponseDTO<List<Theme>>) responseArray[5]);
                consolidatedAPIResponseDTO.setPublishedActions((ResponseDTO<List<ActionViewDTO>>) responseArray[6]);
                consolidatedAPIResponseDTO.setPublishedActionCollections(
                        (ResponseDTO<List<ActionCollectionViewDTO>>) responseArray[7]);
                consolidatedAPIResponseDTO.setCustomJSLibraries((ResponseDTO<List<CustomJSLib>>) responseArray[8]);
                consolidatedAPIResponseDTO.setProductAlert((ResponseDTO<ProductAlertResponseDTO>) responseArray[9]);

                if (!isBlank(defaultPageId)) {
                    consolidatedAPIResponseDTO.setPageWithMigratedDsl((ResponseDTO<PageDTO>) responseArray[10]);
                }

                return consolidatedAPIResponseDTO;
            });
        } else {
            /* Get all actions in edit mode */
            ArrayList<Span> actionsSpanList = new ArrayList<>();
            Mono<ResponseDTO<List>> listOfActionResponseDTOMono = applicationIdMonoCache
                    .flatMap(appId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(APPLICATION_ID, appId);
                        return newActionService
                                .getUnpublishedActions(params, branchName, false)
                                .collectList();
                    })
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        actionsSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(ACTIONS_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(actionsSpanList.get(0)));

            /* Get all action collections in edit mode */
            ArrayList<Span> actionCollectionsSpanList = new ArrayList<>();
            Mono<ResponseDTO<List>> listOfActionCollectionResponseDTOMono = applicationIdMonoCache
                    .flatMap(appId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(APPLICATION_ID, appId);
                        return actionCollectionService
                                .getPopulatedActionCollectionsByViewMode(params, false, branchName)
                                .collectList()
                                .map(res -> (List) res)
                                .map(this::getSuccessResponse);
                    })
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        actionCollectionsSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(ACTION_COLLECTIONS_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(actionCollectionsSpanList.get(0)));

            /* Get all pages in edit mode post apply migrate DSL changes */
            ArrayList<Span> pagesPostMigrateDslSpanList = new ArrayList<>();
            Mono<ResponseDTO<List>> listOfAllPageResponseDTOMono = migrateDslMonoCache
                    .flatMap(migrateDsl -> applicationPagesDTOResponseDTOMonoCache
                            .map(ResponseDTO::getData)
                            .map(ApplicationPagesDTO::getPages)
                            .flatMapMany(Flux::fromIterable)
                            .flatMap(page -> applicationPageService.getPageAndMigrateDslByBranchAndDefaultPageId(
                                    page.getDefaultPageId(), branchName, false, migrateDsl))
                            .collect(Collectors.toList()))
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        pagesPostMigrateDslSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(PAGES_DSL_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(pagesPostMigrateDslSpanList.get(0)));

            /* Get all workspace id */
            ArrayList<Span> workspaceIdSpanList = new ArrayList<>();
            Mono<String> workspaceIdMonoCache = applicationPagesDTOResponseDTOMonoCache
                    .map(responseDTO -> {
                        if (INTERNAL_SERVER_ERROR_STATUS
                                == responseDTO.getResponseMeta().getStatus()) {
                            return EMPTY_WORKSPACE_ID_ON_ERROR;
                        }

                        return responseDTO.getData().getWorkspaceId();
                    })
                    .onErrorResume(error -> Mono.just(EMPTY_WORKSPACE_ID_ON_ERROR))
                    .doOnSubscribe(subscription -> {
                        workspaceIdSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(WORKSPACE_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(workspaceIdSpanList.get(0)))
                    .cache();

            /* Get all plugins in workspace */
            ArrayList<Span> pluginsSpanList = new ArrayList<>();
            Mono<ResponseDTO<List>> listOfPluginsResponseDTOMonoCache = workspaceIdMonoCache
                    .flatMap(workspaceId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        if (!EMPTY_WORKSPACE_ID_ON_ERROR.equals(workspaceId)) {
                            params.add(WORKSPACE_ID, workspaceId);
                        }
                        return pluginService.get(params).collectList();
                    })
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        pluginsSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(PLUGINS_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(pluginsSpanList.get(0)))
                    .cache();

            /* Get all datasources in workspace */
            ArrayList<Span> datasourcesSpanList = new ArrayList<>();
            Mono<ResponseDTO<List>> listOfDatasourcesResponseDTOMonoCache = workspaceIdMonoCache
                    .flatMap(workspaceId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        if (!EMPTY_WORKSPACE_ID_ON_ERROR.equals(workspaceId)) {
                            params.add(WORKSPACE_ID, workspaceId);
                        }
                        return datasourceService.getAllWithStorages(params).collectList();
                    })
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        datasourcesSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(DATASOURCES_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(datasourcesSpanList.get(0)))
                    .cache();

            /* Get form config for all relevant plugins by following this rule:
             *   (a) there is at least one datasource of the plugin type alive in the workspace
             *   (b) include REST API and GraphQL API plugin always
             *   (c) ignore any other plugin
             *  */
            ArrayList<Span> formConfigsSpanList = new ArrayList<>();
            Mono<ResponseDTO<Map>> listOfFormConfigsResponseDTOMono = Mono.zip(
                            listOfPluginsResponseDTOMonoCache, listOfDatasourcesResponseDTOMonoCache)
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
                    .onErrorResume(error -> getErrorResponseMono(error, Map.class))
                    .doOnSubscribe(subscription -> {
                        formConfigsSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(FORM_CONFIG_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(formConfigsSpanList.get(0)));

            /* List of mock datasources available to the user */
            ArrayList<Span> mockDatasourcesSpanList = new ArrayList<>();
            Mono<ResponseDTO<List>> mockDataListResponseDTOMono = mockDataService
                    .getMockDataSet()
                    .map(MockDataDTO::getMockdbs)
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        mockDatasourcesSpanList.add(this.otlpTelemetry.startOTLPSpan(
                                getQualifiedSpanName(MOCK_DATASOURCES_SPAN, mode), null, parentSpan));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(mockDatasourcesSpanList.get(0)));

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
                consolidatedAPIResponseDTO.setUserProfile((ResponseDTO<UserProfileDTO>) responseArray[0]);
                consolidatedAPIResponseDTO.setTenantConfig((ResponseDTO<Tenant>) responseArray[1]);
                consolidatedAPIResponseDTO.setFeatureFlags((ResponseDTO<Map<String, Boolean>>) responseArray[2]);
                consolidatedAPIResponseDTO.setPages((ResponseDTO<ApplicationPagesDTO>) responseArray[3]);
                consolidatedAPIResponseDTO.setCurrentTheme((ResponseDTO<Theme>) responseArray[4]);
                consolidatedAPIResponseDTO.setThemes((ResponseDTO<List<Theme>>) responseArray[5]);
                consolidatedAPIResponseDTO.setCustomJSLibraries((ResponseDTO<List<CustomJSLib>>) responseArray[6]);
                consolidatedAPIResponseDTO.setProductAlert((ResponseDTO<ProductAlertResponseDTO>) responseArray[7]);
                consolidatedAPIResponseDTO.setUnpublishedActions((ResponseDTO<List<ActionDTO>>) responseArray[8]);
                consolidatedAPIResponseDTO.setUnpublishedActionCollections(
                        (ResponseDTO<List<ActionCollectionDTO>>) responseArray[9]);
                consolidatedAPIResponseDTO.setPagesWithMigratedDsl((ResponseDTO<List<PageDTO>>) responseArray[10]);
                consolidatedAPIResponseDTO.setPlugins((ResponseDTO<List<Plugin>>) responseArray[11]);
                consolidatedAPIResponseDTO.setDatasources((ResponseDTO<List<Datasource>>) responseArray[12]);
                consolidatedAPIResponseDTO.setPluginFormConfigs((ResponseDTO<Map<String, Map>>) responseArray[13]);
                consolidatedAPIResponseDTO.setMockDatasources((ResponseDTO<List<MockDataSet>>) responseArray[14]);

                if (!isBlank(defaultPageId)) {
                    consolidatedAPIResponseDTO.setPageWithMigratedDsl((ResponseDTO<PageDTO>) responseArray[15]);
                }

                return consolidatedAPIResponseDTO;
            });
        }
    }
}
