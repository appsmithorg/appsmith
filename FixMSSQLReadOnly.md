# Plan: Support `ApplicationIntent=ReadOnly` for MSSQL Connection String

## Summary

The MSSQL plugin form **already has** a "Connection mode" toggle (`READ_WRITE` / `READ_ONLY`) but the backend **ignores it** when building the JDBC URL. The fix is to wire up the existing mode setting to append `ApplicationIntent=ReadOnly` to the JDBC connection string when `READ_ONLY` is selected.

## Current State

- **Form** (`form.json` lines 8-21): Has `READ_WRITE` / `READ_ONLY` segmented control → `datasourceConfiguration.connection.mode`
- **Validation** (`MssqlPlugin.java:401-403`): Validates mode is not null
- **Connection string** (`MssqlPlugin.java:611-629`): Never reads the mode value — `ApplicationIntent` is never appended
- **PostgreSQL reference** (`PostgresPlugin.java:1334-1344`): Sets `config.setReadOnly(true)` + `readOnlyMode=always` when `READ_ONLY`

## Changes

### 1. `MssqlPlugin.java` — Wire up connection mode to JDBC URL

**File:** `app/server/appsmith-plugins/mssqlPlugin/src/main/java/com/external/plugins/MssqlPlugin.java`

After `addSslOptionsToUrlBuilder(...)` (line 627) and before `hikariConfig.setJdbcUrl(...)` (line 629), add:

```java
// Set ApplicationIntent based on connection mode
if (datasourceConfiguration.getConnection() != null
        && datasourceConfiguration.getConnection().getMode() != null
        && com.appsmith.external.models.Connection.Mode.READ_ONLY.equals(
                datasourceConfiguration.getConnection().getMode())) {
    urlBuilder.append("ApplicationIntent=ReadOnly;");
    hikariConfig.setReadOnly(true);
}
```

This appends `ApplicationIntent=ReadOnly` to the JDBC URL (the MSSQL JDBC driver parameter that routes to a read-only secondary replica in an Always On Availability Group) and also marks the HikariCP pool as read-only.

### 2. `MssqlTestDBContainerManager.java` — Set mode in test datasource config

**File:** `app/server/appsmith-plugins/mssqlPlugin/src/test/java/com/external/plugins/MssqlTestDBContainerManager.java`

After line 66 (`dsConfig.getConnection().getSsl().setAuthType(...)`) add:

```java
dsConfig.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_WRITE);
```

This ensures the test datasource configuration is explicit about the mode (matching what the form sends by default), preventing any null-related issues now that the mode is read.

## No Other Changes Needed

- **`form.json`**: Already has the `READ_ONLY` / `READ_WRITE` toggle — no UI changes needed
- **Validation**: Already validates mode is not null — no changes needed
- **Connection.Mode enum**: Already has `READ_ONLY` — no model changes needed
- **Scope**: MSSQL plugin only — `ApplicationIntent=ReadOnly` is a Microsoft SQL Server JDBC driver parameter specific to Always On Availability Groups

## Verification

1. Build the MSSQL plugin: `cd app/server && mvn -pl appsmith-plugins/mssqlPlugin compile -DskipTests`
2. Run MSSQL plugin tests (requires Docker): `cd app/server && mvn -pl appsmith-plugins/mssqlPlugin test`
3. Manual verification: In Appsmith UI, create/edit an MSSQL datasource, toggle "Connection mode" to "Read only", save, and test the connection — the JDBC URL should now include `ApplicationIntent=ReadOnly`
