package com.appsmith.external.dtos;

import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

public class ModifiedResourcesTest {

    @Test
    public void testIsResourceUpdated() {
        ModifiedResources modifiedResources = new ModifiedResources();

        // should be true when no the flag is not set
        assertThat(modifiedResources.isResourceUpdated("any", "any")).isFalse();
        assertThat(modifiedResources.isResourceUpdated(null, "any")).isFalse();

        modifiedResources.setAllModified(false);
        assertThat(modifiedResources.isResourceUpdated("any", "any")).isFalse();
        assertThat(modifiedResources.isResourceUpdated(null, "any")).isFalse();

        modifiedResources.setAllModified(true);
        assertThat(modifiedResources.isResourceUpdated("any", "any")).isTrue();
        assertThat(modifiedResources.isResourceUpdated(null, "any")).isFalse();

        modifiedResources.setAllModified(false);
        modifiedResources.setModifiedResourceMap(Map.of());
        assertThat(modifiedResources.isResourceUpdated("any", "any")).isFalse();
        assertThat(modifiedResources.isResourceUpdated(null, "any")).isFalse();

        modifiedResources.setAllModified(false);
        modifiedResources.setModifiedResourceMap(Map.of("any", Set.of()));
        assertThat(modifiedResources.isResourceUpdated("any", "any")).isFalse();
        assertThat(modifiedResources.isResourceUpdated(null, "any")).isFalse();

        modifiedResources.setAllModified(false);
        modifiedResources.setModifiedResourceMap(Map.of("PAGE", Set.of("home")));
        assertThat(modifiedResources.isResourceUpdated("PAGE", "home")).isTrue();
        assertThat(modifiedResources.isResourceUpdated(null, "any")).isFalse();
    }

    @Test
    public void testPutResource_ForSingleResource() {
        ModifiedResources modifiedResources = new ModifiedResources();
        assertThat(modifiedResources.isResourceUpdated("PAGE", "home")).isFalse();
        assertThat(modifiedResources.isResourceUpdated("PAGE", "random")).isFalse();

        modifiedResources.putResource("PAGE", "home");
        assertThat(modifiedResources.isResourceUpdated("PAGE", "home")).isTrue();
        assertThat(modifiedResources.isResourceUpdated("PAGE", "random")).isFalse();
    }

    @Test
    public void testPutResource_ForSetOfResources() {
        ModifiedResources modifiedResources = new ModifiedResources();
        assertThat(modifiedResources.isResourceUpdated("PAGE", "home")).isFalse();
        assertThat(modifiedResources.isResourceUpdated("PAGE", "random")).isFalse();

        modifiedResources.putResource("PAGE", Set.of("home"));
        assertThat(modifiedResources.isResourceUpdated("PAGE", "home")).isTrue();
        assertThat(modifiedResources.isResourceUpdated("PAGE", "random")).isFalse();

        modifiedResources.putResource("PAGE", Set.of("random")); // should be appended with home
        assertThat(modifiedResources.isResourceUpdated("PAGE", "home")).isTrue();
        assertThat(modifiedResources.isResourceUpdated("PAGE", "random")).isTrue();
    }
}
