package com.appsmith.server.services;

import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.constants.AccessControlConstants;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.SubscriptionDetails;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.FeaturesResponseDTO;
import com.appsmith.server.dtos.ProductEdition;
import com.appsmith.server.dtos.UpdateLicenseKeyDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.PermissionGroupHelper;
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
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ApiConstants.CLOUD_SERVICES_SIGNATURE;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static com.appsmith.server.constants.ce.FieldNameCE.TENANT;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

@SpringBootTest
@ExtendWith(SpringExtension.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
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
    PermissionGroupService permissionGroupService;

    @Autowired
    UserGroupRepository userGroupRepository;

    @Autowired
    PermissionGroupHelper permissionGroupHelper;

    @Autowired
    BrandingService brandingService;

    @SpyBean
    CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    private Tenant tenant;

    @BeforeEach
    public void setup() {
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));
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
        when(featureFlagService.check(FeatureFlagEnum.license_branding_enabled)).thenReturn(Mono.just(true));
        when(featureFlagService.check(FeatureFlagEnum.license_session_limit_enabled))
                .thenReturn(Mono.just(true));
        when(featureFlagService.check(FeatureFlagEnum.license_pac_enabled)).thenReturn(Mono.just(true));
    }

    private void makeUserTenantAdminViaCustomUserGroup(User user) {
        userUtils.makeSuperUser(List.of(user)).block();
        UserGroup userGroup = new UserGroup();
        userGroup.setName("instance_admin_user_group");
        assert user.getId() != null;
        userGroup.setUsers(Set.of(user.getId()));
        UserGroupDTO userGroupDTO = userGroupService.createGroup(userGroup).block();
        assert userGroupDTO != null;
        userGroup = userGroupRepository.findById(userGroupDTO.getId()).block();

        PermissionGroup instanceAdminPermissionGroup =
                userUtils.getSuperAdminPermissionGroup().block();
        assert userGroup != null;
        permissionGroupService
                .bulkAssignToUserGroups(instanceAdminPermissionGroup, Set.of(userGroup))
                .block();
        userUtils.removeSuperUser(List.of(user)).block();
    }

    private void removeUserFromTenantAdmin() {
        User user = sessionUserService.getCurrentUser().block();
        if (user == null) {
            return;
        }

        userUtils.removeSuperUser(List.of(user)).block();
        userGroupService
                .findAllGroupsForUser(user.getId())
                .flatMap(userGroupCompactDTO -> userGroupRepository.findById(userGroupCompactDTO.getId()))
                .collectList()
                .zipWith(userUtils.getSuperAdminPermissionGroup())
                .flatMap(tuple -> {
                    Set<String> userGroupIds =
                            tuple.getT1().stream().map(UserGroup::getId).collect(Collectors.toSet());
                    return permissionGroupService.bulkUnassignFromUserGroupsWithoutPermission(
                            tuple.getT2(), userGroupIds);
                })
                .block();
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
        license.setPlan(LicensePlan.BUSINESS);
        license.setProductEdition(ProductEdition.COMMERCIAL);

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
                    assertThat(savedLicense.getPlan()).isEqualTo(LicensePlan.BUSINESS);
                    assertThat(savedLicense.getProductEdition()).isEqualTo(ProductEdition.COMMERCIAL);
                    assertThat(savedLicense.getStatus()).isEqualTo(LicenseStatus.ACTIVE);
                    assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
                    assertTrue(tenantConfiguration.getIsActivated());
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
                    assertThat(savedLicense.getPlan()).isEqualTo(LicensePlan.BUSINESS);
                    assertThat(savedLicense.getProductEdition()).isEqualTo(ProductEdition.COMMERCIAL);
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
        license.setPlan(LicensePlan.BUSINESS);
        license.setProductEdition(ProductEdition.COMMERCIAL);

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
                    assertThat(savedLicense.getPlan()).isEqualTo(LicensePlan.BUSINESS);
                    assertThat(savedLicense.getStatus()).isEqualTo(LicenseStatus.IN_GRACE_PERIOD);
                    assertThat(tenantConfiguration.getLicense()).isEqualTo(savedLicense);
                    assertTrue(tenantConfiguration.getIsActivated());
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
                    assertThat(savedLicense.getPlan()).isEqualTo(LicensePlan.BUSINESS);
                    assertThat(savedLicense.getProductEdition()).isEqualTo(ProductEdition.COMMERCIAL);
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

        // Assert that `isActivated` does not get modified for invalid license
        StepVerifier.create(tenantService.getDefaultTenant())
                .assertNext(tenant1 -> {
                    assertNull(tenant1.getTenantConfiguration().getIsActivated());
                })
                .verifyComplete();
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
        license.setPlan(LicensePlan.BUSINESS);
        license.setProductEdition(ProductEdition.COMMERCIAL);

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
                    assertThat(expiredLicense.getProductEdition()).isEqualTo(license.getProductEdition());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test_setShowRolesAndGroupInTenant_checkRolesAndGroupsExistInUserProfile() {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(Boolean.TRUE));
        String testName = "test_setShowRolesAndGroupInTenant_checkRolesAndGroupsExistInUserProfile";
        User apiUser = userRepository.findByEmail("api_user").block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        userGroup.setUsers(Set.of(apiUser.getId()));
        UserGroupDTO createdUserGroupDTO =
                userGroupService.createGroup(userGroup).block();

        List<String> assignedToRoles = permissionGroupRepository
                .findByAssignedToUserIdsIn(apiUser.getId())
                .filter(role -> !permissionGroupHelper.isUserManagementRole(role))
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

        UserProfileDTO userProfileDTO_shouldNotContainRolesAndGroupInfo = sessionUserService
                .getCurrentUser()
                .flatMap(userService::buildUserProfileDTO)
                .block();

        assertEquals(
                List.of(AccessControlConstants.ENABLE_PROGRAMMATIC_ACCESS_CONTROL_IN_ADMIN_SETTINGS),
                userProfileDTO_shouldNotContainRolesAndGroupInfo.getRoles());
        assertEquals(
                List.of(AccessControlConstants.ENABLE_PROGRAMMATIC_ACCESS_CONTROL_IN_ADMIN_SETTINGS),
                userProfileDTO_shouldNotContainRolesAndGroupInfo.getGroups());
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            test_setShowRolesAndGroupInTenant_checkRolesAndGroupsDoesNotExistInUserProfile_whenFeatureFlagDisabled() {

        String testName =
                "test_setShowRolesAndGroupInTenant_checkRolesAndGroupsDoesNotExistInUserProfile_whenFeatureFlagDisabled";
        User apiUser = userRepository.findByEmail("api_user").block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        userGroup.setUsers(Set.of(apiUser.getId()));
        UserGroupDTO createdUserGroupDTO =
                userGroupService.createGroup(userGroup).block();

        List<String> assignedToRoles = permissionGroupRepository
                .findByAssignedToUserIdsIn(apiUser.getId())
                .filter(role -> !permissionGroupHelper.isUserManagementRole(role))
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

        // Disable the showRolesAndGroups feature flag
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_pac_enabled))
                .thenReturn(Mono.just(false));

        UserProfileDTO userProfileDTO_noRolesAndGroupInfo = sessionUserService
                .getCurrentUser()
                .flatMap(userService::buildUserProfileDTO)
                .block();

        Assertions.assertThat(userProfileDTO_noRolesAndGroupInfo.getRoles())
                .isEqualTo(
                        List.of(
                                AccessControlConstants
                                        .UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC));
        Assertions.assertThat(userProfileDTO_noRolesAndGroupInfo.getGroups())
                .isEqualTo(
                        List.of(
                                AccessControlConstants
                                        .UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC));
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
    @WithUserDetails("api_user")
    public void test_updateDefaultTenantConfiguration_noUpdatesSent() {

        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        Tenant defaultTenantPostUpdate = tenantService
                .updateDefaultTenantConfiguration(Mono.empty(), Mono.empty(), Mono.empty())
                .block();
        assertTenantConfigurations(
                defaultTenantPostUpdate.getTenantConfiguration(),
                defaultTenant.getTenantConfiguration(),
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true);
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
    public void test_updateDefaultTenantConfiguration_updateBrandColors() {

        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        TenantConfiguration defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        String primary1 = "#df8d67";
        String active1 = "#df8d67";
        String background1 = "#fdf9f7";
        String font1 = "#000";
        String disabled1 = "#f8e6dd";
        String hover1 = "#d66d3e";
        String primary2 = "#df8d68";
        String active2 = "#df8d68";
        String background2 = "#fdf9f8";
        String font2 = "#001";
        String disabled2 = "#f8e6de";
        Mono<String> update1_brandColors = Mono.just("{\"brandColors\": {\"primary\":\"" + primary1
                + "\",\"background\":\"" + background1 + "\",\"font\":\"" + font1 + "\",\"disabled\":\"" + disabled1
                + "\",\"active\":\"" + active1 + "\", \"hover\":\"" + hover1 + "\"}}");

        Tenant defaultTenantPostUpdate1 = tenantService
                .updateDefaultTenantConfiguration(update1_brandColors, Mono.empty(), Mono.empty())
                .block();
        TenantConfiguration newTenantConfiguration1 = defaultTenantPostUpdate1.getTenantConfiguration();
        assertThat(newTenantConfiguration1.getBrandColors()).isNotNull();
        TenantConfiguration.BrandColors newBrandColors1 = newTenantConfiguration1.getBrandColors();
        assertThat(newBrandColors1.getPrimary()).isEqualTo(primary1);
        assertThat(newBrandColors1.getActive()).isEqualTo(active1);
        assertThat(newBrandColors1.getBackground()).isEqualTo(background1);
        assertThat(newBrandColors1.getFont()).isEqualTo(font1);
        assertThat(newBrandColors1.getDisabled()).isEqualTo(disabled1);
        assertThat(newBrandColors1.getHover()).isEqualTo(hover1);
        assertTenantConfigurations(
                newTenantConfiguration1, defaultTenantConfiguration, true, true, true, true, true, false, true, true);

        Mono<String> update2_brandColors = Mono.just(
                "{\"brandColors\": {\"primary\":\"" + primary2 + "\",\"background\":\"" + background2 + "\",\"font\":\""
                        + font2 + "\",\"active\":\"" + active2 + "\",\"disabled\":\"" + disabled2 + "\"}}");

        Tenant defaultTenantPostUpdate2 = tenantService
                .updateDefaultTenantConfiguration(update2_brandColors, Mono.empty(), Mono.empty())
                .block();
        TenantConfiguration newTenantConfiguration2 = defaultTenantPostUpdate2.getTenantConfiguration();
        assertThat(newTenantConfiguration2.getBrandColors()).isNotNull();
        TenantConfiguration.BrandColors newBrandColors2 = newTenantConfiguration2.getBrandColors();
        assertThat(newBrandColors2.getPrimary()).isEqualTo(primary2);
        assertThat(newBrandColors2.getActive()).isEqualTo(active2);
        assertThat(newBrandColors2.getBackground()).isEqualTo(background2);
        assertThat(newBrandColors2.getFont()).isEqualTo(font2);
        assertThat(newBrandColors2.getDisabled()).isEqualTo(disabled2);
        assertThat(newBrandColors2.getHover()).isEqualTo(hover1);
        assertTenantConfigurations(
                newTenantConfiguration2, defaultTenantConfiguration, true, true, true, true, true, false, true, true);
    }

    @Test
    @WithUserDetails("api_user")
    public void test_defaultBranding_whenFeatureFlagDisabled() {
        when(featureFlagService.check(FeatureFlagEnum.license_branding_enabled)).thenReturn(Mono.just(false));
        when(featureFlagService.check(FeatureFlagEnum.license_pac_enabled)).thenReturn(Mono.just(true));
        Mono<Tenant> tenantMono = tenantService.getTenantConfiguration();
        StepVerifier.create(tenantMono)
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    assertTrue(tenantConfiguration.getBrandLogoUrl().contains(Url.ASSET_URL));
                    assertEquals(
                            TenantConfiguration.DEFAULT_APPSMITH_FEVICON, tenantConfiguration.getBrandFaviconUrl());

                    TenantConfiguration.BrandColors brandColors = tenantConfiguration.getBrandColors();
                    assertEquals(TenantConfiguration.DEFAULT_BACKGROUND_COLOR, brandColors.getBackground());
                    assertEquals(TenantConfiguration.DEFAULT_PRIMARY_COLOR, brandColors.getPrimary());
                    assertEquals(TenantConfiguration.DEFAULT_FONT_COLOR, brandColors.getFont());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_tenantConfiguration_whenPACFeatureFlagEnabled() {

        when(featureFlagService.check(any())).thenReturn(Mono.just(true));
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setShowRolesAndGroups(true);

        Mono<Tenant> tenantMono = tenantService.updateDefaultTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantMono)
                .assertNext(tenant1 -> {
                    TenantConfiguration tenantConfiguration1 = tenant1.getTenantConfiguration();
                    assertTrue(tenantConfiguration1.getShowRolesAndGroups());
                })
                .verifyComplete();

        tenantMono = tenantService.getTenantConfiguration();
        StepVerifier.create(tenantMono)
                .assertNext(tenant1 -> {
                    TenantConfiguration tenantConfiguration1 = tenant1.getTenantConfiguration();
                    assertTrue(tenantConfiguration1.getShowRolesAndGroups());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_tenantConfiguration_whenPACFeatureFlagDisabled() {

        when(featureFlagService.check(any())).thenReturn(Mono.just(true));
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setShowRolesAndGroups(false);

        Mono<Tenant> tenantMono = tenantService.updateDefaultTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantMono)
                .assertNext(tenant1 -> {
                    TenantConfiguration tenantConfiguration1 = tenant1.getTenantConfiguration();
                    assertFalse(tenantConfiguration1.getShowRolesAndGroups());
                })
                .verifyComplete();

        // disable PAC, now updates won't be taking in-effect and default tenant configuration will be returned
        when(featureFlagService.check(FeatureFlagEnum.license_pac_enabled)).thenReturn(Mono.just(false));

        tenantConfiguration.setShowRolesAndGroups(true);
        tenantMono = tenantService.updateDefaultTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantMono)
                .assertNext(tenant1 -> {
                    TenantConfiguration tenantConfiguration1 = tenant1.getTenantConfiguration();
                    assertFalse(tenantConfiguration1.getShowRolesAndGroups());
                })
                .verifyComplete();

        tenantMono = tenantService.getTenantConfiguration();
        StepVerifier.create(tenantMono)
                .assertNext(tenant1 -> {
                    TenantConfiguration tenantConfiguration1 = tenant1.getTenantConfiguration();
                    assertFalse(tenantConfiguration1.getShowRolesAndGroups());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updateBrandingNotAllowed_whenFeatureFlagDisabled() {

        TenantConfiguration defaultTenantConfiguration = new TenantConfiguration();
        defaultTenantConfiguration.setWhiteLabelEnable(Boolean.FALSE.toString());
        defaultTenantConfiguration.setWhiteLabelFavicon(TenantConfiguration.DEFAULT_APPSMITH_FEVICON);
        defaultTenantConfiguration.setWhiteLabelLogo(TenantConfiguration.DEFAULT_APPSMITH_LOGO);

        TenantConfiguration.BrandColors defaultBrandColors = new TenantConfiguration.BrandColors();
        defaultBrandColors.setPrimary(TenantConfiguration.DEFAULT_PRIMARY_COLOR);
        defaultBrandColors.setFont(TenantConfiguration.DEFAULT_FONT_COLOR);
        defaultBrandColors.setBackground(TenantConfiguration.DEFAULT_BACKGROUND_COLOR);
        defaultTenantConfiguration.setBrandColors(defaultBrandColors);

        Tenant defaultTenant = tenantService.getDefaultTenant().block();
        tenantService
                .updateTenantConfiguration(defaultTenant.getId(), defaultTenantConfiguration)
                .block();

        Mono<Part> favicon = Mono.just(createMockFilePart(1024));
        Mono<Part> icon = Mono.just(createMockFilePart(2048));

        // updating it from default value but since feature flag is disabled, update shouldn't happen
        when(featureFlagService.check(FeatureFlagEnum.license_branding_enabled)).thenReturn(Mono.just(false));
        when(featureFlagService.check(FeatureFlagEnum.license_pac_enabled)).thenReturn(Mono.just(true));
        Mono<Tenant> tenantMono = tenantService.updateDefaultTenantConfiguration(Mono.empty(), icon, favicon);
        StepVerifier.create(tenantMono)
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    assertTrue(tenantConfiguration.getBrandLogoUrl().contains(Url.ASSET_URL));
                    assertEquals(
                            TenantConfiguration.DEFAULT_APPSMITH_FEVICON, tenantConfiguration.getBrandFaviconUrl());

                    TenantConfiguration.BrandColors brandColors = tenantConfiguration.getBrandColors();
                    assertEquals(TenantConfiguration.DEFAULT_BACKGROUND_COLOR, brandColors.getBackground());
                    assertEquals(TenantConfiguration.DEFAULT_PRIMARY_COLOR, brandColors.getPrimary());
                    assertEquals(TenantConfiguration.DEFAULT_FONT_COLOR, brandColors.getFont());
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

        License freeLicense = new License();
        freeLicense.setActive(Boolean.FALSE);
        freeLicense.setPreviousPlan(LicensePlan.FREE);
        freeLicense.setPlan(LicensePlan.FREE);
        // Check if the license field is null after the license is removed as a part of downgrade to community flow
        StepVerifier.create(tenantService.removeLicenseKey())
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration().getLicense()).isEqualTo(freeLicense);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void removeTenantLicenseKey_removeExistingLicense_clientCancelsSubscriptionMidway_licenseKeyRemoved() {

        License license = new License();
        license.setKey(UUID.randomUUID().toString());
        license.setActive(true);

        tenant.getTenantConfiguration().setLicense(license);
        Mockito.when(licenseAPIManager.downgradeTenantToFreePlan(any()))
                .thenReturn(Mono.just(true).delaySubscription(Duration.ofMillis(100)));

        // Add the dummy license
        StepVerifier.create(tenantService.save(tenant))
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration().getLicense()).isNotNull();
                })
                .verifyComplete();

        License freeLicense = new License();
        freeLicense.setActive(Boolean.FALSE);
        freeLicense.setPreviousPlan(LicensePlan.FREE);
        freeLicense.setPlan(LicensePlan.FREE);

        // Create the scenario where the client cancels the subscription midway
        tenantService.removeLicenseKey().timeout(Duration.ofMillis(10)).subscribe();

        // Wait for license removal to complete
        Mono<Tenant> resultMono = Mono.just(tenant).flatMap(originalApp -> {
            try {
                // Before fetching the updated tenant, sleep for 2 seconds to ensure that the license removal is
                // completed
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return tenantService.retrieveById(tenant.getId());
        });

        // Check if the license field is null after the license is removed as a part of downgrade to community flow
        StepVerifier.create(resultMono)
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration().getLicense()).isEqualTo(freeLicense);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updateDefaultTenantConfiguration_updateBrandLogo() {

        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        TenantConfiguration defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        Mono<Part> update_brandLogo = Mono.just(createMockFilePart(2047));

        Tenant defaultTenantPostUpdate1 = tenantService
                .updateDefaultTenantConfiguration(Mono.empty(), update_brandLogo, Mono.empty())
                .block();
        TenantConfiguration newTenantConfiguration1 = defaultTenantPostUpdate1.getTenantConfiguration();
        assertThat(newTenantConfiguration1.getBrandLogoUrl()).startsWith(Url.ASSET_URL);
        assertTenantConfigurations(
                newTenantConfiguration1, defaultTenantConfiguration, true, false, true, true, true, true, true, true);
    }

    @Test
    @WithUserDetails("api_user")
    public void syncTenantLicensePlan_startWithDifferentPlans_success() {

        License license = new License();
        license.setKey(UUID.randomUUID().toString());
        license.setActive(true);
        license.setPlan(LicensePlan.ENTERPRISE);
        license.setPreviousPlan(LicensePlan.BUSINESS);

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
        StepVerifier.create(tenantService.syncLicensePlansAndRunFeatureBasedMigrations())
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
    public void test_updateDefaultTenantConfiguration_updateBrandFavicon() {

        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        TenantConfiguration defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        Mono<Part> update_brandFavicon = Mono.just(createMockFilePart(1));

        Tenant defaultTenantPostUpdate1 = tenantService
                .updateDefaultTenantConfiguration(Mono.empty(), Mono.empty(), update_brandFavicon)
                .block();
        TenantConfiguration newTenantConfiguration1 = defaultTenantPostUpdate1.getTenantConfiguration();
        assertThat(newTenantConfiguration1.getBrandFaviconUrl()).startsWith(Url.ASSET_URL);
        assertTenantConfigurations(
                newTenantConfiguration1, defaultTenantConfiguration, true, true, false, true, true, true, true, true);
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updateDefaultTenantConfiguration_updateShowRolesAndGroups() {

        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        TenantConfiguration defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        Mono<String> update1_showRolesAndGroups = Mono.just("{\"showRolesAndGroups\": true}");

        Tenant defaultTenantPostUpdate1 = tenantService
                .updateDefaultTenantConfiguration(update1_showRolesAndGroups, Mono.empty(), Mono.empty())
                .block();
        TenantConfiguration newTenantConfiguration1 = defaultTenantPostUpdate1.getTenantConfiguration();
        assertThat(newTenantConfiguration1.getShowRolesAndGroups()).isTrue();
        assertTenantConfigurations(
                newTenantConfiguration1, defaultTenantConfiguration, true, true, true, false, true, true, true, true);

        Mono<String> update2_showRolesAndGroups = Mono.just("{\"showRolesAndGroups\": false}");

        Tenant defaultTenantPostUpdate2 = tenantService
                .updateDefaultTenantConfiguration(update2_showRolesAndGroups, Mono.empty(), Mono.empty())
                .block();
        TenantConfiguration newTenantConfiguration2 = defaultTenantPostUpdate2.getTenantConfiguration();
        assertThat(newTenantConfiguration2.getShowRolesAndGroups()).isFalse();
        assertTenantConfigurations(
                newTenantConfiguration2, defaultTenantConfiguration, true, true, true, false, true, true, true, true);
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updateDefaultTenantConfiguration_updateSingleSessionPerUserEnabled() {

        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        TenantConfiguration defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        Mono<String> update1_singleSessionPerUserEnabled = Mono.just("{\"singleSessionPerUserEnabled\": true}");

        Tenant defaultTenantPostUpdate1 = tenantService
                .updateDefaultTenantConfiguration(update1_singleSessionPerUserEnabled, Mono.empty(), Mono.empty())
                .block();
        TenantConfiguration newTenantConfiguration1 = defaultTenantPostUpdate1.getTenantConfiguration();
        assertThat(newTenantConfiguration1.getSingleSessionPerUserEnabled()).isTrue();
        assertTenantConfigurations(
                newTenantConfiguration1, defaultTenantConfiguration, true, true, true, true, false, true, true, true);

        Mono<String> update2_singleSessionPerUserEnabled = Mono.just("{\"singleSessionPerUserEnabled\": false}");

        Tenant defaultTenantPostUpdate2 = tenantService
                .updateDefaultTenantConfiguration(update2_singleSessionPerUserEnabled, Mono.empty(), Mono.empty())
                .block();
        TenantConfiguration newTenantConfiguration2 = defaultTenantPostUpdate2.getTenantConfiguration();
        assertThat(newTenantConfiguration2.getSingleSessionPerUserEnabled()).isFalse();
        assertTenantConfigurations(
                newTenantConfiguration2, defaultTenantConfiguration, true, true, true, true, false, true, true, true);
    }

    private FilePart createMockFilePart(int fileSizeKB) {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource("test_assets/WorkspaceServiceTest/favicon-16x16.png"),
                        new DefaultDataBufferFactory(),
                        fileSizeKB)
                .cache();
        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);
        return filepart;
    }

    private void assertTenantConfigurations(
            TenantConfiguration expectedTenantConfiguration,
            TenantConfiguration actualTenantConfiguration,
            boolean assertWhiteLabelEnable,
            boolean assertWhiteLabelLogo,
            boolean assertWhiteLabelFavicon,
            boolean assertShowRolesAndGroups,
            boolean assertSingleSessionPerUserEnabled,
            boolean assertBrandColors,
            boolean assertFirstTimeInteraction,
            boolean assertHideWatermark) {
        if (assertWhiteLabelEnable) {
            assertThat(actualTenantConfiguration.isWhitelabelEnabled())
                    .isEqualTo(expectedTenantConfiguration.isWhitelabelEnabled());
        }

        if (assertWhiteLabelLogo) {
            assertThat(actualTenantConfiguration.getBrandLogoUrl())
                    .isEqualTo(expectedTenantConfiguration.getBrandLogoUrl());
        }

        if (assertWhiteLabelFavicon) {
            assertThat(actualTenantConfiguration.getBrandFaviconUrl())
                    .isEqualTo(expectedTenantConfiguration.getBrandFaviconUrl());
        }

        if (assertShowRolesAndGroups) {
            assertThat(actualTenantConfiguration.getShowRolesAndGroups())
                    .isEqualTo(expectedTenantConfiguration.getShowRolesAndGroups());
        }

        if (assertSingleSessionPerUserEnabled) {
            assertThat(actualTenantConfiguration.getSingleSessionPerUserEnabled())
                    .isEqualTo(expectedTenantConfiguration.getSingleSessionPerUserEnabled());
        }

        if (assertBrandColors) {
            TenantConfiguration.BrandColors expectedBrandColors = expectedTenantConfiguration.getBrandColors();
            TenantConfiguration.BrandColors actualBrandColors = actualTenantConfiguration.getBrandColors();

            assertThat(Objects.nonNull(actualBrandColors)).isEqualTo(Objects.nonNull(expectedBrandColors));
            assertThat(Objects.isNull(actualBrandColors)).isEqualTo(Objects.isNull(expectedBrandColors));

            if (Objects.nonNull(actualBrandColors) && Objects.nonNull(expectedBrandColors)) {
                assertThat(actualBrandColors.getPrimary()).isEqualTo(expectedBrandColors.getPrimary());
                assertThat(actualBrandColors.getBackground()).isEqualTo(expectedBrandColors.getBackground());
                assertThat(actualBrandColors.getFont()).isEqualTo(expectedBrandColors.getFont());
                assertThat(actualBrandColors.getDisabled()).isEqualTo(expectedBrandColors.getDisabled());
                assertThat(actualBrandColors.getHover()).isEqualTo(expectedBrandColors.getHover());
                assertThat(actualBrandColors.getActive()).isEqualTo(expectedBrandColors.getActive());
            }
        }
        if (assertFirstTimeInteraction) {
            assertThat(actualTenantConfiguration.getIsActivated())
                    .isEqualTo(expectedTenantConfiguration.getIsActivated());
        }

        if (assertHideWatermark) {
            if (actualTenantConfiguration.getHideWatermark() == null) {
                assertFalse(expectedTenantConfiguration.getHideWatermark());
            } else {
                assertThat(actualTenantConfiguration.getHideWatermark())
                        .isEqualTo(expectedTenantConfiguration.getHideWatermark());
            }
        }
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
        license.setPlan(LicensePlan.BUSINESS);

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
                    assertThat(savedLicense.getPlan()).isEqualTo(LicensePlan.BUSINESS);
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

    @Test
    @WithUserDetails("api_user")
    public void forceUpdateFeatures_licenseUpdate_cacheUpdateSuccess() {

        // Insert dummy value for tenant flags
        Map<String, Boolean> flags = new HashMap<>();
        String feature1 = UUID.randomUUID().toString();
        String feature2 = UUID.randomUUID().toString();

        flags.put(feature1, true);
        flags.put(feature2, false);
        FeaturesResponseDTO featuresResponseDTO = new FeaturesResponseDTO();
        featuresResponseDTO.setFeatures(flags);

        doReturn(Mono.just(featuresResponseDTO))
                .when(cacheableFeatureFlagHelper)
                .getRemoteFeaturesForTenant(any());

        String defaultTenantId = tenantService.getDefaultTenantId().block();

        String licenseKey = "sample-license-key";
        License license = new License();
        license.setActive(true);
        license.setType(LicenseType.PAID);
        license.setKey(licenseKey);
        license.setStatus(LicenseStatus.valueOf("ACTIVE"));
        license.setExpiry(Instant.now().plus(Duration.ofHours(1)));
        license.setOrigin(LicenseOrigin.SELF_SERVE);
        license.setPlan(LicensePlan.BUSINESS);

        // Mock CS response to get valid license
        Mockito.when(licenseAPIManager.licenseCheck(any())).thenReturn(Mono.just(license));

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO(licenseKey, false);
        // Check after force update if we get updated values for existing features
        tenantService.updateTenantLicenseKey(updateLicenseKeyDTO).block();
        Mono<CachedFeatures> updatedCacheMono = cacheableFeatureFlagHelper.fetchCachedTenantFeatures(defaultTenantId);
        // Assert if the cache entry is updated
        StepVerifier.create(updatedCacheMono)
                .assertNext(cachedFeatures -> {
                    assertTrue(cachedFeatures.getFeatures().get(feature1));
                    assertFalse(cachedFeatures.getFeatures().get(feature2));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateDefaultTenantConfiguration_updateActivationFromClient_updateDisabled() {

        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        TenantConfiguration defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        Mono<String> update1_updateFirstTimeInteraction = Mono.just("{\"isActivated\": true}");

        Tenant defaultTenantPostUpdate1 = tenantService
                .updateDefaultTenantConfiguration(update1_updateFirstTimeInteraction, Mono.empty(), Mono.empty())
                .block();
        TenantConfiguration newTenantConfiguration1 = defaultTenantPostUpdate1.getTenantConfiguration();
        assertThat(newTenantConfiguration1.getIsActivated()).isFalse();
        assertTenantConfigurations(
                newTenantConfiguration1, defaultTenantConfiguration, true, true, true, true, true, true, false, true);
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updateDefaultTenantConfiguration_subscriptionDetailsInLicense() {

        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        TenantConfiguration defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        defaultTenantConfiguration.setLicense(new License());
        SubscriptionDetails subscriptionDetails = new SubscriptionDetails();
        subscriptionDetails.setSubscriptionStatus("ACTIVE");
        subscriptionDetails.setUsers(10);
        subscriptionDetails.setSessions(100);
        subscriptionDetails.setEndDate(Instant.now().plus(100, ChronoUnit.DAYS));
        subscriptionDetails.setStartDate(Instant.now());
        subscriptionDetails.setCurrentCycleStartDate(subscriptionDetails.getStartDate());
        subscriptionDetails.setCustomerEmail("dev@appsmith.com");

        defaultTenantConfiguration.getLicense().setSubscriptionDetails(subscriptionDetails);

        Tenant defaultTenantPostUpdate1 = tenantService
                .updateDefaultTenantConfiguration(defaultTenantConfiguration)
                .block();
        TenantConfiguration newTenantConfiguration1 = defaultTenantPostUpdate1.getTenantConfiguration();

        // since api_user is not a superuser, subscription details should be null
        assertNull(newTenantConfiguration1.getLicense().getSubscriptionDetails());

        // now make api_user superuser and subscription details should come

        User api_user = userRepository.findByEmail("api_user").block();
        userUtils.makeSuperUser(List.of(api_user)).block();

        defaultTenant = tenantService.getDefaultTenant().block();
        SubscriptionDetails defaultSubscriptionDetails =
                defaultTenant.getTenantConfiguration().getLicense().getSubscriptionDetails();

        assertEquals(
                subscriptionDetails.getStartDate().getEpochSecond(),
                defaultSubscriptionDetails.getStartDate().getEpochSecond());
        assertEquals(
                subscriptionDetails.getEndDate().getEpochSecond(),
                defaultSubscriptionDetails.getEndDate().getEpochSecond());
        assertEquals(
                subscriptionDetails.getCurrentCycleStartDate().getEpochSecond(),
                defaultSubscriptionDetails.getCurrentCycleStartDate().getEpochSecond());
        assertEquals(subscriptionDetails.getCustomerEmail(), defaultSubscriptionDetails.getCustomerEmail());
        assertEquals(subscriptionDetails.getUsers(), defaultSubscriptionDetails.getUsers());
        assertEquals(subscriptionDetails.getSessions(), defaultSubscriptionDetails.getSessions());
        // remove api_user superuser permissions
        userUtils.removeSuperUser(List.of(api_user)).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateDefaultTenantConfigurationWithConnectionPoolConfig() {
        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        TenantConfiguration defaultTenantConfiguration = defaultTenant.getTenantConfiguration();

        Mono<String> update1_updateFirstTimeInteraction = Mono.just("{\"connectionMaxPoolSize\": 20}");

        Mono<Tenant> defaultTenantPostUpdateMono = tenantService.updateDefaultTenantConfiguration(
                update1_updateFirstTimeInteraction, Mono.empty(), Mono.empty());

        StepVerifier.create(defaultTenantPostUpdateMono).assertNext(dbTenant -> {
            TenantConfiguration tenantConfiguration = dbTenant.getTenantConfiguration();
            assertThat(tenantConfiguration.getConnectionMaxPoolSize()).isEqualTo(20);
            assertTenantConfigurations(
                    tenantConfiguration, defaultTenantConfiguration, true, true, true, true, true, true, false, true);
        });
    }

    @Test
    @WithUserDetails("api_user")
    public void updateDefaultTenantConfiguration_updateHideWatermark_success() {

        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        TenantConfiguration defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        Mono<String> update1_hideWatermarkEnabled = Mono.just("{\"hideWatermark\": true}");

        Tenant defaultTenantPostUpdate1 = tenantService
                .updateDefaultTenantConfiguration(update1_hideWatermarkEnabled, Mono.empty(), Mono.empty())
                .block();
        TenantConfiguration newTenantConfiguration1 = defaultTenantPostUpdate1.getTenantConfiguration();
        assertThat(newTenantConfiguration1.getHideWatermark()).isTrue();
        assertTenantConfigurations(
                newTenantConfiguration1, defaultTenantConfiguration, true, true, true, true, false, true, true, false);

        Mono<String> update2_hideWatermarkDisabled = Mono.just("{\"hideWatermark\": false}");

        Tenant defaultTenantPostUpdate2 = tenantService
                .updateDefaultTenantConfiguration(update2_hideWatermarkDisabled, Mono.empty(), Mono.empty())
                .block();
        TenantConfiguration newTenantConfiguration2 = defaultTenantPostUpdate2.getTenantConfiguration();
        assertThat(newTenantConfiguration2.getHideWatermark()).isFalse();
        assertTenantConfigurations(
                newTenantConfiguration2, defaultTenantConfiguration, true, true, true, true, false, true, true, false);
    }

    @Test
    @WithUserDetails("usertest@usertest.com")
    public void removeTenantLicenseKey_userWithManageTenantPermissionViaCustomGroup_success() {
        User testAdminUser = userRepository.findByEmail("usertest@usertest.com").block();
        makeUserTenantAdminViaCustomUserGroup(testAdminUser);
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

        License freeLicense = new License();
        freeLicense.setActive(Boolean.FALSE);
        freeLicense.setPreviousPlan(LicensePlan.FREE);
        freeLicense.setPlan(LicensePlan.FREE);
        // Check if the license field is null after the license is removed as a part of downgrade to community flow
        StepVerifier.create(tenantService.removeLicenseKey())
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration().getLicense()).isEqualTo(freeLicense);
                })
                .verifyComplete();

        removeUserFromTenantAdmin();
    }

    @Test
    @WithUserDetails(value = "anonymousUser")
    public void activateTenantAndGetRedirectUrl_userWithoutManageTenantPermission_throwACLException() {
        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO();
        Mono<String> resultMono = tenantService.activateTenantAndGetRedirectUrl(updateLicenseKeyDTO, new HttpHeaders());

        StepVerifier.create(resultMono)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(error.getMessage())
                            .isEqualTo(AppsmithError.NO_RESOURCE_FOUND.getMessage(TENANT, DEFAULT));
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            activateTenantAndGetRedirectUrl_withInvalidLicenseKey_userWithManageTenantPermission_throwCloudServiceException() {

        // Mock CS response to get invalid license
        Mockito.when(licenseAPIManager.licenseCheck(any()))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, "")));

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO("invalid-license-key", false);
        Mono<String> resultMono = tenantService.activateTenantAndGetRedirectUrl(updateLicenseKeyDTO, new HttpHeaders());

        StepVerifier.create(resultMono)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(error.getMessage()).isEqualTo(AppsmithError.CLOUD_SERVICES_ERROR.getMessage(""));
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            activateTenantAndGetRedirectUrl_withValidLicenseKey_withoutDefaultWorkspace_userWithManageTenantPermission_returnsRedirectUrl() {

        String licenseKey = "sample-license-key";
        License license = new License();
        license.setActive(true);
        license.setType(LicenseType.PAID);
        license.setKey(licenseKey);
        license.setStatus(LicenseStatus.valueOf("ACTIVE"));
        license.setExpiry(Instant.now().plus(Duration.ofHours(1)));
        license.setOrigin(LicenseOrigin.SELF_SERVE);
        license.setPlan(LicensePlan.BUSINESS);
        license.setProductEdition(ProductEdition.COMMERCIAL);

        // Mock CS response to get valid license
        Mockito.when(licenseAPIManager.licenseCheck(any())).thenReturn(Mono.just(license));

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO("sample-license-key", false);
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://localhost");
        Mono<String> resultMono = tenantService.activateTenantAndGetRedirectUrl(updateLicenseKeyDTO, headers);

        StepVerifier.create(resultMono)
                .assertNext(redirectUrl -> {
                    String encodedUrl = URLEncoder.encode("http://localhost/applications", StandardCharsets.UTF_8);
                    assertThat(redirectUrl).isEqualTo("/signup-success?redirectUrl=" + encodedUrl);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            activateTenantAndGetRedirectUrl_withValidLicenseKey_withDefaultWorkspace_userWithManageTenantPermission_returnsRedirectUrl() {

        User user = sessionUserService.getCurrentUser().block();

        Workspace workspace = workspaceService
                .createDefault(new Workspace(), user)
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();

        Application application = new Application();
        application.setName("test_application");
        assert workspace != null;
        application.setWorkspaceId(workspace.getId());
        application = applicationPageService.createApplication(application).block();

        String licenseKey = "sample-license-key";
        License license = new License();
        license.setActive(true);
        license.setType(LicenseType.PAID);
        license.setKey(licenseKey);
        license.setStatus(LicenseStatus.valueOf("ACTIVE"));
        license.setExpiry(Instant.now().plus(Duration.ofHours(1)));
        license.setOrigin(LicenseOrigin.SELF_SERVE);
        license.setPlan(LicensePlan.BUSINESS);
        license.setProductEdition(ProductEdition.COMMERCIAL);

        // Mock CS response to get valid license
        Mockito.when(licenseAPIManager.licenseCheck(any())).thenReturn(Mono.just(license));

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO("sample-license-key", false);
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://localhost");
        Mono<String> resultMono = tenantService.activateTenantAndGetRedirectUrl(updateLicenseKeyDTO, headers);

        assert application != null;
        StepVerifier.create(resultMono.zipWith(applicationService.findById(application.getId())))
                .assertNext(tuple -> {
                    String signupUrl = tuple.getT1();
                    Application application1 = tuple.getT2();
                    String pageId = application1.getPages().get(0).getId();
                    String redirectUrl = URLEncoder.encode(
                                    "http://localhost/applications/" + application1.getId() + "/pages/" + pageId
                                            + "/edit",
                                    StandardCharsets.UTF_8)
                            + "&enableFirstTimeUserExperience=true";
                    assertThat(signupUrl).isEqualTo("/signup-success?redirectUrl=" + redirectUrl);
                })
                .verifyComplete();

        // Cleanup the default generated workspace and application
        applicationPageService.deleteApplication(application.getId()).block();
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void activateTenantAndGetRedirectUrl_withoutLicenseKey_userWithManageTenantPermission_returnsRedirectUrl() {

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO("", false);
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://localhost");
        Mono<String> resultMono = tenantService.activateTenantAndGetRedirectUrl(updateLicenseKeyDTO, headers);

        StepVerifier.create(resultMono)
                .assertNext(redirectUrl -> {
                    String encodedUrl = URLEncoder.encode("http://localhost/applications", StandardCharsets.UTF_8);
                    assertThat(redirectUrl).isEqualTo("/signup-success?redirectUrl=" + encodedUrl);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void activateTenantAndGetRedirectUrl_withoutLicenseKey_userWithDefaultWorkspace_returnsRedirectUrl() {

        // Create a default workspace
        User user = sessionUserService.getCurrentUser().block();
        makeUserTenantAdminViaCustomUserGroup(user);
        Workspace workspace = workspaceService
                .createDefault(new Workspace(), user)
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();

        Application application = new Application();
        application.setName("test_application");
        assert workspace != null;
        application.setWorkspaceId(workspace.getId());
        application = applicationPageService.createApplication(application).block();

        UpdateLicenseKeyDTO updateLicenseKeyDTO = new UpdateLicenseKeyDTO("", false);
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://localhost");
        Mono<String> resultMono = tenantService.activateTenantAndGetRedirectUrl(updateLicenseKeyDTO, headers);

        assert application != null;
        StepVerifier.create(resultMono.zipWith(applicationService.findById(application.getId())))
                .assertNext(tuple -> {
                    String signupUrl = tuple.getT1();
                    Application application1 = tuple.getT2();
                    String pageId = application1.getPages().get(0).getId();
                    String redirectUrl = URLEncoder.encode(
                                    "http://localhost/applications/" + application1.getId() + "/pages/" + pageId
                                            + "/edit",
                                    StandardCharsets.UTF_8)
                            + "&enableFirstTimeUserExperience=true";
                    assertThat(signupUrl).isEqualTo("/signup-success?redirectUrl=" + redirectUrl);
                })
                .verifyComplete();

        // Cleanup the default generated workspace and application
        applicationPageService.deleteApplication(application.getId()).block();
        workspaceService.archiveById(workspace.getId()).block();
        removeUserFromTenantAdmin();
    }
}
