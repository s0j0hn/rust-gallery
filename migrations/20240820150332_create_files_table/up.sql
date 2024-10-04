CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path VARCHAR NOT NULL,
    hash VARCHAR NOT NULL constraint files_pk unique,
    extention VARCHAR NOT NULL,
    filename VARCHAR NOT NULL,
    folder_name VARCHAR NOT NULL,
    width VARCHAR NOT NULL,
    height VARCHAR NOT NULL,
    tags VARCHAR default '[]',
    root VARCHAR NOT NULL
);

create index files_hash_index
    on files (hash desc);