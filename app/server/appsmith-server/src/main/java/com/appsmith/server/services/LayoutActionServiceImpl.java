package com.appsmith.server.services;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.onload.internal.OnLoadExecutablesUtil;
import com.appsmith.server.services.ce.LayoutActionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LayoutActionServiceImpl extends LayoutActionServiceCEImpl implements LayoutActionService {

    public LayoutActionServiceImpl(
            ObjectMapper objectMapper,
            AnalyticsService analyticsService,
            NewPageService newPageService,
            NewActionService newActionService,
            OnLoadExecutablesUtil pageLoadActionsUtil,
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
