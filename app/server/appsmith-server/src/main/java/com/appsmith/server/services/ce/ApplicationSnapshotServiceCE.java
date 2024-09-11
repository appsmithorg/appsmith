package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.projections.ApplicationSnapshotResponseDTO;
import reactor.core.publisher.Mono;

public interface ApplicationSnapshotServiceCE {
    /**
     * This method will create a new snapshot of the provided applicationId and branch name and store in the
     * ApplicationSnapshot collection.
     *
     * @param branchedApplicationId ID of the application, default application ID if application is connected to Git
     * @return Created snapshot ID
     */
    Mono<Boolean> createApplicationSnapshot(String branchedApplicationId);

    Mono<ApplicationSnapshotResponseDTO> getWithoutDataByBranchedApplicationId(String branchedApplicationId);

    Mono<Application> restoreSnapshot(String branchedApplicationId);

    Mono<Boolean> deleteSnapshot(String branchedApplicationId);
}
