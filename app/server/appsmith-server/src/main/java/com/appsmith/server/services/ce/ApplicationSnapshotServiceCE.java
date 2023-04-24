package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationSnapshot;
import reactor.core.publisher.Mono;

public interface ApplicationSnapshotServiceCE {
    /**
     * This method will create a new snapshot of the provided applicationId and branch name and store in the
     * ApplicationSnapshot collection.
     * @param applicationId ID of the application, default application ID if application is connected to Git
     * @param branchName name of the Git branch, null or empty if not connected to Git
     * @return Created snapshot ID
     */
    Mono<Boolean> createApplicationSnapshot(String applicationId, String branchName);

    Mono<ApplicationSnapshot> getWithoutDataByApplicationId(String applicationId, String branchName);

    Mono<Application> restoreSnapshot(String applicationId, String branchName);

    Mono<Boolean> deleteSnapshot(String applicationId, String branchName);
}
