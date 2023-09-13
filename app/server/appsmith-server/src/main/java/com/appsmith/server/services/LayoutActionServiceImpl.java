package com.appsmith.server.services;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newaction.base.NewActionService;
import com.appsmith.server.onpageload.internal.PageLoadExecutablesUtil;
import com.appsmith.server.services.ce.LayoutActionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class LayoutActionServiceImpl extends LayoutActionServiceCEImpl implements LayoutActionService {

    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;

    public LayoutActionServiceImpl(
            ObjectMapper objectMapper,
            AnalyticsService analyticsService,
            NewPageService newPageService,
            NewActionService newActionService,
            PageLoadExecutablesUtil pageLoadActionsUtil,
            SessionUserService sessionUserService,
            ActionCollectionService actionCollectionService,
            CollectionService collectionService,
            ApplicationService applicationService,
            ResponseUtils responseUtils,
            DatasourceService datasourceService,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            DatasourcePermission datasourcePermission) {

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

        this.datasourceService = datasourceService;
        this.datasourcePermission = datasourcePermission;
    }

    @Override
    public Mono<ActionDTO> createAction(ActionDTO action, AppsmithEventContext eventContext, Boolean isJsAction) {
        Mono<ActionDTO> createActionMono = super.createAction(action, eventContext, isJsAction);

        // If it is an embedded datasource, continue.
        if (action.getDatasource() == null
                || !StringUtils.hasLength(action.getDatasource().getId())) {
            return createActionMono;
        }

        // Check if the user is allowed to create actions on the said datasource and only then proceed.
        String datasourceId = action.getDatasource().getId();
        return datasourceService
                .findById(datasourceId, datasourcePermission.getActionCreatePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "datasource", datasourceId)))
                .then(createActionMono);
    }
}
