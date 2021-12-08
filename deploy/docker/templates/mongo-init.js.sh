#!/bin/bash

set -o nounset

MONGO_ROOT_USER="$1"
MONGO_ROOT_PASSWORD="$2"
MONGO_DATABASE="$3"

cat <<EOF
let error = false
print("**** Going to start Mongo seed ****")

var admin = db.getSiblingDB("admin")
admin.auth("$MONGO_ROOT_USER", "$MONGO_ROOT_PASSWORD")

let res = [
    db.createUser(
        {
            user: "$MONGO_ROOT_USER",
            pwd: "$MONGO_ROOT_PASSWORD",
            roles: [{
                role: "root",
                db: "admin"
            }, "readWrite"]
        }
    ),
    db.createUser(
        {
            user: "netdata",
            pwd: "$MONGO_ROOT_PASSWORD",
            roles: [
                {role: "read", db: "admin" },
                {role: "clusterMonitor", db: "admin"},
                {role: "read", db: "$MONGO_DATABASE" }
            ]
        }
    )
]

printjson(res)

if (error) {
  print('Error occurred while inserting the records')
}
EOF
