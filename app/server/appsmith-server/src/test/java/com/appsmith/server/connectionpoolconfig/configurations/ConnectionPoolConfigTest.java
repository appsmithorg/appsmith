package com.appsmith.server.connectionpoolconfig.configurations;

import com.appsmith.external.connectionpoolconfig.configurations.ConnectionPoolConfig;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.TenantService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class ConnectionPoolConfigTest {

    @SpyBean
    TenantService tenantService;

    @Autowired
    ConnectionPoolConfig connectionPoolConfig;

    @Test
    public void verifyGetMaxPoolSizeReturnsTenantProvidedValueInRange() {
        Integer connectionPoolMaxSize = 18;
        Tenant tenant = new Tenant();
        tenant.setTenantConfiguration(new TenantConfiguration());
        tenant.getTenantConfiguration().setConnectionMaxPoolSize(connectionPoolMaxSize);

        Mockito.doReturn(Mono.just(tenant)).when(tenantService).getDefaultTenant();

        Mono<Integer> connectionPoolMaxSizeMono = connectionPoolConfig.getMaxConnectionPoolSize();
        StepVerifier.create(connectionPoolMaxSizeMono).assertNext(poolSize -> {
            assertThat(poolSize).isEqualTo(connectionPoolMaxSize);
        });
    }

    @Test
    public void verifyGetMaxPoolSizeReturnsDefaultWhenTenantProvidedValueOutOfRange() {
        Integer defaultMaxPoolSize = 5;
        Integer negativePoolSize = -5;
        Tenant tenant = new Tenant();
        tenant.setTenantConfiguration(new TenantConfiguration());
        tenant.getTenantConfiguration().setConnectionMaxPoolSize(negativePoolSize);

        Mockito.doReturn(Mono.just(tenant)).when(tenantService).getDefaultTenant();

        Mono<Integer> connectionPoolMaxSizeMono = connectionPoolConfig.getMaxConnectionPoolSize();
        StepVerifier.create(connectionPoolMaxSizeMono).assertNext(poolSize -> {
            assertThat(poolSize).isEqualTo(defaultMaxPoolSize);
        });

        Integer positiveOutOfBoundPoolSize = 51;
        tenant.getTenantConfiguration().setConnectionMaxPoolSize(positiveOutOfBoundPoolSize);
        Mockito.doReturn(Mono.just(tenant)).when(tenantService).getDefaultTenant();

        StepVerifier.create(connectionPoolConfig.getMaxConnectionPoolSize()).assertNext(poolSize -> {
            assertThat(poolSize).isEqualTo(defaultMaxPoolSize);
        });

        positiveOutOfBoundPoolSize = 3;
        tenant.getTenantConfiguration().setConnectionMaxPoolSize(positiveOutOfBoundPoolSize);
        Mockito.doReturn(Mono.just(tenant)).when(tenantService).getDefaultTenant();

        StepVerifier.create(connectionPoolConfig.getMaxConnectionPoolSize()).assertNext(poolSize -> {
            assertThat(poolSize).isEqualTo(defaultMaxPoolSize);
        });
    }
}
