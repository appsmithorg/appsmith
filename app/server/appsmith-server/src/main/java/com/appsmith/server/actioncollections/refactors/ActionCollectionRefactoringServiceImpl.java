package com.appsmith.server.actioncollections.refactors;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.regex.Pattern;

import static com.appsmith.server.helpers.ContextTypeUtils.isModuleContext;

@Service
public class ActionCollectionRefactoringServiceImpl extends ActionCollectionRefactoringServiceCEImpl
        implements EntityRefactoringService<ActionCollection> {
    public ActionCollectionRefactoringServiceImpl(
            ActionCollectionService actionCollectionService,
            NewActionService newActionService,
            ActionPermission actionPermission,
            AstService astService) {
        super(actionCollectionService, newActionService, actionPermission, astService);
    }

    @Override
    public Mono<Object> refactorCurrentEntity(
            Object currentEntity,
            RefactorEntityNameDTO refactorEntityNameDTO,
            Pattern oldNamePattern,
            Mono<Integer> evalVersionMono) {
        return evalVersionMono.flatMap(evalVersion -> this.refactorNameInActionCollection(
                        (ActionCollectionDTO) currentEntity,
                        refactorEntityNameDTO.getOldFullyQualifiedName(),
                        refactorEntityNameDTO.getNewFullyQualifiedName(),
                        evalVersion,
                        oldNamePattern)
                .thenReturn(currentEntity));
    }

    @Override
    public Flux<RefactorEntityNameDTO> getRefactorDTOsForExistingEntityNames(
            String contextId, CreatorContextType contextType, String layoutId) {
        return this.getExistingEntities(contextId, contextType, layoutId)
                .map(actionCollectionDTO -> {
                    RefactorEntityNameDTO dto = new RefactorEntityNameDTO();
                    dto.setOldName(actionCollectionDTO.getName());
                    dto.setEntityType(EntityType.JS_OBJECT);
                    return dto;
                })
                .map(refactorEntityNameDTO -> {
                    this.sanitizeRefactorEntityDTO(refactorEntityNameDTO);
                    return refactorEntityNameDTO;
                });
    }

    // TODO: This should be coming from CE regardless of the contextType
    @Override
    protected Flux<ActionCollectionDTO> getExistingEntities(
            String contextId, CreatorContextType contextType, String layoutId) {
        if (isModuleContext(contextType)) {
            return actionCollectionService
                    .findAllActionCollectionsByContextIdAndContextTypeAndViewMode(
                            contextId, contextType, AclPermission.MANAGE_ACTIONS, false)
                    .flatMap(actionCollection ->
                            actionCollectionService.generateActionCollectionByViewMode(actionCollection, false));
        } else {
            return super.getExistingEntities(contextId, contextType, layoutId);
        }
    }
}
