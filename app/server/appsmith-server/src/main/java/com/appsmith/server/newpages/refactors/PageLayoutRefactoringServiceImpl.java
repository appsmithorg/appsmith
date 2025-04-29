package com.appsmith.server.newpages.refactors;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.ce.LayoutContainer;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.AnalyticsContextDTO;
import com.appsmith.server.refactors.ContextLayoutRefactoringService;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.constants.ce.CommonConstantsCE.EVALUATION_VERSION;

@Component
@RequiredArgsConstructor
@Slf4j
public class PageLayoutRefactoringServiceImpl implements ContextLayoutRefactoringService<NewPage, PageDTO> {
    private final NewPageService newPageService;
    private final ApplicationService applicationService;
    private final SessionUserService sessionUserService;

    @Override
    public Mono<PageDTO> updateContext(String contextId, LayoutContainer dto) {
        return newPageService.saveUnpublishedPage((PageDTO) dto);
    }

    @Override
    public Mono<PageDTO> getContextDTOMono(String contextId, boolean viewMode) {
        return newPageService.findPageById(contextId, null, viewMode);
    }

    @Override
    public Mono<PageDTO> getContextDTOMono(RefactoringMetaDTO refactoringMetaDTO) {
        return refactoringMetaDTO.getPageDTOMono();
    }

    @Override
    public Mono<Integer> getEvaluationVersionMono(
            String contextId, RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        Mono<PageDTO> pageDTOMono = getContextDTOMono(contextId, false);
        refactoringMetaDTO.setPageDTOMono(pageDTOMono);
        return pageDTOMono.flatMap(
                page -> applicationService.findById(page.getApplicationId()).map(application -> {
                    Integer evaluationVersion = application.getEvaluationVersion();
                    if (evaluationVersion == null) {
                        evaluationVersion = EVALUATION_VERSION;
                    }
                    return evaluationVersion;
                }));
    }

    @Override
    public Mono<Integer> getEvaluationVersionMono(String artifactId) {
        return applicationService
                .findById(artifactId)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, artifactId)))
                .map(application -> {
                    Integer evaluationVersion = application.getEvaluationVersion();
                    if (evaluationVersion == null) {
                        evaluationVersion = EVALUATION_VERSION;
                    }
                    return evaluationVersion;
                });
    }

    @Override
    public List<Layout> getLayouts(RefactoringMetaDTO refactoringMetaDTO) {
        PageDTO updatedPage = refactoringMetaDTO.getUpdatedPage();
        if (updatedPage == null) {
            return null;
        }
        return updatedPage.getLayouts();
    }

    @Override
    public Mono<PageDTO> updateLayoutByContextId(String contextId, Layout layout) {
        // Implementation for updating page layout
        return Mono.empty();
    }

    @Override
    public String getId(RefactoringMetaDTO refactoringMetaDTO) {
        return refactoringMetaDTO.getUpdatedPage() != null
                ? refactoringMetaDTO.getUpdatedPage().getId()
                : null;
    }

    @Override
    public String getArtifactId(RefactoringMetaDTO refactoringMetaDTO) {
        return refactoringMetaDTO.getUpdatedPage() != null
                ? refactoringMetaDTO.getUpdatedPage().getApplicationId()
                : null;
    }

    @Override
    public void setUpdatedContext(RefactoringMetaDTO refactoringMetaDTO, LayoutContainer updatedContext) {
        refactoringMetaDTO.setUpdatedPage((PageDTO) updatedContext);
    }

    @Override
    public Mono<AnalyticsContextDTO> getContextForAnalytics(String contextId) {
        return Mono.zip(sessionUserService.getCurrentUser(), newPageService.getByIdWithoutPermissionCheck(contextId))
                .map(tuple -> {
                    return AnalyticsContextDTO.builder()
                            .username(tuple.getT1().getUsername())
                            .artifactType(ArtifactType.APPLICATION)
                            .artifactId(tuple.getT2().getApplicationId())
                            .domain(tuple.getT2())
                            .build();
                });
    }
}
