package com.appsmith.server.newactions.refactors;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.regex.Pattern;

@Service
public class JsActionRefactoringServiceImpl extends JsActionRefactoringServiceCEImpl
        implements EntityRefactoringService<Void> {
    public JsActionRefactoringServiceImpl(
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            EntityRefactoringService<NewAction> newActionEntityRefactoringService,
            ActionPermission actionPermission) {
        super(newActionService, actionCollectionService, newActionEntityRefactoringService, actionPermission);
    }

    @Override
    public Mono<Object> refactorCurrentEntity(
            Object currentEntity,
            RefactorEntityNameDTO refactorEntityNameDTO,
            Pattern oldNamePattern,
            Mono<Integer> evalVersionMono) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<RefactorEntityNameDTO> getRefactorDTOsForExistingEntityNames(
            String contextId, CreatorContextType contextType, String layoutId) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
