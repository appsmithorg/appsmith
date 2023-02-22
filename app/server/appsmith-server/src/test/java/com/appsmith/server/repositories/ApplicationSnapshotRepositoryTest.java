package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.dtos.ApplicationJson;
import com.google.gson.Gson;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;


@SpringBootTest
public class ApplicationSnapshotRepositoryTest {
    @Autowired
    private ApplicationSnapshotRepository applicationSnapshotRepository;

    @Autowired
    private Gson gson;

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
    @WithUserDetails("api_user")
    public void findWithoutApplicationJson_WhenMatched_ReturnsMatchedDocumentWithoutApplicationJson() {
        String testAppId1 = UUID.randomUUID().toString(),
                testAppId2 = UUID.randomUUID().toString();

        ApplicationSnapshot snapshot1 = new ApplicationSnapshot();
        snapshot1.setApplicationId(testAppId1);

        ApplicationSnapshot snapshot2 = new ApplicationSnapshot();
        snapshot2.setApplicationJson("{}");
        snapshot2.setApplicationId(testAppId2);

        Mono<ApplicationSnapshot> snapshotMono = applicationSnapshotRepository.saveAll(List.of(snapshot1, snapshot2))
                .then(applicationSnapshotRepository.findWithoutApplicationJson(testAppId2));

        StepVerifier.create(snapshotMono).assertNext(applicationSnapshot -> {
            assertThat(applicationSnapshot.getApplicationId()).isEqualTo(testAppId2);
            assertThat(applicationSnapshot.getApplicationJson()).isNull();
        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationJson_WhenMatched_ReturnsMatchedDocumentWithApplicationJson() {
        String testAppId1 = UUID.randomUUID().toString(),
                testAppId2 = UUID.randomUUID().toString();

        ApplicationSnapshot snapshot1 = new ApplicationSnapshot();
        snapshot1.setApplicationId(testAppId1);

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(new Application());
        applicationJson.getExportedApplication().setName("findApplicationJson_test");

        ApplicationSnapshot snapshot2 = new ApplicationSnapshot();
        snapshot2.setApplicationJson(gson.toJson(applicationJson));
        snapshot2.setApplicationId(testAppId2);

        Mono<String> applicationJsonMono = applicationSnapshotRepository.saveAll(List.of(snapshot1, snapshot2))
                .then(applicationSnapshotRepository.findApplicationJson(testAppId2));

        StepVerifier.create(applicationJsonMono).assertNext(jsonString -> {
            ApplicationJson applicationJson1 = gson.fromJson(jsonString, ApplicationJson.class);
            Application application = applicationJson1.getExportedApplication();
            assertThat(application.getName()).isEqualTo("findApplicationJson_test");
        }).verifyComplete();
    }
}