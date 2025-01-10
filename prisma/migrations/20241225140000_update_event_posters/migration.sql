-- Update existing event posters
UPDATE "Event"
SET "posterUrl" = 'https://placehold.co/800x600.png/6b21a8/ffffff?text=Event+Poster'
WHERE "posterUrl" LIKE '%placeholder.com%' OR "posterUrl" IS NULL; 