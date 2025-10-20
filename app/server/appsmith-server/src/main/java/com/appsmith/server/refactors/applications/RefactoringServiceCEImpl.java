package com.appsmith.server.refactors.applications;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.ContextLayoutRefactoringService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.refactors.resolver.ContextLayoutRefactorResolver;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.validations.EntityValidationService;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.spans.RefactorSpan.GET_ALL_EXISTING_ENTITIES;
import static com.appsmith.external.constants.spans.RefactorSpan.IS_NAME_ALLOWED;
import static com.appsmith.external.constants.spans.RefactorSpan.PREPARE_ANALYTICS;
import static com.appsmith.external.constants.spans.RefactorSpan.REFACTOR_ALL_REFERENCES;
import static com.appsmith.external.constants.spans.RefactorSpan.REFACTOR_ENTITY_NAME;
import static com.appsmith.external.constants.spans.RefactorSpan.REFACTOR_NAME;
import static com.appsmith.external.constants.spans.RefactorSpan.SEND_REFACTOR_ANALYTICS;
import static com.appsmith.external.constants.spans.RefactorSpan.UNESCAPE_MONGO_CHARS;
import static com.appsmith.external.constants.spans.RefactorSpan.UPDATE_LAYOUT;
import static com.appsmith.external.constants.spans.RefactorSpan.VALIDATE_ENTITY_NAME;
import static com.appsmith.external.constants.spans.RefactorSpan.VALIDATE_NAME;
import static com.appsmith.server.helpers.ContextTypeUtils.getDefaultContextIfNull;

@Slf4j
@RequiredArgsConstructor
public class RefactoringServiceCEImpl implements RefactoringServiceCE {
    private final NewPageService newPageService;
    private final UpdateLayoutService updateLayoutService;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;
    private final EntityValidationService entityValidationService;
    protected final ObservationRegistry observationRegistry;

    protected final EntityRefactoringService<Void> jsActionEntityRefactoringService;
    protected final EntityRefactoringService<NewAction> newActionEntityRefactoringService;
    protected final EntityRefactoringService<ActionCollection> actionCollectionEntityRefactoringService;
    protected final EntityRefactoringService<Layout> widgetEntityRefactoringService;
    protected final ContextLayoutRefactorResolver contextLayoutRefactorResolver;

    /*
     * To replace fetchUsers in `{{JSON.stringify(fetchUsers)}}` with getUsers, the following regex is required :
     * `\\b(fetchUsers)\\b`. To achieve this the following strings preWord and postWord are declared here to be used
     * at run time to create the regex pattern.
     */
    private static final String preWord = "\\b(";
    private static final String postWord = ")\\b";

    /**
     * This method is responsible for the core logic of refactoring a valid name inside an Appsmith page.
     * This includes refactoring inside the DSL, in actions, and JS Objects.
     * Assumption here is that the refactoring name provided is indeed unique and is fit to be replaced everywhere.
     * <p>
     * At this point, the user must have MANAGE_PAGES and MANAGE_ACTIONS permissions for page and action respectively
     *
     * @return : The DSL after refactor updates
     */
    Mono<Tuple2<LayoutDTO, Set<String>>> refactorName(RefactorEntityNameDTO refactorEntityNameDTO) {
        String contextId = getBranchedContextId(refactorEntityNameDTO);
        String layoutId = refactorEntityNameDTO.getLayoutId();
        String oldName = refactorEntityNameDTO.getOldFullyQualifiedName();
        String newName = refactorEntityNameDTO.getNewFullyQualifiedName();
        EntityType entityType = refactorEntityNameDTO.getEntityType();

        log.debug(
                "Starting refactorName for entity type: {}, oldName: {}, newName: {}, contextId: {}, layoutId: {}",
                entityType,
                oldName,
                newName,
                contextId,
                layoutId);

        Pattern oldNamePattern = getReplacementPattern(oldName);

        RefactoringMetaDTO refactoringMetaDTO = new RefactoringMetaDTO();

        refactoringMetaDTO.setOldNamePattern(oldNamePattern);

        refactoringMetaDTO.setEvalVersionMono(contextLayoutRefactorResolver
                .getContextLayoutRefactorHelper(refactorEntityNameDTO.getContextType())
                .getEvaluationVersionMono(contextId, refactorEntityNameDTO, refactoringMetaDTO));

        Mono<Void> refactoredReferencesMono = refactorAllReferences(refactorEntityNameDTO, refactoringMetaDTO)
                .name(REFACTOR_ALL_REFERENCES)
                .tap(Micrometer.observation(observationRegistry));

        return refactoredReferencesMono
                .then(Mono.defer(() -> {
                    Set<String> updatedBindingPaths = refactoringMetaDTO.getUpdatedBindingPaths();
                    log.debug(
                            "Refactored references for entity: {} -> {}. Updated {} binding paths",
                            oldName,
                            newName,
                            updatedBindingPaths.size());

                    ContextLayoutRefactoringService<?, ?> contextLayoutRefactorHelper =
                            contextLayoutRefactorResolver.getContextLayoutRefactorHelper(
                                    refactorEntityNameDTO.getContextType());
                    List<Layout> layouts = contextLayoutRefactorHelper.getLayouts(refactoringMetaDTO);
                    if (layouts != null) {
                        for (Layout layout : layouts) {
                            if (layoutId.equals(layout.getId())) {
                                Mono<JSONObject> unescapeMono = Mono.fromCallable(
                                                () -> updateLayoutService.unescapeMongoSpecialCharacters(layout))
                                        .name(UNESCAPE_MONGO_CHARS)
                                        .tap(Micrometer.observation(observationRegistry));

                                String artifactId = contextLayoutRefactorHelper.getArtifactId(refactoringMetaDTO);
                                return unescapeMono
                                        .flatMap(unescapedDsl -> {
                                            layout.setDsl(unescapedDsl);
                                            return updateLayoutService
                                                    .updateLayout(
                                                            contextId,
                                                            artifactId,
                                                            layout.getId(),
                                                            layout,
                                                            refactorEntityNameDTO.getContextType())
                                                    .name(UPDATE_LAYOUT)
                                                    .tap(Micrometer.observation(observationRegistry));
                                        })
                                        .doOnSuccess(layoutDTO -> log.debug(
                                                "Successfully updated layout for entity refactor: {} -> {}",
                                                oldName,
                                                newName))
                                        .map(layoutDTO -> Tuples.of(layoutDTO, updatedBindingPaths));
                            }
                        }
                    }
                    log.debug("No layout found to update for entity refactor: {} -> {}", oldName, newName);
                    // Return empty Layout when there is no layout
                    return Mono.just(Tuples.of(new LayoutDTO(), Set.<String>of()));
                }))
                .name(REFACTOR_NAME)
                .tap(Micrometer.observation(observationRegistry));
    }

    protected static Pattern getReplacementPattern(String oldName) {
        String regexPattern = preWord + oldName + postWord;
        return Pattern.compile(regexPattern);
    }

    protected Mono<Void> refactorAllReferences(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        Mono<Void> widgetsMono = widgetEntityRefactoringService.refactorReferencesInExistingEntities(
                refactorEntityNameDTO, refactoringMetaDTO);
        Mono<Void> actionsMono = newActionEntityRefactoringService.refactorReferencesInExistingEntities(
                refactorEntityNameDTO, refactoringMetaDTO);

        Mono<Void> collectionsMono = actionCollectionEntityRefactoringService.refactorReferencesInExistingEntities(
                refactorEntityNameDTO, refactoringMetaDTO);

        Mono<Void> actionsAndCollectionsMono = actionsMono.then(Mono.defer(() -> collectionsMono));

        return widgetsMono.then(actionsAndCollectionsMono);
    }

    @Override
    public Mono<LayoutDTO> refactorEntityName(RefactorEntityNameDTO refactorEntityNameDTO) {
        log.info(
                "Starting entity refactoring: entityType={}, oldName={}, newName={}",
                refactorEntityNameDTO.getEntityType(),
                refactorEntityNameDTO.getOldFullyQualifiedName(),
                refactorEntityNameDTO.getNewFullyQualifiedName());

        EntityRefactoringService<?> service = getEntityRefactoringService(refactorEntityNameDTO);

        // Sanitize refactor request wrt the type of entity being refactored
        service.sanitizeRefactorEntityDTO(refactorEntityNameDTO);

        // Validate whether this name is allowed based on the type of entity
        Mono<Boolean> isValidNameMono;
        if (EntityType.WIDGET.equals(refactorEntityNameDTO.getEntityType())) {
            isValidNameMono = Mono.just(Boolean.TRUE);
        } else {
            isValidNameMono = Mono.just(entityValidationService.validateName(
                            refactorEntityNameDTO.getNewName(), refactorEntityNameDTO.getIsInternal()))
                    .flatMap(isValid -> {
                        if (!isValid) {
                            return Mono.error(new AppsmithException(AppsmithError.INVALID_ACTION_NAME));
                        }
                        return Mono.just(true);
                    })
                    .name(VALIDATE_NAME)
                    .tap(Micrometer.observation(observationRegistry));
        }

        // Make sure to retrieve correct page id for branched page
        String contextId = getBranchedContextId(refactorEntityNameDTO);

        final Map<String, String> analyticsProperties = new HashMap<>();

        return isValidNameMono
                .then(validateAndPrepareAnalyticsForRefactor(refactorEntityNameDTO, contextId, analyticsProperties)
                        .name(VALIDATE_ENTITY_NAME)
                        .tap(Micrometer.observation(observationRegistry)))
                .flatMap(updatedAnalyticsProperties -> {
                    return refactorWithoutContext(refactorEntityNameDTO, service, updatedAnalyticsProperties);
                })
                .doOnSuccess(layoutDTO -> log.info(
                        "Successfully refactored entity: {} -> {}",
                        refactorEntityNameDTO.getOldFullyQualifiedName(),
                        refactorEntityNameDTO.getNewFullyQualifiedName()))
                .doOnError(error -> log.error(
                        "Failed to refactor entity: {} -> {}. Error: {}",
                        refactorEntityNameDTO.getOldFullyQualifiedName(),
                        refactorEntityNameDTO.getNewFullyQualifiedName(),
                        error.getMessage()))
                .name(REFACTOR_ENTITY_NAME)
                .tap(Micrometer.observation(observationRegistry));
    }

    protected Mono<Map<String, String>> validateAndPrepareAnalyticsForRefactor(
            RefactorEntityNameDTO refactorEntityNameDTO,
            String branchedContextId,
            Map<String, String> analyticsProperties) {
        return validateEntityName(refactorEntityNameDTO, branchedContextId)
                .then(prepareAnalyticsProperties(refactorEntityNameDTO, branchedContextId, analyticsProperties));
    }

    protected Mono<Map<String, String>> prepareAnalyticsProperties(
            RefactorEntityNameDTO refactorEntityNameDTO,
            String branchedContextId,
            Map<String, String> analyticsProperties) {
        refactorEntityNameDTO.setPageId(branchedContextId);
        return newPageService
                .getByIdWithoutPermissionCheck(branchedContextId)
                .map(page -> {
                    analyticsProperties.put(FieldName.APPLICATION_ID, page.getApplicationId());
                    analyticsProperties.put(FieldName.PAGE_ID, refactorEntityNameDTO.getPageId());
                    return analyticsProperties;
                })
                .name(PREPARE_ANALYTICS)
                .tap(Micrometer.observation(observationRegistry));
    }

    protected Mono<Void> validateEntityName(RefactorEntityNameDTO refactorEntityNameDTO, String contextId) {
        return isNameAllowed(
                        contextId,
                        getDefaultContextIfNull(refactorEntityNameDTO.getContextType()),
                        refactorEntityNameDTO.getLayoutId(),
                        refactorEntityNameDTO.getNewFullyQualifiedName())
                .flatMap(valid -> {
                    if (!valid) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.NAME_CLASH_NOT_ALLOWED_IN_REFACTOR,
                                refactorEntityNameDTO.getOldFullyQualifiedName(),
                                refactorEntityNameDTO.getNewFullyQualifiedName()));
                    }
                    return Mono.empty();
                });
    }

    protected Mono<LayoutDTO> refactorWithoutContext(
            RefactorEntityNameDTO refactorEntityNameDTO,
            EntityRefactoringService<?> service,
            Map<String, String> analyticsProperties) {
        return service.updateRefactoredEntity(refactorEntityNameDTO)
                .then(Mono.defer(() -> this.refactorName(refactorEntityNameDTO)))
                .flatMap(tuple2 -> {
                    AnalyticsEvents event = service.getRefactorAnalyticsEvent(refactorEntityNameDTO.getEntityType());
                    return this.sendRefactorAnalytics(event, analyticsProperties, tuple2.getT2())
                            .thenReturn(tuple2.getT1());
                });
    }

    protected EntityRefactoringService<?> getEntityRefactoringService(RefactorEntityNameDTO refactorEntityNameDTO) {
        return switch (refactorEntityNameDTO.getEntityType()) {
            case WIDGET -> widgetEntityRefactoringService;
            case JS_ACTION -> jsActionEntityRefactoringService;
            case ACTION -> newActionEntityRefactoringService;
            case JS_OBJECT -> actionCollectionEntityRefactoringService;
            default -> null;
        };
    }

    protected String getBranchedContextId(RefactorEntityNameDTO refactorEntityNameDTO) {
        return refactorEntityNameDTO.getPageId();
    }

    private Mono<Void> sendRefactorAnalytics(
            AnalyticsEvents event, Map<String, String> properties, Set<String> updatedPaths) {

        return sessionUserService
                .getCurrentUser()
                .map(user -> {
                    final Map<String, String> analyticsProperties = new HashMap<>(properties);
                    analyticsProperties.put("updatedPaths", updatedPaths.toString());
                    analyticsProperties.put("userId", user.getUsername());
                    analyticsService.sendEvent(event.getEventName(), user.getUsername(), analyticsProperties);
                    log.debug(
                            "Sent refactor analytics event: {}, updatedPathsCount: {}",
                            event.getEventName(),
                            updatedPaths.size());
                    return true;
                })
                .then()
                .name(SEND_REFACTOR_ANALYTICS)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Mono<Boolean> isNameAllowed(
            String contextId, CreatorContextType contextType, String layoutId, String newName) {

        boolean isFQN = newName.contains(".");
        log.debug("Checking if name is allowed: {}, isFQN: {}, contextId: {}", newName, isFQN, contextId);

        return getAllExistingEntitiesMono(contextId, contextType, layoutId, isFQN)
                .map(existingNames -> {
                    boolean isAllowed = !existingNames.contains(newName);
                    log.debug(
                            "Name '{}' is {} (total existing entities: {})",
                            newName,
                            isAllowed ? "allowed" : "NOT allowed",
                            existingNames.size());
                    return isAllowed;
                })
                .name(IS_NAME_ALLOWED)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Mono<Set<String>> getAllExistingEntitiesMono(
            String contextId, CreatorContextType contextType, String layoutId, boolean isFQN) {
        log.debug(
                "Getting all existing entities for contextId: {}, contextType: {}, isFQN: {}",
                contextId,
                contextType,
                isFQN);
        Iterable<Flux<String>> existingEntityNamesFlux =
                getExistingEntityNamesFlux(contextId, layoutId, isFQN, contextType);

        return Flux.merge(existingEntityNamesFlux)
                .collect(Collectors.toSet())
                .doOnSuccess(entityNames ->
                        log.debug("Found {} existing entities for contextId: {}", entityNames.size(), contextId))
                .name(GET_ALL_EXISTING_ENTITIES)
                .tap(Micrometer.observation(observationRegistry));
    }

    protected Iterable<Flux<String>> getExistingEntityNamesFlux(
            String contextId, String layoutId, boolean isFQN, CreatorContextType contextType) {
        Flux<String> existingActionNamesFlux =
                newActionEntityRefactoringService.getExistingEntityNames(contextId, contextType, layoutId, false);

        /*
         * TODO : Execute this check directly on the DB server. We can query array of arrays by:
         * https://stackoverflow.com/questions/12629692/querying-an-array-of-arrays-in-mongodb
         */
        Flux<String> existingWidgetNamesFlux = Flux.empty();
        Flux<String> existingActionCollectionNamesFlux = Flux.empty();

        // Widget and collection names cannot collide with FQNs because of the dot operator
        // Hence we can avoid unnecessary DB calls
        if (!isFQN) {
            existingWidgetNamesFlux =
                    widgetEntityRefactoringService.getExistingEntityNames(contextId, contextType, layoutId, false);

            existingActionCollectionNamesFlux = actionCollectionEntityRefactoringService.getExistingEntityNames(
                    contextId, contextType, layoutId, false);
        }

        ArrayList<Flux<String>> list = new ArrayList<>();

        list.add(existingActionNamesFlux);
        list.add(existingWidgetNamesFlux);
        list.add(existingActionCollectionNamesFlux);

        return list;
    }
}
