package com.external.plugins;

package com.example.redshift;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.Properties;
import java.sql.SQLException;
import java.sql.ResultSet;

public class RedshiftPlugin extends BasePlugin {
    static final String JDBC_DRIVER = "com.amazon.redshift.jdbc.Driver";
    private static final String USER = "user";
    private static final String PASSWORD = "password";
    private static final String SSL = "ssl";
    private static final int VALIDITY_CHECK_TIMEOUT = 5;

    public RedshiftPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }


}
