package com.appsmith.server.domains;

import lombok.Data;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.reflections.Reflections;
import org.springframework.data.mongodb.core.mapping.Document;

import java.lang.reflect.Field;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
public class EqualityTest {

    private final Set<Class<?>> TESTED_CLASSES = Set.of(
            // Note: Adding a class here means that we have a test for its equality in this file.
            ApplicationDetail.class, TenantConfiguration.class);

    @SneakyThrows
    @Test
    void testAffirmation() {
        // Test that all classes we suspect equality screw-up in, are accounted for in the TESTED_CLASSES set.
        final Set<Class<?>> classes = new Reflections("com.appsmith").getTypesAnnotatedWith(Document.class);
        final Set<Class<?>> fieldClasses = new HashSet<>();

        for (final Class<?> cls : classes) {
            Field[] fields = cls.getDeclaredFields();
            for (Field field : fields) {
                final Class<?> fieldCls = field.getType();
                if (!fieldCls.isEnum()
                        && fieldCls.getPackageName().startsWith("com.appsmith.")
                        && !fieldCls.isAnnotationPresent(Document.class)
                        && !fieldCls.getSuperclass().equals(Object.class)
                        && !fieldCls.isAnnotationPresent(Data.class)
                        && !TESTED_CLASSES.contains(fieldCls)) {
                    fieldClasses.add(fieldCls);
                }
            }
        }

        assertThat(fieldClasses).isEmpty();
    }

    @Test
    void testTenantConfiguration() {
        TenantConfiguration c1 = new TenantConfiguration();
        c1.setEmailVerificationEnabled(true);
        TenantConfiguration c2 = new TenantConfiguration();
        c2.setEmailVerificationEnabled(true);
        TenantConfiguration c3 = new TenantConfiguration();
        c3.setEmailVerificationEnabled(false);
        assertThat(c1).isEqualTo(c2).isNotEqualTo(c3);
    }

    @Test
    void testApplicationDetail() {
        Application.AppPositioning p1 = new Application.AppPositioning();
        p1.setType(Application.AppPositioning.Type.AUTO);
        Application.AppPositioning p2 = new Application.AppPositioning();
        p2.setType(Application.AppPositioning.Type.AUTO);
        Application.AppPositioning p3 = new Application.AppPositioning();
        p3.setType(Application.AppPositioning.Type.FIXED);
        assertThat(p1).isEqualTo(p2).isNotEqualTo(p3);

        ApplicationDetail d1 = new ApplicationDetail();
        d1.setAppPositioning(p1);
        ApplicationDetail d2 = new ApplicationDetail();
        d2.setAppPositioning(p2);
        ApplicationDetail d3 = new ApplicationDetail();
        d3.setAppPositioning(p3);
        assertThat(d1).isEqualTo(d2);
        assertThat(d1).isNotEqualTo(d3);
    }
}
