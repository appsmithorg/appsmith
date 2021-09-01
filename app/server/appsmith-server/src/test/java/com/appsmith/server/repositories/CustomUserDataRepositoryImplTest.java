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

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
class CustomUserDataRepositoryImplTest {

    @Autowired
    private UserDataRepository userDataRepository;

    private Mono<UserData> createUser(String userId, List<String> orgIds) {
        String sampleUserId = userId;
        UserData sampleUserData = new UserData();
        sampleUserData.setUserId(sampleUserId);
        sampleUserData.setRecentlyUsedOrgIds(List.of("123", "234", "345"));
        return userDataRepository.save(sampleUserData);
    }

    @Test
    void removeOrgFromRecentlyUsedList_WhenOrgIdAlreadyExists_OrgIdRemoved() {
        // create an user data with 3 org id in the recently used orgid list
        String sampleUserId = "abcd";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, List.of("123", "234", "345"));

        // remove the 345 org id from the recently used orgid list
        Mono<UpdateResult> updateResultMono = createUserDataMono.flatMap(
                userData -> userDataRepository.removeOrgFromRecentlyUsedList(userData.getUserId(), "345")
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
    void removeOrgFromRecentlyUsedList_WhenOrgIdDoesNotExist_NothingRemoved() {
        // create an user data with 3 org id in the recently used orgid list
        String sampleUserId = "efgh";
        Mono<UserData> createUserDataMono = createUser(sampleUserId, List.of("123", "234", "345"));

        // remove the 345 org id from the recently used orgid list
        Mono<UpdateResult> updateResultMono = createUserDataMono.flatMap(
                userData -> userDataRepository.removeOrgFromRecentlyUsedList(userData.getUserId(), "678")
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
}