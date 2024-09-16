package com.appsmith.server.widgets.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.entities.EntityRefactoringServiceCE;
import com.appsmith.server.services.AstService;
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
import static com.appsmith.server.helpers.ContextTypeUtils.isPageContext;

@Slf4j
@RequiredArgsConstructor
public class WidgetRefactoringServiceCEImpl implements EntityRefactoringServiceCE<Layout> {

    private final NewPageService newPageService;
    private final AstService astService;
    private final ObjectMapper objectMapper;
    private final WidgetRefactorUtil widgetRefactorUtil;

    @Override
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return REFACTOR_WIDGET;
    }

    @Override
    public Mono<Void> refactorReferencesInExistingEntities(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        if (!isPageContext(refactorEntityNameDTO.getContextType())) {
            return Mono.empty().then();
        }
        Mono<PageDTO> pageMono = refactoringMetaDTO.getPageDTOMono();
        Mono<Integer> evalVersionMono = refactoringMetaDTO.getEvalVersionMono();
        Set<String> updatedBindingPaths = refactoringMetaDTO.getUpdatedBindingPaths();
        Pattern oldNamePattern = refactoringMetaDTO.getOldNamePattern();

        String layoutId = refactorEntityNameDTO.getLayoutId();
        String oldName = refactorEntityNameDTO.getOldFullyQualifiedName();
        String newName = refactorEntityNameDTO.getNewFullyQualifiedName();

        Mono<PageDTO> pageDTOMono = Mono.zip(pageMono, evalVersionMono).flatMap(tuple -> {
            PageDTO page = tuple.getT1();
            int evalVersion = tuple.getT2();

            List<Layout> layouts = page.getLayouts();
            for (Layout layout : layouts) {
                if (layoutId.equals(layout.getId()) && layout.getDsl() != null) {
                    // DSL has removed all the old names and replaced it with new name. If the change of name
                    // was one of the mongoEscaped widgets, then update the names in the set as well
                    Set<String> mongoEscapedWidgetNames = layout.getMongoEscapedWidgetNames();
                    if (mongoEscapedWidgetNames != null && mongoEscapedWidgetNames.contains(oldName)) {
                        mongoEscapedWidgetNames.remove(oldName);
                        mongoEscapedWidgetNames.add(newName);
                    }

                    final JsonNode dslNode = objectMapper.convertValue(layout.getDsl(), JsonNode.class);
                    Mono<PageDTO> refactorNameInDslMono = widgetRefactorUtil
                            .refactorNameInDsl(dslNode, oldName, newName, evalVersion, oldNamePattern)
                            .flatMap(dslBindingPaths -> {
                                updatedBindingPaths.addAll(dslBindingPaths);
                                layout.setDsl(objectMapper.convertValue(dslNode, JSONObject.class));
                                page.setLayouts(layouts);
                                refactoringMetaDTO.setUpdatedPage(page);
                                return Mono.just(page);
                            });

                    // Since the page has most probably changed, save the page and return.
                    return refactorNameInDslMono.flatMap(newPageService::saveUnpublishedPage);
                }
            }
            // If we have reached here, the layout was not found and the page should be returned as is.
            return Mono.just(page);
        });

        return pageDTOMono.then();
    }

    @Override
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO) {
        // Do nothing, DSL refactor will take care of this
        return Mono.empty().then();
    }

    @Override
    public Flux<String> getExistingEntityNames(
            String contextId, CreatorContextType contextType, String layoutId, boolean viewMode) {
        return newPageService
                // fetch the unpublished page
                .findPageById(contextId, null, viewMode)
                .flatMapMany(page -> {
                    List<Layout> layouts = page.getLayouts();
                    for (Layout layout : layouts) {
                        if (layoutId.equals(layout.getId())) {
                            if (layout.getWidgetNames() != null
                                    && layout.getWidgetNames().size() > 0) {
                                return Flux.fromIterable(layout.getWidgetNames());
                            }
                            // In case of no widget names (which implies that there is no DSL), return an empty set.
                            return Flux.empty();
                        }
                    }
                    return Flux.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.LAYOUT_ID, layoutId));
                });
    }
}
