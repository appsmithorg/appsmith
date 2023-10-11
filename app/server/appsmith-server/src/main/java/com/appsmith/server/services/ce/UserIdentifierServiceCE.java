package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;

public interface UserIdentifierServiceCE {

    String getUserIdentifier(User user);

    String hash(String value);

    String getEmailDomain(String email);
}
