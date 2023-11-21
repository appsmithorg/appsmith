package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.data.annotation.Transient;

import java.util.List;

@Data
@AllArgsConstructor
public class RecentlyUsedEntityDTO {
    List<String> applicationIds;

    @Transient
    String workspaceId;
}
