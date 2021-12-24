package com.appsmith.server.services;

import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.ce.LayoutActionServiceCEImpl;
import com.appsmith.server.solutions.PageLoadActionsUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LayoutActionServiceImpl extends LayoutActionServiceCEImpl implements LayoutActionService {

    public LayoutActionServiceImpl(ObjectMapper objectMapper,
                                   AnalyticsService analyticsService,
                                   NewPageService newPageService,
                                   NewActionService newActionService,
                                   PageLoadActionsUtil pageLoadActionsUtil,
                                   SessionUserService sessionUserService,
                                   ActionCollectionService actionCollectionService,
                                   CollectionService collectionService,
                                   ApplicationService applicationService,
                                   ResponseUtils responseUtils) {

        super(objectMapper, analyticsService, newPageService, newActionService, pageLoadActionsUtil, sessionUserService,
                actionCollectionService, collectionService, applicationService, responseUtils);

    }
}
