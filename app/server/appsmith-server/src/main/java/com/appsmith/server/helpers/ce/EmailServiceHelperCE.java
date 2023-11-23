package com.appsmith.server.helpers.ce;

import reactor.core.publisher.Mono;

import java.util.Map;

public interface EmailServiceHelperCE {
    Mono<Map<String, String>> enrichWithBrandParams(Map<String, String> params, String origin);

    String getForgotPasswordTemplate();

    String getWorkspaceInviteTemplate(boolean isNewUser);

    String getEmailVerificationTemplate();

    String getAdminInstanceInviteTemplate();

    String getJoinInstanceCtaPrimaryText();

    String getSubjectJoinInstanceAsAdmin(String instanceName);

    String getSubjectJoinWorkspace(String workspaceName);
}
