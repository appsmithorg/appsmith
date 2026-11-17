package com.appsmith.server.domains.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.JdkSerializationRedisSerializer;

import java.io.ObjectStreamClass;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The organization is cached in Redis with Java serialization. These tests guard the fixed
 * serialVersionUID, so a cached organization stays readable after a field is added or removed.
 */
class OrganizationConfigurationCESerializationTest {

    private static final long PINNED_SERIAL_VERSION_UID = -1093613682409951944L;

    // Regression guard: this test fails when the pinned serialVersionUID is removed or changed.
    @Test
    void should_declarePinnedSerialVersionUid_when_organizationConfigurationCeIsInspected() throws Exception {
        // Given
        Class<OrganizationConfigurationCE> type = OrganizationConfigurationCE.class;

        // When
        Field field = type.getDeclaredField("serialVersionUID");
        long lookedUpUid = ObjectStreamClass.lookup(type).getSerialVersionUID();

        // Then
        assertThat(Modifier.isStatic(field.getModifiers())).isTrue();
        assertThat(Modifier.isFinal(field.getModifiers())).isTrue();
        assertThat(field.getType()).isEqualTo(long.class);
        assertThat(lookedUpUid).isEqualTo(PINNED_SERIAL_VERSION_UID);
    }

    // Smoke test: it passes with or without the pin. The test above is the regression guard.
    @Test
    void should_roundTripOrganizationThroughRedisSerializer_when_serialized() {
        // Given
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        configuration.setIsFormLoginEnabled(true);
        configuration.setIsSignupDisabled(false);
        configuration.setThirdPartyAuths(List.of("google"));
        Organization organization = new Organization();
        organization.setSlug("default");
        organization.setOrganizationConfiguration(configuration);
        JdkSerializationRedisSerializer serializer = new JdkSerializationRedisSerializer();

        // When
        Object restored = serializer.deserialize(serializer.serialize(organization));

        // Then
        assertThat(restored).isInstanceOf(Organization.class);
        Organization restoredOrganization = (Organization) restored;
        assertThat(restoredOrganization.getSlug()).isEqualTo("default");
        OrganizationConfiguration restoredConfiguration = restoredOrganization.getOrganizationConfiguration();
        assertThat(restoredConfiguration.getIsFormLoginEnabled()).isTrue();
        assertThat(restoredConfiguration.getIsSignupDisabled()).isFalse();
        assertThat(restoredConfiguration.getThirdPartyAuths()).containsExactly("google");
    }
}
