package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserData;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;


@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class CustomUserDataRepositoryTest {

    @Autowired
    private UserDataRepository userDataRepository;

    private Mono<UserData> createUser(String userId, List<String> workspaceIds, List<String> appIds) {
        return userDataRepository
                .findByUserId(userId)
                .defaultIfEmpty(new UserData()).flatMap(userData -> {
                    userData.setUserId(userId);
                    userData.setRecentlyUsedWorkspaceIds(workspaceIds);
                    userData.setRecentlyUsedAppIds(appIds);
                    return userDataRepository.save(userData);
                });
    }

    @Test
    public void removeIdFromRecentlyUsedList_WhenWorkspaceIdAlreadyExists_WorkspaceIdRemoved() {
        // create an user data with 3 org id in the recently used workspaceId list
        String sampleUserId = "abcd";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, List.of("123", "234", "345"), null);

        // remove the 345 org id from the recently used workspaceId list
        Mono<UpdateResult> updateResultMono = createUserDataMono.flatMap(
                userData -> userDataRepository.removeIdFromRecentlyUsedList(
                        userData.getUserId(), "345", List.of())
        );

        // read the userdata
        Mono<UserData> readUserDataMono = userDataRepository.findByUserId(sampleUserId);

        // add the read user data mono after the update mono
        Mono<UserData> userDataAfterUpdateMono = updateResultMono.then(readUserDataMono);

        StepVerifier.create(userDataAfterUpdateMono).assertNext(userData -> {
            assertEquals(2, userData.getRecentlyUsedWorkspaceIds().size());
            assertArrayEquals(List.of("123", "234").toArray(), userData.getRecentlyUsedWorkspaceIds().toArray());
        }).verifyComplete();
    }

    @Test
    public void removeIdFromRecentlyUsedList_WhenWorkspaceIdDoesNotExist_NothingRemoved() {
        // create an user data with 3 org id in the recently used workspaceId list
        String sampleUserId = "efgh";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, List.of("123", "234", "345"), null);

        // remove the 345 org id from the recently used workspaceId list
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
            assertEquals(3, userData.getRecentlyUsedWorkspaceIds().size());
            assertArrayEquals(List.of("123", "234", "345").toArray(), userData.getRecentlyUsedWorkspaceIds().toArray());
        }).verifyComplete();
    }

    @Test
    public void removeIdFromRecentlyUsedList_WhenAppIdExists_AppIdRemoved() {
        // create a user data with 3 app id in the recently used appId list
        String sampleUserId = "abcd";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, null, List.of("123", "456", "789"));

        // remove the 345 org id from the recently used workspaceId list
        Mono<UpdateResult> updateResultMono = createUserDataMono.flatMap(
                // workspaceId does not matter
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
    public void removeIdFromRecentlyUsedList_WhenWorkspaceIdAndAppIdExists_BothAreRemoved() {
        // create a user data with 3 app id in the recently used appId list
        String sampleUserId = "abcd";
        Mono<UserData> createUserDataMono = createUser(
                sampleUserId, List.of("abc", "efg", "hij"), List.of("123", "456", "789")
        );

        // remove the 345 org id from the recently used workspaceId list
        Mono<UpdateResult> updateResultMono = createUserDataMono.flatMap(
                // workspaceId does not matter
                userData -> userDataRepository.removeIdFromRecentlyUsedList(
                        userData.getUserId(), "efg", List.of("123", "789")) // remove 123 and 789
        );

        // read the userdata
        Mono<UserData> readUserDataMono = userDataRepository.findByUserId(sampleUserId);

        // add the read user data mono after the update mono
        Mono<UserData> userDataAfterUpdateMono = updateResultMono.then(readUserDataMono);

        StepVerifier.create(userDataAfterUpdateMono).assertNext(userData -> {
            List<String> recentlyUsedAppIds = userData.getRecentlyUsedAppIds();
            List<String> recentlyUsedWorkspaceIds = userData.getRecentlyUsedWorkspaceIds();
            assertThat(recentlyUsedAppIds.size()).isEqualTo(1);
            assertThat(recentlyUsedAppIds.get(0)).isEqualTo("456");

            assertThat(recentlyUsedWorkspaceIds.size()).isEqualTo(2);
            assertThat(recentlyUsedWorkspaceIds).contains("abc", "hij");
        }).verifyComplete();
    }

    @Test
    public void findPhotoAssetsByUserIds_WhenPhotoAssetIdExist_ReturnsPhotoAssetId() {
        String randomId = UUID.randomUUID().toString();
        String firstId = "first_" + randomId,
                secondId = "second_" + randomId,
                photoId = "photo_" + randomId;

        UserData userDataOne = new UserData();
        userDataOne.setUserId(firstId);
        userDataOne.setProfilePhotoAssetId(photoId);
        userDataOne.setRecentlyUsedAppIds(List.of("abc"));

        UserData userDataTwo = new UserData();
        userDataTwo.setUserId(secondId);
        userDataTwo.setRecentlyUsedAppIds(List.of("abc"));

        Flux<UserData> userDataFlux = userDataRepository.saveAll(List.of(userDataOne, userDataTwo))
                .map(UserData::getUserId)
                .collectList()
                .flatMapMany(userDataRepository::findPhotoAssetsByUserIds);

        StepVerifier.create(userDataFlux.collectMap(UserData::getUserId))
                .assertNext(userDataMap -> {
                    assertThat(userDataMap.size()).isEqualTo(2);

                    UserData firstUserData = userDataMap.get(firstId);
                    assertThat(firstUserData.getProfilePhotoAssetId()).isEqualTo(photoId);
                    assertThat(firstUserData.getRecentlyUsedAppIds()).isNull();

                    UserData secondUserData = userDataMap.get(secondId);
                    assertThat(secondUserData.getProfilePhotoAssetId()).isNull();
                    assertThat(secondUserData.getRecentlyUsedAppIds()).isNull();
                })
                .verifyComplete();

    }
}