# ACL Migration Steps

1. Create a super user (with email <superuser_acl@appsmith.com>), using the sign-up API.

2. Add `manage` and `read` permissions for `organizations`, `applications`, `pages` and `actions` for this super user,
    on ALL existing documents (in corresponding collections). Once this is done, the policies field of organizations,
    for example, should look something like:

```json
{
    "policies": [         
        {
            "permission" : "manage:organizations",
            "users" : [ 
                "superuser_acl@appsmith.com"
            ],
            "groups" : []
        }, 
        {
            "permission" : "read:organizations",
            "users" : [ 
                "superuser_acl@appsmith.com"
            ],
            "groups" : []
        }
    ]
}
```

3. Disable emails for invite API actions.

4. For each user, for each organization in the user's `organizationIds` list, hit the invite user API for that
    organization, using session of the super user.

5. Remove super user from the organization policies, without disturbing other permission values.

6. Remove super user from users collection.

# Running

Assuming you have node (>=v12), use the following command to run the migration:

```sh
npm install
node acl-migration.js 'https://localhost/api/v1/' 'mongodb://localhost:27017/mobtools'
```

The first argument should be a running API endpoint, and the second argument should be a URI to the database that this
API endpoint is running on.
