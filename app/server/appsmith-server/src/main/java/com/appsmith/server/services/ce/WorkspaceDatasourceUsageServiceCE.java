package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.WorkspaceDatasourceUsageDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface WorkspaceDatasourceUsageServiceCE {

    Mono<List<WorkspaceDatasourceUsageDTO>> getDatasourceUsage(String workspaceId);
}
