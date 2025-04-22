package com.appsmith.server.refactors.resolver;

import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.refactors.ContextLayoutRefactoringService;
import org.springframework.stereotype.Service;

@Service
public class ContextLayoutRefactorResolver extends ContextLayoutRefactorResolverCE {
    public ContextLayoutRefactorResolver(ContextLayoutRefactoringService<NewPage, PageDTO> pageLayoutRefactorService) {
        super(pageLayoutRefactorService);
    }
}
