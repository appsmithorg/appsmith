package com.appsmith.server.repositories;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.projections.ApplicationSnapshotResponseDTO;
import com.appsmith.server.repositories.cakes.ApplicationSnapshotRepositoryCake;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(AfterAllCleanUpExtension.class)
@SpringBootTest
public class ApplicationSnapshotRepositoryTest {
    @Autowired
    private ApplicationSnapshotRepositoryCake applicationSnapshotRepository;

    @Test
    @WithUserDetails("api_user")
    public void findWithoutData_WhenMatched_ReturnsMatchedDocumentWithoutData() {
        String testAppId1 = UUID.randomUUID().toString(),
                testAppId2 = UUID.randomUUID().toString();

        ApplicationSnapshot snapshot1 = new ApplicationSnapshot();
        snapshot1.setApplicationId(testAppId1);
        snapshot1.setChunkOrder(1);

        ApplicationSnapshot snapshot2 = new ApplicationSnapshot();
        snapshot2.setData(new byte[10]);
        snapshot2.setApplicationId(testAppId2);
        snapshot2.setChunkOrder(1);

        Mono<ApplicationSnapshotResponseDTO> snapshotMono = applicationSnapshotRepository
                .saveAll(List.of(snapshot1, snapshot2))
                .then(applicationSnapshotRepository.findByApplicationIdAndChunkOrder(testAppId2, 1));

        StepVerifier.create(snapshotMono)
                .assertNext(applicationSnapshot -> {
                    assertThat(applicationSnapshot.updatedAt()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void findWithoutData_WhenMultipleChunksArePresent_ReturnsSingleOne() {
        String testAppId1 = UUID.randomUUID().toString();

        // create two snapshots with same application id and another one with different application id
        ApplicationSnapshot snapshot1 = new ApplicationSnapshot();
        snapshot1.setApplicationId(testAppId1);
        snapshot1.setChunkOrder(1);

        ApplicationSnapshot snapshot2 = new ApplicationSnapshot();
        snapshot2.setApplicationId(testAppId1);
        snapshot2.setChunkOrder(2);

        Mono<ApplicationSnapshotResponseDTO> snapshotMono = applicationSnapshotRepository
                .saveAll(List.of(snapshot1, snapshot2))
                .then(applicationSnapshotRepository.findByApplicationIdAndChunkOrder(testAppId1, 1));

        StepVerifier.create(snapshotMono)
                .assertNext(applicationSnapshot -> {
                    assertThat(applicationSnapshot.updatedAt()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void deleteAllByApplicationId_WhenMatched_ReturnsMatchedDocumentWithoutData() {
        String testAppId1 = UUID.randomUUID().toString(),
                testAppId2 = UUID.randomUUID().toString();

        // create two snapshots with same application id and another one with different application id
        ApplicationSnapshot snapshot1 = new ApplicationSnapshot();
        snapshot1.setApplicationId(testAppId1);
        snapshot1.setChunkOrder(1);

        ApplicationSnapshot snapshot2 = new ApplicationSnapshot();
        snapshot2.setApplicationId(testAppId1);
        snapshot2.setChunkOrder(2);

        ApplicationSnapshot snapshot3 = new ApplicationSnapshot();
        snapshot3.setApplicationId(testAppId2);
        snapshot3.setChunkOrder(1);

        Flux<ApplicationSnapshot> applicationSnapshots = applicationSnapshotRepository
                .saveAll(List.of(snapshot1, snapshot2, snapshot3))
                .then(applicationSnapshotRepository.deleteAllByApplicationId(testAppId1))
                .thenMany(applicationSnapshotRepository.findByApplicationId(testAppId1));

        StepVerifier.create(applicationSnapshots).verifyComplete();

        StepVerifier.create(applicationSnapshotRepository.findByApplicationId(testAppId2))
                .assertNext(applicationSnapshot -> {
                    assertThat(applicationSnapshot.getApplicationId()).isEqualTo(testAppId2);
                    assertThat(applicationSnapshot.getChunkOrder()).isEqualTo(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void findByApplicationId_WhenMatched_ReturnsMatchedDocumentWithoutData() {
        String testAppId1 = UUID.randomUUID().toString(),
                testAppId2 = UUID.randomUUID().toString();

        // create two snapshots with same application id and another one with different application id
        ApplicationSnapshot snapshot1 = new ApplicationSnapshot();
        snapshot1.setApplicationId(testAppId1);
        snapshot1.setChunkOrder(1);

        ApplicationSnapshot snapshot2 = new ApplicationSnapshot();
        snapshot2.setApplicationId(testAppId1);
        snapshot2.setChunkOrder(2);

        ApplicationSnapshot snapshot3 = new ApplicationSnapshot();
        snapshot3.setApplicationId(testAppId2);
        snapshot3.setChunkOrder(1);

        Flux<ApplicationSnapshot> applicationSnapshots = applicationSnapshotRepository
                .saveAll(List.of(snapshot1, snapshot2, snapshot3))
                .thenMany(applicationSnapshotRepository.findByApplicationId(testAppId1));

        StepVerifier.create(applicationSnapshots)
                .assertNext(applicationSnapshot -> {
                    assertThat(applicationSnapshot.getApplicationId()).isEqualTo(testAppId1);
                })
                .assertNext(applicationSnapshot -> {
                    assertThat(applicationSnapshot.getApplicationId()).isEqualTo(testAppId1);
                })
                .verifyComplete();
    }
}
