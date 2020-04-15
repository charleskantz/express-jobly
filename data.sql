CREATE TABLE companies (
    handle text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    num_employees integer,
    description text,
    logo_url text
);



-- CREATE TABLE messages (
--     id SERIAL PRIMARY KEY,
--     from_username text NOT NULL REFERENCES users,
--     to_username text NOT NULL REFERENCES users,
--     body text NOT NULL,
--     sent_at timestamp with time zone NOT NULL,
--     read_at timestamp with time zone
-- );
