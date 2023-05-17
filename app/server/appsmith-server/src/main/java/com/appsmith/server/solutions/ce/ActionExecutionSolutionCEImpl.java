package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.dtos.ParamProperty;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.Constraint;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DateUtils;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
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
import org.springframework.http.codec.multipart.Part;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuple5;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.CommonFieldName.REDACTED_DATA;
import static com.appsmith.external.constants.spans.ActionSpans.ACTION_EXECUTION_CACHED_ACTION;
import static com.appsmith.external.constants.spans.ActionSpans.ACTION_EXECUTION_CACHED_DATASOURCE;
import static com.appsmith.external.constants.spans.ActionSpans.ACTION_EXECUTION_CACHED_PLUGIN;
import static com.appsmith.external.constants.spans.ActionSpans.ACTION_EXECUTION_DATASOURCE_CONTEXT;
import static com.appsmith.external.constants.spans.ActionSpans.ACTION_EXECUTION_DATASOURCE_CONTEXT_REMOTE;
import static com.appsmith.external.constants.spans.ActionSpans.ACTION_EXECUTION_EDITOR_CONFIG;
import static com.appsmith.external.constants.spans.ActionSpans.ACTION_EXECUTION_REQUEST_PARSING;
import static com.appsmith.external.constants.spans.ActionSpans.ACTION_EXECUTION_SERVER_EXECUTION;
import static com.appsmith.external.constants.spans.ActionSpans.ACTION_EXECUTION_VALIDATE_AUTHENTICATION;
import static com.appsmith.external.helpers.DataTypeStringUtils.getDisplayDataTypes;
import static com.appsmith.server.helpers.WidgetSuggestionHelper.getSuggestedWidgets;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
public class ActionExecutionSolutionCEImpl implements ActionExecutionSolutionCE {

    private final NewActionService newActionService;
    private final ActionPermission actionPermission;
    private final ObservationRegistry observationRegistry;
    private final ObjectMapper objectMapper;
    private final NewActionRepository repository;
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

    static final String PARAM_KEY_REGEX = "^k\\d+$";
    static final String BLOB_KEY_REGEX = "^blob:[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}$";
    static final String EXECUTE_ACTION_DTO = "executeActionDTO";
    static final String PARAMETER_MAP = "parameterMap";
    List<Pattern> patternList = new ArrayList<>();

    public ActionExecutionSolutionCEImpl(NewActionService newActionService,
                                         ActionPermission actionPermission,
                                         ObservationRegistry observationRegistry,
                                         ObjectMapper objectMapper,
                                         NewActionRepository repository,
                                         DatasourceService datasourceService,
                                         PluginService pluginService,
                                         DatasourceContextService datasourceContextService,
                                         PluginExecutorHelper pluginExecutorHelper,
                                         NewPageService newPageService,
                                         ApplicationService applicationService,
                                         SessionUserService sessionUserService,
                                         AuthenticationValidator authenticationValidator,
                                         DatasourcePermission datasourcePermission,
                                         AnalyticsService analyticsService) {
        this.newActionService = newActionService;
        this.actionPermission = actionPermission;
        this.observationRegistry = observationRegistry;
        this.objectMapper = objectMapper;
        this.repository = repository;
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


        this.patternList.add(Pattern.compile(PARAM_KEY_REGEX));
        this.patternList.add(Pattern.compile(BLOB_KEY_REGEX));
        this.patternList.add(Pattern.compile(EXECUTE_ACTION_DTO));
        this.patternList.add(Pattern.compile(PARAMETER_MAP));
    }

    /**
     * Executes the action(queries) by creating executeActionDTO and sending it to the plugin for further execution
     *
     * @param partFlux
     * @param branchName
     * @param environmentName
     * @return Mono of actionExecutionResult if the query succeeds, error messages otherwise
     */
    @Override
    public Mono<ActionExecutionResult> executeAction(Flux<Part> partFlux, String branchName, String environmentName) {
        return createExecuteActionDTO(partFlux)
                .flatMap(executeActionDTO -> newActionService.findByBranchNameAndDefaultActionId(branchName,
                                executeActionDTO.getActionId(),
                                actionPermission.getExecutePermission())
                        .map(branchedAction -> {
                            executeActionDTO.setActionId(branchedAction.getId());
                            return executeActionDTO;
                        }))
                .flatMap(executeActionDTO -> this.executeAction(executeActionDTO, environmentName))
                .name(ACTION_EXECUTION_SERVER_EXECUTION)
                .tap(Micrometer.observation(observationRegistry));
    }

    /**
     * Fetches the required Mono (action, datasource, and plugin) and makes actionExecution call to plugin
     *
     * @param executeActionDTO
     * @param environmentName
     * @return actionExecutionResult if query succeeds, error messages otherwise
     */
    public Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO, String environmentName) {

        // 1. Validate input parameters which are required for mustache replacements
        replaceNullWithQuotesForParamValues(executeActionDTO.getParams());

        String actionId = executeActionDTO.getActionId();
        AtomicReference<String> actionName = new AtomicReference<>();
        actionName.set("");

        // 2. Fetch the action from the DB and check if it can be executed
        Mono<NewAction> actionMono = getCachedActionForActionExecution(actionId);
        Mono<ActionDTO> actionDTOMono = getCachedActionDTOForActionExecution(actionMono, executeActionDTO, actionId);

        // 3. Instantiate the implementation class based on the query type
        Mono<Datasource> datasourceMono = getCachedDatasourceForActionExecution(actionDTOMono, environmentName);
        Mono<Plugin> pluginMono = getCachedPluginForActionExecution(datasourceMono, actionId);
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        // 4. Execute the query
        Mono<ActionExecutionResult> actionExecutionResultMono = getActionExecutionResult(executeActionDTO,
                actionMono,
                actionDTOMono,
                datasourceMono,
                pluginMono,
                pluginExecutorMono,
                actionName,
                actionId,
                environmentName);

        Mono<Map> editorConfigLabelMapMono = getEditorConfigLabelMap(datasourceMono);

        return actionExecutionResultMono
                .zipWith(editorConfigLabelMapMono, (result, labelMap) -> {
                    if (TRUE.equals(executeActionDTO.getViewMode())) {
                        result.setRequest(null);
                    } else if (result.getRequest() != null && result.getRequest().getRequestParams() != null) {
                        transformRequestParams(result, labelMap);
                    }
                    return result;
                })
                .map(result -> addDataTypesAndSetSuggestedWidget(result, executeActionDTO.getViewMode()));
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
    protected Flux<Param> parsePartsAndGetParamsFlux(Flux<Part> partFlux, AtomicLong totalReadableByteCount, ExecuteActionDTO dto) {
        return partFlux
                .groupBy(part -> {
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
                        case PARAM_KEY_REGEX ->
                                groupedPartsFlux.flatMap(part -> this.parseExecuteParameter(part, totalReadableByteCount));
                        case BLOB_KEY_REGEX ->
                                this.parseExecuteBlobs(groupedPartsFlux, dto, totalReadableByteCount).then(Mono.empty());
                        case EXECUTE_ACTION_DTO ->
                                groupedPartsFlux.next().flatMap(part -> this.parseExecuteActionPart(part, dto)).then(Mono.empty());
                        case PARAMETER_MAP ->
                                groupedPartsFlux.next().flatMap(part -> this.parseExecuteParameterMapPart(part, dto)).then(Mono.empty());
                        default ->
                                Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, "Unexpected part found: " + key));
                    };
                });
    }


    protected Mono<Void> parseExecuteActionPart(Part part, ExecuteActionDTO dto) {
        return DataBufferUtils
                .join(part.content())
                .flatMap(executeActionDTOBuffer -> {
                    byte[] byteData = new byte[executeActionDTOBuffer.readableByteCount()];
                    executeActionDTOBuffer.read(byteData);
                    DataBufferUtils.release(executeActionDTOBuffer);
                    try {
                        return Mono.just(objectMapper.readValue(byteData, ExecuteActionDTO.class));
                    } catch (IOException e) {
                        log.error("Error in deserializing ExecuteActionDTO", e);
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, EXECUTE_ACTION_DTO));
                    }
                })
                .flatMap(executeActionDTO -> {
                    dto.setActionId(executeActionDTO.getActionId());
                    dto.setViewMode(executeActionDTO.getViewMode());
                    dto.setParamProperties(executeActionDTO.getParamProperties());
                    dto.setPaginationField(executeActionDTO.getPaginationField());
                    dto.setAnalyticsProperties(executeActionDTO.getAnalyticsProperties());
                    return Mono.empty();
                });
    }

    protected Mono<Void> parseExecuteParameterMapPart(Part part, ExecuteActionDTO dto) {
        return DataBufferUtils
                .join(part.content())
                .flatMap(parameterMapBuffer -> {
                    byte[] byteData = new byte[parameterMapBuffer.readableByteCount()];
                    parameterMapBuffer.read(byteData);
                    DataBufferUtils.release(parameterMapBuffer);
                    try {
                        return Mono.just(objectMapper.readValue(byteData, new TypeReference<Map<String, String>>() {
                        }));
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
        return DataBufferUtils
                .join(part.content())
                .map(dataBuffer -> {
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    totalReadableByteCount.addAndGet(dataBuffer.readableByteCount());
                    dataBuffer.read(bytes);
                    DataBufferUtils.release(dataBuffer);
                    param.setValue(new String(bytes, StandardCharsets.UTF_8));
                    return param;
                });
    }

    protected Mono<Void> parseExecuteBlobs(Flux<Part> partsFlux, ExecuteActionDTO dto, AtomicLong totalReadableByteCount) {
        Map<String, String> blobMap = new HashMap<>();
        dto.setBlobValuesMap(blobMap);

        return partsFlux
                .flatMap(part -> {
                    return DataBufferUtils
                            .join(part.content())
                            .map(dataBuffer -> {
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


    protected Mono<ExecuteActionDTO> enrichExecutionParam(AtomicLong totalReadableByteCount, ExecuteActionDTO dto, List<Param> params) {
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
        params.forEach(
                param -> {
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

                }
        );

        // In case there are parameters that did not receive a value in the multipart request,
        // initialize these bindings with empty strings
        if (dto.getParameterMap() != null) {
            dto.getParameterMap()
                    .keySet()
                    .stream()
                    .forEach(parameter -> {
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
        if (paramProperty.getBlobIdentifiers() != null && !paramProperty.getBlobIdentifiers().isEmpty()) {
            // If it does, trigger the replacement logic for each of these urlPaths
            String replacedValue = this.replaceBlobValuesInParam(
                    param.getValue(),
                    paramProperty.getBlobIdentifiers(),
                    dto.getBlobValuesMap());
            // And then update the value for this param
            param.setValue(replacedValue);
        }
    }

    private void identifyExecutionParamDatatype(Param param, ParamProperty paramProperty) {
        Object datatype = paramProperty.getDatatype();
        if (datatype instanceof String) {
            param.setClientDataType(ClientDataType.valueOf(String.valueOf(datatype).toUpperCase()));
        } else if (datatype instanceof LinkedHashMap) {
            // if the type is an array e.g. "k1": { "array": [ "string", "number", "string", "boolean"]
            LinkedHashMap<String, ArrayList> stringArrayListLinkedHashMap =
                    (LinkedHashMap<String, ArrayList>) datatype;
            Optional<String> firstKeyOpt = stringArrayListLinkedHashMap.keySet()
                    .stream()
                    .findFirst();
            if (firstKeyOpt.isPresent()) {
                String firstKey = firstKeyOpt.get();
                param.setClientDataType(ClientDataType.valueOf(firstKey.toUpperCase()));
                List<String> individualTypes = stringArrayListLinkedHashMap.get(firstKey);
                List<ClientDataType> dataTypesOfArrayElements =
                        individualTypes.stream()
                                .map(it -> ClientDataType.valueOf(String.valueOf(it)
                                        .toUpperCase()))
                                .collect(Collectors.toList());
                param.setDataTypesOfArrayElements(dataTypesOfArrayElements);
            }
        }
    }

    protected String replaceBlobValuesInParam(String value, List<String> blobIdentifiers, Map<String, String> blobValuesMap) {
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
     * Fetches and caches action with permission.
     *
     * @param actionId
     * @return actionMono
     */
    protected Mono<NewAction> getCachedActionForActionExecution(String actionId) {

        return repository.findById(actionId, actionPermission.getExecutePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId)))
                .name(ACTION_EXECUTION_CACHED_ACTION)
                .tap(Micrometer.observation(observationRegistry))
                .cache();
    }

    /**
     * Retrieves and caches validated actionDTO from actionMono.
     *
     * @param actionMono
     * @param executeActionDTO
     * @param actionId
     * @return actionDTOMono
     */
    protected Mono<ActionDTO> getCachedActionDTOForActionExecution(Mono<NewAction> actionMono,
                                                                   ExecuteActionDTO executeActionDTO,
                                                                   String actionId) {
        return actionMono
                .flatMap(action -> getValidActionForExecution(executeActionDTO, actionId, action))
                .cache();
    }

    /**
     * Fetches, validates and caches the datasource from actionDTO
     *
     * @param actionDTOMono
     * @return datasourceMono
     */
    protected Mono<Datasource> getCachedDatasourceForActionExecution(Mono<ActionDTO> actionDTOMono, String environmentName) {

        return actionDTOMono
                .flatMap(actionDTO -> datasourceService.getValidDatasourceFromActionMono(actionDTO,
                        datasourcePermission.getExecutePermission()))
                .flatMap(datasource -> {
                    // For embedded datasource, validate the datasource for each execution
                    if (datasource.getId() == null) {
                        return datasourceService.validateDatasource(datasource);
                    }

                    // The external datasource have already been validated. No need to validate again.
                    return Mono.just(datasource);
                })
                .name(ACTION_EXECUTION_CACHED_DATASOURCE)
                .tap(Micrometer.observation(observationRegistry))
                .cache();
    }

    /**
     * fetches and caches plugin by pluginId after checking datasource for invalids(issues)
     *
     * @param datasourceMono
     * @param actionId
     * @return pluginMono if datasource has no issues and plugin is find, else throws error
     */
    protected Mono<Plugin> getCachedPluginForActionExecution(Mono<Datasource> datasourceMono, String actionId) {
        return datasourceMono
                .flatMap(datasource -> {
                    Set<String> invalids = datasource.getInvalids();
                    if (!CollectionUtils.isEmpty(invalids)) {
                        log.error("Unable to execute actionId: {} because it's datasource is not valid. Cause: {}",
                                actionId, ArrayUtils.toString(invalids));
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_DATASOURCE,
                                datasource.getName(),
                                ArrayUtils.toString(invalids)));
                    }
                    return pluginService.findById(datasource.getPluginId());
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN)))
                .name(ACTION_EXECUTION_CACHED_PLUGIN)
                .tap(Micrometer.observation(observationRegistry))
                .cache();
    }

    /**
     * Fetches and returns editorConfigLabelMap if datasourceId is present
     *
     * @param datasourceMono
     * @return an Empty hashMap if datasource doesn't have id, else configLabelMap from plugin service
     */
    protected Mono<Map> getEditorConfigLabelMap(Mono<Datasource> datasourceMono) {

        return datasourceMono
                .flatMap(datasource -> {
                    if (!StringUtils.hasLength(datasource.getId())) {
                        return Mono.just(new HashMap());
                    }

                    return pluginService.getEditorConfigLabelMap(datasource.getPluginId());
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
     * @param datasource
     * @param plugin
     * @param pluginExecutor
     * @param environmentName
     * @return actionExecutionResultMono
     */
    protected Mono<ActionExecutionResult> verifyDatasourceAndMakeRequest(ExecuteActionDTO executeActionDTO,
                                                                         ActionDTO actionDTO,
                                                                         Datasource datasource,
                                                                         Plugin plugin,
                                                                         PluginExecutor pluginExecutor,
                                                                         String environmentName) {

        DatasourceContextIdentifier dsContextIdentifier = new DatasourceContextIdentifier();

        Mono<ActionExecutionResult> executionMono =
                datasourceService.getEvaluatedDSAndDsContextKeyWithEnvMap(datasource, environmentName)
                        .flatMap(tuple3 -> {
                            Datasource datasource1 = tuple3.getT1();
                            DatasourceContextIdentifier datasourceContextIdentifier = tuple3.getT2();
                            Map<String, BaseDomain> environmentMap = tuple3.getT3();

                            dsContextIdentifier.setDatasourceId(datasourceContextIdentifier.getDatasourceId());
                            dsContextIdentifier.setEnvironmentId(datasourceContextIdentifier.getEnvironmentId());

                            return getValidatedDatasourceForActionExecution(datasource1, datasourceContextIdentifier.getEnvironmentId())
                                    .zipWhen(validatedDatasource -> getDsContextForActionExecution(validatedDatasource,
                                            plugin,
                                            datasourceContextIdentifier,
                                            environmentMap))
                                    .flatMap(tuple2 -> {
                                        Datasource validatedDatasource = tuple2.getT1();
                                        DatasourceContext<?> resourceContext = tuple2.getT2();
                                        // Now that we have the context (connection details), execute the action.

                                        Instant requestedAt = Instant.now();
                                        return ((Mono<ActionExecutionResult>)
                                                pluginExecutor.executeParameterizedWithMetrics(resourceContext.getConnection(),
                                                        executeActionDTO,
                                                        validatedDatasource.getDatasourceConfiguration(),
                                                        actionDTO.getActionConfiguration(),
                                                        observationRegistry))
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
                        });

        return executionMono.onErrorResume(StaleConnectionException.class, error -> {
            log.info("Looks like the connection is stale. Retrying with a fresh context.");
            return deleteDatasourceContextForRetry(dsContextIdentifier).then(executionMono);
        });
    }

    /**
     * This is a composite method for fetching authenticated datasource, datasourceContextIdentifier, and environmentMap
     *
     * @param datasource
     * @param environmentName
     * @return
     */
    protected Mono<Tuple3<Datasource, DatasourceContextIdentifier, Map<String, BaseDomain>>>
    getValidatedDatasourceWithDsContextKeyAndEnvMap(Datasource datasource, String environmentName) {
        // see EE override for complete usage.
        return datasourceService.getEvaluatedDSAndDsContextKeyWithEnvMap(datasource, environmentName)
                .flatMap(tuple3 -> {
                    Datasource datasource1 = tuple3.getT1();
                    DatasourceContextIdentifier datasourceContextIdentifier = tuple3.getT2();
                    Map<String, BaseDomain> environmentMap = tuple3.getT3();

                    return getValidatedDatasourceForActionExecution(datasource1, environmentName)
                            .flatMap(datasource2 -> Mono.zip(Mono.just(datasource2),
                                    Mono.just(datasourceContextIdentifier),
                                    Mono.just(environmentMap))
                            );
                });
    }

    /**
     * Validates the datasource for further execution
     *
     * @param datasource
     * @return
     */
    protected Mono<Datasource> getValidatedDatasourceForActionExecution(Datasource datasource, String environmentId) {
        // the environmentName argument is not consumed over here
        // See EE override for usage of variable
        return authenticationValidator.validateAuthentication(datasource, environmentId)
                .name(ACTION_EXECUTION_VALIDATE_AUTHENTICATION)
                .tap(Micrometer.observation(observationRegistry))
                .cache();
    }

    /**
     * Provides datasource context for execution
     *
     * @param validatedDatasource
     * @param plugin
     * @param datasourceContextIdentifier
     * @param environmentMap
     * @return datasourceContextMono
     */
    protected Mono<DatasourceContext<?>> getDsContextForActionExecution(Datasource validatedDatasource, Plugin plugin,
                                                                        DatasourceContextIdentifier datasourceContextIdentifier,
                                                                        Map<String, BaseDomain> environmentMap) {
        if (plugin.isRemotePlugin()) {
            return datasourceContextService.getRemoteDatasourceContext(plugin, validatedDatasource)
                    .tag("plugin", plugin.getPackageName())
                    .name(ACTION_EXECUTION_DATASOURCE_CONTEXT_REMOTE)
                    .tap(Micrometer.observation(observationRegistry));
        }
        return datasourceContextService.getDatasourceContext(validatedDatasource, datasourceContextIdentifier, environmentMap)
                .tag("plugin", plugin.getPackageName())
                .name(ACTION_EXECUTION_DATASOURCE_CONTEXT)
                .tap(Micrometer.observation(observationRegistry));
    }

    /**
     * Deletes the datasourceContext for the given datasource
     *
     * @param datasourceContextIdentifier
     * @return datasourceContextMono
     */
    protected Mono<DatasourceContext<?>> deleteDatasourceContextForRetry(DatasourceContextIdentifier datasourceContextIdentifier) {
        // the environmentName argument is not consumed over here
        // See EE override for usage of variable
        return datasourceContextService.deleteDatasourceContext(datasourceContextIdentifier);
    }

    protected Mono<ActionExecutionResult> handleExecutionErrors(Mono<ActionExecutionResult> actionExecutionResultMono,
                                                                ActionDTO actionDTO,
                                                                Integer timeoutDuration,
                                                                String actionId) {
        return actionExecutionResultMono
                .onErrorMap(TimeoutException.class, error ->
                        new AppsmithPluginException(AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR,
                                actionDTO.getName(),
                                timeoutDuration))
                .onErrorMap(StaleConnectionException.class, error ->
                        new AppsmithPluginException(AppsmithPluginError.STALE_CONNECTION_ERROR))
                .onErrorResume(e -> {
                    log.debug("{}: In the action execution error mode.",
                            Thread.currentThread().getName(), e);
                    ActionExecutionResult result = new ActionExecutionResult();
                    result.setErrorInfo(e);
                    result.setIsExecutionSuccess(false);
                    final ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
                    actionExecutionRequest.setActionId(actionId);
                    actionExecutionRequest.setRequestedAt(Instant.now());
                    result.setRequest(actionExecutionRequest);
                    return Mono.just(result);
                });

    }

    /**
     * Handles the execution logic, call to pluginExecutor with the payload post retrieval and validation of action, datasource, and plugin
     *
     * @param executeActionDTO
     * @param actionMono
     * @param actionDTOMono
     * @param datasourceMono
     * @param pluginMono
     * @param pluginExecutorMono
     * @param actionName
     * @param actionId
     * @param environmentName
     * @return actionExecutionResultMono
     */
    protected Mono<ActionExecutionResult> getActionExecutionResult(ExecuteActionDTO executeActionDTO,
                                                                   Mono<NewAction> actionMono,
                                                                   Mono<ActionDTO> actionDTOMono,
                                                                   Mono<Datasource> datasourceMono,
                                                                   Mono<Plugin> pluginMono,
                                                                   Mono<PluginExecutor> pluginExecutorMono,
                                                                   AtomicReference<String> actionName,
                                                                   String actionId,
                                                                   String environmentName) {

        Mono<Tuple5<ActionDTO, Datasource, PluginExecutor, Plugin, NewAction>> executeActionPublishersCache =
                Mono.zip(actionDTOMono, datasourceMono, pluginExecutorMono, pluginMono, actionMono).cache();

        return executeActionPublishersCache
                .flatMap(tuple -> {
                    final ActionDTO actionDTO = tuple.getT1();
                    final Datasource datasource = tuple.getT2();
                    final PluginExecutor pluginExecutor = tuple.getT3();
                    final Plugin plugin = tuple.getT4();
                    final NewAction actionFromDb = tuple.getT5();

                    // Set the action name
                    actionName.set(actionDTO.getName());

                    log.debug("[{}]Execute Action called in Page {}, for action id : {}  action name : {}",
                            Thread.currentThread().getName(),
                            actionDTO.getPageId(), actionId, actionDTO.getName());

                    Integer timeoutDuration = actionDTO.getActionConfiguration().getTimeoutInMillisecond();

                    Mono<ActionExecutionResult> actionExecutionResultMono =
                            verifyDatasourceAndMakeRequest(executeActionDTO, actionDTO, datasource,
                                    plugin, pluginExecutor, environmentName)
                                    .timeout(Duration.ofMillis(timeoutDuration));

                    return handleExecutionErrors(actionExecutionResultMono, actionDTO, timeoutDuration, actionId)
                            .elapsed()
                            // Now send the analytics event for this execution
                            .flatMap(tuple1 -> {
                                Long timeElapsed = tuple1.getT1();
                                ActionExecutionResult result = tuple1.getT2();

                                log.debug("{}: Action {} with id {} execution time : {} ms",
                                        Thread.currentThread().getName(),
                                        actionName.get(),
                                        actionId,
                                        timeElapsed
                                );

                                return sendExecuteAnalyticsEvent(actionFromDb, actionDTO, datasource,
                                        executeActionDTO, result, timeElapsed)
                                        .then(Mono.just(result));
                            });
                })
                .onErrorResume(AppsmithException.class, error -> {
                    ActionExecutionResult result = new ActionExecutionResult();
                    result.setIsExecutionSuccess(false);
                    result.setErrorInfo(error);
                    return Mono.just(result);
                });
    }


    @Override
    public Mono<ActionDTO> getValidActionForExecution(ExecuteActionDTO executeActionDTO, String actionId, NewAction newAction) {
        Mono<ActionDTO> actionDTOMono = Mono.just(newAction)
                .flatMap(dbAction -> {
                    ActionDTO action;
                    if (TRUE.equals(executeActionDTO.getViewMode())) {
                        action = dbAction.getPublishedAction();
                        // If the action has not been published, return error
                        if (action == null) {
                            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId));
                        }
                    } else {
                        action = dbAction.getUnpublishedAction();
                    }

                    // Now check for erroneous situations which would deter the execution of the action :

                    // Error out with in case of an invalid action
                    if (FALSE.equals(action.getIsValid())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_ACTION,
                                action.getName(),
                                ArrayUtils.toString(action.getInvalids().toArray())
                        ));
                    }

                    // Error out in case of JS Plugin (this is currently client side execution only)
                    if (dbAction.getPluginType() == PluginType.JS) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                    return Mono.just(action);
                });
        return actionDTOMono;
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
        ((List) result.getRequest().getRequestParams()).stream()
                .forEach(param -> requestParamsConfigMap.put(((RequestParamDTO) param).getConfigProperty(),
                        (RequestParamDTO) param));

        labelMap.entrySet().stream()
                .forEach(e -> {
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
            NewAction action,
            ActionDTO actionDTO,
            Datasource datasource,
            ExecuteActionDTO executeActionDto,
            ActionExecutionResult actionExecutionResult,
            Long timeElapsed
    ) {

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
                    null
            );
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

        return Mono.justOrEmpty(action.getApplicationId())
                .flatMap(applicationService::findById)
                .defaultIfEmpty(new Application())
                .flatMap(application -> Mono.zip(
                        Mono.just(application),
                        sessionUserService.getCurrentUser(),
                        newPageService.getNameByPageId(actionDTO.getPageId(), executeActionDto.getViewMode()),
                        pluginService.getById(action.getPluginId())
                ))
                .flatMap(tuple -> {
                    final Application application = tuple.getT1();
                    final User user = tuple.getT2();
                    final String pageName = tuple.getT3();
                    final Plugin plugin = tuple.getT4();

                    final PluginType pluginType = action.getPluginType();
                    final String appMode = TRUE.equals(executeActionDto.getViewMode()) ? ApplicationMode.PUBLISHED.toString() : ApplicationMode.EDIT.toString();

                    final Map<String, Object> data = new HashMap<>(Map.of(
                            "username", user.getUsername(),
                            "type", pluginType,
                            "pluginName", plugin.getName(),
                            "name", actionDTO.getName(),
                            "datasource", Map.of(
                                    "name", datasource.getName()
                            ),
                            "orgId", application.getWorkspaceId(),
                            "appId", action.getApplicationId(),
                            FieldName.APP_MODE, appMode,
                            "appName", application.getName(),
                            "isExampleApp", application.isAppIsExample()
                    ));

                    String dsCreatedAt = "";
                    if (datasource.getCreatedAt() != null) {
                        dsCreatedAt = DateUtils.ISO_FORMATTER.format(datasource.getCreatedAt());
                    }
                    List<Param> paramsList = executeActionDto.getParams();
                    if (paramsList == null) {
                        paramsList = new ArrayList<>();
                    }
                    List<String> executionParams = paramsList.stream().map(param -> param.getValue()).collect(Collectors.toList());
                    Map<String, Object> analyticsProperties = executeActionDto.getAnalyticsProperties();
                    if (analyticsProperties == null) {
                        analyticsProperties = new HashMap<>();
                    }

                    data.putAll(Map.of(
                            "request", request,
                            "pageId", ObjectUtils.defaultIfNull(actionDTO.getPageId(), ""),
                            "pageName", pageName,
                            "isSuccessfulExecution", ObjectUtils.defaultIfNull(actionExecutionResult.getIsExecutionSuccess(), false),
                            "statusCode", ObjectUtils.defaultIfNull(actionExecutionResult.getStatusCode(), ""),
                            "timeElapsed", timeElapsed,
                            "actionCreated", DateUtils.ISO_FORMATTER.format(action.getCreatedAt()),
                            "actionId", ObjectUtils.defaultIfNull(action.getId(), ""),
                            "isUserInitiated", ObjectUtils.defaultIfNull(analyticsProperties.get("isUserInitiated"), false)
                    ));
                    data.putAll(Map.of(
                            FieldName.ACTION_EXECUTION_REQUEST_PARAMS_SIZE, executeActionDto.getTotalReadableByteCount(),
                            FieldName.ACTION_EXECUTION_REQUEST_PARAMS_COUNT, executionParams.size()
                    ));

                    data.putAll(
                            Map.of(
                                    "pluginErrorDetails", ObjectUtils.defaultIfNull(actionExecutionResult.getPluginErrorDetails(), "")
                            )
                    );
                    data.putAll(Map.of(
                            "dsId", ObjectUtils.defaultIfNull(datasource.getId(), ""),
                            "dsName", datasource.getName(),
                            "dsIsTemplate", ObjectUtils.defaultIfNull(datasource.getIsTemplate(), ""),
                            "dsIsMock", ObjectUtils.defaultIfNull(datasource.getIsMock(), ""),
                            "dsCreatedAt", dsCreatedAt
                    ));

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
                        data.putAll(Map.of(
                                "statusCode", actionExecutionResult.getStatusCode()
                        ));
                    }

                    String executionRequestQuery = "";
                    if (actionExecutionResult != null &&
                            actionExecutionResult.getRequest() != null &&
                            actionExecutionResult.getRequest().getQuery() != null) {
                        executionRequestQuery = actionExecutionResult.getRequest().getQuery();
                    }

                    final Map<String, Object> eventData = new HashMap<>(Map.of(
                            FieldName.ACTION, action,
                            FieldName.DATASOURCE, datasource,
                            FieldName.APP_MODE, appMode,
                            FieldName.ACTION_EXECUTION_RESULT, actionExecutionResult,
                            FieldName.ACTION_EXECUTION_TIME, timeElapsed,
                            FieldName.ACTION_EXECUTION_QUERY, executionRequestQuery,
                            FieldName.APPLICATION, application,
                            FieldName.PLUGIN, plugin
                    ));

                    if (executeActionDto.getTotalReadableByteCount() <= Constraint.MAX_ANALYTICS_SIZE_BYTES) {
                        // Only send params info if total size is less than 5 MB
                        eventData.put(FieldName.ACTION_EXECUTION_REQUEST_PARAMS, executionParams);
                    } else {
                        eventData.put(FieldName.ACTION_EXECUTION_REQUEST_PARAMS, REDACTED_DATA);
                    }
                    data.put(FieldName.EVENT_DATA, eventData);

                    return analyticsService.sendObjectEvent(AnalyticsEvents.EXECUTE_ACTION, action, data)
                            .thenReturn(request);
                })
                .onErrorResume(error -> {
                    log.warn("Error sending action execution data point", error);
                    return Mono.just(request);
                });
    }
}
