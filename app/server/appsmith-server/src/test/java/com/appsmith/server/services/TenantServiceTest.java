package com.appsmith.server.services;

import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UpdateLicenseKeyDTO;
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
import com.appsmith.server.solutions.LicenseAPIManager;
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

import static com.appsmith.server.constants.ApiConstants.CLOUD_SERVICES_SIGNATURE;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
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
    LicenseAPIManager licenseAPIManager;

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
                    assertThat(tenantConfiguration.getWhiteLabelLogo())
                            .isEqualTo(tenant.getTenantConfiguration().getWhiteLabelLogo());
                    assertThat(tenantConfiguration.getWhiteLabelFavicon())
                            .isEqualTo(tenant.getTenantConfiguration().getWhiteLabelFavicon());
                    assertThat(tenantConfiguration.getWhiteLabelEnable()).isNullOrEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateTenantLicenseKey_validLicenseKey_Success() {
        String licenseKey = "sample-license-key";
        License license = new License();
        license.setActive(true);
        license.setType(LicenseType.PAID);
        license.setKey(licenseKey);
        license.setStatus(LicenseStatus.valueOf("ACTIVE"));
        license.setExpiry(Instant.now().plus(Duration.ofHours(1)));
        license.setOrigin(LicenseOrigin.SELF_SERVE);
        license.setPlan(LicensePlan.SELF_SERVE);

        // Mock CS response to get valid license
        Mockito.when(licenseAPIManager.licenseCheck(any())).thenReturn(Mono.just(license));

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO(licenseKey, false);
        StepVerifier.create(tenantService.updateTenantLicenseKey(updateLicenseKeyDTO))
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    License savedLicense = tenantConfiguration.getLicense();
                    assertThat(savedLicense.getKey()).isEqualTo(DataTypeStringUtils.maskString(licenseKey, 8, 32, 'x'));
                    assertThat(savedLicense.getActive()).isTrue();
                    assertThat(savedLicense.getType()).isEqualTo(LicenseType.PAID);
                    assertThat(savedLicense.getExpiry()).isAfter(Instant.now());
                    assertThat(savedLicense.getOrigin()).isEqualTo(LicenseOrigin.SELF_SERVE);
                    assertThat(savedLicense.getPlan()).isEqualTo(LicensePlan.SELF_SERVE);
                    assertThat(savedLicense.getStatus()).isEqualTo(LicenseStatus.ACTIVE);
                    assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
                })
                .verifyComplete();

        // Verify getTenantConfiguration() has license details after setting a valid license
        StepVerifier.create(tenantService.getDefaultTenant())
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    License savedLicense = tenantConfiguration.getLicense();
                    assertThat(savedLicense.getKey()).isEqualTo(licenseKey);
                    assertThat(savedLicense.getActive()).isTrue();
                    assertThat(savedLicense.getType()).isEqualTo(LicenseType.PAID);
                    assertThat(savedLicense.getExpiry()).isAfter(Instant.now());
                    assertThat(savedLicense.getOrigin()).isEqualTo(LicenseOrigin.SELF_SERVE);
                    assertThat(savedLicense.getPlan()).isEqualTo(LicensePlan.SELF_SERVE);
                    assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateTenantLicenseKey_licenseInGracePeriod_Success() {
        String licenseKey = UUID.randomUUID().toString();
        License license = new License();
        license.setActive(true);
        license.setType(LicenseType.PAID);
        license.setKey(licenseKey);
        license.setStatus(LicenseStatus.valueOf("IN_GRACE_PERIOD"));
        license.setExpiry(Instant.now().plus(Duration.ofHours(1)));
        license.setOrigin(LicenseOrigin.SELF_SERVE);
        license.setPlan(LicensePlan.SELF_SERVE);

        // Mock CS response to get valid license
        Mockito.when(licenseAPIManager.licenseCheck(any())).thenReturn(Mono.just(license));

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO(licenseKey, false);
        StepVerifier.create(tenantService.updateTenantLicenseKey(updateLicenseKeyDTO))
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    License savedLicense = tenantConfiguration.getLicense();
                    assertThat(savedLicense.getKey()).isEqualTo(DataTypeStringUtils.maskString(licenseKey, 8, 32, 'x'));
                    assertThat(savedLicense.getActive()).isTrue();
                    assertThat(savedLicense.getType()).isEqualTo(LicenseType.PAID);
                    assertThat(savedLicense.getExpiry()).isAfter(Instant.now());
                    assertThat(savedLicense.getOrigin()).isEqualTo(LicenseOrigin.SELF_SERVE);
                    assertThat(savedLicense.getPlan()).isEqualTo(LicensePlan.SELF_SERVE);
                    assertThat(savedLicense.getStatus()).isEqualTo(LicenseStatus.IN_GRACE_PERIOD);
                    assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
                })
                .verifyComplete();

        // Verify getTenantConfiguration() has license details after setting a valid license
        StepVerifier.create(tenantService.getDefaultTenant())
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    License savedLicense = tenantConfiguration.getLicense();
                    assertThat(savedLicense.getKey()).isEqualTo(licenseKey);
                    assertThat(savedLicense.getActive()).isTrue();
                    assertThat(savedLicense.getType()).isEqualTo(LicenseType.PAID);
                    assertThat(savedLicense.getExpiry()).isAfter(Instant.now());
                    assertThat(savedLicense.getOrigin()).isEqualTo(LicenseOrigin.SELF_SERVE);
                    assertThat(savedLicense.getPlan()).isEqualTo(LicensePlan.SELF_SERVE);
                    assertThat(savedLicense.getStatus()).isEqualTo(LicenseStatus.IN_GRACE_PERIOD);
                    assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateTenantLicenseKey_Invalid_LicenseKey() {
        String licenseKey = UUID.randomUUID().toString();
        License license = new License();
        license.setActive(false);
        license.setKey(licenseKey);

        // Mock CS response to get invalid license
        Mockito.when(licenseAPIManager.licenseCheck(any())).thenReturn(Mono.just(license));

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO(licenseKey, false);
        Mono<Tenant> addLicenseKeyMono = tenantService.updateTenantLicenseKey(updateLicenseKeyDTO);
        StepVerifier.create(addLicenseKeyMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_LICENSE_KEY_ENTERED.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails("usertest@usertest.com")
    public void updateTenantLicenseKey_missingManageTenantPermission_throwsException() {
        String licenseKey = "SOME-INVALID-LICENSE-KEY";
        License license = new License();
        license.setActive(false);
        license.setKey(licenseKey);

        // Mock CS response to get invalid license
        Mockito.when(licenseAPIManager.licenseCheck(any())).thenReturn(Mono.just(license));

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO(licenseKey, false);
        Mono<Tenant> addLicenseKeyMono = tenantService.updateTenantLicenseKey(updateLicenseKeyDTO);
        StepVerifier.create(addLicenseKeyMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.TENANT, DEFAULT)))
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_getTenantConfiguration_returnsNullLicense_ifNoLicensePresent() {
        License license = new License();

        // Mock CS response to get valid license
        Mockito.when(licenseAPIManager.licenseCheck(any())).thenReturn(Mono.just(license));
        // Performing same process as a scheduled license check
        tenantService.checkAndUpdateDefaultTenantLicense().block();

        // Verify getTenantConfiguration() should have a license with plan only after updating with empty License object
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration()).isNotNull();
                    assertThat(tenant.getTenantConfiguration().getLicense()).isNotNull();
                    License freeLicense = tenant.getTenantConfiguration().getLicense();
                    assertThat(freeLicense.getPlan()).isEqualTo(LicensePlan.FREE);

                    assertThat(freeLicense.getActive()).isNull();
                    assertThat(freeLicense.getId()).isNull();
                    assertThat(freeLicense.getKey()).isNull();
                    assertThat(freeLicense.getType()).isNull();
                    assertThat(freeLicense.getExpiry()).isNull();
                    assertThat(freeLicense.getStatus()).isNull();
                    assertThat(freeLicense.getOrigin()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_getTenantConfiguration_licensePlanRemainsSame() {
        String licenseKey = UUID.randomUUID().toString();
        License license = new License();
        license.setActive(true);
        license.setType(LicenseType.PAID);
        license.setKey(licenseKey);
        license.setStatus(LicenseStatus.valueOf("EXPIRED"));
        license.setExpiry(Instant.now().minus(Duration.ofHours(1)));
        license.setOrigin(LicenseOrigin.SELF_SERVE);
        license.setPlan(LicensePlan.SELF_SERVE);

        // Mock CS response to get valid license
        Mockito.when(licenseAPIManager.licenseCheck(any())).thenReturn(Mono.just(license));
        // Performing same process as a scheduled license check
        tenantService.checkAndUpdateDefaultTenantLicense().block();

        // Verify getTenantConfiguration() should have a license with plan only after updating with empty License object
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration()).isNotNull();
                    assertThat(tenant.getTenantConfiguration().getLicense()).isNotNull();
                    License expiredLicense = tenant.getTenantConfiguration().getLicense();
                    assertThat(expiredLicense.getPlan()).isEqualTo(license.getPlan());
                    assertThat(expiredLicense.getStatus()).isEqualTo(license.getStatus());
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
        UserGroupDTO createdUserGroupDTO =
                userGroupService.createGroup(userGroup).block();

        List<String> assignedToRoles = permissionGroupRepository
                .findByAssignedToUserIdsIn(apiUser.getId())
                .filter(role -> !PermissionGroupUtils.isUserManagementRole(role))
                .map(PermissionGroup::getName)
                .collectList()
                .block();

        List<String> memberOfGroups = userGroupRepository
                .findAllByUsersIn(Set.of(apiUser.getId()))
                .map(UserGroup::getName)
                .collectList()
                .block();

        // Set the showRolesAndGroups property in tenant configuration to True.
        TenantConfiguration tenantConfiguration_showRolesAndGroupsTrue = new TenantConfiguration();
        tenantConfiguration_showRolesAndGroupsTrue.setShowRolesAndGroups(true);
        Tenant updatedTenant_showRolesAndGroupsTrue = tenantService
                .updateDefaultTenantConfiguration(tenantConfiguration_showRolesAndGroupsTrue)
                .block();

        Assertions.assertThat(updatedTenant_showRolesAndGroupsTrue.getTenantConfiguration())
                .isNotNull();
        Assertions.assertThat(updatedTenant_showRolesAndGroupsTrue
                        .getTenantConfiguration()
                        .getShowRolesAndGroups())
                .isTrue();

        // Roles and Groups information should be present in the User Profile.
        UserProfileDTO userProfileDTO_shouldContainRolesAndGroupInfo = sessionUserService
                .getCurrentUser()
                .flatMap(userService::buildUserProfileDTO)
                .block();

        Assertions.assertThat(userProfileDTO_shouldContainRolesAndGroupInfo.getRoles())
                .isNotEmpty();
        Assertions.assertThat(userProfileDTO_shouldContainRolesAndGroupInfo.getRoles())
                .containsExactlyInAnyOrderElementsOf(assignedToRoles);
        Assertions.assertThat(userProfileDTO_shouldContainRolesAndGroupInfo.getGroups())
                .isNotEmpty();
        Assertions.assertThat(userProfileDTO_shouldContainRolesAndGroupInfo.getGroups())
                .containsExactlyInAnyOrderElementsOf(memberOfGroups);

        // Set the showRolesAndGroups property in tenant configuration to False.
        TenantConfiguration tenantConfiguration_showRolesAndGroupsFalse = new TenantConfiguration();
        tenantConfiguration_showRolesAndGroupsFalse.setShowRolesAndGroups(false);
        Tenant updatedTenant_showRolesAndGroupsFalse = tenantService
                .updateDefaultTenantConfiguration(tenantConfiguration_showRolesAndGroupsFalse)
                .block();

        Assertions.assertThat(updatedTenant_showRolesAndGroupsFalse.getTenantConfiguration())
                .isNotNull();
        Assertions.assertThat(updatedTenant_showRolesAndGroupsFalse
                        .getTenantConfiguration()
                        .getShowRolesAndGroups())
                .isFalse();

        // Roles and Groups information should not be present in the User Profile.
        UserProfileDTO userProfileDTO_shouldNotContainRolesAndGroupInfo = sessionUserService
                .getCurrentUser()
                .flatMap(userService::buildUserProfileDTO)
                .block();

        Assertions.assertThat(userProfileDTO_shouldNotContainRolesAndGroupInfo.getRoles())
                .isNullOrEmpty();
        Assertions.assertThat(userProfileDTO_shouldNotContainRolesAndGroupInfo.getGroups())
                .isNullOrEmpty();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateTenantLicenseKey_invalidLicenseSignature_throwException() {

        // Mock CS response to get invalid signature
        Mockito.when(licenseAPIManager.licenseCheck(any()))
                .thenThrow(new AppsmithException(AppsmithError.INVALID_PARAMETER, CLOUD_SERVICES_SIGNATURE));

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO("invalid_signature_license_test", false);
        StepVerifier.create(tenantService.updateTenantLicenseKey(updateLicenseKeyDTO))
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(CLOUD_SERVICES_SIGNATURE)))
                .verify();
    }

    @Test
    public void removeTenantLicenseKey_withoutPermission_throwException() {
        StepVerifier.create(tenantService.removeLicenseKey())
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.TENANT, DEFAULT)))
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void removeTenantLicenseKey_noLicensePresent_provideExistingTenant() {

        // Mock CS response
        Mockito.when(licenseAPIManager.downgradeTenantToFreePlan(any())).thenReturn(Mono.just(true));

        StepVerifier.create(tenantService.removeLicenseKey())
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration()).isEqualTo(tenant.getTenantConfiguration());
                    assertThat(tenant1.getTenantConfiguration().getLicense()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void removeTenantLicenseKey_removeExistingLicense_success() {

        License license = new License();
        license.setKey(UUID.randomUUID().toString());
        license.setActive(true);

        tenant.getTenantConfiguration().setLicense(license);
        Mockito.when(licenseAPIManager.downgradeTenantToFreePlan(any())).thenReturn(Mono.just(true));

        // Add the dummy license
        StepVerifier.create(tenantService.save(tenant))
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration().getLicense()).isNotNull();
                })
                .verifyComplete();

        // Check if the license field is null after the license is removed as a part of downgrade to community flow
        StepVerifier.create(tenantService.removeLicenseKey())
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration().getLicense()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void syncTenantLicensePlan_startWithDifferentPlans_success() {

        License license = new License();
        license.setKey(UUID.randomUUID().toString());
        license.setActive(true);
        license.setPlan(LicensePlan.ENTERPRISE);
        license.setPreviousPlan(LicensePlan.SELF_SERVE);

        tenant.getTenantConfiguration().setLicense(license);

        Mono<Tenant> tenantMono =
                tenantService.save(tenant).flatMap(updatedTenant -> tenantService.getTenantConfiguration());

        // Add the dummy license
        StepVerifier.create(tenantMono)
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration()).isNotNull();
                    License tenantLicense = tenant1.getTenantConfiguration().getLicense();
                    assertThat(tenantLicense).isNotNull();
                    assertThat(tenantLicense.getPlan()).isEqualTo(license.getPlan());
                    assertThat(tenantLicense.getPreviousPlan()).isEqualTo(license.getPreviousPlan());
                })
                .verifyComplete();

        // Check if the license field is null after the license is removed as a part of downgrade to community flow
        StepVerifier.create(tenantService.syncLicensePlans())
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration().getLicense()).isNotNull();
                    License tenantLicense = tenant1.getTenantConfiguration().getLicense();
                    assertThat(tenantLicense.getPlan()).isEqualTo(tenantLicense.getPreviousPlan());
                    assertThat(tenantLicense.getPlan()).isEqualTo(LicensePlan.ENTERPRISE);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateTenantLicenseKey_validLicenseKeyWithDryRun_dbStateIsUnchanged() {
        String licenseKey = "sample-license-key";
        License license = new License();
        license.setActive(true);
        license.setType(LicenseType.PAID);
        license.setKey(licenseKey);
        license.setStatus(LicenseStatus.valueOf("ACTIVE"));
        license.setExpiry(Instant.now().plus(Duration.ofHours(1)));
        license.setOrigin(LicenseOrigin.SELF_SERVE);
        license.setPlan(LicensePlan.SELF_SERVE);

        // Mock CS response to get valid license
        Mockito.when(licenseAPIManager.licenseCheck(any())).thenReturn(Mono.just(license));

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO(licenseKey, true);
        StepVerifier.create(tenantService.updateTenantLicenseKey(updateLicenseKeyDTO))
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    License savedLicense = tenantConfiguration.getLicense();
                    assertThat(savedLicense.getKey()).isEqualTo(DataTypeStringUtils.maskString(licenseKey, 8, 32, 'x'));
                    assertThat(savedLicense.getActive()).isTrue();
                    assertThat(savedLicense.getType()).isEqualTo(LicenseType.PAID);
                    assertThat(savedLicense.getExpiry()).isAfter(Instant.now());
                    assertThat(savedLicense.getOrigin()).isEqualTo(LicenseOrigin.SELF_SERVE);
                    assertThat(savedLicense.getPlan()).isEqualTo(LicensePlan.SELF_SERVE);
                    assertThat(savedLicense.getStatus()).isEqualTo(LicenseStatus.ACTIVE);
                    assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
                })
                .verifyComplete();

        // Verify license is not stored in tenant even after successful validation
        StepVerifier.create(tenantService.getDefaultTenant())
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    assertThat(tenantConfiguration.getLicense()).isNull();
                })
                .verifyComplete();
    }
}
