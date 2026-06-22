-- Unify the "watched/finished" status across series and movies onto a single
-- label + colour: "Gesehen" in red. Previously series used "Fertig" (red) and
-- movies used "Gesehen" (green), which read inconsistently side by side.
--
-- Series: rename the finished label and keep it red.
UPDATE series SET status = 'Gesehen' WHERE status = 'Fertig';
UPDATE series SET status_type = 'red' WHERE status = 'Gesehen';

-- Movies: keep the label, recolour finished entries from green to red.
UPDATE movies SET status_type = 'red' WHERE status = 'Gesehen';
