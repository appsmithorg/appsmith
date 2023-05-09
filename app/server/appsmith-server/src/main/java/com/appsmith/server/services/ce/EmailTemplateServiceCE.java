package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import kotlin.Pair;

import java.util.Map;

public interface EmailTemplateServiceCE {

    public Pair<String, String> getSubjectAndWorkspaceEmailTemplateForExistingUser(Workspace inviterWorkspace);

    public Pair<String, String> getSubjectAndWorkspaceEmailTemplateForNewUser(Workspace inviterWorkspace);

    public Map<String, String> getEmailParams(Workspace workspace, User inviter, String inviteUrl, boolean isNewUser);

}
