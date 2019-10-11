package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.ResourceConfiguration;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.pf4j.Extension;
import org.pf4j.PluginException;
import org.pf4j.PluginWrapper;
import org.springframework.util.Assert;
import reactor.core.publisher.Mono;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Slf4j
public class PostgresPlugin extends BasePlugin {

    private static ObjectMapper objectMapper;

    static String JDBC_DRIVER = "org.postgresql.Driver";

    public PostgresPlugin(PluginWrapper wrapper) {
        super(wrapper);
        this.objectMapper = new ObjectMapper();
    }

    @Slf4j
    @Extension
    public static class PostgresPluginExecutor implements PluginExecutor {

        @Override
        public Mono<ActionExecutionResult> execute(Object connection,
                                                   ResourceConfiguration resourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            Connection conn = (Connection) connection;
            Assert.notNull(conn);

            ArrayList list = new ArrayList(50);
            try {
                Statement statement = conn.createStatement();

                ResultSet resultSet = statement.executeQuery(actionConfiguration.getQuery());
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

            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(objectMapper.valueToTree(list));
            return Mono.just(result);
        }

        @Override
        public Object resourceCreate(ResourceConfiguration resourceConfiguration) {
            Connection conn = null;
            try {
                // Load the class into JVM
                Class.forName(JDBC_DRIVER);

                // Create the connection
                conn = DriverManager.getConnection(resourceConfiguration.getUrl(),
                                                   resourceConfiguration.getAuthentication().getUsername(),
                                                   resourceConfiguration.getAuthentication().getPassword());
                return conn;
            } catch (ClassNotFoundException e) {
                log.error("", e);
            } catch (SQLException e) {
                log.error("", e);
            }
            return conn;
        }

        @Override
        public void resourceDestroy(Object connection) {
            Connection conn = (Connection) connection;
            try {
                if (conn != null) {
                    conn.close();
                }
            } catch (SQLException e) {
                log.error("", e);
                try {
                    throw new PluginException(e);
                } catch (PluginException ex) {
                    ex.printStackTrace();
                }
            }
        }

    }

}
