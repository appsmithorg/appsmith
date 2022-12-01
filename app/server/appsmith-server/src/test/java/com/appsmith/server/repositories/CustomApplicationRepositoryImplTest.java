package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
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

        Mono<List<String>> appIds = applicationRepository.saveAll(List.of(application1, application2))
                .then(applicationRepository.getAllApplicationId(randomWorkspaceId));

        StepVerifier.create(appIds).assertNext(strings -> {
            assertThat(strings.size()).isEqualTo(2);
        }).verifyComplete();
    }

    @Test
    public void getAllApplicationId_WhenNoneExists_ReturnsEmptyList() {
        String randomWorkspaceId = UUID.randomUUID().toString();
        Mono<List<String>> appIds = applicationRepository.getAllApplicationId(randomWorkspaceId);
        StepVerifier.create(appIds).assertNext(strings -> {
            assertThat(CollectionUtils.isEmpty(strings)).isTrue();
        }).verifyComplete();
    }
}