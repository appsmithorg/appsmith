-- permission_group table constraints
drop index if exists permission_group_user_ids_idx;

create index if not exists permission_group_user_ids_idx
    ON permission_group USING gin (assigned_to_user_ids jsonb_ops)
    WHERE deleted_at IS NULL;
