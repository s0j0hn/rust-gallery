CREATE TABLE files (
                       id INTEGER PRIMARY KEY,
                       path TEXT NOT NULL,
                       hash TEXT NOT NULL UNIQUE,
                       extension TEXT NOT NULL,
                       filename TEXT NOT NULL,
                       folder_name TEXT NOT NULL,
                       width INTEGER NOT NULL,
                       height INTEGER NOT NULL,
                       tags TEXT DEFAULT '[]',
                       root TEXT NOT NULL
);

CREATE INDEX files_hash_index ON files (hash DESC);