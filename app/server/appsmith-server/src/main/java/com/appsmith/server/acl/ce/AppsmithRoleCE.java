package com.appsmith.server.acl.ce;

import com.appsmith.server.acl.AclPermission;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

import static com.appsmith.server.acl.ce.AclPermissionCE.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.ce.AclPermissionCE.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.ce.AclPermissionCE.ORGANIZATION_EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.ce.AclPermissionCE.ORGANIZATION_INVITE_USERS;
import static com.appsmith.server.acl.ce.AclPermissionCE.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.ce.AclPermissionCE.ORGANIZATION_PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.ce.AclPermissionCE.ORGANIZATION_READ_APPLICATIONS;
import static com.appsmith.server.acl.ce.AclPermissionCE.READ_APPLICATIONS;
import static com.appsmith.server.acl.ce.AclPermissionCE.READ_ORGANIZATIONS;

@Getter
@Setter
public class AppsmithRoleCE {

    public static final AppsmithRoleCE APPLICATION_ADMIN = new AppsmithRoleCE("Application Administrator",
            "", Set.of( (AclPermission) MANAGE_APPLICATIONS));
    public static final AppsmithRoleCE APPLICATION_VIEWER = new AppsmithRoleCE("Application Viewer",
            "",  Set.of( (AclPermission) READ_APPLICATIONS));
    public static final AppsmithRoleCE ORGANIZATION_ADMIN = new AppsmithRoleCE("Administrator",
            "Can modify all organization settings including editing applications, inviting other users " +
                    "to the organization and exporting applications from the organization",
            Set.of( (AclPermission) MANAGE_ORGANIZATIONS,
                    (AclPermission) ORGANIZATION_INVITE_USERS,
                    (AclPermission) ORGANIZATION_EXPORT_APPLICATIONS));
    public static final AppsmithRoleCE ORGANIZATION_DEVELOPER = new AppsmithRoleCE("Developer",
            "Can edit and view applications along with inviting other users to the organization",
            Set.of( (AclPermission) READ_ORGANIZATIONS,
                    (AclPermission) ORGANIZATION_MANAGE_APPLICATIONS,
                    (AclPermission) ORGANIZATION_READ_APPLICATIONS,
                    (AclPermission) ORGANIZATION_PUBLISH_APPLICATIONS,
                    (AclPermission) ORGANIZATION_INVITE_USERS));
    public static final AppsmithRoleCE ORGANIZATION_VIEWER = new AppsmithRoleCE("App Viewer",
            "Can view applications and invite other users to view applications",
            Set.of( (AclPermission) READ_ORGANIZATIONS,
                    (AclPermission) ORGANIZATION_READ_APPLICATIONS,
                    (AclPermission) ORGANIZATION_INVITE_USERS));

    private Set<AclPermission> permissions;
    private String name;
    private String description;

    public AppsmithRoleCE(String name, String description, Set<AclPermission> permissions) {
        this.name = name;
        this.description = description;
        this.permissions = permissions;
    }

}
