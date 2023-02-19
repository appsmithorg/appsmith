package com.appsmith.server.repositories;

import com.appsmith.server.domains.ApplicationSnapshot;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;


@SpringBootTest
public class ApplicationSnapshotRepositoryTest {
    @Autowired
    private ApplicationSnapshotRepository applicationSnapshotRepository;

    @Test
    public void save_WhenSameApplicationId_DuplicateExceptionThrown() {
        String testAppId = UUID.randomUUID().toString();

        ApplicationSnapshot snapshot1 = new ApplicationSnapshot();
        snapshot1.setApplicationId(testAppId);

        ApplicationSnapshot snapshot2 = new ApplicationSnapshot();
        snapshot2.setApplicationId(testAppId);

        Mono<ApplicationSnapshot> saveSnapshotMono = applicationSnapshotRepository.save(snapshot1)
                .then(applicationSnapshotRepository.save(snapshot2));

        StepVerifier.create(saveSnapshotMono)
                .verifyError(DuplicateKeyException.class);
    }

    @Test
    public void findByApplicationId_WhenMatched_ReturnsMatchedDocument() {
        String testAppId1 = UUID.randomUUID().toString(),
                testAppId2 = UUID.randomUUID().toString();

        ApplicationSnapshot snapshot1 = new ApplicationSnapshot();
        snapshot1.setApplicationId(testAppId1);

        ApplicationSnapshot snapshot2 = new ApplicationSnapshot();
        snapshot2.setApplicationId(testAppId2);

        Mono<ApplicationSnapshot> snapshotMono = applicationSnapshotRepository.saveAll(List.of(snapshot1, snapshot2))
                .then(applicationSnapshotRepository.findByApplicationId(testAppId2));

        StepVerifier.create(snapshotMono).assertNext(applicationSnapshot -> {
            assertThat(applicationSnapshot.getApplicationId()).isEqualTo(testAppId2);
        }).verifyComplete();


    }
}