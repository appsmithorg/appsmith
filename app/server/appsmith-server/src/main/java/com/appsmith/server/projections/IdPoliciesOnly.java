package com.appsmith.server.projections;

import com.appsmith.external.models.Policy;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

@Getter
public class IdPoliciesOnly {
    String id;
    Map<String, Policy> policyMap = new HashMap<>();

    // TODO Abhijeet: This is a temporary fix to convert the map of Object to map of Policy
    public IdPoliciesOnly(String id, Map<String, Object> policyMap) {
        this.id = id;
        if (policyMap == null) {
            return;
        }
        policyMap.forEach((key, value) -> {
            if (value instanceof Policy) {
                this.policyMap.put(key, (Policy) value);
            } else if (value instanceof Map) {
                this.policyMap.put(key, new ObjectMapper().convertValue(value, Policy.class));
            }
        });
    }
}
