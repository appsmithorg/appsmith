package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserData;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;


@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
class CustomUserDataRepositoryImplTest {

    @Autowired
    private UserDataRepository userDataRepository;

    private Mono<UserData> createUser(String userId, List<String> orgIds, List<String> appIds) {
        return userDataRepository
                .findByUserId(userId)
                .defaultIfEmpty(new UserData()).flatMap(userData -> {
                    userData.setUserId(userId);
                    userData.setRecentlyUsedOrgIds(orgIds);
                    userData.setRecentlyUsedAppIds(appIds);
                    return userDataRepository.save(userData);
                });
    }

    @Test
    void removeIdFromRecentlyUsedList_WhenOrgIdAlreadyExists_OrgIdRemoved() {
        // create an user data with 3 org id in the recently used orgid list
        String sampleUserId = "abcd";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, List.of("123", "234", "345"), null);

        // remove the 345 org id from the recently used orgid list
        Mono<UpdateResult> updateResultMono = createUserDataMono.flatMap(
                userData -> userDataRepository.removeIdFromRecentlyUsedList(
                        userData.getUserId(), "345", List.of())
        );

        // read the userdata
        Mono<UserData> readUserDataMono = userDataRepository.findByUserId(sampleUserId);

        // add the read user data mono after the update mono
        Mono<UserData> userDataAfterUpdateMono = updateResultMono.then(readUserDataMono);

        StepVerifier.create(userDataAfterUpdateMono).assertNext(userData -> {
            Assert.assertEquals(2, userData.getRecentlyUsedOrgIds().size());
            Assert.assertArrayEquals(List.of("123", "234").toArray(), userData.getRecentlyUsedOrgIds().toArray());
        }).verifyComplete();
    }

    @Test
    void removeIdFromRecentlyUsedList_WhenOrgIdDoesNotExist_NothingRemoved() {
        // create an user data with 3 org id in the recently used orgid list
        String sampleUserId = "efgh";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, List.of("123", "234", "345"), null);

        // remove the 345 org id from the recently used orgid list
        Mono<UpdateResult> updateResultMono = createUserDataMono.flatMap(
                userData -> userDataRepository.removeIdFromRecentlyUsedList(
                        userData.getUserId(), "678", List.of()
                )
        );

        // read the userdata
        Mono<UserData> readUserDataMono = userDataRepository.findByUserId(sampleUserId);

        // add the read user data mono after the update mono
        Mono<UserData> userDataAfterUpdateMono = updateResultMono.then(readUserDataMono);

        StepVerifier.create(userDataAfterUpdateMono).assertNext(userData -> {
            Assert.assertEquals(3, userData.getRecentlyUsedOrgIds().size());
            Assert.assertArrayEquals(List.of("123", "234", "345").toArray(), userData.getRecentlyUsedOrgIds().toArray());
        }).verifyComplete();
    }

    @Test
    void removeIdFromRecentlyUsedList_WhenAppIdExists_AppIdRemoved() {
        // create a user data with 3 app id in the recently used appId list
        String sampleUserId = "abcd";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, null, List.of("123", "456", "789"));

        // remove the 345 org id from the recently used orgid list
        Mono<UpdateResult> updateResultMono = createUserDataMono.flatMap(
                // orgId does not matter
                userData -> userDataRepository.removeIdFromRecentlyUsedList(
                        userData.getUserId(), "345", List.of("123", "789")) // remove 123 and 789
        );

        // read the userdata
        Mono<UserData> readUserDataMono = userDataRepository.findByUserId(sampleUserId);

        // add the read user data mono after the update mono
        Mono<UserData> userDataAfterUpdateMono = updateResultMono.then(readUserDataMono);

        StepVerifier.create(userDataAfterUpdateMono).assertNext(userData -> {
            List<String> recentlyUsedAppIds = userData.getRecentlyUsedAppIds();
            assertThat(recentlyUsedAppIds.size()).isEqualTo(1);
            assertThat(recentlyUsedAppIds.get(0)).isEqualTo("456");
        }).verifyComplete();
    }

    @Test
    void removeIdFromRecentlyUsedList_WhenOrgIdAndAppIdExists_BothAreRemoved() {
        // create a user data with 3 app id in the recently used appId list
        String sampleUserId = "abcd";
        Mono<UserData> createUserDataMono = createUser(
                sampleUserId, List.of("abc", "efg", "hij"), List.of("123", "456", "789")
        );

        // remove the 345 org id from the recently used orgid list
        Mono<UpdateResult> updateResultMono = createUserDataMono.flatMap(
                // orgId does not matter
                userData -> userDataRepository.removeIdFromRecentlyUsedList(
                        userData.getUserId(), "efg", List.of("123", "789")) // remove 123 and 789
        );

        // read the userdata
        Mono<UserData> readUserDataMono = userDataRepository.findByUserId(sampleUserId);

        // add the read user data mono after the update mono
        Mono<UserData> userDataAfterUpdateMono = updateResultMono.then(readUserDataMono);

        StepVerifier.create(userDataAfterUpdateMono).assertNext(userData -> {
            List<String> recentlyUsedAppIds = userData.getRecentlyUsedAppIds();
            List<String> recentlyUsedOrgIds = userData.getRecentlyUsedOrgIds();
            assertThat(recentlyUsedAppIds.size()).isEqualTo(1);
            assertThat(recentlyUsedAppIds.get(0)).isEqualTo("456");

            assertThat(recentlyUsedOrgIds.size()).isEqualTo(2);
            assertThat(recentlyUsedOrgIds).contains("abc", "hij");
        }).verifyComplete();
    }
}