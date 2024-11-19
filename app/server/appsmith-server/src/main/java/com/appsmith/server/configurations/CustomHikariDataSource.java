package com.appsmith.server.configurations;

import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentHashMap;

public class CustomHikariDataSource extends HikariDataSource {

    // Map to store connections per reqId
    private final ConcurrentHashMap<String, Connection> connectionMap = new ConcurrentHashMap<>();

    @Override
    public Connection getConnection() throws SQLException {
        String reqId = ReactorContextHelper.getReqId(); // Fetch reqId from Reactor context
        if (reqId == null) {
            throw new IllegalStateException("reqId not found in Reactor context");
        }

        // Return the existing connection or create a new one
        // 10 connections get from the pool
        // 1 for transaction
        // Normal JDBC connection
        // Connction - Spring

        // 1. Identify if the query/request is Transactional
        // 2. true, create a new connection(does not come from default pool) and use it for the rest of the flow
        //      a.
        return connectionMap.computeIfAbsent(reqId, key -> {
            try {
                return super.getConnection();
            } catch (SQLException e) {
                throw new RuntimeException("Failed to get connection for reqId: " + reqId, e);
            }
        });
    }

    // Cleanup method to release connections after request processing
    public void releaseConnection(String reqId) {
        Connection connection = connectionMap.remove(reqId);
        if (connection != null) {
            try {
                connection.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
