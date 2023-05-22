/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.solutions.ce;

import com.appsmith.server.dtos.ApplicationImportDTO;
import reactor.core.publisher.Mono;

public interface ApplicationForkingServiceCE {

Mono<ApplicationImportDTO> forkApplicationToWorkspace(
	String srcApplicationId, String targetWorkspaceId);

Mono<ApplicationImportDTO> forkApplicationToWorkspace(
	String srcApplicationId, String targetWorkspaceId, String branchName);
}
