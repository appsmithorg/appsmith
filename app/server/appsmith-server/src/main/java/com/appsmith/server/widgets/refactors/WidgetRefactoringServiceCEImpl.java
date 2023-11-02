package com.appsmith.server.widgets.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.refactors.entities.EntityRefactoringServiceCE;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import static com.appsmith.external.constants.AnalyticsEvents.REFACTOR_WIDGET;

@Slf4j
@RequiredArgsConstructor
public class WidgetRefactoringServiceCEImpl implements EntityRefactoringServiceCE<Layout> {

    @Override
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return REFACTOR_WIDGET;
    }

    @Override
    public void sanitizeRefactorEntityDTO(RefactorEntityNameDTO refactorEntityNameDTO) {
        // Do nothing
    }

    @Override
    public Mono<Boolean> validateName(String name) {
        return Mono.just(Boolean.TRUE);
    }

    @Override
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO, String branchName) {
        // Do nothing, DSL refactor will take care of this
        return Mono.empty().then();
    }
}
