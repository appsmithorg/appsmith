package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
public class CustomApplicationRepositoryImplTest {
    @Autowired
    ApplicationRepository applicationRepository;


    @Test
    public void getAllApplicationId_WhenDataExists_ReturnsList() {
        String randomOrgId = UUID.randomUUID().toString();
        Application application1 = new Application();
        application1.setOrganizationId(randomOrgId);
        application1.setName("my test app");

        Application application2 = new Application();
        application2.setOrganizationId(randomOrgId);
        application2.setName("my another test app");

        Mono<List<String>> appIds = applicationRepository.saveAll(List.of(application1, application2))
                .then(applicationRepository.getAllApplicationId(randomOrgId));

        StepVerifier.create(appIds).assertNext(strings -> {
            assertThat(strings.size()).isEqualTo(2);
        }).verifyComplete();
    }

    @Test
    public void getAllApplicationId_WhenNoneExists_ReturnsEmptyList() {
        String randomOrgId = UUID.randomUUID().toString();
        Mono<List<String>> appIds = applicationRepository.getAllApplicationId(randomOrgId);
        StepVerifier.create(appIds).assertNext(strings -> {
            assertThat(CollectionUtils.isEmpty(strings)).isTrue();
        }).verifyComplete();
    }
}