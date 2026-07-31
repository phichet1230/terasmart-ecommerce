SELECT id,
       username,
       email,
       password_hash,
       phone,
       role,
       account_status,
       created_at,
       updated_at
FROM public.users
LIMIT 1000;