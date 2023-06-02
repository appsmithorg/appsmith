package com.appsmith.server.services;

import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PermissionGroupUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.LicenseValidator;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class TenantServiceTest {
    @Autowired
    TenantService tenantService;

    @Autowired
    TenantRepository tenantRepository;

    @Autowired
    LicenseConfig licenseConfig;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @MockBean
    LicenseValidator licenseValidator;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    UserService userService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserGroupRepository userGroupRepository;

    private Tenant tenant;

    @BeforeEach
    public void setup() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setWhiteLabelEnable("true");
        tenantConfiguration.setWhiteLabelLogo("https://custom.random.url");
        tenantConfiguration.setWhiteLabelFavicon("https://custom.random.favicon");

        tenant = tenantService.getDefaultTenant().block();
        tenant.setTenantConfiguration(tenantConfiguration);
        tenant = tenantRepository.save(this.tenant).block();

        // Make api_user super-user to test tenant admin functionality
        User api_user = userRepository.findByEmail("api_user").block();
        // Todo change this to tenant admin once we introduce multitenancy
        userUtils.makeSuperUser(List.of(api_user)).block();
    }
    
    @Test
    @WithUserDetails("anonymousUser")
    public void getTenantConfig_Valid_AnonymousUser() {
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    assertThat(tenantConfiguration.getWhiteLabelLogo()).isEqualTo(tenant.getTenantConfiguration().getWhiteLabelLogo());
                    assertThat(tenantConfiguration.getWhiteLabelFavicon()).isEqualTo(tenant.getTenantConfiguration().getWhiteLabelFavicon());
                    assertThat(tenantConfiguration.getWhiteLabelEnable()).isNullOrEmpty();
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails("api_user")
    public void setTenantLicenseKey_validLicenseKey_Success() {
        String licenseKey = "sample-license-key";
        TenantConfiguration.License license = new TenantConfiguration.License();
        license.setActive(true);
        license.setType(LicenseType.PAID);
        license.setKey(licenseKey);
        license.setStatus(LicenseStatus.valueOf("ACTIVE"));
        license.setExpiry(Instant.now().plus(Duration.ofHours(1)));
        license.setOrigin(LicenseOrigin.SELF_SERVE);

        // Mock CS response to get valid license
        Mockito.when(licenseValidator.licenseCheck(any()))
                .thenReturn(Mono.just(license));

        StepVerifier.create(tenantService.setTenantLicenseKey(licenseKey))
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    TenantConfiguration.License savedLicense = tenantConfiguration.getLicense();
                    assertThat(savedLicense.getKey()).isEqualTo(DataTypeStringUtils.maskString(licenseKey, 8, 32, 'x'));
                    assertThat(savedLicense.getActive()).isTrue();
                    assertThat(savedLicense.getType()).isEqualTo(LicenseType.PAID);
                    assertThat(savedLicense.getExpiry()).isAfter(Instant.now());
                    assertThat(savedLicense.getOrigin()).isEqualTo(LicenseOrigin.SELF_SERVE);
                    assertThat(savedLicense.getStatus()).isEqualTo(LicenseStatus.ACTIVE);
                    assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
                })
                .verifyComplete();

        // Verify getTenantConfiguration() has license details after setting a valid license
        StepVerifier.create(tenantService.getDefaultTenant())
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    TenantConfiguration.License savedLicense = tenantConfiguration.getLicense();
                    assertThat(savedLicense.getKey()).isEqualTo(licenseKey);
                    assertThat(savedLicense.getActive()).isTrue();
                    assertThat(savedLicense.getType()).isEqualTo(LicenseType.PAID);
                    assertThat(savedLicense.getExpiry()).isAfter(Instant.now());
                    assertThat(savedLicense.getOrigin()).isEqualTo(LicenseOrigin.SELF_SERVE);
                    assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void setTenantLicenseKey_licenseInGracePeriod_Success() {
        String licenseKey = UUID.randomUUID().toString();
        TenantConfiguration.License license = new TenantConfiguration.License();
        license.setActive(true);
        license.setType(LicenseType.PAID);
        license.setKey(licenseKey);
        license.setStatus(LicenseStatus.valueOf("IN_GRACE_PERIOD"));
        license.setExpiry(Instant.now().plus(Duration.ofHours(1)));
        license.setOrigin(LicenseOrigin.SELF_SERVE);

        // Mock CS response to get valid license
        Mockito.when(licenseValidator.licenseCheck(any()))
            .thenReturn(Mono.just(license));

        StepVerifier.create(tenantService.setTenantLicenseKey(licenseKey))
            .assertNext(tenant -> {
                TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                TenantConfiguration.License savedLicense = tenantConfiguration.getLicense();
                assertThat(savedLicense.getKey()).isEqualTo(DataTypeStringUtils.maskString(licenseKey, 8, 32, 'x'));
                assertThat(savedLicense.getActive()).isTrue();
                assertThat(savedLicense.getType()).isEqualTo(LicenseType.PAID);
                assertThat(savedLicense.getExpiry()).isAfter(Instant.now());
                assertThat(savedLicense.getOrigin()).isEqualTo(LicenseOrigin.SELF_SERVE);
                assertThat(savedLicense.getStatus()).isEqualTo(LicenseStatus.IN_GRACE_PERIOD);
                assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
            })
            .verifyComplete();

        // Verify getTenantConfiguration() has license details after setting a valid license
        StepVerifier.create(tenantService.getDefaultTenant())
            .assertNext(tenant -> {
                TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                TenantConfiguration.License savedLicense = tenantConfiguration.getLicense();
                assertThat(savedLicense.getKey()).isEqualTo(licenseKey);
                assertThat(savedLicense.getActive()).isTrue();
                assertThat(savedLicense.getType()).isEqualTo(LicenseType.PAID);
                assertThat(savedLicense.getExpiry()).isAfter(Instant.now());
                assertThat(savedLicense.getOrigin()).isEqualTo(LicenseOrigin.SELF_SERVE);
                assertThat(savedLicense.getStatus()).isEqualTo(LicenseStatus.IN_GRACE_PERIOD);
                assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void setTenantLicenseKey_Invalid_LicenseKey() {
        String licenseKey = UUID.randomUUID().toString();
        TenantConfiguration.License license = new TenantConfiguration.License();
        license.setActive(false);
        license.setKey(licenseKey);

        // Mock CS response to get invalid license
        Mockito.when(licenseValidator.licenseCheck(any()))
            .thenReturn(Mono.just(license));

        Mono<Tenant> addLicenseKeyMono = tenantService.setTenantLicenseKey(licenseKey);
        StepVerifier.create(addLicenseKeyMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                    throwable.getMessage().equals(AppsmithError.INVALID_LICENSE_KEY_ENTERED.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails("usertest@usertest.com")
    public void setTenantLicenseKey_missingManageTenantPermission_throwsException() {
        String licenseKey = "SOME-INVALID-LICENSE-KEY";
        TenantConfiguration.License license = new TenantConfiguration.License();
        license.setActive(false);
        license.setKey(licenseKey);

        // Mock CS response to get invalid license
        Mockito.when(licenseValidator.licenseCheck(any()))
            .thenReturn(Mono.just(license));

        Mono<Tenant> addLicenseKeyMono = tenantService.setTenantLicenseKey(licenseKey);
        StepVerifier.create(addLicenseKeyMono)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                && throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.TENANT, FieldName.DEFAULT)))
            .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_getTenantConfiguration_returnsNullLicense_ifNoLicensePresent() {
        TenantConfiguration.License license = new TenantConfiguration.License();

        // Mock CS response to get valid license
        Mockito.when(licenseValidator.licenseCheck(any()))
                .thenReturn(Mono.just(license));
        // Performing same process as a scheduled license check
        tenantService.checkAndUpdateDefaultTenantLicense().block();

        // Verify getTenantConfiguration() should have null license after updating with empty License object
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration()).isNotNull();
                    assertThat(tenant.getTenantConfiguration().getLicense()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test_setShowRolesAndGroupInTenant_checkRolesAndGroupsExistInUserProfile() {
        String testName = "test_setShowRolesAndGroupInTenant_checkRolesAndGroupsExistInUserProfile";
        User apiUser = userRepository.findByEmail("api_user").block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        userGroup.setUsers(Set.of(apiUser.getId()));
        UserGroupDTO createdUserGroupDTO = userGroupService.createGroup(userGroup).block();

        List<String> assignedToRoles = permissionGroupRepository.findByAssignedToUserIdsIn(apiUser.getId())
                .filter(role -> !PermissionGroupUtils.isUserManagementRole(role))
                .map(PermissionGroup::getName)
                .collectList().block();

        List<String> memberOfGroups = userGroupRepository.findAllByUsersIn(Set.of(apiUser.getId()))
                .map(UserGroup::getName)
                .collectList().block();

        // Set the showRolesAndGroups property in tenant configuration to True.
        TenantConfiguration tenantConfiguration_showRolesAndGroupsTrue = new TenantConfiguration();
        tenantConfiguration_showRolesAndGroupsTrue.setShowRolesAndGroups(true);
        Tenant updatedTenant_showRolesAndGroupsTrue = tenantService.updateDefaultTenantConfiguration(tenantConfiguration_showRolesAndGroupsTrue).block();

        Assertions.assertThat(updatedTenant_showRolesAndGroupsTrue.getTenantConfiguration()).isNotNull();
        Assertions.assertThat(updatedTenant_showRolesAndGroupsTrue.getTenantConfiguration().getShowRolesAndGroups()).isTrue();

        // Roles and Groups information should be present in the User Profile.
        UserProfileDTO userProfileDTO_shouldContainRolesAndGroupInfo = sessionUserService.getCurrentUser()
                .flatMap(userService::buildUserProfileDTO)
                .block();

        Assertions.assertThat(userProfileDTO_shouldContainRolesAndGroupInfo.getRoles()).isNotEmpty();
        Assertions.assertThat(userProfileDTO_shouldContainRolesAndGroupInfo.getRoles()).containsExactlyInAnyOrderElementsOf(assignedToRoles);
        Assertions.assertThat(userProfileDTO_shouldContainRolesAndGroupInfo.getGroups()).isNotEmpty();
        Assertions.assertThat(userProfileDTO_shouldContainRolesAndGroupInfo.getGroups()).containsExactlyInAnyOrderElementsOf(memberOfGroups);


        // Set the showRolesAndGroups property in tenant configuration to False.
        TenantConfiguration tenantConfiguration_showRolesAndGroupsFalse = new TenantConfiguration();
        tenantConfiguration_showRolesAndGroupsFalse.setShowRolesAndGroups(false);
        Tenant updatedTenant_showRolesAndGroupsFalse = tenantService.updateDefaultTenantConfiguration(tenantConfiguration_showRolesAndGroupsFalse).block();

        Assertions.assertThat(updatedTenant_showRolesAndGroupsFalse.getTenantConfiguration()).isNotNull();
        Assertions.assertThat(updatedTenant_showRolesAndGroupsFalse.getTenantConfiguration().getShowRolesAndGroups()).isFalse();


        // Roles and Groups information should not be present in the User Profile.
        UserProfileDTO userProfileDTO_shouldNotContainRolesAndGroupInfo = sessionUserService.getCurrentUser()
                .flatMap(userService::buildUserProfileDTO)
                .block();

        Assertions.assertThat(userProfileDTO_shouldNotContainRolesAndGroupInfo.getRoles()).isNullOrEmpty();
        Assertions.assertThat(userProfileDTO_shouldNotContainRolesAndGroupInfo.getGroups()).isNullOrEmpty();
    }
}