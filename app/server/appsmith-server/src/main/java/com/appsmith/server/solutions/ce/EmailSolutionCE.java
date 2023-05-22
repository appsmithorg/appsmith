package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface EmailSolutionCE {

    Mono<Map<String, String>> sendInviteUserToWorkspaceEmail(String originHeader, Workspace workspace, User inviter,
                                                             String permissionGroupName, User invitee, Boolean isNewUser);
    Mono<Map<String, String>> updateTenantLogoInParams(Map<String, String> params, String origin);

    Mono<Map<String, String>> sendForgetPasswordEmail(String email, String resetUrl, String originHeader);
}
