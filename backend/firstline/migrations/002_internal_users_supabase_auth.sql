ALTER TABLE public.internal_users
    ALTER COLUMN password_hash DROP NOT NULL;

INSERT INTO public.internal_users (email, password_hash, name, role, status)
VALUES ('douglasvslopes@gmail.com', NULL, 'Douglas Lopes', 'OWNER', 'ACTIVE')
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = now();
