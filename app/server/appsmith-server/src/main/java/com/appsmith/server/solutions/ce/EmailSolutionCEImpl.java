package com.appsmith.server.solutions.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.EmailDto;
import com.appsmith.server.notifications.EmailSender;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.EmailConstants.EMAIL_ROLE_ADMINISTRATOR_TEXT;
import static com.appsmith.server.constants.EmailConstants.EMAIL_ROLE_DEVELOPER_TEXT;
import static com.appsmith.server.constants.EmailConstants.EMAIL_ROLE_VIEWER_TEXT;
import static com.appsmith.server.constants.EmailConstants.FORGOT_PASSWORD_EMAIL_SUBJECT;
import static com.appsmith.server.constants.EmailConstants.FORGOT_PASSWORD_TEMPLATE;
import static com.appsmith.server.constants.EmailConstants.INVITER_FIRST_NAME;
import static com.appsmith.server.constants.EmailConstants.INVITER_WORKSPACE_NAME;
import static com.appsmith.server.constants.EmailConstants.INVITE_EXISTING_USER_TO_WORKSPACE_TEMPLATE;
import static com.appsmith.server.constants.EmailConstants.INVITE_NEW_USER_TO_WORKSPACE_TEMPLATE;
import static com.appsmith.server.constants.EmailConstants.PRIMARY_LINK_URL;
import static com.appsmith.server.constants.EmailConstants.RESET_URL;
import static com.appsmith.server.constants.EmailConstants.SIGNUP_NEW_USER_CLIENT_URL_FORMAT;
import static com.appsmith.server.constants.EmailConstants.WORKSPACE_EMAIL_SUBJECT_FOR_EXISTING_USER;
import static com.appsmith.server.constants.EmailConstants.WORKSPACE_EMAIL_SUBJECT_FOR_NEW_USER;
import static com.appsmith.server.constants.EmailConstants.WORKSPACE_URL_FORMAT;
import static org.apache.commons.lang3.StringUtils.defaultIfEmpty;

@Slf4j
@AllArgsConstructor
public class EmailSolutionCEImpl implements EmailSolutionCE {

    private final EmailSender emailSender;
    private final CommonConfig commonConfig;


    protected EmailDto getSubjectAndWorkspaceEmailTemplate(Workspace inviterWorkspace, Boolean isNewUser) {
        if(isNewUser){
            String subject = String.format(WORKSPACE_EMAIL_SUBJECT_FOR_NEW_USER, inviterWorkspace.getName());
            return new EmailDto(subject, INVITE_NEW_USER_TO_WORKSPACE_TEMPLATE);
        }else {
            return new EmailDto(WORKSPACE_EMAIL_SUBJECT_FOR_EXISTING_USER, INVITE_EXISTING_USER_TO_WORKSPACE_TEMPLATE);
        }
    }


    /**
     * Preparing the parameters which will be used in creating workspace email body from workspace template.
     */
    private Map<String, String> getWorkspaceEmailParams(Workspace workspace, User inviter, String inviteUrl, String roleType, boolean isNewUser) {
        Map<String, String> params = new HashMap<>();

        if (inviter != null) {
            params.put(INVITER_FIRST_NAME, defaultIfEmpty(inviter.getName(), inviter.getEmail()));
        }
        if(roleType != null){
            if(roleType.startsWith(FieldName.ADMINISTRATOR)){
                params.put(FieldName.ROLE, EMAIL_ROLE_ADMINISTRATOR_TEXT);
            }else if(roleType.startsWith(FieldName.DEVELOPER)){
                params.put(FieldName.ROLE, EMAIL_ROLE_DEVELOPER_TEXT);
            }else if(roleType.startsWith(FieldName.VIEWER)){
                params.put(FieldName.ROLE, EMAIL_ROLE_VIEWER_TEXT);
            }
        }
        if (workspace != null) {
            params.put(INVITER_WORKSPACE_NAME, workspace.getName());
        }
        if (isNewUser) {
            params.put(PRIMARY_LINK_URL, inviteUrl);
        } else {
            if (workspace != null) {
                params.put(PRIMARY_LINK_URL, String.format(WORKSPACE_URL_FORMAT, inviteUrl, workspace.getId()));
            }
        }
        return params;
    }

    @Override
    public Mono<Map<String, String>> updateTenantLogoInParams(Map<String, String> params, String origin) {
        return Mono.just(params);
    }

    protected EmailDto getSubjectAndForgotPasswordEmailTemplate(String instanceName) {
        return new EmailDto(FORGOT_PASSWORD_EMAIL_SUBJECT, FORGOT_PASSWORD_TEMPLATE);
    }

    @Override
    public Mono<Map<String, String>> sendForgetPasswordEmail(String email, String resetUrl, String originHeader) {
        String instanceName = defaultIfEmpty(commonConfig.getInstanceName(), Appsmith.APPSMITH);
        Map<String, String> params = new HashMap<>();
        params.put(RESET_URL, resetUrl);
        EmailDto subjectAndEmailTemplate = this.getSubjectAndForgotPasswordEmailTemplate(instanceName);
        return this.updateTenantLogoInParams(params, originHeader)
                .flatMap(updatedParams ->
                        emailSender.sendMail(
                                email,
                                subjectAndEmailTemplate.getSubject(),
                                subjectAndEmailTemplate.getEmailTemplate(),
                                updatedParams
                        ).thenReturn(updatedParams)
                );
    }

    @Override
    public Mono<User> sendInviteUserAuditLogEvent(User currentUser, List<User> invitedUserList, String instanceId, String instanceName) {
        return Mono.just(currentUser);
    }

    @Override
    public Mono<Map<String, String>> sendInviteUserToWorkspaceEmail(String originHeader, Workspace workspace, User inviter,
                                                                    String permissionGroupName, User invitee, Boolean isNewUser) {
        // This is a part of inviteUrl that will be sent to the user if it's not a new user
        String inviteUrl = originHeader;
        if(isNewUser){
            inviteUrl = getSignupUrl(originHeader, invitee);
        }
        EmailDto subjectAndEmailTemplate = this.getSubjectAndWorkspaceEmailTemplate(workspace, isNewUser);
        Map<String, String> params = getWorkspaceEmailParams(workspace, inviter, inviteUrl, permissionGroupName, isNewUser);
        return updateTenantLogoInParams(params, originHeader)
                .flatMap(updatedParams ->
                        emailSender.sendMail(
                                invitee.getEmail(),
                                subjectAndEmailTemplate.getSubject(),
                                subjectAndEmailTemplate.getEmailTemplate(),
                                updatedParams
                        ).thenReturn(updatedParams)
                );
    }

    protected String getSignupUrl(String originHeader, User invitee) {
        String inviteUrl;
        inviteUrl = String.format(
                SIGNUP_NEW_USER_CLIENT_URL_FORMAT,
                originHeader,
               URLEncoder.encode(invitee.getUsername().toLowerCase(), StandardCharsets.UTF_8)
       );
        return inviteUrl;
    }
}
