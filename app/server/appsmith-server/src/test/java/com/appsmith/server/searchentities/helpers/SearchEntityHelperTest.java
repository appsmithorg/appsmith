package com.appsmith.server.searchentities.helpers;

import org.junit.jupiter.api.Test;

import static com.appsmith.server.searchentities.helpers.SearchEntityHelper.shouldSearchEntity;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SearchEntityHelperTest {

    private static class TestEntity {}

    @Test
    public void testShouldSearchEntity_NullEntities() {
        assertTrue(shouldSearchEntity(TestEntity.class, null));
    }

    @Test
    public void testShouldSearchEntity_EmptyEntities() {
        assertTrue(shouldSearchEntity(TestEntity.class, new String[] {}));
    }

    @Test
    public void testShouldSearchEntity_EntityInEntities() {
        assertTrue(shouldSearchEntity(TestEntity.class, new String[] {"TestEntity"}));
    }

    @Test
    public void testShouldSearchEntity_EntityNotInEntities() {
        assertFalse(shouldSearchEntity(TestEntity.class, new String[] {"AnotherEntity"}));
    }

    @Test
    public void testShouldSearchEntity_CaseInsensitiveMatch() {
        assertTrue(shouldSearchEntity(TestEntity.class, new String[] {"testEntity"}));
    }

    @Test
    public void testShouldSearchEntity_MultipleEntities() {
        assertTrue(
                shouldSearchEntity(TestEntity.class, new String[] {"AnotherEntity", "TestEntity", "YetAnotherEntity"}));
    }

    @Test
    public void testShouldSearchEntity_MultipleEntitiesNoMatch() {
        assertFalse(shouldSearchEntity(TestEntity.class, new String[] {"Entity1", "Entity2", "Entity3"}));
    }
}
