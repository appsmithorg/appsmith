package com.appsmith.server.projections;

import com.appsmith.external.models.Policy;
import lombok.Getter;
import lombok.NonNull;

import java.util.Set;

@Getter
public record IdPoliciesOnly(@NonNull String id, Set<Policy> policies) {}
