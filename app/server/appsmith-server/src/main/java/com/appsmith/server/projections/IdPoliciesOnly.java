package com.appsmith.server.projections;

import com.appsmith.external.models.Policy;
import lombok.Getter;
import lombok.NonNull;

import java.util.Set;

public record IdPoliciesOnly(@NonNull String id, @Getter Set<Policy> policies) {}
