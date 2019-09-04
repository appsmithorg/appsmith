package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
public class TenantServiceTest {

    @Autowired
    TenantService tenantService;

    Tenant tenant;

    @Before
    public void setup() {
        tenant = new Tenant();
        tenant.setName("Test Name");
        tenant.setDomain("example.com");
        tenant.setWebsite("https://example.com");
    }

    /* Tests for the Create Tenant Flow */

    @Test
    public void nullCreateTenant() {
        Mono<Tenant> tenantResponse = tenantService.create(null);
        StepVerifier.create(tenantResponse)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.TENANT)))
                .verify();
    }

    @Test
    public void nullName() {
        tenant.setName(null);
        Mono<Tenant> tenantResponse = tenantService.create(tenant);
        StepVerifier.create(tenantResponse)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    public void validCreateTenantTest() {
        Mono<Tenant> tenantResponse = tenantService.create(tenant);
        StepVerifier.create(tenantResponse)
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getName()).isEqualTo("Test Name");
                })
                .verifyComplete();
    }

    /* Tests for Get Tenant Flow */

    @Test
    public void getTenantInvalidId() {
        Mono<Tenant> tenantMono = tenantService.getById("random-id");
        StepVerifier.create(tenantMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("resource", "random-id")))
                .verify();
    }

    @Test
    public void getTenantNullId() {
        Mono<Tenant> tenantMono = tenantService.getById(null);
        StepVerifier.create(tenantMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    public void validGetTenantByName() {
        Mono<Tenant> createTenant = tenantService.create(tenant);
        Mono<Tenant> getTenant = createTenant.flatMap(t -> tenantService.getById(t.getId()));
        StepVerifier.create(getTenant)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getName()).isEqualTo(tenant.getName());
                    assertThat(t.getId()).isEqualTo(tenant.getId());
                })
                .verifyComplete();
    }

    /* Tests for Update Tenant Flow */
    @Test
    public void validUpdateTenant() {
        Tenant tenant = new Tenant();
        tenant.setName("Test Name");
        tenant.setDomain("example.com");
        tenant.setWebsite("https://example.com");

        Mono<Tenant> createTenant = tenantService.create(tenant);
        Mono<Tenant> updateTenant = createTenant
                .map(t -> {
                    t.setDomain("abc.com");
                    return t;
                })
                .flatMap(t -> tenantService.update(t.getId(), t))
                .flatMap(t -> tenantService.getById(t.getId()));

        StepVerifier.create(updateTenant)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getName()).isEqualTo(tenant.getName());
                    assertThat(t.getId()).isEqualTo(tenant.getId());
                    assertThat(t.getDomain()).isEqualTo("abc.com");
                })
                .verifyComplete();
    }
}
