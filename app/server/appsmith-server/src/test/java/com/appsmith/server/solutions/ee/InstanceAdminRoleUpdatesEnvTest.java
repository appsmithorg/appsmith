package com.appsmith.server.solutions.ee;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.EnvManager;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_ADMIN_EMAILS;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_ADMIN_ROLE;
import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_CONFIG;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
@DirtiesContext
public class InstanceAdminRoleUpdatesEnvTest {

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    EnvManager envManager;

    @Autowired
    ConfigService configService;

    @Autowired
    UserService userService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @BeforeAll
    public static void createEnvFile() {
        String envFilePath = System.getenv("APPSMITH_ENVFILE_PATH");
        File envFile = new File(envFilePath);
        try {
            envFile.createNewFile();
        } catch (IOException e) {
            assert false;
        }
    }

    @AfterAll
    public static void removeEnvFile() {
        String envFilePath = System.getenv("APPSMITH_ENVFILE_PATH");
        File envFile = new File(envFilePath);
        envFile.delete();
    }

    @BeforeEach
    public void assignUserTestToInstanceAdminRole() {
        User testUser = userService.findByEmail("usertest@usertest.com").block();
        userUtils.makeSuperUser(List.of(testUser)).block();
        User apiUser = userService.findByEmail("api_user").block();
        userUtils.removeSuperUser(List.of(apiUser)).block();
    }

    @AfterEach
    public void unAssignUserTestFromInstanceAdminRole() {
        User testUser = userService.findByEmail("usertest@usertest.com").block();
        userUtils.removeSuperUser(List.of(testUser)).block();
        User apiUser = userService.findByEmail("api_user").block();
        userUtils.makeSuperUser(List.of(apiUser)).block();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    void associateInstanceAdminRoleThenEnvFileAdminEmailsShouldBeUpdated() {
        String instanceRoleId = configService
                .getByName(INSTANCE_CONFIG)
                .map(config -> config.getConfig().getAsString(DEFAULT_PERMISSION_GROUP))
                .block();

        User user = new User();
        user.setEmail("associateInstanceAdminRoleThenEnvFileAdminEmailsShouldBeUpdated@test.com");
        user.setPassword("associateInstanceAdminRoleThenEnvFileAdminEmailsShouldBeUpdated");
        User createdUser = userService.create(user).block();

        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setRolesAdded(
                Set.of(new PermissionGroupCompactDTO(instanceRoleId, INSTANCE_ADMIN_ROLE)));
        updateRoleAssociationDTO.setUsers(
                Set.of(new UserCompactDTO(createdUser.getId(), createdUser.getUsername(), null)));

        Boolean roleAssociationChanged = userAndAccessManagementService
                .changeRoleAssociations(updateRoleAssociationDTO, "originHeader")
                .block();
        assertThat(roleAssociationChanged).isTrue();

        String adminEmailsString = envManager.getAll().block().get(APPSMITH_ADMIN_EMAILS.name());
        Set<String> adminEmailsFromEnv =
                Arrays.stream(adminEmailsString.split(",")).collect(Collectors.toSet());

        PermissionGroup instanceAdminRole =
                permissionGroupRepository.findById(instanceRoleId).block();

        Set<String> adminEmailsFromRole = userService
                .findAllByIdsIn(instanceAdminRole.getAssignedToUserIds())
                .map(User::getUsername)
                .collect(Collectors.toSet())
                .block();

        assertThat(adminEmailsFromRole).isEqualTo(adminEmailsFromEnv);
    }
}
