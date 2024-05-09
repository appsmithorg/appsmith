package com.appsmith.server.projections;

import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class UserRecentlyUsedEntitiesProjection {
    List<RecentlyUsedEntityDTO> recentlyUsedEntityIds;
}
