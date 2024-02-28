package com.appsmith.server.searchentities;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.dtos.SearchEntityDTO;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.searchentities.helpers.SearchWorkflowHelper;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.searchentities.helpers.SearchEntityHelper.shouldSearchEntity;

@Component
public class SearchEntitySolutionImpl extends SearchEntitySolutionCEImpl implements SearchEntitySolution {

    private final SearchWorkflowHelper searchWorkflowHelper;

    public SearchEntitySolutionImpl(
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            ResponseUtils responseUtils,
            SearchWorkflowHelper searchWorkflowHelper) {
        super(workspaceService, applicationService, workspacePermission, applicationPermission, responseUtils);
        this.searchWorkflowHelper = searchWorkflowHelper;
    }

    @Override
    public Mono<SearchEntityDTO> searchEntity(
            String[] entities, String searchString, int page, int size, Boolean isRequestedForHomepage) {
        if (size == 0) {
            return Mono.just(new SearchEntityDTO());
        }
        Mono<SearchEntityDTO> searchEntityDTOMono =
                super.searchEntity(entities, searchString, page, size, isRequestedForHomepage);
        if (shouldSearchEntity(Workflow.class, entities)) {
            searchEntityDTOMono = searchEntityDTOMono
                    .zipWith(
                            searchWorkflowHelper.searchWorkflowEntity(searchString, page, size, isRequestedForHomepage))
                    .map(tuple -> {
                        SearchEntityDTO searchEntityDTO = tuple.getT1();
                        List<Workflow> searchedWorkflows = tuple.getT2();
                        searchEntityDTO.setWorkflows(searchedWorkflows);
                        return searchEntityDTO;
                    });
        }

        return searchEntityDTOMono;
    }
}
