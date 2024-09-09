package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.solutions.PolicySolution;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class PolicySolutionCEImplTest {

    @Autowired
    private PolicySolution policySolution;

    private static class TestClass extends BaseDomain {
        TestClass(Set<Policy> policies) {
            Map<String, Policy> policyMap = new HashMap<>();
            policies.forEach(p -> policyMap.put(p.getPermission(), p));
            this.setPolicyMap(policyMap);
        }

        TestClass() {}
    }

    @Test
    void testAddNewPoliciesToNullPoliciesObject() {
        TestClass obj = new TestClass();
        obj.setPolicies(null);
        Map<String, Policy> policyMap = new HashMap<>();
        policyMap.put("read", new Policy("read", new HashSet<>(Set.of("group1"))));

        BaseDomain result = policySolution.addPoliciesToExistingObject(policyMap, obj);

        assertTrue(result.getPolicies().containsAll(policyMap.values()));
    }

    @Test
    void testAddNewPoliciesToEmptyObject() {
        BaseDomain obj = new TestClass(); // Assuming BaseDomain has a default empty set of policies.
        Map<String, Policy> policyMap = new HashMap<>();
        policyMap.put("read", new Policy("read", new HashSet<>(Set.of("group1"))));

        BaseDomain result = policySolution.addPoliciesToExistingObject(policyMap, obj);

        assertTrue(result.getPolicies().containsAll(policyMap.values()));
    }

    @Test
    void testMergePoliciesWithExistingOnes() {
        Set<Policy> existingPolicies = new HashSet<>();
        existingPolicies.add(new Policy("read", new HashSet<>(Set.of("group1"))));
        BaseDomain obj = new TestClass(existingPolicies);

        Map<String, Policy> policyMap = new HashMap<>();
        policyMap.put("read", new Policy("read", new HashSet<>(Set.of("group2"))));
        policyMap.put("write", new Policy("write", new HashSet<>(Set.of("group1"))));

        BaseDomain result = policySolution.addPoliciesToExistingObject(policyMap, obj);

        assertEquals(2, result.getPolicies().size());
        assertTrue(result.getPolicies().stream()
                .anyMatch(p -> p.getPermission().equals("read")
                        && p.getPermissionGroups().containsAll(Set.of("group1", "group2"))));
        assertTrue(result.getPolicies().stream()
                .anyMatch(p -> p.getPermission().equals("write")
                        && p.getPermissionGroups().contains("group1")));
    }

    @Test
    void testOriginalPolicyMapNotModified() {
        Set<Policy> existingPolicies = new HashSet<>();
        existingPolicies.add(new Policy("read", new HashSet<>(Set.of("group1"))));
        BaseDomain obj = new TestClass(existingPolicies);
        Map<String, Policy> originalPolicyMap = new HashMap<>();
        originalPolicyMap.put("read", new Policy("read", new HashSet<>(Set.of("group2"))));

        Map<String, Policy> policyMapToPass = new HashMap<>(originalPolicyMap);
        BaseDomain result = policySolution.addPoliciesToExistingObject(policyMapToPass, obj);

        assertEquals(originalPolicyMap, policyMapToPass);
        assertTrue(originalPolicyMap.values().stream()
                .anyMatch(p -> p.getPermission().equals("read")
                        && p.getPermissionGroups().contains("group2")));
        assertTrue(result.getPolicies().stream()
                .anyMatch(p -> p.getPermission().equals("read")
                        && p.getPermissionGroups().containsAll(Set.of("group1", "group2"))));
    }

    @Test
    void testReturnModifiedObject() {
        BaseDomain obj = new TestClass();
        Map<String, Policy> policyMap = new HashMap<>();
        policyMap.put("read", new Policy("read", new HashSet<>(Set.of("group1"))));

        BaseDomain result = policySolution.addPoliciesToExistingObject(policyMap, obj);

        assertSame(obj, result);
    }
}
