package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.projections.UserDataProfilePhotoProjection;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Slf4j
public class CustomUserDataRepositoryTest {

    @Autowired
    private UserDataRepository userDataRepository;

    private Mono<UserData> createUser(String userId, List<String> workspaceIds) {
        return userDataRepository
                .findByUserId(userId)
                .defaultIfEmpty(new UserData())
                .flatMap(userData -> {
                    userData.setUserId(userId);
                    userData.setRecentlyUsedEntityIds(new ArrayList<>());
                    workspaceIds.forEach(workspaceId -> {
                        RecentlyUsedEntityDTO recentlyUsedEntityDTO = new RecentlyUsedEntityDTO();
                        recentlyUsedEntityDTO.setWorkspaceId(workspaceId);
                        userData.getRecentlyUsedEntityIds().add(recentlyUsedEntityDTO);
                    });
                    return userDataRepository.save(userData);
                });
    }

    @Test
    public void removeIdFromRecentlyUsedList_WhenWorkspaceIdAlreadyExists_WorkspaceIdRemoved() {
        // create an user data with 3 org id in the recently used workspaceId list
        String sampleUserId = "abcd";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, List.of("123", "234", "345"));

        // remove the 345 org id from the recently used workspaceId list
        Mono<Void> updateResultMono = createUserDataMono.flatMap(
                userData -> userDataRepository.removeEntitiesFromRecentlyUsedList(userData.getUserId(), "345"));

        // read the userdata
        Mono<UserData> readUserDataMono = userDataRepository.findByUserId(sampleUserId);

        // add the read user data mono after the update mono
        Mono<UserData> userDataAfterUpdateMono = updateResultMono.then(readUserDataMono);

        StepVerifier.create(userDataAfterUpdateMono)
                .assertNext(userData -> {
                    assertEquals(2, userData.getRecentlyUsedEntityIds().size());
                    assertArrayEquals(
                            List.of("123", "234").toArray(),
                            userData.getRecentlyUsedEntityIds().stream()
                                    .map(RecentlyUsedEntityDTO::getWorkspaceId)
                                    .toArray());
                })
                .verifyComplete();
    }

    @Test
    public void removeIdFromRecentlyUsedList_WhenWorkspaceIdDoesNotExist_NothingRemoved() {
        // create an user data with 3 org id in the recently used workspaceId list
        String sampleUserId = "efgh";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, List.of("123", "234", "345"));

        // remove the 345 org id from the recently used workspaceId list
        Mono<Void> updateResultMono = createUserDataMono.flatMap(
                userData -> userDataRepository.removeEntitiesFromRecentlyUsedList(userData.getUserId(), "678"));

        // read the userdata
        Mono<UserData> readUserDataMono = userDataRepository.findByUserId(sampleUserId);

        // add the read user data mono after the update mono
        Mono<UserData> userDataAfterUpdateMono = updateResultMono.then(readUserDataMono);

        StepVerifier.create(userDataAfterUpdateMono)
                .assertNext(userData -> {
                    assertEquals(3, userData.getRecentlyUsedEntityIds().size());
                    assertArrayEquals(
                            List.of("123", "234", "345").toArray(),
                            userData.getRecentlyUsedEntityIds().stream()
                                    .map(RecentlyUsedEntityDTO::getWorkspaceId)
                                    .toArray());
                })
                .verifyComplete();
    }

    @Test
    public void removeIdFromRecentlyUsedList_WhenWorkspaceIdExists_BothAreRemoved() {
        // create a user data with 3 app id in the recently used appId list
        String sampleUserId = "abcd";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, List.of("abc", "efg", "hij"));

        // remove the efg workspace id from the recently used workspaceId list
        Mono<Void> updateResultMono = createUserDataMono.flatMap(
                userData -> userDataRepository.removeEntitiesFromRecentlyUsedList(userData.getUserId(), "efg"));

        // read the userdata
        Mono<UserData> readUserDataMono = userDataRepository.findByUserId(sampleUserId);

        // add the read user data mono after the update mono
        Mono<UserData> userDataAfterUpdateMono = updateResultMono.then(readUserDataMono);

        StepVerifier.create(userDataAfterUpdateMono)
                .assertNext(userData -> {
                    List<String> recentlyUsedWorkspaceIds = userData.getRecentlyUsedEntityIds().stream()
                            .map(RecentlyUsedEntityDTO::getWorkspaceId)
                            .toList();

                    assertThat(recentlyUsedWorkspaceIds).hasSize(2);
                    assertThat(recentlyUsedWorkspaceIds).contains("abc", "hij");
                })
                .verifyComplete();
    }

    @Test
    public void findPhotoAssetsByUserIds_WhenPhotoAssetIdExist_ReturnsPhotoAssetId() {
        String randomId = UUID.randomUUID().toString();
        String firstId = "first_" + randomId, secondId = "second_" + randomId, photoId = "photo_" + randomId;

        UserData userDataOne = new UserData();
        userDataOne.setUserId(firstId);
        userDataOne.setProfilePhotoAssetId(photoId);

        UserData userDataTwo = new UserData();
        userDataTwo.setUserId(secondId);

        Flux<UserDataProfilePhotoProjection> userDataFlux = userDataRepository
                .saveAll(List.of(userDataOne, userDataTwo))
                .map(UserData::getUserId)
                .collectList()
                .flatMapMany(userDataRepository::findByUserIdIn);

        StepVerifier.create(userDataFlux.collectMap(UserDataProfilePhotoProjection::getUserId))
                .assertNext(userDataMap -> {
                    assertThat(userDataMap).hasSize(2);

                    UserDataProfilePhotoProjection firstUserData = userDataMap.get(firstId);
                    assertThat(firstUserData.getProfilePhotoAssetId()).isEqualTo(photoId);

                    UserDataProfilePhotoProjection secondUserData = userDataMap.get(secondId);
                    assertThat(secondUserData.getProfilePhotoAssetId()).isNull();
                })
                .verifyComplete();
    }

    @Test
    public void fetchMostRecentlyUsedWorkspaceId_withAndWithoutRecentlyUsedIds_success() {
        String randomId = UUID.randomUUID().toString();
        String firstId = "first_" + randomId, photoId = "photo_" + randomId;

        UserData userData = new UserData();
        userData.setUserId(firstId);
        userData.setProfilePhotoAssetId(photoId);

        // Assert when no recently used entity ids are present
        userData = userDataRepository.save(userData).block();
        StepVerifier.create(userDataRepository.fetchMostRecentlyUsedWorkspaceId(firstId))
                .assertNext(workspaceId -> {
                    assertThat(workspaceId).isEmpty();
                })
                .verifyComplete();

        // Recently used entity ids are present
        RecentlyUsedEntityDTO recentlyUsedEntityDTO = new RecentlyUsedEntityDTO();
        recentlyUsedEntityDTO.setWorkspaceId("123");
        recentlyUsedEntityDTO.setApplicationIds(List.of("456"));

        assert userData != null : "userData can't be null";
        userData.setRecentlyUsedEntityIds(List.of(recentlyUsedEntityDTO));
        userDataRepository.save(userData).block();
        StepVerifier.create(userDataRepository.fetchMostRecentlyUsedWorkspaceId(firstId))
                .assertNext(workspaceId -> {
                    assertThat(workspaceId).isEqualTo("123");
                })
                .verifyComplete();
    }
}
