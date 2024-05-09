package com.appsmith.server.projections;

import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class UserRecentlyUsedEntitiesProjection {
    List<RecentlyUsedEntityDTO> recentlyUsedEntityIds;
}
