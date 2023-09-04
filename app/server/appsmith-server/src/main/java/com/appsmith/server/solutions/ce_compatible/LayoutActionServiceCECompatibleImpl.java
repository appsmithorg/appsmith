package com.appsmith.server.solutions.ce_compatible;

import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.CollectionService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ce.LayoutActionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PageLoadActionsUtil;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class LayoutActionServiceCECompatibleImpl extends LayoutActionServiceCEImpl
        implements LayoutActionServiceCECompatible {
    public LayoutActionServiceCECompatibleImpl(
            ObjectMapper objectMapper,
            AnalyticsService analyticsService,
            NewPageService newPageService,
            NewActionService newActionService,
            PageLoadActionsUtil pageLoadActionsUtil,
            SessionUserService sessionUserService,
            ActionCollectionService actionCollectionService,
            CollectionService collectionService,
            ApplicationService applicationService,
            ResponseUtils responseUtils,
            DatasourceService datasourceService,
            PagePermission pagePermission,
            ActionPermission actionPermission) {
        super(
                objectMapper,
                analyticsService,
                newPageService,
                newActionService,
                pageLoadActionsUtil,
                sessionUserService,
                actionCollectionService,
                collectionService,
                applicationService,
                responseUtils,
                datasourceService,
                pagePermission,
                actionPermission);
    }
}
