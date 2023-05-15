package com.appsmith.server.services;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.services.ce.EmailServiceCE;
import com.appsmith.server.solutions.ce.UserAndAccessManagementServiceCEImpl;
import kotlin.Pair;
import org.jetbrains.annotations.NotNull;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface EmailService extends EmailServiceCE {


}
