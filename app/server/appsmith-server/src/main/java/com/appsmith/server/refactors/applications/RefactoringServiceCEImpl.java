package com.appsmith.server.refactors.applications;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.validations.EntityValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

import static com.appsmith.server.constants.CommonConstants.EVALUATION_VERSION;
import static com.appsmith.server.helpers.ContextTypeUtils.getDefaultContextIfNull;

@Slf4j
@RequiredArgsConstructor
public class RefactoringServiceCEImpl implements RefactoringServiceCE {
    private final NewPageService newPageService;
    private final UpdateLayoutService updateLayoutService;
    private final ApplicationService applicationService;
    private final PagePermission pagePermission;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;
    private final EntityValidationService entityValidationService;

    protected final EntityRefactoringService<Void> jsActionEntityRefactoringService;
    protected final EntityRefactoringService<NewAction> newActionEntityRefactoringService;
    protected final EntityRefactoringService<ActionCollection> actionCollectionEntityRefactoringService;
    protected final EntityRefactoringService<Layout> widgetEntityRefactoringService;

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
        String pageId = refactorEntityNameDTO.getPageId();
        String layoutId = refactorEntityNameDTO.getLayoutId();
        String oldName = refactorEntityNameDTO.getOldFullyQualifiedName();

        Pattern oldNamePattern = getReplacementPattern(oldName);

        RefactoringMetaDTO refactoringMetaDTO = new RefactoringMetaDTO();

        refactoringMetaDTO.setOldNamePattern(oldNamePattern);

        refactoringMetaDTO.setEvalVersionMono(
                getContextBasedEvalVersionMono(pageId, refactorEntityNameDTO, refactoringMetaDTO));

        Mono<Void> refactoredReferencesMono = refactorAllReferences(refactorEntityNameDTO, refactoringMetaDTO);

        return refactoredReferencesMono.then(Mono.defer(() -> {
            PageDTO page = refactoringMetaDTO.getUpdatedPage();
            Set<String> updatedBindingPaths = refactoringMetaDTO.getUpdatedBindingPaths();
            if (page != null) {
                List<Layout> layouts = page.getLayouts();
                for (Layout layout : layouts) {
                    if (layoutId.equals(layout.getId())) {
                        layout.setDsl(updateLayoutService.unescapeMongoSpecialCharacters(layout));
                        return updateLayoutService
                                .updateLayout(page.getId(), page.getApplicationId(), layout.getId(), layout)
                                .zipWith(Mono.just(updatedBindingPaths));
                    }
                }
            }
            // Return empty Layout when there is no layout
            return Mono.just(Tuples.of(new LayoutDTO(), Set.of()));
        }));
    }

    protected Mono<Integer> getContextBasedEvalVersionMono(
            String contextId, RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        Mono<PageDTO> pageMono = newPageService
                // fetch the unpublished page
                .findPageById(contextId, pagePermission.getEditPermission(), false)
                .cache();

        refactoringMetaDTO.setPageDTOMono(pageMono);
        Mono<Integer> evalVersionMono = pageMono.flatMap(page -> {
                    return applicationService.findById(page.getApplicationId()).map(application -> {
                        Integer evaluationVersion = application.getEvaluationVersion();
                        if (evaluationVersion == null) {
                            evaluationVersion = EVALUATION_VERSION;
                        }
                        return evaluationVersion;
                    });
                })
                .cache();
        return evalVersionMono;
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
                    });
        }

        // Make sure to retrieve correct page id for branched page
        String contextId = getBranchedContextId(refactorEntityNameDTO);

        final Map<String, String> analyticsProperties = new HashMap<>();

        return isValidNameMono
                .then(validateAndPrepareAnalyticsForRefactor(refactorEntityNameDTO, contextId, analyticsProperties))
                .flatMap(updatedAnalyticsProperties -> {
                    return refactorWithoutContext(refactorEntityNameDTO, service, updatedAnalyticsProperties);
                });
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
        return newPageService.getByIdWithoutPermissionCheck(branchedContextId).map(page -> {
            analyticsProperties.put(FieldName.APPLICATION_ID, page.getApplicationId());
            analyticsProperties.put(FieldName.PAGE_ID, refactorEntityNameDTO.getPageId());
            return analyticsProperties;
        });
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
                    return true;
                })
                .then();
    }

    @Override
    public Mono<Boolean> isNameAllowed(
            String contextId, CreatorContextType contextType, String layoutId, String newName) {

        boolean isFQN = newName.contains(".");

        return getAllExistingEntitiesMono(contextId, contextType, layoutId, isFQN)
                .map(existingNames -> !existingNames.contains(newName));
    }

    @Override
    public Mono<Set<String>> getAllExistingEntitiesMono(
            String contextId, CreatorContextType contextType, String layoutId, boolean isFQN) {
        Iterable<Flux<String>> existingEntityNamesFlux =
                getExistingEntityNamesFlux(contextId, layoutId, isFQN, contextType);

        return Flux.merge(existingEntityNamesFlux).collect(Collectors.toSet());
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
