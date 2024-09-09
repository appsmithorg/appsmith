package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class BaseAppsmithRepositoryImplTest {

    BaseAppsmithRepositoryCEImpl<TestClass> baseAppsmithRepositoryImpl;

    @BeforeEach
    public void setup() {
        baseAppsmithRepositoryImpl = new BaseAppsmithRepositoryCEImpl<>() {};
    }

    class TestClass extends BaseDomain {}

    @Test
    void testSetUserPermissionsInObject_whenPoliciesIsEmptySet_emptyCollectionValueIsSet() {
        // Test the method setPoliciesInObject when the policies are null
        // The method should set an empty collection value in the object
        // The method should return the object
        TestClass obj = baseAppsmithRepositoryImpl
                .setUserPermissionsInObject(new TestClass(), null)
                .block();
        assertNotNull(obj);
        Assertions.assertEquals(0, obj.getPolicies().size());
    }

    @Test
    void testSetUserPermissionsInObject_whenPoliciesIsNull_nullPoliciesAreSet() {
        // Test the method setPoliciesInObject when the policies are empty
        // The method should set an empty collection value in the object
        // The method should return the object
        TestClass obj = new TestClass();
        obj.setPolicies(null);
        Set<String> permissionGroups = new HashSet<>();
        permissionGroups.add(UUID.randomUUID().toString());
        obj = baseAppsmithRepositoryImpl
                .setUserPermissionsInObject(obj, permissionGroups)
                .block();
        assertNotNull(obj);
        Assertions.assertNull(obj.getPolicies());
    }
}
