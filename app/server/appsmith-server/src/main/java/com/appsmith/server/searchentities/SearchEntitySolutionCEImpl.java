package com.appsmith.server.searchentities;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.SearchEntityDTO;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

import static com.appsmith.server.searchentities.helpers.SearchEntityHelper.getPageable;
import static com.appsmith.server.searchentities.helpers.SearchEntityHelper.getSort;
import static com.appsmith.server.searchentities.helpers.SearchEntityHelper.shouldSearchEntity;

@RequiredArgsConstructor
public class SearchEntitySolutionCEImpl implements SearchEntitySolutionCE {

    private final WorkspaceService workspaceService;

    private final ApplicationService applicationService;

    private final WorkspacePermission workspacePermission;

    private final ApplicationPermission applicationPermission;

    /**
     * This method searches for workspaces and applications based on the searchString provided.
     * The search is performed with contains operator on the name field of the entities and is case-insensitive.
     * The search results are sorted by the updated_at field in descending order.
     * searchString = "test" will return all entities with name containing "test".
     * e.g. "test_app", "test_workspace", "appTest", "wsTest_random" etc.
     *
     * @param entities                  The list of entities to search for. If null or empty, all entities are searched.
     * @param searchString              The string to search for in the name field of the entities.
     * @param page                      The page number of the results to return.
     * @param size                      Max number of results to return within each entity.
     * @param isRequestedForHomepage    Whether the search is requested for the homepage or not.
     *
     * @return  A Mono of SearchEntityDTO containing the list of workspaces and applications.
     */
    @Override
    public Mono<SearchEntityDTO> searchEntity(
            String[] entities, String searchString, int page, int size, Boolean isRequestedForHomepage) {
        if (size == 0) {
            return Mono.just(new SearchEntityDTO());
        }
        Pageable pageable = getPageable(page, size);
        Sort sort = getSort();
        searchString = StringUtils.hasLength(searchString) ? searchString.trim() : "";
        // If no entities are specified, search for all entities.
        Mono<List<Workspace>> workspacesMono = Mono.just(new ArrayList<>());
        if (shouldSearchEntity(Workspace.class, entities)) {
            workspacesMono = workspaceService
                    .filterByEntityFieldsWithoutPublicAccess(
                            List.of(Workspace.Fields.name),
                            searchString,
                            pageable,
                            sort,
                            workspacePermission.getReadPermission())
                    .collectList();
        }

        Mono<List<Application>> applicationsMono = Mono.just(new ArrayList<>());
        if (shouldSearchEntity(Application.class, entities)) {
            applicationsMono = applicationService
                    .filterByEntityFieldsWithoutPublicAccess(
                            List.of(Application.Fields.name),
                            searchString,
                            pageable,
                            sort,
                            applicationPermission.getReadPermission())
                    .filter(application -> {
                        if (Boolean.FALSE.equals(isRequestedForHomepage)) {
                            return true;
                        }
                        /*
                         * As the applications are requested on homepage filter applications based on the following
                         * criteria:
                         * - Applications that are not connected to Git.
                         * OR
                         * - Applications that, when connected, revert with default branch only.
                         */
                        return !GitUtils.isArtifactConnectedToGit(application.getGitArtifactMetadata())
                                || GitUtils.isDefaultBranchedArtifact(application.getGitArtifactMetadata());
                    })
                    .collectList();
        }

        return Mono.zip(workspacesMono, applicationsMono).map(tuple2 -> {
            SearchEntityDTO searchEntityDTO = new SearchEntityDTO();
            searchEntityDTO.setWorkspaces(tuple2.getT1());
            searchEntityDTO.setApplications(tuple2.getT2());
            return searchEntityDTO;
        });
    }
}
