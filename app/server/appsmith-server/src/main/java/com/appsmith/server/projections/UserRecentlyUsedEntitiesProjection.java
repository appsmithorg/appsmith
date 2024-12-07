package com.appsmith.server.projections;

import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class UserRecentlyUsedEntitiesProjection {
    List<RecentlyUsedEntityDTO> recentlyUsedEntityIds = new ArrayList<>();

    public UserRecentlyUsedEntitiesProjection(List<Object> recentlyUsedEntityIds) {
        if (recentlyUsedEntityIds == null) {
            return;
        }
        // TODO Abhijeet: This is a temporary fix to convert the list of Object to list of RecentlyUsedEntityDTO
        recentlyUsedEntityIds.forEach(recentlyUsedEntityId -> {
            this.recentlyUsedEntityIds.add(
                    new ObjectMapper().convertValue(recentlyUsedEntityId, RecentlyUsedEntityDTO.class));
        });
    }
}
