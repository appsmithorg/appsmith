package com.external.plugins;

import com.appsmith.external.models.CommandParams;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginException;
import org.pf4j.PluginWrapper;
import org.springframework.util.Assert;
import reactor.core.publisher.Flux;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;

@Slf4j
public class PostgresPlugin extends BasePlugin {
    static String JDBC_DRIVER="org.postgresql.Driver";

    static String DB_URL="jdbc:postgresql://localhost/mobtools";

    //  Database credentials
    static String DB_USER="root";

    static String DB_PASS="root";

    static Connection conn = null;

    public PostgresPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Override
    public void start() throws PluginException {
        log.debug("Going to initialize the PostgresDBPlugin");
        try {
            // Load the class into JVM
            Class.forName(JDBC_DRIVER);
            log.debug("Got the jdbc url as {}", DB_URL);
            // Create the connection
            conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
        } catch (ClassNotFoundException e) {
            log.error("", e);
        } catch (SQLException e) {
            log.error("", e);
        }
    }

    @Override
    public void stop() throws PluginException {
        log.debug("PostgresPlugin.stop()");
        try {
            if(conn != null) {
                conn.close();
            }
        } catch (SQLException e) {
            log.error("", e);
            throw new PluginException(e);
        }
    }

    @Slf4j
    @Extension
    public static class PostgresPluginExecutor implements PluginExecutor {

        @Override
        public Flux<Object> execute(String command, CommandParams commandParams) {
            log.debug("In the PostgresPlugin execute with command: {}", command);
            Assert.notNull(conn);

            ArrayList list = new ArrayList(50);
            try {
                Statement statement = conn.createStatement();

                ResultSet resultSet = statement.executeQuery(command);
                ResultSetMetaData metaData = resultSet.getMetaData();
                Integer colCount = metaData.getColumnCount();
                while (resultSet.next()) {
                    HashMap row = new HashMap(colCount);
                    for (int i = 1; i <= colCount; i++) {
                        row.put(metaData.getColumnName(i), resultSet.getObject(i));
                    }
                    list.add(row);
                }
            } catch (SQLException e) {
                log.error("", e);
            }
            list.forEach(System.out::println);

            return Flux.fromIterable(list);
        }

    }

}
