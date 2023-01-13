package com.appsmith.server.services;

import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.server.configurations.LicenseConfig;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.ArrayList;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class TenantServiceTest {
    @Autowired
    TenantService tenantService;

    @Autowired
    TenantRepository tenantRepository;

    @Autowired
    LicenseConfig licenseConfig;

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
    public void setTenantLicenseKey_Valid_LicenseKey() {
        // Currently fetching the APPSMITH_LICENSE_KEY env variable to get a valid license key
        String licenseKey = licenseConfig.getLicenseKey();
        StepVerifier.create(tenantService.setTenantLicenseKey(licenseKey))
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    TenantConfiguration.License license = tenantConfiguration.getLicense();
                    assertThat(license.getKey()).isEqualTo(DataTypeStringUtils.maskString(licenseKey));
                    assertThat(license.getActive()).isTrue();
                    assertThat(license.getType()).isEqualTo(TenantConfiguration.License.LicenseType.PAID);
                    assertThat(license.getExpiry()).isAfter(Instant.now());
                })
                .verifyComplete();

        // Verify getTenantConfiguration() has license details after setting a valid license
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    TenantConfiguration.License license = tenantConfiguration.getLicense();
                    assertThat(license.getKey()).isEqualTo(DataTypeStringUtils.maskString(licenseKey));
                    assertThat(license.getActive()).isTrue();
                    assertThat(license.getType()).isEqualTo(TenantConfiguration.License.LicenseType.PAID);
                    assertThat(license.getExpiry()).isAfter(Instant.now());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void setTenantLicenseKey_Invalid_LicenseKey() {
        String licenseKey = "SOME-INVALID-LICENSE-KEY";
        Mono<Tenant> addLicenseKeyMono = tenantService.setTenantLicenseKey(licenseKey);
        StepVerifier.create(addLicenseKeyMono)
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    TenantConfiguration.License license = tenantConfiguration.getLicense();
                    assertThat(license.getKey()).isEqualTo(DataTypeStringUtils.maskString(licenseKey));
                    assertThat(license.getActive()).isFalse();
                })
                .verifyComplete();
    }

}
