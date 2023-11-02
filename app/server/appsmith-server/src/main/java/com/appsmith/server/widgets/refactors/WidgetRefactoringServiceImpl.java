package com.appsmith.server.widgets.refactors;

import com.appsmith.server.domains.Layout;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import org.springframework.stereotype.Service;

@Service
public class WidgetRefactoringServiceImpl extends WidgetRefactoringServiceCEImpl
        implements EntityRefactoringService<Layout> {}
