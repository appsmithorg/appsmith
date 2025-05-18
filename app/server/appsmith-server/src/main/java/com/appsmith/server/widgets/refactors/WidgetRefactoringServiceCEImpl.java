package com.appsmith.server.widgets.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.ce.LayoutContainer;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.refactors.ContextLayoutRefactoringService;
import com.appsmith.server.refactors.entities.EntityRefactoringServiceCE;
import com.appsmith.server.refactors.resolver.ContextLayoutRefactorResolver;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import static com.appsmith.external.constants.AnalyticsEvents.REFACTOR_WIDGET;
import static com.appsmith.server.helpers.ContextTypeUtils.isModuleContext;
import static com.appsmith.server.helpers.ContextTypeUtils.isPageContext;

@Slf4j
@RequiredArgsConstructor
public class WidgetRefactoringServiceCEImpl implements EntityRefactoringServiceCE<Layout> {
    protected final ObjectMapper objectMapper;
    protected final WidgetRefactorUtil widgetRefactorUtil;
    private final ContextLayoutRefactorResolver contextLayoutRefactorResolver;

    @Override
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return REFACTOR_WIDGET;
    }

    @Override
    public Mono<Void> refactorReferencesInExistingEntities(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        if (!isPageContext(refactorEntityNameDTO.getContextType())
                && !isModuleContext(refactorEntityNameDTO.getContextType())) {
            return Mono.empty().then();
        }

        CreatorContextType contextType = refactorEntityNameDTO.getContextType();
        String layoutId = refactorEntityNameDTO.getLayoutId();
        String oldName = refactorEntityNameDTO.getOldFullyQualifiedName();
        String newName = refactorEntityNameDTO.getNewFullyQualifiedName();

        Set<String> updatedBindingPaths = refactoringMetaDTO.getUpdatedBindingPaths();
        Pattern oldNamePattern = refactoringMetaDTO.getOldNamePattern();

        // Get the appropriate context refactor service based on context type
        ContextLayoutRefactoringService<? extends BaseDomain, ? extends LayoutContainer> contextLayoutRefactorHelper =
                contextLayoutRefactorResolver.getContextLayoutRefactorHelper(contextType);

        // Get context DTO mono (either PageDTO or ModuleDTO)
        Mono<? extends LayoutContainer> contextDTOMono =
                contextLayoutRefactorHelper.getContextDTOMono(refactoringMetaDTO);

        return contextDTOMono
                .flatMap(contextDTO -> {
                    String contextId = contextDTO.getId();
                    Mono<Integer> evalVersionMono = contextLayoutRefactorHelper.getEvaluationVersionMono(
                            contextId, refactorEntityNameDTO, refactoringMetaDTO);

                    return evalVersionMono.flatMap(evalVersion -> {
                        List<Layout> layouts = contextDTO.getLayouts();
                        if (layouts == null) {
                            return Mono.just(contextDTO);
                        }
                        for (Layout layout : layouts) {
                            if (layoutId.equals(layout.getId()) && layout.getDsl() != null) {
                                // DSL has removed all the old names and replaced it with new name. If the change of
                                // name
                                // was one of the mongoEscaped widgets, then update the names in the set as well
                                Set<String> mongoEscapedWidgetNames = layout.getMongoEscapedWidgetNames();
                                if (mongoEscapedWidgetNames != null && mongoEscapedWidgetNames.contains(oldName)) {
                                    mongoEscapedWidgetNames.remove(oldName);
                                    mongoEscapedWidgetNames.add(newName);
                                }

                                final JsonNode dslNode = objectMapper.convertValue(layout.getDsl(), JsonNode.class);
                                return widgetRefactorUtil
                                        .refactorNameInDsl(dslNode, oldName, newName, evalVersion, oldNamePattern)
                                        .flatMap(dslBindingPaths -> {
                                            updatedBindingPaths.addAll(dslBindingPaths);
                                            layout.setDsl(objectMapper.convertValue(dslNode, JSONObject.class));
                                            contextDTO.setLayouts(layouts);
                                            contextLayoutRefactorHelper.setUpdatedContext(
                                                    refactoringMetaDTO, contextDTO);

                                            return contextLayoutRefactorHelper.updateContext(contextId, contextDTO);
                                        });
                            }
                        }
                        return Mono.just(contextDTO);
                    });
                })
                .then();
    }

    @Override
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO) {
        // Do nothing, DSL refactor will take care of this
        return Mono.empty().then();
    }

    @Override
    public Flux<String> getExistingEntityNames(
            String contextId, CreatorContextType contextType, String layoutId, boolean viewMode) {
        Mono<?> contextDTOMono = contextLayoutRefactorResolver
                .getContextLayoutRefactorHelper(contextType)
                .getContextDTOMono(contextId, viewMode);
        return contextDTOMono.flatMapMany(contextDTO -> {
            LayoutContainer layoutContainer = (LayoutContainer) contextDTO;
            List<Layout> layouts = layoutContainer.getLayouts();
            if (layouts == null) {
                return Flux.empty();
            }
            for (Layout layout : layouts) {
                if (layoutId.equals(layout.getId())) {
                    if (layout.getWidgetNames() != null
                            && !layout.getWidgetNames().isEmpty()) {
                        return Flux.fromIterable(layout.getWidgetNames());
                    }
                    // In case of no widget names (which implies that there is no DSL), return an empty set.
                    return Flux.empty();
                }
            }
            return Flux.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.LAYOUT_ID, layoutId));
        });
    }
}
