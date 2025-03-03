package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.dtos.ParamProperty;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.Constraint;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ExecuteActionMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ActionExecutionSolutionHelper;
import com.appsmith.server.helpers.DatasourceAnalyticsUtils;
import com.appsmith.server.helpers.DateUtils;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang.StringEscapeUtils;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.codec.multipart.Part;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.CommonFieldName.REDACTED_DATA;
import static com.appsmith.external.constants.spans.ActionSpan.ACTION_EXECUTION_CACHED_DATASOURCE;
import static com.appsmith.external.constants.spans.ActionSpan.ACTION_EXECUTION_DATASOURCE_CONTEXT;
import static com.appsmith.external.constants.spans.ActionSpan.ACTION_EXECUTION_EDITOR_CONFIG;
import static com.appsmith.external.constants.spans.ActionSpan.ACTION_EXECUTION_REQUEST_PARSING;
import static com.appsmith.external.constants.spans.ActionSpan.ACTION_EXECUTION_SERVER_EXECUTION;
import static com.appsmith.external.helpers.DataTypeStringUtils.getDisplayDataTypes;
import static com.appsmith.server.constants.ce.FieldNameCE.NONE;
import static com.appsmith.server.helpers.WidgetSuggestionHelper.getSuggestedWidgets;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
public class ActionExecutionSolutionCEImpl implements ActionExecutionSolutionCE {

    private final NewActionService newActionService;
    private final ActionPermission actionPermission;
    private final ObservationRegistry observationRegistry;
    private final ObjectMapper objectMapper;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final DatasourceContextService datasourceContextService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final NewPageService newPageService;
    private final ApplicationService applicationService;
    private final SessionUserService sessionUserService;
    private final AuthenticationValidator authenticationValidator;
    private final DatasourcePermission datasourcePermission;
    private final AnalyticsService analyticsService;
    private final DatasourceStorageService datasourceStorageService;
    private final EnvironmentPermission environmentPermission;
    private final ConfigService configService;
    private final OrganizationService organizationService;
    private final ActionExecutionSolutionHelper actionExecutionSolutionHelper;
    private final CommonConfig commonConfig;
    private final FeatureFlagService featureFlagService;

    static final String PARAM_KEY_REGEX = "^k\\d+$";
    static final String BLOB_KEY_REGEX =
            "^blob:[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}$";
    static final String EXECUTE_ACTION_DTO = "executeActionDTO";
    static final String PARAMETER_MAP = "parameterMap";
    List<Pattern> patternList = new ArrayList<>();

    public ActionExecutionSolutionCEImpl(
            NewActionService newActionService,
            ActionPermission actionPermission,
            ObservationRegistry observationRegistry,
            ObjectMapper objectMapper,
            DatasourceService datasourceService,
            PluginService pluginService,
            DatasourceContextService datasourceContextService,
            PluginExecutorHelper pluginExecutorHelper,
            NewPageService newPageService,
            ApplicationService applicationService,
            SessionUserService sessionUserService,
            AuthenticationValidator authenticationValidator,
            DatasourcePermission datasourcePermission,
            AnalyticsService analyticsService,
            DatasourceStorageService datasourceStorageService,
            EnvironmentPermission environmentPermission,
            ConfigService configService,
            OrganizationService organizationService,
            CommonConfig commonConfig,
            ActionExecutionSolutionHelper actionExecutionSolutionHelper,
            FeatureFlagService featureFlagService) {
        this.newActionService = newActionService;
        this.actionPermission = actionPermission;
        this.observationRegistry = observationRegistry;
        this.objectMapper = objectMapper;
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.datasourceContextService = datasourceContextService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.newPageService = newPageService;
        this.applicationService = applicationService;
        this.sessionUserService = sessionUserService;
        this.authenticationValidator = authenticationValidator;
        this.datasourcePermission = datasourcePermission;
        this.analyticsService = analyticsService;
        this.datasourceStorageService = datasourceStorageService;
        this.environmentPermission = environmentPermission;
        this.configService = configService;
        this.organizationService = organizationService;
        this.commonConfig = commonConfig;
        this.actionExecutionSolutionHelper = actionExecutionSolutionHelper;
        this.featureFlagService = featureFlagService;

        this.patternList.add(Pattern.compile(PARAM_KEY_REGEX));
        this.patternList.add(Pattern.compile(BLOB_KEY_REGEX));
        this.patternList.add(Pattern.compile(EXECUTE_ACTION_DTO));
        this.patternList.add(Pattern.compile(PARAMETER_MAP));
    }

    protected AclPermission getPermission(ExecuteActionMetaDTO executeActionMetaDTO, AclPermission aclPermission) {
        return aclPermission;
    }

    /**
     * Fetches the action from the DB, and populates the executeActionMetaDTO with the action
     * Also fetches the true environmentId for the action execution
     *
     * @param executeActionDTO
     * @param executeActionMetaDTO
     * @return
     */
    protected Mono<ActionExecutionResult> populateAndExecuteAction(
            ExecuteActionDTO executeActionDTO, ExecuteActionMetaDTO executeActionMetaDTO) {
        AclPermission executePermission = getPermission(executeActionMetaDTO, actionPermission.getExecutePermission());
        Mono<NewAction> newActionMono = newActionService
                .findById(executeActionDTO.getActionId(), executePermission)
                .cache();

        Mono<ExecuteActionDTO> populatedExecuteActionDTOMono =
                newActionMono.flatMap(newAction -> populateExecuteActionDTO(executeActionDTO, newAction));
        Mono<String> environmentIdMono = Mono.zip(newActionMono, populatedExecuteActionDTOMono)
                .flatMap(tuple -> {
                    NewAction newAction = tuple.getT1();
                    ExecuteActionDTO populatedExecuteActionDTO = tuple.getT2();
                    return getTrueEnvironmentId(newAction, populatedExecuteActionDTO, executeActionMetaDTO);
                });

        return Mono.zip(populatedExecuteActionDTOMono, environmentIdMono).flatMap(pair -> {
            ExecuteActionDTO populatedExecuteActionDTO = pair.getT1();
            String environmentId = pair.getT2();
            executeActionMetaDTO.setEnvironmentId(environmentId);
            return executeAction(populatedExecuteActionDTO, executeActionMetaDTO);
        });
    }

    /**
     * Fetches the true environmentId for the action execution based on the action, the provided environmentId and the
     * pluginId. It also takes into account, whether the datasource related to action is embedded or not.
     * @param newAction
     * @param executeActionDTO
     * @param executeActionMetaDTO
     * @return
     */
    private Mono<String> getTrueEnvironmentId(
            NewAction newAction, ExecuteActionDTO executeActionDTO, ExecuteActionMetaDTO executeActionMetaDTO) {
        boolean isEmbedded = executeActionDTO.getViewMode()
                ? newAction.getPublishedAction().getDatasource().getId() == null
                : newAction.getUnpublishedAction().getDatasource().getId() == null;

        AclPermission executePermission =
                getPermission(executeActionMetaDTO, environmentPermission.getExecutePermission());

        return datasourceService.getTrueEnvironmentId(
                newAction.getWorkspaceId(),
                executeActionMetaDTO.getEnvironmentId(),
                newAction.getPluginId(),
                executePermission,
                isEmbedded);
    }

    /**
     * Populates the executeActionDTO with the required fields
     * @param executeActionDTO
     * @param newAction
     * @return
     */
    private Mono<ExecuteActionDTO> populateExecuteActionDTO(ExecuteActionDTO executeActionDTO, NewAction newAction) {
        Mono<String> instanceIdMono = configService.getInstanceId();
        Mono<String> defaultOrganizationIdMono = organizationService.getDefaultOrganizationId();
        Mono<ExecuteActionDTO> systemInfoPopulatedExecuteActionDTOMono =
                actionExecutionSolutionHelper.populateExecuteActionDTOWithSystemInfo(executeActionDTO);

        return systemInfoPopulatedExecuteActionDTOMono.flatMap(populatedExecuteActionDTO -> Mono.zip(
                        instanceIdMono, defaultOrganizationIdMono)
                .map(tuple -> {
                    String instanceId = tuple.getT1();
                    String organizationId = tuple.getT2();
                    populatedExecuteActionDTO.setActionId(newAction.getId());
                    populatedExecuteActionDTO.setWorkspaceId(newAction.getWorkspaceId());
                    if (TRUE.equals(executeActionDTO.getViewMode())) {
                        populatedExecuteActionDTO.setDatasourceId(
                                newAction.getPublishedAction().getDatasource().getId());
                    } else {
                        populatedExecuteActionDTO.setDatasourceId(
                                newAction.getUnpublishedAction().getDatasource().getId());
                    }
                    populatedExecuteActionDTO.setInstanceId(instanceId);
                    populatedExecuteActionDTO.setOrganizationId(organizationId);
                    return populatedExecuteActionDTO;
                }));
    }

    /**
     * Executes the action(queries) by creating executeActionDTO and sending it to the plugin for further execution
     *
     * @param partFlux
     * @param environmentId
     * @return Mono of actionExecutionResult if the query succeeds, error messages otherwise
     */
    @Override
    public Mono<ActionExecutionResult> executeAction(
            Flux<Part> partFlux, String environmentId, HttpHeaders httpHeaders, Boolean operateWithoutPermission) {
        ExecuteActionMetaDTO executeActionMetaDTO = ExecuteActionMetaDTO.builder()
                .headers(httpHeaders)
                .operateWithoutPermission(operateWithoutPermission)
                .environmentId(environmentId)
                .build();
        Mono<ExecuteActionDTO> executeActionDTOMono =
                createExecuteActionDTO(partFlux).cache();
        Mono<Plugin> pluginMono = executeActionDTOMono.flatMap(executeActionDTO -> newActionService
                .findById(executeActionDTO.getActionId())
                .flatMap(newAction -> {
                    if (newAction.getPluginId() == null
                            || newAction.getPluginId().isEmpty()) {
                        return Mono.empty();
                    } else {
                        return pluginService.findById(newAction.getPluginId());
                    }
                })
                .cache());

        return pluginMono
                .map(plugin -> {
                    executeActionMetaDTO.setPlugin(plugin);
                    return plugin.getName() != null ? plugin.getName() : NONE;
                })
                .defaultIfEmpty(NONE)
                .flatMap(pluginName -> {
                    String name = (String) pluginName;
                    if (NONE.equals(name)) {
                        executeActionMetaDTO.setPlugin(null);
                    }
                    return executeActionDTOMono
                            .flatMap(executeActionDTO ->
                                    populateAndExecuteAction(executeActionDTO, executeActionMetaDTO))
                            .tag("plugin", name)
                            .name(ACTION_EXECUTION_SERVER_EXECUTION)
                            .tap(Micrometer.observation(observationRegistry));
                });
    }

    /**
     * Fetches the required Mono (action, datasource, and plugin) and makes actionExecution call to plugin
     *
     * @param executeActionDTO
     * @param executeActionMetaDTO
     * @return actionExecutionResult if query succeeds, error messages otherwise
     */
    @Override
    public Mono<ActionExecutionResult> executeAction(
            ExecuteActionDTO executeActionDTO, ExecuteActionMetaDTO executeActionMetaDTO) {
        // 1. Validate input parameters which are required for mustache replacements
        replaceNullWithQuotesForParamValues(executeActionDTO.getParams());

        String actionId = executeActionDTO.getActionId();
        AtomicReference<String> actionName = new AtomicReference<>();
        actionName.set("");

        // 2. Fetch the action from the DB and check if it can be executed
        Mono<ActionDTO> actionDTOMono = getValidActionForExecution(executeActionDTO, executeActionMetaDTO)
                .cache();

        // 3. Instantiate the implementation class based on the query type
        Mono<DatasourceStorage> datasourceStorageMono = getCachedDatasourceStorage(actionDTOMono, executeActionMetaDTO);
        Mono<Plugin> pluginMono = executeActionMetaDTO.getPlugin() != null
                ? Mono.just(executeActionMetaDTO.getPlugin())
                : getCachedPluginForActionExecution(datasourceStorageMono);
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        // 4. Execute the query
        Mono<ActionExecutionResult> actionExecutionResultMono = getActionExecutionResult(
                executeActionDTO,
                actionDTOMono,
                datasourceStorageMono,
                pluginMono,
                pluginExecutorMono,
                executeActionMetaDTO.getHeaders());

        Mono<Map> editorConfigLabelMapMono = getEditorConfigLabelMap(datasourceStorageMono);

        return actionExecutionResultMono
                .zipWith(editorConfigLabelMapMono, (result, labelMap) -> {
                    if (TRUE.equals(executeActionDTO.getViewMode())) {
                        result.setRequest(null);
                    } else if (result.getRequest() != null
                            && result.getRequest().getRequestParams() != null) {
                        transformRequestParams(result, labelMap);
                    }
                    return result;
                })
                .map(result -> addDataTypesAndSetSuggestedWidget(result, executeActionDTO.getViewMode()))
                .onErrorResume(AppsmithException.class, error -> {
                    ActionExecutionResult result = new ActionExecutionResult();
                    result.setIsExecutionSuccess(false);
                    result.setErrorInfo(error);
                    return Mono.just(result);
                });
    }

    /**
     * Creates the ExecuteActionDTO from Flux of ByteBuffers
     *
     * @param partFlux
     * @return an executionDTO object with parameterMap
     */
    protected Mono<ExecuteActionDTO> createExecuteActionDTO(Flux<Part> partFlux) {
        final AtomicLong totalReadableByteCount = new AtomicLong(0);
        final ExecuteActionDTO dto = new ExecuteActionDTO();
        return this.parsePartsAndGetParamsFlux(partFlux, totalReadableByteCount, dto)
                .collectList()
                .flatMap(params -> this.enrichExecutionParam(totalReadableByteCount, dto, params))
                .name(ACTION_EXECUTION_REQUEST_PARSING)
                .tap(Micrometer.observation(observationRegistry));
    }

    /**
     * This method attempts to parse all incoming parts by type, in parallel
     * The expectation is that each part gets processed by the time this flux ends,
     * and the DTO is updated accordingly
     *
     * @param partFlux               Raw flux of parts as received in the execution request
     * @param totalReadableByteCount An atomic type to store the total execution request size as and when we parse them
     * @param dto                    The ExecuteActionDTO object to store all results in
     * @return
     */
    protected Flux<Param> parsePartsAndGetParamsFlux(
            Flux<Part> partFlux, AtomicLong totalReadableByteCount, ExecuteActionDTO dto) {
        return partFlux.groupBy(part -> {
                    // We're grouping parts by the type of processing required
                    // Expected types: meta, value, blob

                    for (Pattern pattern : patternList) {
                        Matcher matcher = pattern.matcher(part.name());
                        if (matcher.find()) {
                            return pattern.pattern();
                        }
                    }
                    return part.name();
                })
                .flatMap(groupedPartsFlux -> {
                    String key = groupedPartsFlux.key();
                    return switch (key) {
                        case PARAM_KEY_REGEX -> groupedPartsFlux.flatMap(
                                part -> this.parseExecuteParameter(part, totalReadableByteCount));
                        case BLOB_KEY_REGEX -> this.parseExecuteBlobs(groupedPartsFlux, dto, totalReadableByteCount)
                                .then(Mono.empty());
                        case EXECUTE_ACTION_DTO -> groupedPartsFlux
                                .next()
                                .flatMap(part -> this.parseExecuteActionPart(part, dto))
                                .then(Mono.empty());
                        case PARAMETER_MAP -> groupedPartsFlux
                                .next()
                                .flatMap(part -> this.parseExecuteParameterMapPart(part, dto))
                                .then(Mono.empty());
                        default -> Mono.error(new AppsmithException(
                                AppsmithError.GENERIC_BAD_REQUEST, "Unexpected part found: " + key));
                    };
                });
    }

    protected Mono<Void> parseExecuteActionPart(Part part, ExecuteActionDTO dto) {
        return DataBufferUtils.join(part.content())
                .flatMap(executeActionDTOBuffer -> {
                    byte[] byteData = new byte[executeActionDTOBuffer.readableByteCount()];
                    executeActionDTOBuffer.read(byteData);
                    DataBufferUtils.release(executeActionDTOBuffer);
                    try {
                        return Mono.just(objectMapper.readValue(byteData, ExecuteActionDTO.class));
                    } catch (IOException e) {
                        log.error("Error in deserializing ExecuteActionDTO", e);
                        return Mono.error(new AppsmithException(AppsmithError.GENERIC_REQUEST_BODY_PARSE_ERROR));
                    }
                })
                .flatMap(executeActionDTO -> {
                    dto.setActionId(executeActionDTO.getActionId());
                    dto.setDatasourceId(executeActionDTO.getDatasourceId());
                    dto.setViewMode(executeActionDTO.getViewMode());
                    dto.setParamProperties(executeActionDTO.getParamProperties());
                    dto.setPaginationField(executeActionDTO.getPaginationField());
                    return Mono.empty();
                });
    }

    protected Mono<Void> parseExecuteParameterMapPart(Part part, ExecuteActionDTO dto) {
        return DataBufferUtils.join(part.content())
                .flatMap(parameterMapBuffer -> {
                    byte[] byteData = new byte[parameterMapBuffer.readableByteCount()];
                    parameterMapBuffer.read(byteData);
                    DataBufferUtils.release(parameterMapBuffer);
                    try {
                        return Mono.just(objectMapper.readValue(byteData, new TypeReference<Map<String, String>>() {}));
                    } catch (IOException e) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, PARAMETER_MAP));
                    }
                })
                .flatMap(paramMap -> {
                    dto.setParameterMap(paramMap);
                    return Mono.empty();
                });
    }

    protected Mono<Param> parseExecuteParameter(Part part, AtomicLong totalReadableByteCount) {
        final Param param = new Param();
        param.setPseudoBindingName(part.name());
        return DataBufferUtils.join(part.content()).map(dataBuffer -> {
            byte[] bytes = new byte[dataBuffer.readableByteCount()];
            totalReadableByteCount.addAndGet(dataBuffer.readableByteCount());
            dataBuffer.read(bytes);
            DataBufferUtils.release(dataBuffer);
            param.setValue(new String(bytes, StandardCharsets.UTF_8));
            return param;
        });
    }

    protected Mono<Void> parseExecuteBlobs(
            Flux<Part> partsFlux, ExecuteActionDTO dto, AtomicLong totalReadableByteCount) {
        Map<String, String> blobMap = new HashMap<>();
        dto.setBlobValuesMap(blobMap);

        return partsFlux
                .flatMap(part -> {
                    return DataBufferUtils.join(part.content()).map(dataBuffer -> {
                        byte[] bytes = new byte[dataBuffer.readableByteCount()];
                        totalReadableByteCount.addAndGet(dataBuffer.readableByteCount());
                        dataBuffer.read(bytes);
                        DataBufferUtils.release(dataBuffer);
                        blobMap.put(part.name(), new String(bytes, StandardCharsets.ISO_8859_1));
                        return Mono.empty();
                    });
                })
                .then();
    }

    protected Mono<ExecuteActionDTO> enrichExecutionParam(
            AtomicLong totalReadableByteCount, ExecuteActionDTO dto, List<Param> params) {
        if (dto.getActionId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ACTION_ID));
        }

        dto.setTotalReadableByteCount(totalReadableByteCount.longValue());

        final Set<String> visitedBindings = new HashSet<>();
        /*
           Parts in multipart request can appear in any order. In order to avoid NPE original name of the parameters
           along with the client-side data type are set here as it's guaranteed at this point that the part having the parameterMap is already collected.
           Ref: https://github.com/appsmithorg/appsmith/issues/16722
        */
        params.forEach(param -> {
            String pseudoBindingName = param.getPseudoBindingName();
            String bindingValue = dto.getInvertParameterMap().get(pseudoBindingName);
            param.setKey(bindingValue);
            visitedBindings.add(bindingValue);
            // if the type is not an array e.g. "k1": "string" or "k1": "boolean"
            ParamProperty paramProperty = dto.getParamProperties().get(pseudoBindingName);
            if (paramProperty != null) {
                this.identifyExecutionParamDatatype(param, paramProperty);

                this.substituteBlobValuesInParam(dto, param, paramProperty);
            }
        });

        // In case there are parameters that did not receive a value in the multipart request,
        // initialize these bindings with empty strings
        if (dto.getParameterMap() != null) {
            dto.getParameterMap().keySet().stream().forEach(parameter -> {
                if (!visitedBindings.contains(parameter)) {
                    Param newParam = new Param(parameter, "");
                    params.add(newParam);
                }
            });
        }
        dto.setParams(params);
        return Mono.just(dto);
    }

    private void substituteBlobValuesInParam(ExecuteActionDTO dto, Param param, ParamProperty paramProperty) {
        // Check if this param has blobUrlPaths
        if (paramProperty.getBlobIdentifiers() != null
                && !paramProperty.getBlobIdentifiers().isEmpty()) {
            // If it does, trigger the replacement logic for each of these urlPaths
            String replacedValue = this.replaceBlobValuesInParam(
                    param.getValue(), paramProperty.getBlobIdentifiers(), dto.getBlobValuesMap());
            // And then update the value for this param
            param.setValue(replacedValue);
        }
    }

    private void identifyExecutionParamDatatype(Param param, ParamProperty paramProperty) {
        Object datatype = paramProperty.getDatatype();
        if (datatype instanceof String) {
            param.setClientDataType(
                    ClientDataType.valueOf(String.valueOf(datatype).toUpperCase()));
        } else if (datatype instanceof LinkedHashMap) {
            // if the type is an array e.g. "k1": { "array": [ "string", "number", "string", "boolean"]
            LinkedHashMap<String, ArrayList> stringArrayListLinkedHashMap = (LinkedHashMap<String, ArrayList>) datatype;
            Optional<String> firstKeyOpt =
                    stringArrayListLinkedHashMap.keySet().stream().findFirst();
            if (firstKeyOpt.isPresent()) {
                String firstKey = firstKeyOpt.get();
                param.setClientDataType(ClientDataType.valueOf(firstKey.toUpperCase()));
                List<String> individualTypes = stringArrayListLinkedHashMap.get(firstKey);
                List<ClientDataType> dataTypesOfArrayElements = individualTypes.stream()
                        .map(it -> ClientDataType.valueOf(String.valueOf(it).toUpperCase()))
                        .collect(Collectors.toList());
                param.setDataTypesOfArrayElements(dataTypesOfArrayElements);
            }
        }
    }

    protected String replaceBlobValuesInParam(
            String value, List<String> blobIdentifiers, Map<String, String> blobValuesMap) {
        // If there is no blobId reference against this param, return as is
        if (blobIdentifiers == null || blobIdentifiers.isEmpty()) {
            return value;
        }

        // Otherwise, for each such blobId reference, replace the reference with the actual value from the blobMap
        for (String blobId : blobIdentifiers) {
            value = value.replace(blobId, StringEscapeUtils.escapeJava(blobValuesMap.get(blobId)));
        }

        return value;
    }

    /**
     * Sets the param value to "" if key is not empty and value is null for each param
     *
     * @param params
     */
    protected void replaceNullWithQuotesForParamValues(List<Param> params) {

        if (!CollectionUtils.isEmpty(params)) {
            for (Param param : params) {
                // In case the parameter values turn out to be null, set it to empty string instead to allow
                // the execution to go through no matter what.
                if (StringUtils.hasLength(param.getKey()) && param.getValue() == null) {
                    param.setValue("");
                }
            }
        }
    }

    /**
     * Fetches, validates and caches the datasource from actionDTO
     *
     * @param actionDTOMono
     * @return datasourceStorageMono
     */
    protected Mono<DatasourceStorage> getCachedDatasourceStorage(
            Mono<ActionDTO> actionDTOMono, ExecuteActionMetaDTO executeActionMetaDTO) {

        return actionDTOMono
                .flatMap(actionDTO -> {
                    Mono<DatasourceStorage> datasourceStorageMono = null;
                    Datasource datasource = actionDTO.getDatasource();
                    if (datasource != null && datasource.getId() != null) {
                        // This is an action with a global datasource,
                        // we need to find the entry from db and populate storage
                        AclPermission executePermission =
                                getPermission(executeActionMetaDTO, datasourcePermission.getExecutePermission());
                        datasourceStorageMono = datasourceService
                                .findById(datasource.getId(), executePermission)
                                .flatMap(datasource1 ->
                                        datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(
                                                datasource1, executeActionMetaDTO.getEnvironmentId()));
                    } else if (datasource == null) {
                        datasourceStorageMono = Mono.empty();
                    } else {
                        // For embedded datasource, we are simply relying on datasource configuration property
                        datasourceStorageMono =
                                Mono.just(datasourceStorageService.createDatasourceStorageFromDatasource(
                                        datasource, executeActionMetaDTO.getEnvironmentId()));
                    }

                    return datasourceStorageMono
                            .switchIfEmpty(Mono.error(
                                    new AppsmithException(AppsmithError.NO_CONFIGURATION_FOUND_IN_DATASOURCE)))
                            .flatMap(datasourceStorage -> {
                                // For embedded datasourceStorage, validate the datasourceStorage for each execution
                                if (datasourceStorage.getDatasourceId() == null) {
                                    return datasourceStorageService.validateDatasourceConfiguration(datasourceStorage);
                                }

                                // The external datasourceStorage have already been validated. No need to validate
                                // again.
                                return Mono.just(datasourceStorage);
                            })
                            .flatMap(datasourceStorage -> {
                                Set<String> invalids = datasourceStorage.getInvalids();
                                if (!CollectionUtils.isEmpty(invalids)) {
                                    log.error(
                                            "Unable to execute actionId: {} because it's datasource is not valid. Cause: {}",
                                            actionDTO.getId(),
                                            ArrayUtils.toString(invalids));
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.INVALID_DATASOURCE,
                                            datasourceStorage.getName(),
                                            ArrayUtils.toString(invalids)));
                                }
                                return Mono.just(datasourceStorage);
                            });
                })
                .name(ACTION_EXECUTION_CACHED_DATASOURCE)
                .tap(Micrometer.observation(observationRegistry))
                .cache();
    }

    /**
     * fetches and caches plugin by pluginId after checking datasource for invalids(issues)
     *
     * @param datasourceStorageMono
     * @return pluginMono if datasource has no issues and plugin is find, else throws error
     */
    protected Mono<Plugin> getCachedPluginForActionExecution(Mono<DatasourceStorage> datasourceStorageMono) {

        return datasourceStorageMono
                .flatMap(datasourceStorage -> pluginService.findById(datasourceStorage.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN)));
    }

    /**
     * Fetches and returns editorConfigLabelMap if datasourceId is present
     *
     * @param datasourceStorageMono
     * @return an Empty hashMap if datasource doesn't have id, else configLabelMap from plugin service
     */
    protected Mono<Map> getEditorConfigLabelMap(Mono<DatasourceStorage> datasourceStorageMono) {

        return datasourceStorageMono
                .flatMap(datasourceStorage -> {
                    if (!StringUtils.hasLength(datasourceStorage.getDatasourceId())) {
                        return Mono.just(new HashMap<>());
                    }

                    return pluginService.getEditorConfigLabelMap(datasourceStorage.getPluginId());
                })
                .name(ACTION_EXECUTION_EDITOR_CONFIG)
                .tap(Micrometer.observation(observationRegistry));
    }

    /**
     * Passes the payload to pluginExecutor post datasource validation and context retrieval
     * <p>
     * This method validates the datasource, retrieves context and subsequently passes the payload to pluginExecutor for
     * further execution of the request.
     * </p>
     * <p> In case of failure the method retries to from context</p>
     *
     * @param executeActionDTO
     * @param actionDTO
     * @param datasourceStorage
     * @param plugin
     * @param pluginExecutor
     * @return actionExecutionResultMono
     */
    protected Mono<ActionExecutionResult> verifyDatasourceAndMakeRequest(
            ExecuteActionDTO executeActionDTO,
            ActionDTO actionDTO,
            DatasourceStorage datasourceStorage,
            Plugin plugin,
            PluginExecutor pluginExecutor) {

        Mono<ActionExecutionResult> executionMono = authenticationValidator
                .validateAuthentication(datasourceStorage)
                .zipWhen(validatedDatasource -> datasourceContextService
                        .getDatasourceContext(validatedDatasource, plugin)
                        .tag("plugin", plugin.getPackageName())
                        .name(ACTION_EXECUTION_DATASOURCE_CONTEXT)
                        .tap(Micrometer.observation(observationRegistry)))
                .zipWith(ReactiveContextUtils.getCurrentUser())
                .flatMap(objects -> {
                    DatasourceStorage datasourceStorage1 = objects.getT1().getT1();
                    DatasourceContext<?> resourceContext = objects.getT1().getT2();
                    String organizationId = objects.getT2().getOrganizationId();
                    // Now that we have the context (connection details), execute the action.

                    Instant requestedAt = Instant.now();
                    Map<String, Boolean> features =
                            featureFlagService.getCachedOrganizationFeatureFlags(organizationId) != null
                                    ? featureFlagService
                                            .getCachedOrganizationFeatureFlags(organizationId)
                                            .getFeatures()
                                    : Collections.emptyMap();

                    // TODO: Flags are needed here for google sheets integration to support shared drive behind a flag
                    // Once thoroughly tested, this flag can be removed
                    return ((PluginExecutor<Object>) pluginExecutor)
                            .executeParameterizedWithMetricsAndFlags(
                                    resourceContext.getConnection(),
                                    executeActionDTO,
                                    datasourceStorage1.getDatasourceConfiguration(),
                                    actionDTO.getActionConfiguration(),
                                    observationRegistry,
                                    features)
                            .map(actionExecutionResult -> {
                                ActionExecutionRequest actionExecutionRequest = actionExecutionResult.getRequest();
                                if (actionExecutionRequest == null) {
                                    actionExecutionRequest = new ActionExecutionRequest();
                                }

                                actionExecutionRequest.setActionId(executeActionDTO.getActionId());
                                actionExecutionRequest.setRequestedAt(requestedAt);

                                actionExecutionResult.setRequest(actionExecutionRequest);
                                return actionExecutionResult;
                            });
                });

        return executionMono.onErrorResume(StaleConnectionException.class, error -> {
            log.info("Looks like the connection is stale. Retrying with a fresh context.");
            return datasourceContextService
                    .deleteDatasourceContext(datasourceStorage)
                    .then(executionMono);
        });
    }

    protected Function<? super Throwable, ? extends Throwable> executionExceptionMapper(
            ActionDTO actionDTO, Integer timeoutDuration) {
        return error -> {
            if (error instanceof TimeoutException) {
                return new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR, actionDTO.getName(), timeoutDuration);
            } else if (error instanceof StaleConnectionException e) {
                return new AppsmithPluginException(AppsmithPluginError.STALE_CONNECTION_ERROR, e.getMessage());
            } else {
                log.debug(
                        "{}: In the action execution error mode.",
                        Thread.currentThread().getName(),
                        error);
                return error;
            }
        };
    }

    protected Function<? super Throwable, Mono<ActionExecutionResult>> executionExceptionHandler(ActionDTO actionDTO) {
        return error -> {
            ActionExecutionResult result = new ActionExecutionResult();
            result.setErrorInfo(error);
            result.setIsExecutionSuccess(false);
            final ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
            actionExecutionRequest.setActionId(actionDTO.getId());
            actionExecutionRequest.setRequestedAt(Instant.now());
            result.setRequest(actionExecutionRequest);
            return Mono.just(result);
        };
    }

    /**
     * This function deep copies the actionConfiguration object to send the original object to mixpanel which contains
     * the actual user query with bindings
     * @param actionConfiguration
     * @return
     */
    private ActionConfiguration deepCopyActionConfiguration(ActionConfiguration actionConfiguration) {
        try {
            // Convert the ActionConfiguration object to JSON string
            String json = objectMapper.writeValueAsString(actionConfiguration);

            // Convert the JSON string back to an ActionConfiguration object
            return objectMapper.readValue(json, ActionConfiguration.class);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Handles the execution logic, call to pluginExecutor with the payload post retrieval and validation of action, datasource, and plugin
     *
     * @param executeActionDTO
     * @param actionDTOMono
     * @param datasourceStorageMono
     * @param pluginMono
     * @param pluginExecutorMono
     * @return actionExecutionResultMono
     */
    protected Mono<ActionExecutionResult> getActionExecutionResult(
            ExecuteActionDTO executeActionDTO,
            Mono<ActionDTO> actionDTOMono,
            Mono<DatasourceStorage> datasourceStorageMono,
            Mono<Plugin> pluginMono,
            Mono<PluginExecutor> pluginExecutorMono,
            HttpHeaders httpHeaders) {

        return Mono.zip(actionDTOMono, datasourceStorageMono, pluginExecutorMono, pluginMono)
                .flatMap(tuple -> {
                    final ActionDTO actionDTO = tuple.getT1();
                    final DatasourceStorage datasourceStorage = tuple.getT2();
                    final PluginExecutor pluginExecutor = tuple.getT3();
                    final Plugin plugin = tuple.getT4();
                    // This is to return the raw user query including bindings
                    ActionConfiguration rawActionConfiguration = null;
                    if (actionDTO != null && actionDTO.getActionConfiguration() != null) {
                        // deep copying the actionConfiguration to avoid any changes in the original object
                        rawActionConfiguration = this.deepCopyActionConfiguration(actionDTO.getActionConfiguration());
                    }

                    log.debug(
                            "[{}]Execute Action called in Page {}, for action id : {}  action name : {}",
                            Thread.currentThread().getName(),
                            actionDTO.getPageId(),
                            actionDTO.getId(),
                            actionDTO.getName());

                    Integer timeoutDuration = actionDTO.getActionConfiguration().getTimeoutInMillisecond();

                    Mono<ActionDTO> actionDTOWithAutoGeneratedHeadersMono =
                            setAutoGeneratedHeaders(plugin, actionDTO, httpHeaders);

                    Mono<ActionExecutionResult> actionExecutionResultMono =
                            actionDTOWithAutoGeneratedHeadersMono.flatMap(actionDTO1 -> verifyDatasourceAndMakeRequest(
                                            executeActionDTO, actionDTO, datasourceStorage, plugin, pluginExecutor)
                                    .timeout(Duration.ofMillis(timeoutDuration)));

                    ActionConfiguration finalRawActionConfiguration = rawActionConfiguration;
                    return actionExecutionResultMono
                            .onErrorMap(executionExceptionMapper(actionDTO, timeoutDuration))
                            .onErrorResume(executionExceptionHandler(actionDTO))
                            .elapsed()
                            // Now send the analytics event for this execution
                            .flatMap(tuple1 -> {
                                Long timeElapsed = tuple1.getT1();
                                ActionExecutionResult result = tuple1.getT2();

                                log.debug(
                                        "{}: Action {} with id {} execution time : {} ms",
                                        Thread.currentThread().getName(),
                                        actionDTO.getName(),
                                        actionDTO.getId(),
                                        timeElapsed);

                                return sendExecuteAnalyticsEvent(
                                                actionDTO,
                                                datasourceStorage,
                                                executeActionDTO,
                                                result,
                                                timeElapsed,
                                                finalRawActionConfiguration)
                                        .thenReturn(result);
                            });
                });
    }

    @Override
    public Mono<ActionDTO> getValidActionForExecution(
            ExecuteActionDTO executeActionDTO, ExecuteActionMetaDTO executeActionMetaDTO) {
        AclPermission executePermission = getPermission(executeActionMetaDTO, actionPermission.getExecutePermission());
        return newActionService
                .findActionDTObyIdAndViewMode(
                        executeActionDTO.getActionId(), executeActionDTO.getViewMode(), executePermission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, executeActionDTO.getActionId())))
                .flatMap(action -> {
                    // Now check for erroneous situations which would deter the execution of the action

                    // Error out with in case of an invalid action
                    if (FALSE.equals(action.getIsValid())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_ACTION,
                                action.getName(),
                                ArrayUtils.toString(action.getInvalids().toArray())));
                    }

                    // Error out in case of JS Plugin (this is currently client side execution only)
                    if (action.getPluginType() == PluginType.JS) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                    return Mono.just(action);
                });
    }

    /**
     * This function replaces the variables in the Object with the actual params
     */
    @Override
    public <T> T variableSubstitution(T configuration, Map<String, String> replaceParamsMap) {
        return MustacheHelper.renderFieldValues(configuration, replaceParamsMap);
    }

    /*
     * - Get label for request params.
     * - Transform request params list: [""] to a map: {"label": {"value": ...}}
     * - Rearrange request params in the order as they appear in query editor form.
     */
    private void transformRequestParams(ActionExecutionResult result, Map<String, String> labelMap) {
        Map<String, Object> transformedParams = new LinkedHashMap<>();
        Map<String, RequestParamDTO> requestParamsConfigMap = new HashMap();
        ((List) result.getRequest().getRequestParams())
                .stream()
                        .forEach(param -> requestParamsConfigMap.put(
                                ((RequestParamDTO) param).getConfigProperty(), (RequestParamDTO) param));

        labelMap.entrySet().stream().forEach(e -> {
            String configProperty = e.getKey();
            if (requestParamsConfigMap.containsKey(configProperty)) {
                RequestParamDTO param = requestParamsConfigMap.get(configProperty);
                transformedParams.put(e.getValue(), param);
            }
        });

        result.getRequest().setRequestParams(transformedParams);
    }

    private ActionExecutionResult addDataTypesAndSetSuggestedWidget(ActionExecutionResult result, Boolean viewMode) {

        if (FALSE.equals(viewMode)) {
            result.setSuggestedWidgets(getSuggestedWidgets(result.getBody()));
        }

        /*
         * - Do not process if data types are already present.
         * - It means that data types have been added by specific plugin.
         */

        if (!CollectionUtils.isEmpty(result.getDataTypes())) {
            return result;
        }

        result.setDataTypes(getDisplayDataTypes(result.getBody()));

        return result;
    }

    /**
     * Since we're loading the application and other details from DB *only* for analytics, we check if analytics is
     * active before making the call to DB.
     *
     * @return
     */
    public Boolean isSendExecuteAnalyticsEvent() {
        return analyticsService.isActive();
    }

    private Mono<ActionExecutionRequest> sendExecuteAnalyticsEvent(
            ActionDTO actionDTO,
            DatasourceStorage datasourceStorage,
            ExecuteActionDTO executeActionDto,
            ActionExecutionResult actionExecutionResult,
            Long timeElapsed,
            ActionConfiguration rawActionConfiguration) {

        if (!isSendExecuteAnalyticsEvent()) {
            return Mono.empty();
        }
        ActionExecutionRequest actionExecutionRequest = actionExecutionResult.getRequest();
        ActionExecutionRequest request;
        if (actionExecutionRequest != null) {
            // Do a deep copy of request to not edit
            request = new ActionExecutionRequest(
                    actionExecutionRequest.getActionId(),
                    actionExecutionRequest.getRequestedAt(),
                    actionExecutionRequest.getQuery(),
                    actionExecutionRequest.getBody(),
                    actionExecutionRequest.getHeaders(),
                    actionExecutionRequest.getHttpMethod(),
                    actionExecutionRequest.getUrl(),
                    actionExecutionRequest.getProperties(),
                    actionExecutionRequest.getExecutionParameters(),
                    null);
        } else {
            request = new ActionExecutionRequest();
        }

        if (request.getHeaders() != null) {
            JsonNode headers = objectMapper.convertValue(request.getHeaders(), JsonNode.class);
            try {
                final String headersAsString = objectMapper.writeValueAsString(headers);
                request.setHeaders(headersAsString);
            } catch (JsonProcessingException e) {
                log.error(e.getMessage());
            }
        }

        if (request.getBody() != null) {
            try {
                final String bodyAsString = objectMapper.writeValueAsString(request.getBody());
                request.setBody(bodyAsString);
            } catch (JsonProcessingException e) {
                log.error(e.getMessage());
                request.setBody("\"Error serializing value to JSON.\"");
            }
        }

        if (!CollectionUtils.isEmpty(request.getProperties())) {
            final Map<String, String> stringProperties = new HashMap<>();
            for (final Map.Entry<String, ?> entry : request.getProperties().entrySet()) {
                String jsonValue;
                try {
                    jsonValue = objectMapper.writeValueAsString(entry.getValue());
                } catch (JsonProcessingException e) {
                    jsonValue = "\"Error serializing value to JSON.\"";
                }
                stringProperties.put(entry.getKey(), jsonValue);
            }
            request.setProperties(stringProperties);
        }

        return Mono.justOrEmpty(actionDTO.getApplicationId())
                .flatMap(applicationService::findById)
                .defaultIfEmpty(new Application())
                .flatMap(application -> Mono.zip(
                        Mono.just(application),
                        sessionUserService.getCurrentUser(),
                        newPageService.getNameByPageId(actionDTO.getPageId(), executeActionDto.getViewMode()),
                        pluginService.getByIdWithoutPermissionCheck(actionDTO.getPluginId()),
                        datasourceStorageService.getEnvironmentNameFromEnvironmentIdForAnalytics(
                                datasourceStorage.getEnvironmentId())))
                .flatMap(tuple -> {
                    final Application application = tuple.getT1();
                    final User user = tuple.getT2();
                    final String pageName = tuple.getT3();
                    final Plugin plugin = tuple.getT4();
                    final String environmentName = tuple.getT5();

                    final PluginType pluginType = actionDTO.getPluginType();
                    final String appMode = TRUE.equals(executeActionDto.getViewMode())
                            ? ApplicationMode.PUBLISHED.toString()
                            : ApplicationMode.EDIT.toString();

                    final Map<String, Object> data = new HashMap<>(Map.of(
                            "username",
                            user.getUsername(),
                            "type",
                            pluginType,
                            "pluginName",
                            plugin.getName(),
                            "name",
                            actionDTO.getName(),
                            "datasource",
                            Map.of("name", datasourceStorage.getName()),
                            "workspaceId",
                            application.getWorkspaceId(),
                            "appId",
                            actionDTO.getApplicationId(),
                            FieldName.APP_MODE,
                            appMode,
                            "appName",
                            application.getName(),
                            "isExampleApp",
                            application.isAppIsExample()));

                    String dsCreatedAt = "";
                    if (datasourceStorage.getCreatedAt() != null) {
                        dsCreatedAt = DateUtils.ISO_FORMATTER.format(datasourceStorage.getCreatedAt());
                    }
                    List<Param> paramsList = executeActionDto.getParams();
                    if (paramsList == null) {
                        paramsList = new ArrayList<>();
                    }
                    List<String> executionParams =
                            paramsList.stream().map(param -> param.getValue()).collect(Collectors.toList());

                    data.putAll(Map.of(
                            "request",
                            request,
                            "isSuccessfulExecution",
                            ObjectUtils.defaultIfNull(actionExecutionResult.getIsExecutionSuccess(), false),
                            "statusCode",
                            ObjectUtils.defaultIfNull(actionExecutionResult.getStatusCode(), ""),
                            "timeElapsed",
                            timeElapsed,
                            "actionCreated",
                            DateUtils.ISO_FORMATTER.format(actionDTO.getCreatedAt()),
                            "actionId",
                            ObjectUtils.defaultIfNull(actionDTO.getId(), "")));
                    data.putAll(Map.of(
                            FieldName.ACTION_EXECUTION_REQUEST_PARAMS_SIZE,
                            executeActionDto.getTotalReadableByteCount(),
                            FieldName.ACTION_EXECUTION_REQUEST_PARAMS_COUNT,
                            executionParams.size()));

                    setContextSpecificProperties(data, actionDTO, pageName);

                    ActionExecutionResult.PluginErrorDetails pluginErrorDetails =
                            actionExecutionResult.getPluginErrorDetails();

                    data.putAll(Map.of("pluginErrorDetails", ObjectUtils.defaultIfNull(pluginErrorDetails, "")));

                    if (pluginErrorDetails != null) {
                        data.putAll(Map.of(
                                "appsmithErrorCode", pluginErrorDetails.getAppsmithErrorCode(),
                                "appsmithErrorMessage", pluginErrorDetails.getAppsmithErrorMessage(),
                                "errorType", pluginErrorDetails.getErrorType()));
                    }

                    data.putAll(DatasourceAnalyticsUtils.getAnalyticsPropertiesWithStorageOnActionExecution(
                            datasourceStorage, dsCreatedAt, environmentName));

                    // Add the error message in case of erroneous execution
                    if (FALSE.equals(actionExecutionResult.getIsExecutionSuccess())) {
                        String errorJson;
                        try {
                            errorJson = objectMapper.writeValueAsString(actionExecutionResult.getBody());
                        } catch (JsonProcessingException e) {
                            log.warn("Unable to serialize action execution error result to JSON.", e);
                            errorJson = "\"Failed to serialize error data to JSON.\"";
                        }
                        data.put("error", errorJson);
                    }

                    if (actionExecutionResult.getStatusCode() != null) {
                        data.put("statusCode", actionExecutionResult.getStatusCode());
                    }

                    String executionRequestQuery = "";
                    if (actionExecutionResult.getRequest() != null
                            && actionExecutionResult.getRequest().getQuery() != null) {
                        executionRequestQuery =
                                actionExecutionResult.getRequest().getQuery();
                    }

                    final Map<String, Object> eventData = new HashMap<>(Map.of(
                            FieldName.ACTION, actionDTO,
                            FieldName.DATASOURCE, datasourceStorage,
                            FieldName.APP_MODE, appMode,
                            FieldName.ACTION_EXECUTION_RESULT, actionExecutionResult,
                            FieldName.ACTION_EXECUTION_TIME, timeElapsed,
                            FieldName.ACTION_EXECUTION_QUERY, executionRequestQuery,
                            FieldName.APPLICATION, application,
                            FieldName.PLUGIN, plugin));

                    if (executeActionDto.getTotalReadableByteCount() <= Constraint.MAX_ANALYTICS_SIZE_BYTES) {
                        // Only send params info if total size is less than 5 MB
                        eventData.put(FieldName.ACTION_EXECUTION_REQUEST_PARAMS, executionParams);
                    } else {
                        eventData.put(FieldName.ACTION_EXECUTION_REQUEST_PARAMS, REDACTED_DATA);
                    }
                    if (executeActionDto != null) {
                        // Remove the value from the executeActionDto.params before sending to mixpanel as it contains
                        // user submitted data
                        if (executeActionDto.getParams() != null) {
                            executeActionDto.getParams().forEach(param -> param.setValue(REDACTED_DATA));
                        }
                        data.put(FieldName.ACTION_EXECUTION_REQUEST_PARAMS_VALUE_MAP, executeActionDto.getParams());
                        data.put(
                                FieldName.ACTION_EXECUTION_INVERT_PARAMETER_MAP,
                                executeActionDto.getInvertParameterMap());
                    }
                    data.put(FieldName.ACTION_CONFIGURATION, rawActionConfiguration);
                    data.put(FieldName.EVENT_DATA, eventData);
                    return analyticsService
                            .sendObjectEvent(AnalyticsEvents.EXECUTE_ACTION, actionDTO, data)
                            .thenReturn(request);
                })
                .onErrorResume(error -> {
                    log.warn("Error sending action execution data point", error);
                    return Mono.just(request);
                });
    }

    protected void setContextSpecificProperties(Map<String, Object> data, ActionDTO actionDTO, String contextName) {
        data.putAll(Map.of("pageId", ObjectUtils.defaultIfNull(actionDTO.getPageId(), ""), "pageName", contextName));
    }

    protected Mono<ActionDTO> setAutoGeneratedHeaders(Plugin plugin, ActionDTO actionDTO, HttpHeaders httpHeaders) {
        return Mono.just(actionDTO);
    }
}
