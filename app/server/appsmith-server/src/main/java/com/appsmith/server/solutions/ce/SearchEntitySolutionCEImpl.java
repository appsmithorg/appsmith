package com.appsmith.server.solutions.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.SearchEntityDTO;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Mono;

import java.util.List;

@RequiredArgsConstructor
public class SearchEntitySolutionCEImpl implements SearchEntitySolutionCE {

    private final WorkspaceService workspaceService;

    private final ApplicationService applicationService;

    private final WorkspacePermission workspacePermission;

    private final ApplicationPermission applicationPermission;

    @Override
    public Mono<SearchEntityDTO> searchEntity(String searchString, int page, int size) {
        Pageable pageable = Pageable.ofSize(size).withPage(page);
        Sort sort = Sort.by(Sort.Direction.DESC, FieldName.UPDATED_AT);

        Mono<List<Workspace>> workspacesMono = workspaceService
                .filterByFields(
                        List.of(FieldName.NAME), searchString, pageable, sort, workspacePermission.getReadPermission())
                .collectList();
        Mono<List<Application>> applicationsMono = applicationService
                .filterByFields(
                        List.of(FieldName.NAME),
                        searchString,
                        pageable,
                        sort,
                        applicationPermission.getReadPermission())
                .collectList();

        return Mono.zip(workspacesMono, applicationsMono).map(tuple2 -> {
            SearchEntityDTO searchEntityDTO = new SearchEntityDTO();
            searchEntityDTO.setWorkspaces(tuple2.getT1());
            searchEntityDTO.setApplications(tuple2.getT2());
            return searchEntityDTO;
        });
    }
}
