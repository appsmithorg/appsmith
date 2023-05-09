package com.appsmith.server.services.ce;

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
        String emailSubject = String.format("You've been invited to the Appsmith workspace %s.", inviterWorkspace.getName());
        return new Pair<>(INVITE_EXISTING_USER_TO_WORKSPACE_TEMPLATE_CE, emailSubject);
    }

    @Override
    public Pair<String, String> getSubjectAndWorkspaceEmailTemplateForNewUser(Workspace inviterWorkspace) {
        String emailSubject = String.format("You've been invited to the Appsmith workspace %s.", inviterWorkspace.getName());
        return new Pair<>(INVITE_WORKSPACE_TEMPLATE_CE, emailSubject);
    }

    @Override
    public Map<String, String> getEmailParams(Workspace workspace, User inviter, String inviteUrl, boolean isNewUser) {
        Map<String, String> params = new HashMap<>();

        if (inviter != null) {
            params.put("inviterFirstName", org.apache.commons.lang3.StringUtils.defaultIfEmpty(inviter.getName(), inviter.getEmail()));
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
