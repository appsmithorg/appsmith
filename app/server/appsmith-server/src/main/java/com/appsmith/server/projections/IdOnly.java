package com.appsmith.server.projections;

import com.appsmith.external.models.Policy;
import lombok.NonNull;

import java.util.Set;

public record IdOnly(@NonNull String id, Set<Policy> policies) {}
