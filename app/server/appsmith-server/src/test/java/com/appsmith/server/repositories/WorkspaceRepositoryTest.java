package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserRole;
import com.appsmith.server.domains.Workspace;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class WorkspaceRepositoryTest {

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Test
    public void updateUserRoleNames_WhenUserIdMatched_AllOrgsUpdated() {
        String oldUserName = "Old name",
                newUserName = "New name",
                userId = "user1";
        UserRole userRole = new UserRole();
        userRole.setName(oldUserName);
        userRole.setUserId(userId);

        List<UserRole> userRoles = new ArrayList<>();
        userRoles.add(userRole);

        Workspace org1 = new Workspace();
        org1.setId(UUID.randomUUID().toString());
        org1.setSlug(org1.getId());
        org1.setUserRoles(userRoles);

        Workspace org2 = new Workspace();
        org2.setId(UUID.randomUUID().toString());
        org2.setSlug(org2.getId());
        org2.setUserRoles(userRoles);

        // create two orgs
        Mono<Tuple2<Workspace, Workspace>> aveOrgsMonoZip = Mono.zip(
                workspaceRepository.save(org1), workspaceRepository.save(org2)
        );

        Mono<Tuple2<Workspace, Workspace>> updatedOrgTupleMono = aveOrgsMonoZip.flatMap(objects -> {
            // update the user names
            return workspaceRepository.updateUserRoleNames(userId, newUserName).thenReturn(objects);
        }).flatMap(workspaceTuple2 -> {
            // fetch the two orgs again
            Mono<Workspace> updatedOrg1Mono = workspaceRepository.findBySlug(org1.getId());
            Mono<Workspace> updatedOrg2Mono = workspaceRepository.findBySlug(org2.getId());
            return Mono.zip(updatedOrg1Mono, updatedOrg2Mono);
        });

        StepVerifier.create(updatedOrgTupleMono).assertNext(orgTuple -> {
            Workspace o1 = orgTuple.getT1();
            assertEquals(1, o1.getUserRoles().size());
            UserRole userRole1 = o1.getUserRoles().get(0);
            assertEquals(userId, userRole1.getUserId());
            assertEquals(newUserName, userRole1.getName());

            Workspace o2 = orgTuple.getT2();
            assertEquals(1, o2.getUserRoles().size());
            UserRole userRole2 = o2.getUserRoles().get(0);
            assertEquals(userId, userRole2.getUserId());
            assertEquals(newUserName, userRole2.getName());
        }).verifyComplete();
    }
}