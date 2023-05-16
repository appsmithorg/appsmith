package com.appsmith.server.services.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.solutions.ce.UserAndAccessManagementServiceCEImpl;
import kotlin.Pair;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface EmailServiceCE {

    Mono<Map<String, String>> sendWorkspaceEmail(String originHeader, Workspace workspace, User inviter,
                                  String permissionGroupName, User invitee, Boolean isNewUser);
    Mono<Map<String, String>> updateTenantLogoInParams(Map<String, String> params, String origin);
}
