### Adding credentials to app export
- In the exported app add this property under `datasourceList` in the item corresponding to the plugin you are adding credentials for.

    ```
    "datasourceConfiguration": {
                "connection": {
                    "mode": "READ_WRITE",
                    "ssl": {
                        "authType": "DEFAULT"
                    }
                },
                "endpoints": [{
                    "host": "localhost",
                    "port": 5432
                }],
                "sshProxyEnabled": false
            },
    ```
- Add this key at the top level
 	```
    "decryptedFields": {
		"PostgresGolden": {
			"password": "********",
			"authType": "com.appsmith.external.models.DBAuth",
			"dbAuth": {
				"authenticationType": "dbAuth",
				"authenticationType": "dbAuth",
				"username": "********",
				"databaseName": "db_name"
			}
		}
	},
    ```