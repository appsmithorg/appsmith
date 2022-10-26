package com.appsmith.server.events;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.WorkspaceMemberInfoDTO;
import lombok.Data;

import java.util.List;

@Data
public abstract class AbstractCommentEvent {
    private final String authorUserName;
    private final Workspace workspace;
    private final List<WorkspaceMemberInfoDTO> workspaceMembers;
    private final Application application;
    private final String originHeader;
    private final String pageName;
}
