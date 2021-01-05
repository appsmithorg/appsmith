package com.external.connections;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.OAuth2;


public class APIConnectionFactory {

    public static APIConnection createConnection(AuthenticationDTO authenticationType) {
        if (authenticationType instanceof OAuth2) {
            return OAuth2Connection.create((OAuth2) authenticationType);
        } else {
            return null;
        }
    }
}