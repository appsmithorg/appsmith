package com.appsmith.server.widgets.refactors;

import com.appsmith.server.domains.Layout;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.refactors.resolver.ContextLayoutRefactorResolver;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class WidgetRefactoringServiceImpl extends WidgetRefactoringServiceCEImpl
        implements EntityRefactoringService<Layout> {
    public WidgetRefactoringServiceImpl(
            ObjectMapper objectMapper,
            WidgetRefactorUtil widgetRefactorUtil,
            ContextLayoutRefactorResolver contextLayoutRefactorResolver) {
        super(objectMapper, widgetRefactorUtil, contextLayoutRefactorResolver);
    }
}
