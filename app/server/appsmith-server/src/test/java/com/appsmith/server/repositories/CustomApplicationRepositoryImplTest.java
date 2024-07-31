package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import com.appsmith.server.projections.IdOnly;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

@SpringBootTest
public class CustomApplicationRepositoryImplTest {
    @Autowired
    ApplicationRepository applicationRepository;

    @Test
    public void getAllApplicationId_WhenDataExists_ReturnsList() {
        String randomWorkspaceId = UUID.randomUUID().toString();
        Application application1 = new Application();
        application1.setWorkspaceId(randomWorkspaceId);
        application1.setName("my test app");

        Application application2 = new Application();
        application2.setWorkspaceId(randomWorkspaceId);
        application2.setName("my another test app");

        Flux<IdOnly> appIds = applicationRepository
                .saveAll(List.of(application1, application2))
                .thenMany(applicationRepository.findIdsByWorkspaceId(randomWorkspaceId));

        StepVerifier.create(appIds).expectNextCount(2).verifyComplete();
    }

    @Test
    public void getAllApplicationId_WhenNoneExists_ReturnsEmptyList() {
        String randomWorkspaceId = UUID.randomUUID().toString();
        Flux<IdOnly> appIds = applicationRepository.findIdsByWorkspaceId(randomWorkspaceId);
        StepVerifier.create(appIds).verifyComplete();
    }
}
