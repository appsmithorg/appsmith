package com.appsmith.server.helpers.ce;

import reactor.core.publisher.Mono;

import java.util.Map;

public interface EmailServiceHelperCE {
    Mono<Map<String, String>> enrichWithBrandParams(Map<String, String> params, String origin);

    String getForgotPasswordTemplate(String organizationId);

    String getWorkspaceInviteTemplate(boolean isNewUser, String organizationId);

    String getEmailVerificationTemplate(String organizationId);

    String getAdminInstanceInviteTemplate(String organizationId);

    String getJoinInstanceCtaPrimaryText(String organizationId);

    String getSubjectJoinInstanceAsAdmin(String instanceName, String organizationId);

    String getSubjectJoinWorkspace(String workspaceName, String organizationId);
}
