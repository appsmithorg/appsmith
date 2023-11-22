package com.appsmith.server.moduleinstances.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.refactors.entities.EntityRefactoringServiceCE;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModuleInstanceRefactoringServiceCECompatibleImpl implements EntityRefactoringServiceCE<ModuleInstance> {
    @Override
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return null;
    }

    @Override
    public Mono<Boolean> validateName(String newName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Void> refactorReferencesInExistingEntities(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        return Mono.empty().then();
    }

    @Override
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO, String branchName) {
        return Mono.empty().then();
    }
}
