package com.appsmith.server.projections;

import java.time.Instant;

public record DefaultTimestampOnly(Instant updatedAt, Instant createdAt) {}
