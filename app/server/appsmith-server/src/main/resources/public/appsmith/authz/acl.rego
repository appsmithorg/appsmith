package appsmith.authz

default url_allow = false
default resource_allow = false

# This rule allows the user to access endpoints based on the permissions that they are assigned.
# The httpMethod and resource are also an integral part of accessing this ACL
# We overload the rule url_allow thereby making it an OR condition. Either the user is able to access the resource
# via their authenticated session, or it's a public url that is accessible to everybody.
url_allow = true {
    op = authenticated_operations[_]
    input.method = op.method
    input.resource = op.resource
    p = input.user.permissions[_]
    p = op.permission
}

url_allow = true {
    op = public_operations[_]
    input.url = op.url
    input.method = op.method
}

# All public URLs must go into this list. Anything not in this list requires an authenticated session to access
public_operations = [
    {"method" : "POST", "url" : "/api/v1/users/forgotPassword" },
    {"method" : "POST", "url" : "/api/v1/users" },
    {"method" : "GET", "url" : "/api/v1/users/verifyPasswordResetToken" },
    {"method" : "PUT", "url" : "/api/v1/users/resetPassword" },
    {"method" : "GET", "url" : "/api/v1/users/invite/verify" },
    {"method" : "PUT", "url" : "/api/v1/users/invite/confirm" },
]

# This is a global list of all the routes for all controllers. Any new controller that is written must
# carry an entry in this array. OPA performs ACL based on an intersection of these entries and permissions
# for a user + permissions inherited via the groups that the user is a part of.
authenticated_operations = [
    {"method": "POST", "resource": "users", "permission": "create:users"},
    {"method": "GET", "resource": "users", "permission": "read:users"},
    {"method": "PUT", "resource": "users", "permission": "update:users"},

    {"method": "POST", "resource": "organizations", "permission": "create:organizations"},
    {"method": "GET", "resource": "organizations", "permission": "read:organizations"},
    {"method": "POST", "resource": "signup", "permission": "create:organizations"},

    {"method": "GET", "resource": "pages", "permission": "read:pages"},
    {"method": "POST", "resource": "pages", "permission": "create:pages"},
    {"method": "PUT", "resource": "pages", "permission": "update:pages"},

    {"method": "GET", "resource": "layouts", "permission": "read:layouts"},
    {"method": "POST", "resource": "layouts", "permission": "create:layouts"},
    {"method": "PUT", "resource": "layouts", "permission": "update:layouts"},

    {"method": "GET", "resource": "properties", "permission": "read:properties"},
    {"method": "POST", "resource": "properties", "permission": "create:properties"},
    {"method": "PUT", "resource": "properties", "permission": "update:properties"},

    {"method": "GET", "resource": "actions", "permission": "read:actions"},
    {"method": "POST", "resource": "actions", "permission": "create:actions"},
    {"method": "PUT", "resource": "actions", "permission": "update:actions"},
    {"method": "DELETE", "resource": "actions", "permission": "delete:actions"},

    {"method": "GET", "resource": "resources", "permission": "read:resources"},
    {"method": "POST", "resource": "resources", "permission": "create:resources"},
    {"method": "PUT", "resource": "resources", "permission": "update:resources"},

    {"method": "GET", "resource": "plugins", "permission": "read:plugins"},
    {"method": "POST", "resource": "plugins", "permission": "create:plugins"},
    {"method": "PUT", "resource": "plugins", "permission": "update:plugins"},

    {"method": "GET", "resource": "applications", "permission": "read:applications"},
    {"method": "POST", "resource": "applications", "permission": "create:applications"},
    {"method": "PUT", "resource": "applications", "permission": "update:applications"},

    {"method": "GET", "resource": "groups", "permission": "read:groups"},
    {"method": "POST", "resource": "groups", "permission": "create:groups"},
    {"method": "PUT", "resource": "groups", "permission": "update:groups"},

    {"method": "GET", "resource": "collections", "permission": "read:collections"},
    {"method": "POST", "resource": "collections", "permission": "create:collections"},
    {"method": "PUT", "resource": "collections", "permission": "update:collections"},

    {"method": "GET", "resource": "datasources", "permission": "read:datasources"},
    {"method": "POST", "resource": "datasources", "permission": "create:datasources"},
    {"method": "PUT", "resource": "datasources", "permission": "update:datasources"},

    {"method": "GET", "resource": "configs", "permission": "read:configs"},
    {"method": "POST", "resource": "configs", "permission": "create:configs"},
    {"method": "PUT", "resource": "configs", "permission": "update:configs"},

    {"method": "POST", "resource": "import", "permission": "create:import"}

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