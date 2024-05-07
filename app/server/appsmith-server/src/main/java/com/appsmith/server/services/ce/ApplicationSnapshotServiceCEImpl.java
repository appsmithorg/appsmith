package com.appsmith.server.services.ce;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.projections.ApplicationSnapshotResponseDTO;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RequiredArgsConstructor
public class ApplicationSnapshotServiceCEImpl implements ApplicationSnapshotServiceCE {
    private final ApplicationSnapshotRepository applicationSnapshotRepository;
    private final ApplicationService applicationService;
    private final ImportService importService;
    private final ExportService exportService;
    private final ApplicationPermission applicationPermission;
    private final Gson gson;
    private final ResponseUtils responseUtils;

    private static final int MAX_SNAPSHOT_SIZE = 15 * 1024 * 1024; // 15 MB

    @Override
    public Mono<Boolean> createApplicationSnapshot(String applicationId, String branchName) {
        return applicationService
                .findBranchedApplicationId(branchName, applicationId, applicationPermission.getEditPermission())
                /* SerialiseArtifactObjective=VERSION_CONTROL because this API can be invoked from developers.
                exportApplicationById method check for MANAGE_PERMISSION if SerialiseArtifactObjective=SHARE.
                */
                .flatMap(branchedAppId -> Mono.zip(
                        exportService.exportByArtifactId(
                                branchedAppId, SerialiseArtifactObjective.VERSION_CONTROL, ArtifactType.APPLICATION),
                        Mono.just(branchedAppId)))
                .flatMapMany(objects -> {
                    String branchedAppId = objects.getT2();
                    ApplicationJson applicationJson = (ApplicationJson) objects.getT1();
                    return applicationSnapshotRepository
                            .deleteAllByApplicationId(branchedAppId)
                            .thenMany(createSnapshots(branchedAppId, applicationJson));
                })
                .then(Mono.just(Boolean.TRUE));
    }

    private Flux<ApplicationSnapshot> createSnapshots(String applicationId, ApplicationJson applicationJson) {
        String json = gson.toJson(applicationJson);
        // check the size of the exported json before storing to avoid mongodb document size limit
        byte[] utf8JsonString = json.getBytes(StandardCharsets.UTF_8);
        List<ApplicationSnapshot> applicationSnapshots = createSnapshotsObjects(utf8JsonString, applicationId);
        return applicationSnapshotRepository.saveAll(applicationSnapshots);
    }

    @Override
    public Mono<ApplicationSnapshotResponseDTO> getWithoutDataByApplicationId(String applicationId, String branchName) {
        // get application first to check the permission and get child aka branched application ID
        return applicationService
                .findBranchedApplicationId(branchName, applicationId, applicationPermission.getEditPermission())
                .flatMap(branchedApplicationId ->
                        applicationSnapshotRepository.findByApplicationIdAndChunkOrder(branchedApplicationId, 1))
                .defaultIfEmpty(new ApplicationSnapshotResponseDTO(null));
    }

    @Override
    public Mono<Application> restoreSnapshot(String applicationId, String branchName) {
        return applicationService
                .findByBranchNameAndDefaultApplicationId(
                        branchName, applicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(application -> getApplicationJsonStringFromSnapShot(application.getId())
                        .zipWith(Mono.just(application)))
                .flatMap(objects -> {
                    String applicationJsonString = objects.getT1();
                    Application application = objects.getT2();
                    ApplicationJson applicationJson = gson.fromJson(applicationJsonString, ApplicationJson.class);
                    return importService.restoreSnapshot(
                            application.getWorkspaceId(), application.getId(), branchName, applicationJson);
                })
                .map(importableArtifact -> (Application) importableArtifact)
                .flatMap(application -> applicationSnapshotRepository
                        .deleteAllByApplicationId(application.getId())
                        .thenReturn(application))
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    private Mono<String> getApplicationJsonStringFromSnapShot(String applicationId) {
        return applicationSnapshotRepository
                .findByApplicationId(applicationId)
                .sort(Comparator.comparingInt(ApplicationSnapshot::getChunkOrder))
                .map(ApplicationSnapshot::getData)
                .collectList()
                .map(bytes -> {
                    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                    for (byte[] b : bytes) {
                        outputStream.writeBytes(b);
                    }
                    return outputStream.toString(StandardCharsets.UTF_8);
                });
    }

    private List<ApplicationSnapshot> createSnapshotsObjects(byte[] bytes, String applicationId) {
        List<ApplicationSnapshot> applicationSnapshots = new ArrayList<>();
        int total = bytes.length;
        int copiedCount = 0;
        int chunkOrder = 1;

        while (copiedCount < total) {
            int currentChunkSize = MAX_SNAPSHOT_SIZE;
            if (copiedCount + currentChunkSize > total) {
                currentChunkSize = total - copiedCount;
            }
            byte[] sub = new byte[currentChunkSize];
            System.arraycopy(bytes, copiedCount, sub, 0, currentChunkSize);
            copiedCount += currentChunkSize;

            // create snapshot that'll contain the chunk of data
            ApplicationSnapshot applicationSnapshot = new ApplicationSnapshot();
            applicationSnapshot.setData(sub);
            applicationSnapshot.setApplicationId(applicationId);
            applicationSnapshot.setChunkOrder(chunkOrder);
            applicationSnapshots.add(applicationSnapshot);

            chunkOrder++;
        }
        return applicationSnapshots;
    }

    @Override
    public Mono<Boolean> deleteSnapshot(String applicationId, String branchName) {
        // find root application by applicationId and branchName
        return applicationService
                .findBranchedApplicationId(branchName, applicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(branchedAppId -> applicationSnapshotRepository
                        .deleteAllByApplicationId(branchedAppId)
                        .thenReturn(Boolean.TRUE));
    }
}
