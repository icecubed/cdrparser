SELECT s.name AS session_name,
       c.first_name,
       c.last_name,
       ih.prospect_uuid,
       d.name AS disposition,
       ih.disposition_time
FROM interaction_history ih
JOIN contacts c ON c.id = ih.contact_id
JOIN dispositions d ON d.id = ih.disposition_id
JOIN campaign_sessions s ON s.id = ih.session_id
AND ih.session_id IN ('4da16bda-05b8-4b70-ab23-57a136ab37db',
                      '65ee6fab-5379-4a15-8bf2-9316844c6cd1',
                      '3e236a9d-bd07-4b32-a7c9-3d4c8f9d53d4',
                      '5086c3c9-f82c-409e-bd32-4a62f47f2302')
GROUP BY ih.prospect_uuid,
         ih.username
ORDER BY ih.disposition_time;

-- select complete report
SELECT s.name AS session_name,
       i.sip_status,
       i.call_start_time,
       c.first_name,
       c.last_name,
       ih.prospect_uuid,
       d.name AS disposition,
       ih.disposition_time,
       i.call_end_time
FROM interaction_history ih
JOIN contacts c ON c.id = ih.contact_id
JOIN dispositions d ON d.id = ih.disposition_id
LEFT OUTER JOIN interaction i ON i.prospect_uuid = ih.prospect_uuid
JOIN campaign_sessions s ON s.id = ih.session_id
AND ih.session_id IN ('958e3330-58a3-439e-b8e7-8bea15798496',
                      'a669ec89-6ff2-452f-b29b-709fd1c40d6f',
                      'fd07b324-f87e-40ed-82cb-4d33f53a1deb')
GROUP BY ih.prospect_uuid,
         ih.username
ORDER BY ih.disposition_time;


-- select only uuids
SELECT ih.prospect_uuid
FROM interaction_history ih
LEFT OUTER JOIN interaction i ON i.prospect_uuid = ih.prospect_uuid
JOIN campaign_sessions s ON s.id = ih.session_id
AND ih.session_id IN ('958e3330-58a3-439e-b8e7-8bea15798496',
                      'a669ec89-6ff2-452f-b29b-709fd1c40d6f',
                      'fd07b324-f87e-40ed-82cb-4d33f53a1deb')
WHERE i.sip_status IS NULL
GROUP BY ih.prospect_uuid,
         ih.username
ORDER BY ih.disposition_time;
