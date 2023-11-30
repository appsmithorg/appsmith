package com.appsmith.server.newactions.refactors;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.ActionPermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.regex.Pattern;

@Service
public class NewActionRefactoringServiceImpl extends NewActionRefactoringServiceCEImpl
        implements EntityRefactoringService<NewAction> {
    public NewActionRefactoringServiceImpl(
            NewActionService newActionService,
            ActionPermission actionPermission,
            AstService astService,
            InstanceConfig instanceConfig,
            ObjectMapper objectMapper) {
        super(newActionService, actionPermission, astService, instanceConfig, objectMapper);
    }

    @Override
    public Mono<Object> refactorCurrentEntity(
            Object currentEntity,
            RefactorEntityNameDTO refactorEntityNameDTO,
            Pattern oldNamePattern,
            Mono<Integer> evalVersionMono) {
        return evalVersionMono.flatMap(evalVersion -> this.refactorNameInAction(
                        (ActionDTO) currentEntity,
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
                .map(actionDTO -> {
                    RefactorEntityNameDTO dto = new RefactorEntityNameDTO();
                    dto.setOldName(actionDTO.getName());
                    if (PluginType.JS.equals(actionDTO.getPluginType())) {
                        dto.setEntityType(EntityType.JS_ACTION);
                        dto.setCollectionName(actionDTO.getValidName().split("\\.")[0]);
                    } else {
                        dto.setEntityType(EntityType.ACTION);
                    }
                    return dto;
                })
                .map(refactorEntityNameDTO -> {
                    this.sanitizeRefactorEntityDTO(refactorEntityNameDTO);
                    return refactorEntityNameDTO;
                });
    }
}
