package com.appsmith.server.projections;

import com.appsmith.server.dtos.RecentlyUsedEntityDTO;

import java.util.List;

public interface UserRecentlyUsedEntitiesProjection {
    List<RecentlyUsedEntityDTO> getRecentlyUsedEntityIds();
}
