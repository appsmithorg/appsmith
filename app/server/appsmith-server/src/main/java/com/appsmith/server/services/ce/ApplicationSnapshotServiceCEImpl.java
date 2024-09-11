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

    private static final int MAX_SNAPSHOT_SIZE = 15 * 1024 * 1024; // 15 MB

    @Override
    public Mono<Boolean> createApplicationSnapshot(String branchedApplicationId) {
        return exportService
                .exportByArtifactId(
                        branchedApplicationId, SerialiseArtifactObjective.VERSION_CONTROL, ArtifactType.APPLICATION)
                .flatMapMany(artifactExchangeJson -> {
                    ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
                    return applicationSnapshotRepository
                            .deleteAllByApplicationId(branchedApplicationId)
                            .thenMany(createSnapshots(branchedApplicationId, applicationJson));
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
    public Mono<ApplicationSnapshotResponseDTO> getWithoutDataByBranchedApplicationId(String branchedApplicationId) {
        // get application first to check the permission and get child aka branched application ID
        return applicationSnapshotRepository
                .findByApplicationIdAndChunkOrder(branchedApplicationId, 1)
                .defaultIfEmpty(new ApplicationSnapshotResponseDTO(null));
    }

    @Override
    public Mono<Application> restoreSnapshot(String branchedApplicationId) {
        return applicationService
                .findById(branchedApplicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, branchedApplicationId)))
                .flatMap(application -> getApplicationJsonStringFromSnapShot(application.getId())
                        .zipWith(Mono.just(application)))
                .flatMap(objects -> {
                    String applicationJsonString = objects.getT1();
                    Application application = objects.getT2();
                    ApplicationJson applicationJson = gson.fromJson(applicationJsonString, ApplicationJson.class);
                    return importService.restoreSnapshot(
                            application.getWorkspaceId(), application.getId(), applicationJson);
                })
                .map(importableArtifact -> (Application) importableArtifact)
                .flatMap(application -> applicationSnapshotRepository
                        .deleteAllByApplicationId(application.getId())
                        .thenReturn(application));
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
    public Mono<Boolean> deleteSnapshot(String branchedApplicationId) {
        return applicationSnapshotRepository
                .deleteAllByApplicationId(branchedApplicationId)
                .thenReturn(Boolean.TRUE);
    }
}
