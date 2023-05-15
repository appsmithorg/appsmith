package com.appsmith.server.services.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.solutions.ce.UserAndAccessManagementServiceCEImpl;
import kotlin.Pair;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface EmailServiceCE {

    Pair<String, String> getSubjectAndWorkspaceEmailTemplate(Workspace inviterWorkspace, Boolean isNewUser);
    Map<String, String> getWorkspaceEmailParams( Workspace workspace, User inviter, String inviteUrl, String roleType, boolean isNewUser);

    Mono<Boolean> sendWorkspaceEmail(String originHeader, Workspace workspace, User inviter,
                                  String permissionGroupName, User invitee, Boolean isNewUser);
    Mono<Map<String, String>> updateTenantLogoInParams(Map<String, String> params, String origin);
}
