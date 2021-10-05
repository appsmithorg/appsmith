package com.appsmith.server.repositories;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.UserRole;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
class OrganizationRepositoryTest {

    @Autowired
    private OrganizationRepository organizationRepository;

    @Test
    void updateUserRoleNames_WhenUserIdMatched_AllOrgsUpdated() {
        String oldUserName = "Old name",
                newUserName = "New name",
                userId = "user1";
        UserRole userRole = new UserRole();
        userRole.setName(oldUserName);
        userRole.setUserId(userId);

        List<UserRole> userRoles = new ArrayList<>();
        userRoles.add(userRole);

        Organization org1 = new Organization();
        org1.setId(UUID.randomUUID().toString());
        org1.setSlug(org1.getId());
        org1.setUserRoles(userRoles);

        Organization org2 = new Organization();
        org2.setId(UUID.randomUUID().toString());
        org2.setSlug(org2.getId());
        org2.setUserRoles(userRoles);

        // create two orgs
        Mono<Tuple2<Organization, Organization>> aveOrgsMonoZip = Mono.zip(
                organizationRepository.save(org1), organizationRepository.save(org2)
        );

        Mono<Tuple2<Organization, Organization>> updatedOrgTupleMono = aveOrgsMonoZip.flatMap(objects -> {
            // update the user names
            return organizationRepository.updateUserRoleNames(userId, newUserName).thenReturn(objects);
        }).flatMap(organizationTuple2 -> {
            // fetch the two orgs again
            Mono<Organization> updatedOrg1Mono = organizationRepository.findBySlug(org1.getId());
            Mono<Organization> updatedOrg2Mono = organizationRepository.findBySlug(org2.getId());
            return Mono.zip(updatedOrg1Mono, updatedOrg2Mono);
        });

        StepVerifier.create(updatedOrgTupleMono).assertNext(orgTuple -> {
            Organization o1 = orgTuple.getT1();
            Assert.assertEquals(1, o1.getUserRoles().size());
            UserRole userRole1 = o1.getUserRoles().get(0);
            Assert.assertEquals(userId, userRole1.getUserId());
            Assert.assertEquals(newUserName, userRole1.getName());

            Organization o2 = orgTuple.getT2();
            Assert.assertEquals(1, o2.getUserRoles().size());
            UserRole userRole2 = o2.getUserRoles().get(0);
            Assert.assertEquals(userId, userRole2.getUserId());
            Assert.assertEquals(newUserName, userRole2.getName());
        }).verifyComplete();
    }
}