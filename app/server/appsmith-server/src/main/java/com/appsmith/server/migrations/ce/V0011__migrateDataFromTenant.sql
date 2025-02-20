DO $$
		DECLARE
tenant_row          jsonb;
				new_org_config      jsonb;
				tenant_id           text;
				new_policy_map      jsonb;
				updated_policies    jsonb;
				policy_key          text;
				policy_val          jsonb;
				new_permission      text;
				policy_item         jsonb;
BEGIN
				-- Retrieve the single tenant document as JSONB from the tenant table
SELECT to_jsonb(t) INTO tenant_row FROM appsmith.tenant t LIMIT 1;
IF tenant_row IS NULL THEN
						RAISE NOTICE 'No tenant found to migrate';
						RETURN;
END IF;

				-- Extract tenant id from the "id" field (note: field name adjusted to your schema)
				tenant_id := tenant_row->>'id';

				-- Start with tenant_configuration (if present) as the base for organization_configuration
				IF tenant_row ? 'tenant_configuration' THEN
						new_org_config := tenant_row->'tenant_configuration';
ELSE
						new_org_config := '{}'::jsonb;
END IF;

				-- Process the policy_map: for keys containing 'tenant', add new keys with "organization" substituted
				IF tenant_row ? 'policy_map' THEN
						new_policy_map := tenant_row->'policy_map';
FOR policy_key, policy_val IN SELECT key, value FROM jsonb_each(new_policy_map)
		LOOP
		IF lower(policy_key) LIKE '%tenant%' THEN
		new_permission := regexp_replace(policy_key, '(?i)tenant', 'organization', 'g');
IF NOT (new_policy_map ? new_permission) THEN
														new_policy_map := new_policy_map || jsonb_build_object(
																		new_permission,
																		jsonb_build_object('permissionGroups', policy_val->'permissionGroups')
																);
END IF;
END IF;
END LOOP;
						new_org_config := new_org_config || jsonb_build_object('policyMap', new_policy_map);
END IF;

				-- Process the policies array: for any policy with "permission" containing 'tenant', add a new policy with "organization" substituted
				IF tenant_row ? 'policies' THEN
						updated_policies := tenant_row->'policies';
FOR policy_item IN SELECT * FROM jsonb_array_elements(tenant_row->'policies')
																		LOOP
		IF lower(policy_item->>'permission') LIKE '%tenant%' THEN
												new_permission := regexp_replace(policy_item->>'permission', '(?i)tenant', 'organization', 'g');
-- Check if a policy with the new permission already exists in the array
IF NOT EXISTS (
														SELECT 1 FROM jsonb_array_elements(updated_policies) as p
														WHERE p->>'permission' = new_permission
												) THEN
														updated_policies := updated_policies || jsonb_build_array(
																		jsonb_build_object(
																						'permission', new_permission,
																						'permissionGroups', policy_item->'permissionGroups'
																				)
																);
END IF;
END IF;
END LOOP;
						new_org_config := new_org_config || jsonb_build_object('policies', updated_policies);
END IF;

				-- Insert the new organization record into the organization table.
INSERT INTO organization (id, slug, display_name, pricing_plan, organization_configuration)
VALUES (
					tenant_id,
					tenant_row->>'slug',
					tenant_row->>'display_name',
					tenant_row->>'pricing_plan',
					new_org_config
			);
RAISE NOTICE 'Successfully migrated tenant to organization with id: %', tenant_id;
EXCEPTION WHEN unique_violation THEN
				RAISE WARNING 'Organization already exists for tenant: %', tenant_id;
END $$;
