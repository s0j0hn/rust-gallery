CREATE TABLE config (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        random_equal_folders INT NOT NULL,
                        photo_per_random INT NOT NULL,
                        folders_per_page INT NOT NULL,
                        equal_enabled TINYINT NOT NULL CHECK (equal_enabled IN (0, 1))
);

INSERT INTO config (id, random_equal_folders, photo_per_random, folders_per_page, equal_enabled)
VALUES (1, 100, 200, 4, 1);