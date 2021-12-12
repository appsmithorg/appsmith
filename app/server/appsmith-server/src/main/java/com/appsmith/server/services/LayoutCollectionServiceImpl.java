package com.appsmith.server.services;

import com.appsmith.server.services.ce.LayoutCollectionServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LayoutCollectionServiceImpl extends LayoutCollectionServiceCEImpl implements LayoutCollectionService {

    public LayoutCollectionServiceImpl(NewPageService newPageService,
                                       LayoutActionService layoutActionService,
                                       ActionCollectionService actionCollectionService,
                                       NewActionService newActionService,
                                       AnalyticsService analyticsService) {

        super(newPageService, layoutActionService, actionCollectionService, newActionService, analyticsService);
    }
}
