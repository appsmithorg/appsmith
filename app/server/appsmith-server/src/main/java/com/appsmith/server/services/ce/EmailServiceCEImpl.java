package com.appsmith.server.services.ce;

import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.solutions.ce.UserAndAccessManagementServiceCEImpl;
import kotlin.Pair;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;


import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@AllArgsConstructor
public class EmailServiceCEImpl implements EmailServiceCE {

    private final EmailSender emailSender;
    public static final String INVITE_EXISTING_USER_TO_WORKSPACE_TEMPLATE_CE = "email/ce/inviteExistingUserToWorkspaceTemplate.html";
    public static final String INVITE_WORKSPACE_TEMPLATE_CE = "email/ce/inviteWorkspaceTemplate.html";
    private static final String INVITE_USER_CLIENT_URL_FORMAT = "%s/user/signup?email=%s";



    @Override
    public Pair<String, String> getSubjectAndWorkspaceEmailTemplate(Workspace inviterWorkspace, Boolean isNewUser) {
        if(isNewUser){
            String emailSubject = String.format("You’re invited to the workspace %s. \uD83E\uDD73 ", inviterWorkspace.getName());
            return new Pair<>(emailSubject, INVITE_WORKSPACE_TEMPLATE_CE);
        }else {
            String emailSubject = String.format("You’re invited to the workspace %s. \uD83E\uDD73 ", inviterWorkspace.getName());
            return new Pair<>(emailSubject, INVITE_EXISTING_USER_TO_WORKSPACE_TEMPLATE_CE);
        }
    }

    private Map<String, String> getWorkspaceEmailParams(Workspace workspace, User inviter, String inviteUrl, String roleType, boolean isNewUser) {
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

    @Override
    public Mono<Map<String, String>> updateTenantLogoInParams(Map<String, String> params, String origin) {
        return Mono.just(params);
    }

    @Override
    public Mono<Map<String, String>> sendInviteWorkspaceEmail(String originHeader, Workspace workspace, User inviter,
                                                              String permissionGroupName, User invitee, Boolean isNewUser) {
        String inviteUrl = originHeader;
        if(isNewUser){
            inviteUrl = getSignupUrl(originHeader, invitee);
        }
        Pair<String, String> subjectAndEmailTemplate = this.getSubjectAndWorkspaceEmailTemplate(workspace, isNewUser);
        Map<String, String> params = getWorkspaceEmailParams(workspace, inviter, inviteUrl, permissionGroupName, isNewUser);
        return updateTenantLogoInParams(params, originHeader)
                .flatMap(updatedParams ->
                        emailSender.sendMail(
                                invitee.getEmail(),
                                subjectAndEmailTemplate.getFirst(),
                                subjectAndEmailTemplate.getSecond(),
                                updatedParams
                        ).thenReturn(updatedParams)
                );
    }

    public String getSignupUrl(String originHeader, User invitee) {
        String inviteUrl;
        inviteUrl = String.format(
               INVITE_USER_CLIENT_URL_FORMAT,
                originHeader,
               URLEncoder.encode(invitee.getUsername().toLowerCase(), StandardCharsets.UTF_8)
       );
        return inviteUrl;
    }
}
