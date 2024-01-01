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
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.PluginConstants.PackageName.GRAPHQL_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.REST_API_PLUGIN;
import static com.appsmith.server.constants.OtlpSpanNames.ACTIONS_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.ACTIONS_VIEW_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.ACTION_COLLECTIONS_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.ACTION_COLLECTIONS_VIEW_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.APPLICATION_ID_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.APPLICATION_PAGES_EDIT_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.APPLICATION_PAGES_VIEW_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.CURRENT_PAGE_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.CURRENT_THEME_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.CUSTOM_JS_LIB_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.DATASOURCES_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.FEATURE_FLAG_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.FORM_CONFIG_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.MOCK_DATA_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.PAGES_DSL_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.PLUGINS_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.PRODUCT_ALERT_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.TENANT_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.THEMES_LIST_SPAN;
import static com.appsmith.server.constants.OtlpSpanNames.USER_PROFILE_SPAN;
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

    /**
     * This method is meant to be used by the client application at the time of 1st page load. Client currently makes
     * several API calls to fetch all the required data. This method consolidates all that data and returns them as
     * response hence enabling the client to fetch the required data via a single API call only.
     *
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

        /* Get user profile data */
        AtomicReference<Span> userProfileSpan = new AtomicReference<>();
        Mono<ResponseDTO<UserProfileDTO>> userProfileDTOResponseDTOMono = sessionUserService
                .getCurrentUser()
                .flatMap(userService::buildUserProfileDTO)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, UserProfileDTO.class))
                .doOnSubscribe(subscription -> {
                    userProfileSpan.set(this.otlpTelemetry.startOTLPSpan(USER_PROFILE_SPAN, null));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(userProfileSpan.get()));

        /* Get all feature flags data */
        AtomicReference<Span> featureFlagsSpan = new AtomicReference<>();
        Mono<ResponseDTO<Map>> featureFlagsForCurrentUserResponseDTOMonoCache = userDataService
                .getFeatureFlagsForCurrentUser()
                .map(res -> (Map) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, Map.class))
                .doOnSubscribe(subscription -> {
                    featureFlagsSpan.set(this.otlpTelemetry.startOTLPSpan(FEATURE_FLAG_SPAN, null));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(featureFlagsSpan.get()))
                .cache();

        /* Get tenant config data */
        AtomicReference<Span> tenantSpan = new AtomicReference<>();
        Mono<ResponseDTO<Tenant>> tenantResponseDTOMono = tenantService
                .getTenantConfiguration()
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, Tenant.class))
                .doOnSubscribe(subscription -> {
                    tenantSpan.set(this.otlpTelemetry.startOTLPSpan(TENANT_SPAN, null));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(tenantSpan.get()));

        /* Get any product alert info */
        AtomicReference<Span> productAlertSpan = new AtomicReference<>();
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
                    productAlertSpan.set(this.otlpTelemetry.startOTLPSpan(PRODUCT_ALERT_SPAN, null));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(productAlertSpan.get()));

        if (isBlank(defaultPageId) && isBlank(applicationId)) {

            List<Mono<?>> listOfCommonResponseMono = List.of(
                    userProfileDTOResponseDTOMono,
                    featureFlagsForCurrentUserResponseDTOMonoCache,
                    tenantResponseDTOMono,
                    productAlertResponseDTOMono);

            return Mono.zip(listOfCommonResponseMono, responseArray -> {
                consolidatedAPIResponseDTO.setV1UsersMeResp((ResponseDTO<UserProfileDTO>) responseArray[0]);
                consolidatedAPIResponseDTO.setV1UsersFeaturesResp((ResponseDTO<Map<String, Boolean>>) responseArray[1]);
                consolidatedAPIResponseDTO.setV1TenantsCurrentResp((ResponseDTO<Tenant>) responseArray[2]);
                consolidatedAPIResponseDTO.setV1ProductAlertResp(
                        (ResponseDTO<ProductAlertResponseDTO>) responseArray[3]);

                return consolidatedAPIResponseDTO;
            });
        }

        /* Get view mode - EDIT or PUBLISHED */
        boolean isViewMode = ApplicationMode.PUBLISHED.equals(mode);

        /* Fetch application id if not provided */
        AtomicReference<Span> applicationIdSpan = new AtomicReference<>();
        Mono<String> applicationIdMonoCache;
        if (isBlank(applicationId)) {
            applicationIdMonoCache = applicationPageService
                    .getPage(defaultPageId, isViewMode)
                    .map(PageDTO::getApplicationId)
                    .doOnSubscribe(subscription -> {
                        applicationIdSpan.set(this.otlpTelemetry.startOTLPSpan(APPLICATION_ID_SPAN, null));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(applicationIdSpan.get()))
                    .cache();
        } else {
            applicationIdMonoCache = Mono.just(applicationId).cache();
        }

        /* Get all pages in application */
        AtomicReference<Span> applicationPagesSpan = new AtomicReference<>();
        Mono<ResponseDTO<ApplicationPagesDTO>> applicationPagesDTOResponseDTOMonoCache = applicationIdMonoCache
                .flatMap(appId -> newPageService.findApplicationPages(appId, null, branchName, mode))
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, ApplicationPagesDTO.class))
                .doOnSubscribe(subscription -> {
                    applicationPagesSpan.set(this.otlpTelemetry.startOTLPSpan(
                            ApplicationMode.PUBLISHED.equals(mode)
                                    ? APPLICATION_PAGES_VIEW_SPAN
                                    : APPLICATION_PAGES_EDIT_SPAN,
                            null));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(applicationPagesSpan.get()))
                .cache();

        /* Get current theme */
        AtomicReference<Span> currentThemeSpan = new AtomicReference<>();
        Mono<ResponseDTO<Theme>> applicationThemeResponseDTOMono = applicationIdMonoCache
                .flatMap(appId -> themeService.getApplicationTheme(appId, mode, branchName))
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, Theme.class))
                .doOnSubscribe(subscription -> {
                    currentThemeSpan.set(this.otlpTelemetry.startOTLPSpan(CURRENT_THEME_SPAN, null));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(currentThemeSpan.get()));

        /* Get all themes */
        AtomicReference<Span> themesListSpan = new AtomicReference<>();
        Mono<ResponseDTO<List>> ThemesListResponseDTOMono = applicationIdMonoCache
                .flatMap(appId ->
                        themeService.getApplicationThemes(appId, branchName).collectList())
                .map(res -> (List) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, List.class))
                .doOnSubscribe(subscription -> {
                    themesListSpan.set(this.otlpTelemetry.startOTLPSpan(THEMES_LIST_SPAN, null));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(themesListSpan.get()));

        /* Get all custom JS libraries installed in the application */
        AtomicReference<Span> customJSLibSpan = new AtomicReference<>();
        Mono<ResponseDTO<List>> allJSLibsInContextDTOResponseDTOMono = applicationIdMonoCache
                .flatMap(appId -> customJSLibService.getAllJSLibsInContext(
                        appId, CreatorContextType.APPLICATION, branchName, isViewMode))
                .map(res -> (List) res)
                .map(this::getSuccessResponse)
                .onErrorResume(error -> getErrorResponseMono(error, List.class))
                .doOnSubscribe(subscription -> {
                    customJSLibSpan.set(this.otlpTelemetry.startOTLPSpan(CUSTOM_JS_LIB_SPAN, null));
                })
                .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(customJSLibSpan.get()));

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
            AtomicReference<Span> currentPageSpan = new AtomicReference<>();
            currentPageDTOResponseDTOMono = migrateDslMonoCache
                    .flatMap(migrateDsl -> applicationPageService.getPageAndMigrateDslByBranchAndDefaultPageId(
                            defaultPageId, branchName, isViewMode, migrateDsl))
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, PageDTO.class))
                    .doOnSubscribe(subscription -> {
                        currentPageSpan.set(this.otlpTelemetry.startOTLPSpan(CURRENT_PAGE_SPAN, null));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(currentPageSpan.get()));
        }

        /* Fetch view specific data */
        if (isViewMode) {
            /* Get list of all actions in view mode */
            AtomicReference<Span> actionViewSpan = new AtomicReference<>();
            Mono<ResponseDTO<List>> listOfActionViewResponseDTOMono = applicationIdMonoCache
                    .flatMap(appId -> newActionService
                            .getActionsForViewMode(appId, branchName)
                            .collectList())
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        actionViewSpan.set(this.otlpTelemetry.startOTLPSpan(ACTIONS_VIEW_SPAN, null));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(actionViewSpan.get()));

            /* Get list of all action collections in view mode */
            AtomicReference<Span> actionCollectionViewSpan = new AtomicReference<>();
            Mono<ResponseDTO<List>> listOfActionCollectionViewResponseDTOMono = applicationIdMonoCache
                    .flatMap(appId -> actionCollectionService
                            .getActionCollectionsForViewMode(appId, branchName)
                            .collectList())
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        actionCollectionViewSpan.set(
                                this.otlpTelemetry.startOTLPSpan(ACTION_COLLECTIONS_VIEW_SPAN, null));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(actionCollectionViewSpan.get()));

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
                consolidatedAPIResponseDTO.setV1LibrariesApplicationResp(
                        (ResponseDTO<List<CustomJSLib>>) responseArray[8]);
                consolidatedAPIResponseDTO.setV1ProductAlertResp(
                        (ResponseDTO<ProductAlertResponseDTO>) responseArray[9]);

                if (!isBlank(defaultPageId)) {
                    consolidatedAPIResponseDTO.setV1PublishedPageResp((ResponseDTO<PageDTO>) responseArray[10]);
                }

                return consolidatedAPIResponseDTO;
            });
        } else {
            /* Get all actions in edit mode */
            AtomicReference<Span> actionsSpan = new AtomicReference<>();
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
                        actionsSpan.set(this.otlpTelemetry.startOTLPSpan(ACTIONS_SPAN, null));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(actionsSpan.get()));

            /* Get all action collections in edit mode */
            AtomicReference<Span> actionCollectionsSpan = new AtomicReference<>();
            Mono<ResponseDTO<List>> listOfActionCollectionResponseDTOMono = applicationIdMonoCache.flatMap(appId -> {
                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.add(APPLICATION_ID, appId);
                return actionCollectionService
                        .getPopulatedActionCollectionsByViewMode(params, false, branchName)
                        .collectList()
                        .map(res -> (List) res)
                        .map(this::getSuccessResponse)
                        .onErrorResume(error -> getErrorResponseMono(error, List.class))
                        .doOnSubscribe(subscription -> {
                            actionCollectionsSpan.set(this.otlpTelemetry.startOTLPSpan(ACTION_COLLECTIONS_SPAN, null));
                        })
                        .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(actionCollectionsSpan.get()));
            });

            /* Get all pages in edit mode post apply migrate DSL changes */
            AtomicReference<Span> pagesPostMigrateDSLSpan = new AtomicReference<>();
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
                        pagesPostMigrateDSLSpan.set(this.otlpTelemetry.startOTLPSpan(PAGES_DSL_SPAN, null));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(pagesPostMigrateDSLSpan.get()));

            /* Get workspace id */
            Mono<String> workspaceIdMonoCache = applicationPagesDTOResponseDTOMonoCache
                    .map(ResponseDTO::getData)
                    .map(ApplicationPagesDTO::getWorkspaceId)
                    .cache();

            /* Get all plugins in workspace */
            AtomicReference<Span> pluginsSpan = new AtomicReference<>();
            Mono<ResponseDTO<List>> listOfPluginsResponseDTOMonoCache = workspaceIdMonoCache
                    .flatMap(workspaceId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(WORKSPACE_ID, workspaceId);
                        return pluginService.get(params).collectList();
                    })
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        pluginsSpan.set(this.otlpTelemetry.startOTLPSpan(PLUGINS_SPAN, null));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(pluginsSpan.get()))
                    .cache();

            /* Get all datasources in workspace */
            AtomicReference<Span> datasourcesSpan = new AtomicReference<>();
            Mono<ResponseDTO<List>> listOfDatasourcesResponseDTOMonoCache = workspaceIdMonoCache
                    .flatMap(workspaceId -> {
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(WORKSPACE_ID, workspaceId);
                        return datasourceService.getAllWithStorages(params).collectList();
                    })
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        datasourcesSpan.set(this.otlpTelemetry.startOTLPSpan(DATASOURCES_SPAN, null));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(datasourcesSpan.get()))
                    .cache();

            /* Get form config for all relevant plugins by following this rule:
             *   (a) there is at least one datasource of the plugin type alive in the workspace
             *   (b) include REST API and GraphQL API plugin always
             *   (c) ignore any other plugin
             *  */
            AtomicReference<Span> formConfigSpan = new AtomicReference<>();
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
                        formConfigSpan.set(this.otlpTelemetry.startOTLPSpan(FORM_CONFIG_SPAN, null));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(formConfigSpan.get()));

            /* List of mock datasources available to the user */
            AtomicReference<Span> mockDataSpan = new AtomicReference<>();
            Mono<ResponseDTO<List>> mockDataListResponseDTOMono = mockDataService
                    .getMockDataSet()
                    .map(MockDataDTO::getMockdbs)
                    .map(res -> (List) res)
                    .map(this::getSuccessResponse)
                    .onErrorResume(error -> getErrorResponseMono(error, List.class))
                    .doOnSubscribe(subscription -> {
                        mockDataSpan.set(this.otlpTelemetry.startOTLPSpan(MOCK_DATA_SPAN, null));
                    })
                    .doFinally(signalType -> this.otlpTelemetry.endOtlpSpanSafely(mockDataSpan.get()));

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
                consolidatedAPIResponseDTO.setV1LibrariesApplicationResp(
                        (ResponseDTO<List<CustomJSLib>>) responseArray[6]);
                consolidatedAPIResponseDTO.setV1ProductAlertResp(
                        (ResponseDTO<ProductAlertResponseDTO>) responseArray[7]);
                consolidatedAPIResponseDTO.setV1ActionsResp((ResponseDTO<List<ActionDTO>>) responseArray[8]);
                consolidatedAPIResponseDTO.setV1CollectionsActionsResp(
                        (ResponseDTO<List<ActionCollectionDTO>>) responseArray[9]);
                consolidatedAPIResponseDTO.setV1PageDSLs((ResponseDTO<List<PageDTO>>) responseArray[10]);
                consolidatedAPIResponseDTO.setV1PluginsResp((ResponseDTO<List<Plugin>>) responseArray[11]);
                consolidatedAPIResponseDTO.setV1DatasourcesResp((ResponseDTO<List<Datasource>>) responseArray[12]);
                consolidatedAPIResponseDTO.setV1PluginFormConfigsResp(
                        (ResponseDTO<Map<String, Map>>) responseArray[13]);
                consolidatedAPIResponseDTO.setV1DatasourcesMockResp((ResponseDTO<List<MockDataSet>>) responseArray[14]);

                if (!isBlank(defaultPageId)) {
                    consolidatedAPIResponseDTO.setV1PageResp((ResponseDTO<PageDTO>) responseArray[15]);
                }

                return consolidatedAPIResponseDTO;
            });
        }
    }
}
