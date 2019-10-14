package appsmith.authz

default url_allow = false
default resource_allow = false

# This rule allows the user to access endpoints based on the permissions that they are assigned.
# The httpMethod and resource are also an integral part of accessing this ACL
url_allow = true {
    op = allowed_operations[_]
    input.method = op.method
    input.resource = op.resource
    p = input.user.permissions[_]
    p = op.permission
}

allowed_operations = [
    {"method": "POST", "resource": "users", "permission": "create:users"},
    {"method": "GET", "resource": "users", "permission": "read:users"},
    {"method": "POST", "resource": "organizations", "permission": "create:organizations"},
    {"method": "GET", "resource": "organizations", "permission": "read:organizations"},
    {"method": "POST", "resource": "signup", "permission": "create:organizations"},
    {"method": "GET", "resource": "pages", "permission": "read:pages"},
    {"method": "POST", "resource": "pages", "permission": "create:pages"},
    {"method": "PUT", "resource": "pages", "permission": "update:pages"},
    {"method": "GET", "resource": "layouts", "permission": "read:layouts"},
    {"method": "POST", "resource": "layouts", "permission": "create:layouts"},
    {"method": "PUT", "resource": "layouts", "permission": "update:layouts"},
]


# This rule is a WIP to create SQL queries based on the policy. For example, the user may be allowed to see a list
# of records that only belong to them and NOT all the records. While url_allow rule will allow the user to access
# this functionality, the resource_allow rule will help us create where clauses to query the DB.
resource_allow = true {
	input.method = "GET"
	input.resource = "users"
	allowed[us]
}

allowed[us] {
	us = data.user
	p = input.user.permissions[_]
	p = "readall:users"
}

allowed[us] {
	us = data.user
	p = input.user.permissions[_]
	us.id = input.user.id
	p = "read:users"
}