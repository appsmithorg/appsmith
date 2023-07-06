package com.appsmith.server.repositories.ee;

import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.repositories.UserGroupRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Slf4j
@DirtiesContext
public class UserGroupRepositoryTestEE {
    @Autowired
    private UserGroupRepository userGroupRepository;

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetUserGroupsWithParamsPaginated_multipleNames_allExistingNamesShouldCome() {
        String testName = "testGetUserGroupsWithParamsPaginated_multipleNames_allExistingNamesShouldCome";
        UserGroup userGroup1 = new UserGroup();
        userGroup1.setName(testName + "_1");
        UserGroup createdUserGroup1 = userGroupRepository.save(userGroup1).block();

        UserGroup userGroup2 = new UserGroup();
        userGroup2.setName(testName + "_2");
        UserGroup createdUserGroup2 = userGroupRepository.save(userGroup2).block();

        String nonExistingGroupName = testName + "_3";

        List<String> emailsForFilter = List.of(userGroup1.getName(), userGroup2.getName(), nonExistingGroupName);

        // test for both users created above.
        PagedDomain<UserGroup> pagedUsers = userGroupRepository
                .findUserGroupsWithParamsPaginated(2, 0, emailsForFilter, List.of(), Optional.empty())
                .block();
        assertThat(pagedUsers.getCount()).isEqualTo(2);
        assertThat(pagedUsers.getTotal()).isEqualTo(2);

        Optional<UserGroup> optionalUserGroup1 = pagedUsers.getContent().stream()
                .filter(user -> user.getName().equals(userGroup1.getName()))
                .findFirst();
        Optional<UserGroup> optionalUserGroup2 = pagedUsers.getContent().stream()
                .filter(user -> user.getName().equals(userGroup2.getName()))
                .findFirst();
        Optional<UserGroup> optionalUserGroup3 = pagedUsers.getContent().stream()
                .filter(user -> user.getName().equals(nonExistingGroupName))
                .findFirst();
        assertThat(optionalUserGroup1.isPresent()).isTrue();
        assertThat(optionalUserGroup2.isPresent()).isTrue();
        assertThat(optionalUserGroup3.isPresent()).isFalse();

        assertThat(optionalUserGroup1.get().getId()).isEqualTo(createdUserGroup1.getId());
        assertThat(optionalUserGroup2.get().getId()).isEqualTo(createdUserGroup2.getId());
        // test for both users created above.

        userGroupRepository
                .deleteAllById(List.of(createdUserGroup1.getId(), createdUserGroup2.getId()))
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetUserGroupsWithParamsPaginated_multipleNamesCaseInsensitive_allExistingNamesShouldCome() {
        String testName =
                "testGetUserGroupsWithParamsPaginated_multipleNamesCaseInsensitive_allExistingNamesShouldCome";
        UserGroup userGroup1 = new UserGroup();
        userGroup1.setName(testName + "_1");
        UserGroup createdUserGroup1 = userGroupRepository.save(userGroup1).block();

        UserGroup userGroup2 = new UserGroup();
        userGroup2.setName(testName + "_2");
        UserGroup createdUserGroup2 = userGroupRepository.save(userGroup2).block();

        String nonExistingGroupName = testName + "_3";

        List<String> emailsForFilter = List.of(
                userGroup1.getName().toUpperCase(),
                userGroup2.getName().toUpperCase(),
                nonExistingGroupName.toUpperCase());

        // test for both users created above.
        PagedDomain<UserGroup> pagedUsers = userGroupRepository
                .findUserGroupsWithParamsPaginated(2, 0, emailsForFilter, List.of(), Optional.empty())
                .block();
        assertThat(pagedUsers.getCount()).isEqualTo(2);
        assertThat(pagedUsers.getTotal()).isEqualTo(2);

        Optional<UserGroup> optionalUserGroup1 = pagedUsers.getContent().stream()
                .filter(user -> user.getName().equals(userGroup1.getName()))
                .findFirst();
        Optional<UserGroup> optionalUserGroup2 = pagedUsers.getContent().stream()
                .filter(user -> user.getName().equals(userGroup2.getName()))
                .findFirst();
        Optional<UserGroup> optionalUserGroup3 = pagedUsers.getContent().stream()
                .filter(user -> user.getName().equals(nonExistingGroupName))
                .findFirst();
        assertThat(optionalUserGroup1.isPresent()).isTrue();
        assertThat(optionalUserGroup2.isPresent()).isTrue();
        assertThat(optionalUserGroup3.isPresent()).isFalse();

        assertThat(optionalUserGroup1.get().getId()).isEqualTo(createdUserGroup1.getId());
        assertThat(optionalUserGroup2.get().getId()).isEqualTo(createdUserGroup2.getId());
        // test for both users created above.

        userGroupRepository
                .deleteAllById(List.of(createdUserGroup1.getId(), createdUserGroup2.getId()))
                .block();
    }
}
