package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class ApplicationSnapshotServiceCEImpl implements ApplicationSnapshotServiceCE {
    private final ApplicationSnapshotRepository applicationSnapshotRepository;
    private final ApplicationService applicationService;
    private final ImportExportApplicationService importExportApplicationService;
    private final ApplicationPermission applicationPermission;

    @Override
    public Mono<String> createApplicationSnapshot(String applicationId, String branchName) {
        return applicationService.findBranchedApplicationId(branchName, applicationId, applicationPermission.getEditPermission())
                /* SerialiseApplicationObjective=VERSION_CONTROL because this API can be invoked from developers.
                exportApplicationById method check for MANAGE_PERMISSION if SerialiseApplicationObjective=SHARE.
                */
                .flatMap(branchedAppId ->
                        Mono.zip(
                                importExportApplicationService.exportApplicationById(branchedAppId, SerialiseApplicationObjective.VERSION_CONTROL),
                                Mono.just(branchedAppId)
                        )
                )
                .flatMap(objects -> createOrUpdateSnapshot(objects.getT2(), objects.getT1()))
                .map(BaseDomain::getId);
    }

    private Mono<ApplicationSnapshot> createOrUpdateSnapshot(String applicationId, ApplicationJson applicationJson) {
        return applicationSnapshotRepository.findWithoutApplicationJson(applicationId)
                .defaultIfEmpty(new ApplicationSnapshot())
                .flatMap(applicationSnapshot -> {
                    applicationSnapshot.setApplicationJson(applicationJson);
                    applicationSnapshot.setApplicationId(applicationId);
                    return applicationSnapshotRepository.save(applicationSnapshot);
                });
    }

    @Override
    public Mono<ApplicationSnapshot> getWithoutApplicationJsonByApplicationId(String applicationId, String branchName) {
        // get application first to check the permission
        return applicationService.findBranchedApplicationId(branchName, applicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId))
                )
                .flatMap(applicationSnapshotRepository::findWithoutApplicationJson);
    }
}
