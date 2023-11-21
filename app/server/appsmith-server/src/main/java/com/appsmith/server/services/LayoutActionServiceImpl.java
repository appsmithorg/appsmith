package com.appsmith.server.services;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringSolution;
import com.appsmith.server.services.ce.LayoutActionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
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
            AnalyticsService analyticsService,
            NewPageService newPageService,
            NewActionService newActionService,
            RefactoringSolution refactoringSolution,
            CollectionService collectionService,
            UpdateLayoutService updateLayoutService,
            ResponseUtils responseUtils,
            DatasourceService datasourceService,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            DatasourcePermission datasourcePermission) {

        super(
                analyticsService,
                newPageService,
                newActionService,
                refactoringSolution,
                collectionService,
                updateLayoutService,
                responseUtils,
                datasourceService,
                pagePermission,
                actionPermission);

        this.datasourceService = datasourceService;
        this.datasourcePermission = datasourcePermission;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
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
