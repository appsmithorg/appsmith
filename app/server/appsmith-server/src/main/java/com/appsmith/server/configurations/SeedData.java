package com.appsmith.server.configurations;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PricingPlan;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashSet;
import java.util.Map;
import java.util.UUID;

@Configuration
@Slf4j
public class SeedData {
    // TODO: Move to separate files in a "seeds" package?

    @Bean
    public String instanceId(ConfigRepository configRepository) {
        final Object value = configRepository
                .findByName("instance-id")
                .orElseGet(() -> {
                    log.debug("Adding instance id");
                    final String valueStr = UUID.randomUUID().toString();
                    return configRepository.save(new Config(new JSONObject(Map.of("value", valueStr)), "instance-id"));
                })
                .getConfig()
                .get("value");

        if (value instanceof String valueStr) {
            return valueStr;
        } else {
            throw new IllegalStateException("instance-id config value is not a string");
        }
    }

    @Bean
    public Tenant defaultTenant(TenantRepository tenantRepository) {
        return tenantRepository.findBySlug("default").orElseGet(() -> {
            Tenant defaultTenant = new Tenant();
            defaultTenant.setDisplayName("Default");
            defaultTenant.setSlug("default");
            defaultTenant.setPricingPlan(PricingPlan.FREE);
            return tenantRepository.save(defaultTenant);
        });
    }

    @Bean
    public User anonymousUser(UserRepository userRepository, Tenant defaultTenant) {
        log.debug("Adding anonymous user");
        return userRepository.findByEmail(FieldName.ANONYMOUS_USER).orElseGet(() -> {
            final User anonymousUser = new User();
            anonymousUser.setName(FieldName.ANONYMOUS_USER);
            anonymousUser.setEmail(FieldName.ANONYMOUS_USER);
            anonymousUser.setCurrentWorkspaceId("");
            anonymousUser.setWorkspaceIds(new HashSet<>());
            anonymousUser.setIsAnonymous(true);
            anonymousUser.setTenantId(defaultTenant.getId());
            return userRepository.save(anonymousUser);
        });
    }
}
