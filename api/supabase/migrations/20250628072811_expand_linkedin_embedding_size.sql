-- increase the size of the embedding column
ALTER TABLE linkedin_data ALTER COLUMN embedding TYPE vector(768);