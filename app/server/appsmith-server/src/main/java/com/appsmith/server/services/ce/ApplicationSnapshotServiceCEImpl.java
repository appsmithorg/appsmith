package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@RequiredArgsConstructor
public class ApplicationSnapshotServiceCEImpl implements ApplicationSnapshotServiceCE {
    private final ApplicationSnapshotRepository applicationSnapshotRepository;
    private final ApplicationService applicationService;
    private final ImportExportApplicationService importExportApplicationService;
    private final ApplicationPermission applicationPermission;
    private final Gson gson;

    private static final int MAX_SNAPSHOT_SIZE = 15*1024*1024; // 15 MB

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
                    String json = gson.toJson(applicationJson);
                    // check the size of the exported json before storing to avoid mongodb document size limit
                    byte[] utf8JsonString = json.getBytes(StandardCharsets.UTF_8);
                    if(utf8JsonString.length > MAX_SNAPSHOT_SIZE) {
                        // file may exceed 16 MB document size limit of mongodb, throw error
                        return Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST,
                                "Application too large for snapshot. Try exporting the Application instead.")
                        );
                    }
                    applicationSnapshot.setApplicationJson(json);
                    applicationSnapshot.setApplicationId(applicationId);
                    return applicationSnapshotRepository.save(applicationSnapshot);
                });
    }

    @Override
    public Mono<ApplicationSnapshot> getWithoutApplicationJsonByApplicationId(String applicationId, String branchName) {
        // get application first to check the permission and get child aka branched application ID
        return applicationService.findBranchedApplicationId(branchName, applicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId))
                )
                .flatMap(applicationSnapshotRepository::findWithoutApplicationJson)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId))
                );
    }

    @Override
    public Mono<Application> restoreSnapshot(String applicationId, String branchName) {
        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, applicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId))
                )
                .flatMap(
                        application -> applicationSnapshotRepository.findApplicationJson(application.getId())
                                .zipWith(Mono.just(application))
                )
                .flatMap(objects -> {
                    String applicationJsonString = objects.getT1();
                    Application application = objects.getT2();
                    ApplicationJson applicationJson = gson.fromJson(applicationJsonString, ApplicationJson.class);
                    return importExportApplicationService.importApplicationInWorkspace(
                            application.getWorkspaceId(), applicationJson, application.getId(), branchName
                    );
                });
    }
}
