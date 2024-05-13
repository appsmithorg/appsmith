package com.appsmith.server.projections;

import com.appsmith.server.dtos.RecentlyUsedEntityDTO;

import java.util.List;

public record UserRecentlyUsedEntitiesProjection(List<RecentlyUsedEntityDTO> recentlyUsedEntityIds) {}
