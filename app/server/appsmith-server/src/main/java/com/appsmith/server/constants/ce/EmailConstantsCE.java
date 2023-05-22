package com.appsmith.server.constants.ce;

import com.appsmith.server.constants.FieldName;

public class EmailConstantsCE {

    public static final String WORKSPACE_EMAIL_SUBJECT_FOR_NEW_USER = "You’re invited to the workspace %s. \uD83E\uDD73 ";
    public static final String WORKSPACE_EMAIL_SUBJECT_FOR_EXISTING_USER = "You’re invited to the workspace. \uD83E\uDD73 ";
    public static final String FORGOT_PASSWORD_EMAIL_SUBJECT = "Reset your Appsmith password";
    public static final String INVITE_EXISTING_USER_TO_WORKSPACE_TEMPLATE_CE = "email/inviteExistingUserToWorkspaceTemplate.html";
    public static final String INVITE_WORKSPACE_TEMPLATE_CE = "email/inviteWorkspaceTemplate.html";
    public static final String INVITE_USER_CLIENT_URL_FORMAT = "%s/user/signup?email=%s";
    public static final String FORGOT_PASSWORD_TEMPLATE_CE = "email/forgotPasswordTemplate.html";
    public static final String EMAIL_ROLE_ADMINISTRATOR_TEXT = "an " + FieldName.ADMINISTRATOR.toLowerCase();
    public static final String EMAIL_ROLE_DEVELOPER_TEXT = "a " + FieldName.DEVELOPER.toLowerCase();
    public static final String EMAIL_ROLE_VIEWER_TEXT = "an " + FieldName.VIEWER.toLowerCase();
    public static final String WORKSPACE_URL = "%s/applications#%s";
    public static final String INVITER_FIRST_NAME = "inviterFirstName";
    public static final String INVITER_WORKSPACE_NAME = "inviterWorkspaceName";
    public static final String PRIMARY_LINK_URL = "primaryLinkUrl";
    public static final String RESET_URL = "resetUrl";
}