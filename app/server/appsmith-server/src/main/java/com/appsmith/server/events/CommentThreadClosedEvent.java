package com.appsmith.server.events;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.WorkspaceMemberInfoDTO;
import lombok.Getter;

import java.util.List;

@Getter
public class CommentThreadClosedEvent extends AbstractCommentEvent {
    private final CommentThread commentThread;

    public CommentThreadClosedEvent(String authorUserName, Workspace workspace, List<WorkspaceMemberInfoDTO> workspaceMembers,
                                    Application application, String originHeader, CommentThread commentThread,
                                    String pagename) {

        super(authorUserName, workspace, workspaceMembers, application, originHeader, pagename);
        this.commentThread = commentThread;
    }
}
