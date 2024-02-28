package com.appsmith.server.workflows.search;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.searchentities.helpers.SearchEntityHelper;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.permission.WorkflowPermission;
import jakarta.validation.Validator;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class SearchWorkflowServiceImpl extends SearchWorkflowServiceCECompatibleImpl implements SearchWorkflowService {
    private final WorkflowPermission workflowPermission;

    public SearchWorkflowServiceImpl(
            Validator validator,
            WorkflowRepository repository,
            AnalyticsService analyticsService,
            WorkflowPermission workflowPermission) {
        super(validator, repository, analyticsService);
        this.workflowPermission = workflowPermission;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<List<Workflow>> searchWorkflowEntity(
            String searchString, int page, int size, Boolean isRequestedForHomepage) {
        // TODO: Filter for Git connected workflows when GIT is implemented.
        if (size == 0) {
            return super.searchWorkflowEntity(searchString, page, size, isRequestedForHomepage);
        }
        Sort sort = SearchEntityHelper.getSort();
        Pageable pageable = SearchEntityHelper.getPageable(page, size);
        searchString = StringUtils.hasLength(searchString) ? searchString.trim() : "";

        return this.filterByEntityFieldsWithoutPublicAccess(
                        List.of(FieldName.NAME), searchString, pageable, sort, workflowPermission.getEditPermission())
                .collectList();
    }
}
