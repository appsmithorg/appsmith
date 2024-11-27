package com.appsmith.server.newactions.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DslUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringServiceCE;
import com.appsmith.server.refactors.utils.RefactoringUtils;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.ActionPermission;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.AnalyticsEvents.REFACTOR_ACTION;
import static com.appsmith.server.helpers.ContextTypeUtils.getDefaultContextIfNull;

@Slf4j
@RequiredArgsConstructor
public class NewActionRefactoringServiceCEImpl implements EntityRefactoringServiceCE<NewAction> {

    protected final NewActionService newActionService;
    private final ActionPermission actionPermission;
    private final AstService astService;
    private final InstanceConfig instanceConfig;
    private final ObjectMapper objectMapper;

    @Override
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return REFACTOR_ACTION;
    }

    @Override
    public void sanitizeRefactorEntityDTO(RefactorEntityNameDTO refactorEntityNameDTO) {
        RefactoringUtils.updateFQNUsingCollectionName(refactorEntityNameDTO);
    }

    @Override
    public Mono<Void> refactorReferencesInExistingEntities(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        Set<String> updatableCollectionIds = refactoringMetaDTO.getUpdatableCollectionIds();
        Mono<Integer> evalVersionMono = refactoringMetaDTO.getEvalVersionMono();
        Set<String> updatedBindingPaths = refactoringMetaDTO.getUpdatedBindingPaths();
        Pattern oldNamePattern = refactoringMetaDTO.getOldNamePattern();

        String contextId = extractContextId(refactorEntityNameDTO);
        CreatorContextType contextType = getDefaultContextIfNull(refactorEntityNameDTO.getContextType());
        String oldName = refactorEntityNameDTO.getOldFullyQualifiedName();
        String newName = refactorEntityNameDTO.getNewFullyQualifiedName();
        return getActionsByContextId(contextId, contextType)
                .flatMap(newAction -> Mono.just(newAction).zipWith(evalVersionMono))
                /*
                 * Assuming that the datasource should not be dependent on the widget and hence not going through the same
                 * to look for replacement pattern.
                 */
                .flatMap(tuple -> {
                    final NewAction newAction = tuple.getT1();
                    final Integer evalVersion = tuple.getT2();
                    // We need actionDTO to be populated with pluginType from NewAction
                    // so that we can check for the JS path
                    ActionDTO action = newActionService.generateActionByViewMode(newAction, false);

                    if (action.getActionConfiguration() == null) {
                        return Mono.just(newAction);
                    }
                    // If this is a JS function rename, add this collection for rename
                    // because the action configuration won't tell us this
                    if (StringUtils.hasLength(action.getCollectionId()) && newName.equals(action.getValidName())) {
                        updatableCollectionIds.add(action.getCollectionId());
                    }
                    newAction.setUnpublishedAction(action);
                    return this.refactorNameInAction(action, oldName, newName, evalVersion, oldNamePattern)
                            .flatMap(updates -> {
                                if (updates.isEmpty()) {
                                    return Mono.just(newAction);
                                }
                                updatedBindingPaths.addAll(updates);
                                if (StringUtils.hasLength(action.getCollectionId())) {
                                    updatableCollectionIds.add(action.getCollectionId());
                                }

                                return newActionService
                                        .extractAndSetJsonPathKeys(newAction)
                                        .then(newActionService.save(newAction));
                            });
                })
                .map(savedAction -> savedAction.getUnpublishedAction().getName())
                .collectList()
                .doOnNext(updatedActionNames -> log.debug(
                        "Actions updated due to refactor name in {} {} are : {}",
                        contextType.toString().toLowerCase(),
                        contextId,
                        updatedActionNames))
                .then();
    }

    protected String extractContextId(RefactorEntityNameDTO refactorEntityNameDTO) {
        return refactorEntityNameDTO.getPageId();
    }

    protected Flux<NewAction> getActionsByContextId(String contextId, CreatorContextType contextType) {
        return newActionService.findAllActionsByContextIdAndContextTypeAndViewMode(
                contextId, contextType, actionPermission.getEditPermission(), false, true);
    }

    @Override
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO) {
        return newActionService
                .findById(refactorEntityNameDTO.getActionId(), actionPermission.getEditPermission())
                .map(branchedAction -> newActionService.generateActionByViewMode(branchedAction, false))
                .flatMap(action -> {
                    action.setName(refactorEntityNameDTO.getNewName());
                    if (StringUtils.hasLength(refactorEntityNameDTO.getCollectionName())) {
                        action.setFullyQualifiedName(refactorEntityNameDTO.getNewFullyQualifiedName());
                    }
                    if (!PluginType.JS.equals(action.getPluginType())) {
                        action.setFullyQualifiedName(action.getName());
                    }
                    return newActionService.updateUnpublishedAction(action.getId(), action);
                })
                .then();
    }

    @Override
    public Flux<String> getExistingEntityNames(
            String contextId, CreatorContextType contextType, String layoutId, boolean viewMode) {
        return this.getExistingEntities(contextId, contextType, layoutId, viewMode)
                .map(ActionDTO::getValidName);
    }

    protected Flux<ActionDTO> getExistingEntities(
            String contextId, CreatorContextType contextType, String layoutId, boolean viewMode) {

        if (viewMode) {
            // TODO: Handle this scenario based on use case
            return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        }
        return newActionService.getUnpublishedActionsByPageId(contextId, null).flatMap(actionDTO -> {
            /*
               This is unexpected. Every action inside a JS collection should have a collectionId.
               But there are a few documents found for plugin type JS inside newAction collection that don't have any collectionId.
               The reason could be due to the lack of transactional behaviour when multiple inserts/updates that take place
               during JS action creation. A detailed RCA is documented here
               https://www.notion.so/appsmith/RCA-JSObject-name-already-exists-Please-use-a-different-name-e09c407f0ddb4653bd3974f3703408e6
            */
            if (actionDTO.getPluginType().equals(PluginType.JS)
                    && !StringUtils.hasLength(actionDTO.getCollectionId())) {
                log.debug(
                        "JS Action with Id: {} doesn't have any collection Id under pageId: {}",
                        actionDTO.getId(),
                        contextId);
                return Mono.empty();
            } else {
                return Mono.just(actionDTO);
            }
        });
    }

    protected Mono<Set<String>> refactorNameInAction(
            ActionDTO actionDTO, String oldName, String newName, int evalVersion, Pattern oldNamePattern) {
        // If we're going the fallback route (without AST), we can first filter actions to be refactored
        // By performing a check on whether json path keys had a reference
        // This is not needed in the AST way since it would be costlier to make double the number of API calls
        if (Boolean.FALSE.equals(this.instanceConfig.getIsRtsAccessible())) {
            Set<String> jsonPathKeys = actionDTO.getJsonPathKeys();

            boolean isReferenceFound = false;
            if (jsonPathKeys != null && !jsonPathKeys.isEmpty()) {
                // Since json path keys actually contain the entire inline js function instead of just the widget/action
                // name, we can not simply use the set.contains(obj) function. We need to iterate over all the keys
                // in the set and see if the old name is a substring of the json path key.
                for (String key : jsonPathKeys) {
                    if (oldNamePattern.matcher(key).find()) {
                        isReferenceFound = true;
                        break;
                    }
                }
            }
            // If no reference was found, return with an empty set
            if (Boolean.FALSE.equals(isReferenceFound)) {
                return Mono.just(new HashSet<>());
            }
        }

        ActionConfiguration actionConfiguration = actionDTO.getActionConfiguration();
        final JsonNode actionConfigurationNode = objectMapper.convertValue(actionConfiguration, JsonNode.class);

        Mono<Set<String>> refactorDynamicBindingsMono = Mono.just(new HashSet<>());

        // If there are dynamic bindings in this action configuration, inspect them
        if (actionDTO.getDynamicBindingPathList() != null
                && !actionDTO.getDynamicBindingPathList().isEmpty()) {
            // recurse over each child
            refactorDynamicBindingsMono = Flux.fromIterable(actionDTO.getDynamicBindingPathList())
                    .flatMap(dynamicBindingPath -> {
                        String key = dynamicBindingPath.getKey();
                        Set<MustacheBindingToken> mustacheValues = new HashSet<>();
                        if (PluginType.JS.equals(actionDTO.getPluginType()) && "body".equals(key)) {
                            mustacheValues.add(new MustacheBindingToken(actionConfiguration.getBody(), 0, false));

                        } else {
                            mustacheValues = DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(
                                    actionConfigurationNode, key);
                        }
                        return astService
                                .replaceValueInMustacheKeys(
                                        mustacheValues, oldName, newName, evalVersion, oldNamePattern)
                                .flatMap(replacementMap -> {
                                    if (replacementMap.isEmpty()) {
                                        return Mono.empty();
                                    }
                                    DslUtils.replaceValuesInSpecificDynamicBindingPath(
                                            actionConfigurationNode, key, replacementMap);
                                    String entityPath = StringUtils.hasLength(actionDTO.getValidName())
                                            ? actionDTO.getValidName() + "."
                                            : "";
                                    return Mono.just(entityPath + key);
                                });
                    })
                    .collect(Collectors.toSet())
                    .map(entityPaths -> {
                        actionDTO.setActionConfiguration(
                                objectMapper.convertValue(actionConfigurationNode, ActionConfiguration.class));
                        return entityPaths;
                    });
        }

        return refactorDynamicBindingsMono;
    }
}
