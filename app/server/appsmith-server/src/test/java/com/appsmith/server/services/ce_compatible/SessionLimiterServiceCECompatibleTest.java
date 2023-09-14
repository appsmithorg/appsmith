package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionLimiterService;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class SessionLimiterServiceCECompatibleTest {
    @Autowired
    SessionLimiterService sessionLimiterService;

    @MockBean
    SessionUserService sessionUserService;

    @MockBean
    FeatureFlagService featureFlagService;

    @MockBean
    WebFilterExchange webFilterExchange;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(any())).thenReturn(Mono.just(false));
    }

    @Test
    public void testUpdateTenantConfiguration_setSingleSessionPerUser() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setSingleSessionPerUserEnabled(true);
        Mono<TenantConfiguration> tenantConfigurationMono =
                sessionLimiterService.updateTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantConfigurationMono)
                .assertNext(tenantConfiguration1 -> {
                    Assertions.assertNull(tenantConfiguration1.getSingleSessionPerUserEnabled());
                })
                .verifyComplete();
    }

    @Test
    public void testUpdateTenantConfiguration_handleSessionLimits() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setSingleSessionPerUserEnabled(true);
        Tenant tenant = new Tenant();
        tenant.setTenantConfiguration(tenantConfiguration);
        User user = new User();
        user.setEmail("developer@appsmith.com");
        Authentication authentication = new UsernamePasswordAuthenticationToken(user, null, null);

        Mono<User> userMono = sessionLimiterService.handleSessionLimits(authentication, webFilterExchange, tenant);
        StepVerifier.create(userMono)
                .assertNext(receivedUser -> Assertions.assertEquals(user, receivedUser))
                .verifyComplete();
    }
}
