package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

public class SnowflakePlugin extends BasePlugin {

    public SnowflakePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class SnowflakePluginExecutor implements PluginExecutor<Connection>, SmartSubstitutionInterface {

        private final Scheduler scheduler = Schedulers.elastic();

        /**
         * Instead of using the default executeParametrized provided by pluginExecutor, this implementation affords an opportunity
         * to use PreparedStatement (if configured) which requires the variable substitution, etc. to happen in a particular format
         * supported by PreparedStatement. In case of PreparedStatement turned off, the action and datasource configurations are
         * prepared (binding replacement) using PluginExecutor.variableSubstitution
         *
         * @param connection              : This is the connection that is established to the data source. This connection is according
         *                                to the parameters in Datasource Configuration
         * @param executeActionDTO        : This is the data structure sent by the client during execute. This contains the params
         *                                which would be used for substitution
         * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
         * @param actionConfiguration     : These are the configurations which have been used to create an Action from a Datasource.
         * @return
         */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(Connection connection,
                                                                ExecuteActionDTO executeActionDTO,
                                                                DatasourceConfiguration datasourceConfiguration,
                                                                ActionConfiguration actionConfiguration) {
            return null;
        }

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            ResultSet resultSet = null;
            List<Map<String, Object>> rowsList = new ArrayList<>(50);
            try {
                Statement statement = connection.createStatement();
                String sqlCommand = "select * from \"SNOWFLAKE_SAMPLE_DATA\".\"TPCDS_SF100TCL\".\"CUSTOMER\" limit 10;";
                resultSet = statement.executeQuery(sqlCommand);
                ResultSetMetaData metaData = resultSet.getMetaData();
                int colCount = metaData.getColumnCount();


                while (resultSet.next()) {
                    // Use `LinkedHashMap` here so that the column ordering is preserved in the response.
                    Map<String, Object> row = new LinkedHashMap<>(colCount);

                    for (int i = 1; i <= colCount; i++) {
                        Object value = resultSet.getObject(i);
                        row.put(metaData.getColumnName(i), value);
                    }
                    rowsList.add(row);
                }
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                if (resultSet != null) {
                    try {
                        resultSet.close();
                    } catch (SQLException e) {
                        e.printStackTrace();
                    }
                }
            }
            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(objectMapper.valueToTree(rowsList));
            result.setIsExecutionSuccess(true);

            return Mono.just(result);
        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            
            Properties properties = new Properties();
            properties.setProperty("user", authentication.getUsername());
            properties.setProperty("password", authentication.getPassword());
            properties.setProperty("db", "SNOWFLAKE_SAMPLE_DATA");
            properties.setProperty("warehouse", "COMPUTE_WH");
            Connection conn = null;
            try {
                conn = DriverManager.getConnection("jdbc:snowflake://uc42599.ap-south-1.aws.snowflakecomputing.com", properties);
            } catch (SQLException e) {
                e.printStackTrace();
            }
            return Mono.just(conn);
        }

        @Override
        public void datasourceDestroy(Connection connection) {

        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Connection connection, DatasourceConfiguration datasourceConfiguration) {
            return null;
        }
    }
}
