package com.external.connections;

import com.appsmith.external.models.AuthenticationDTO;


public class APIConnectionFactory {

    public static APIConnection createConnection(AuthenticationDTO authenticationType) {
        String connectionType = null;

        if (authenticationType != null) {
            connectionType = authenticationType.getClass().getSimpleName();
        }

        switch (connectionType) {
            default:
                return null;
        }
    }
}
