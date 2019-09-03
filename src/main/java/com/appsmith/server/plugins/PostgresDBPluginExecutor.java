package com.appsmith.server.plugins;

import com.appsmith.server.domains.Query;
import com.appsmith.server.dtos.CommandQueryParams;
import com.appsmith.server.services.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
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
@Component
public class PostgresDBPluginExecutor extends PluginExecutor {

    // JDBC driver name and database URL
    @Value("${jdbc.postgres.driver}")
    String JDBC_DRIVER;

    @Value("${jdbc.postgres.url}")
    String DB_URL;

    //  Database credentials
    @Value("${jdbc.postgres.username}")
    String DB_USER;

    @Value("${jdbc.postgres.password}")
    String DB_PASS;

    Connection conn = null;

    @Override
    public Flux<Object> execute(Query queryObj, CommandQueryParams params) {
        if (conn == null) {
            init();
        }
        ArrayList list = new ArrayList(50);
        try {
            Statement statement = conn.createStatement();
            String queryTemplate = queryObj.getCommandTemplate();

            ResultSet resultSet = statement.executeQuery(queryTemplate);
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
            e.printStackTrace();
        }
        return Flux.fromIterable(list);
    }

    @Override
    public void init() {
        log.debug("Going to initialize the PostgresDBPluginExecutor");
        try {

            // Load the class into JVM
            Class.forName(JDBC_DRIVER);
            log.debug("Got the jdbc url as {}", DB_URL);
            // Create the connection
            conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void destroy() {

    }

}
