package com.appsmith.server.widgets.refactors;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.regex.Pattern;

@Service
public class WidgetRefactoringServiceImpl extends WidgetRefactoringServiceCEImpl
        implements EntityRefactoringService<Layout> {
    public WidgetRefactoringServiceImpl(
            NewPageService newPageService,
            AstService astService,
            ObjectMapper objectMapper,
            PagePermission pagePermission) {
        super(newPageService, astService, objectMapper, pagePermission);
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
        return this.getExistingEntityNames(contextId, contextType, layoutId, true)
                .map(widgetName -> {
                    RefactorEntityNameDTO dto = new RefactorEntityNameDTO();
                    dto.setOldName(widgetName);
                    dto.setEntityType(EntityType.WIDGET);
                    return dto;
                })
                .map(refactorEntityNameDTO -> {
                    this.sanitizeRefactorEntityDTO(refactorEntityNameDTO);
                    return refactorEntityNameDTO;
                });
    }
}
