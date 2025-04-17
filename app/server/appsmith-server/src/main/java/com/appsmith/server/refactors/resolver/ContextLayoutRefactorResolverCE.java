package com.appsmith.server.refactors.resolver;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.refactors.ContextLayoutRefactoringService;
import org.springframework.stereotype.Service;

@Service
public class ContextLayoutRefactorResolverCE {
    private final ContextLayoutRefactoringService<NewPage, PageDTO> pageLayoutRefactorService;

    public ContextLayoutRefactorResolverCE(
            ContextLayoutRefactoringService<NewPage, PageDTO> pageLayoutRefactorService) {
        this.pageLayoutRefactorService = pageLayoutRefactorService;
    }

    public ContextLayoutRefactoringService<?, ?> getContextLayoutRefactorHelper(CreatorContextType contextType) {
        return pageLayoutRefactorService;
    }
}
