CREATE TABLE files (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       path VARCHAR(255) NOT NULL,
                       hash VARCHAR(255) NOT NULL UNIQUE,
                       extention VARCHAR(50) NOT NULL,
                       filename VARCHAR(255) NOT NULL,
                       folder_name VARCHAR(255) NOT NULL,
                       width VARCHAR(50) NOT NULL,
                       height VARCHAR(50) NOT NULL,
                       tags VARCHAR(255) DEFAULT '[]',
                       root VARCHAR(255) NOT NULL
);

CREATE INDEX files_hash_index ON files (hash DESC);