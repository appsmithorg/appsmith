package com.appsmith.server.services.ce;

import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import kotlin.Pair;


import java.util.HashMap;
import java.util.Map;

public class EmailTemplateServiceCEImpl implements EmailTemplateServiceCE{

    public static final String INVITE_EXISTING_USER_TO_WORKSPACE_TEMPLATE_CE = "email/ce/inviteExistingUserToWorkspaceTemplate.html";
    public static final String INVITE_WORKSPACE_TEMPLATE_CE = "email/ce/inviteWorkspaceTemplate.html";

    @Override
    public Pair<String, String> getSubjectAndWorkspaceEmailTemplateForExistingUser(Workspace inviterWorkspace) {
        String emailSubject = String.format("You’re invited to the workspace %s. \uD83E\uDD73 ", inviterWorkspace.getName());
        return new Pair<>(INVITE_EXISTING_USER_TO_WORKSPACE_TEMPLATE_CE, emailSubject);
    }

    @Override
    public Pair<String, String> getSubjectAndWorkspaceEmailTemplateForNewUser(Workspace inviterWorkspace) {
        String emailSubject = String.format("You’re invited to the workspace %s. \uD83E\uDD73 ", inviterWorkspace.getName());
        return new Pair<>(INVITE_WORKSPACE_TEMPLATE_CE, emailSubject);
    }

    @Override
    public Map<String, String> getWorkspaceEmailParams(Workspace workspace, User inviter, String inviteUrl, String roleType, boolean isNewUser) {
        Map<String, String> params = new HashMap<>();

        if (inviter != null) {
            params.put("inviterFirstName", org.apache.commons.lang3.StringUtils.defaultIfEmpty(inviter.getName(), inviter.getEmail()));
        }
        if(roleType != null){
            if(roleType.startsWith(FieldNameCE.ADMINISTRATOR)){
                params.put("role", "an " + FieldNameCE.ADMINISTRATOR.toLowerCase());
            }else if(roleType.startsWith(FieldNameCE.DEVELOPER)){
                params.put("role", "a " + FieldNameCE.DEVELOPER.toLowerCase());
            }else if(roleType.startsWith(FieldNameCE.VIEWER)){
                params.put("role", "an " + FieldNameCE.VIEWER.toLowerCase());
            }
        }
        if (workspace != null) {
            params.put("inviterWorkspaceName", workspace.getName());
        }
        if (isNewUser) {
            params.put("primaryLinkUrl", inviteUrl);
        } else {
            if (workspace != null) {
                params.put("primaryLinkUrl", inviteUrl + "/applications#" + workspace.getId());
            }
        }
        return params;
    }
}
