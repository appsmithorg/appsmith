package com.appsmith.server.widgets.refactors;

import com.appsmith.server.domains.Layout;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AstService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class WidgetRefactoringServiceImpl extends WidgetRefactoringServiceCEImpl
        implements EntityRefactoringService<Layout> {
    public WidgetRefactoringServiceImpl(
            NewPageService newPageService,
            AstService astService,
            ObjectMapper objectMapper,
            WidgetRefactorUtil widgetRefactorUtil) {
        super(newPageService, astService, objectMapper, widgetRefactorUtil);
    }
}
