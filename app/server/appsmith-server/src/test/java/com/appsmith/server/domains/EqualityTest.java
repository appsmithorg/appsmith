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
            ApplicationDetail.class,
            TenantConfiguration.class,
            Application.AppLayout.class,
            Application.EmbedSetting.class,
            GitArtifactMetadata.class);

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
        Application.AppPositioning p1 = new Application.AppPositioning(Application.AppPositioning.Type.AUTO);
        Application.AppPositioning p2 = new Application.AppPositioning(Application.AppPositioning.Type.AUTO);
        Application.AppPositioning p3 = new Application.AppPositioning(Application.AppPositioning.Type.FIXED);
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

    @Test
    void testAppLayout() {
        Application.AppLayout a1 = new Application.AppLayout(Application.AppLayout.Type.DESKTOP);
        Application.AppLayout a2 = new Application.AppLayout(Application.AppLayout.Type.DESKTOP);
        Application.AppLayout a3 = new Application.AppLayout(Application.AppLayout.Type.MOBILE);
        assertThat(a1).isEqualTo(a2).isNotEqualTo(a3);
    }

    @Test
    void testAppEmbedSetting() {
        Application.EmbedSetting a1 = new Application.EmbedSetting();
        a1.setHeight("5");
        a1.setWidth("5");
        a1.setShowNavigationBar(Boolean.TRUE);
        Application.EmbedSetting a2 = new Application.EmbedSetting();
        a2.setHeight("5");
        a2.setWidth("5");
        a2.setShowNavigationBar(Boolean.TRUE);
        Application.EmbedSetting a3 = new Application.EmbedSetting();
        a3.setHeight("5");
        a3.setWidth("5");
        a3.setShowNavigationBar(Boolean.FALSE);
        assertThat(a1).isEqualTo(a2).isNotEqualTo(a3);
    }

    @Test
    void testArtifactEquality() {
        String remoteUrl1 = "protocol://domain.superdomain";
        String remoteUrl2 = "protocol://domain.superdomain2";

        GitArtifactMetadata a1 = new GitArtifactMetadata();
        a1.setRemoteUrl(remoteUrl1);
        GitArtifactMetadata a2 = new GitArtifactMetadata();
        a2.setRemoteUrl(remoteUrl1);
        GitArtifactMetadata a3 = new GitArtifactMetadata();
        a3.setRemoteUrl(remoteUrl2);

        assertThat(a1).isEqualTo(a2).isNotEqualTo(a3);

        a1.setAutoCommitConfig(new AutoCommitConfig());
        a2.setAutoCommitConfig(new AutoCommitConfig());
        a3.setAutoCommitConfig(new AutoCommitConfig());

        assertThat(a1).isEqualTo(a2).isNotEqualTo(a3);

        a1.getAutoCommitConfig().setEnabled(Boolean.TRUE);
        a2.getAutoCommitConfig().setEnabled(Boolean.FALSE);

        assertThat(a1).isNotEqualTo(a2).isNotEqualTo(a3);
    }
}
