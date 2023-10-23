package com.appsmith.server.blasphemy;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.postgresql.util.PGobject;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Collection;

@Slf4j
public class DBConnection {

    private static DBConnection instance;

    private Connection con;

    private DBConnection() throws SQLException {
        System.out.println("DBConnection init");

        String url = "jdbc:postgresql://localhost/postgres?user=postgres&password=hammer";
        con = DriverManager.getConnection(url);
    }

    public static DBConnection getInstance() {
        if (instance == null) {
            try {
                instance = new DBConnection();
            } catch (SQLException e) {
                System.err.println("DBConnection getInstance error: " + e.getMessage());
            }
        }

        return instance;
    }

    public void execute(String sql) throws SQLException, JsonProcessingException {
        execute(sql, null);
    }

    public void execute(String sql, Collection<Object> values) throws SQLException, JsonProcessingException {
        log.debug("DBConnection execute {}", sql);

        final PreparedStatement statement = con.prepareStatement(sql);

        if (values != null) {
            int i = 1;
            for (Object value : values) {
                if (value instanceof Enum<?>) {
                    statement.setObject(i++, String.valueOf(value));
                } else if (value instanceof Collection<?>) {
                    PGobject jsonObject = new PGobject();
                    jsonObject.setType("jsonb");
                    jsonObject.setValue(new ObjectMapper().writeValueAsString(value));
                    statement.setObject(i++, jsonObject);
                } else {
                    statement.setObject(i++, value);
                }
            }
        }

        log.debug("Result {}", statement.execute());
    }
}
