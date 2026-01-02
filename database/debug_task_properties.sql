-- Query 1: Check all tasks and their property values
SELECT 
    tp.id as task_id,
    tp.title as task_title,
    tp.category_id,
    COUNT(tpv.id) as property_count,
    STRING_AGG(
        CONCAT(
            tpr.name, ': ', 
            CASE 
                WHEN tpv.value IS NULL THEN 'NULL'
                ELSE tpv.value::text
            END
        ), 
        ' | '
    ) as properties
FROM task_pages tp
LEFT JOIN task_property_values tpv ON tp.id = tpv.page_id
LEFT JOIN task_properties tpr ON tpv.property_id = tpr.id
GROUP BY tp.id, tp.title, tp.category_id
ORDER BY tp.created_at DESC;


-- Query 2: Check specific tasks by title
SELECT 
    tp.title,
    tpr.name as property_name,
    tpv.value,
    tpv.value::text as value_text,
    pg_typeof(tpv.value) as value_type
FROM task_pages tp
LEFT JOIN task_property_values tpv ON tp.id = tpv.page_id
LEFT JOIN task_properties tpr ON tpv.property_id = tpr.id
WHERE tp.title IN (
    'Test notification',
    'Enquire on payment voucher issues',
    'Setup a meeting with likimani'
)
ORDER BY tp.title, tpr.name;


-- Query 3: Check if property values exist but are empty/null
SELECT 
    tp.title,
    tp.id,
    (SELECT COUNT(*) FROM task_property_values WHERE page_id = tp.id) as value_count
FROM task_pages tp
WHERE tp.title IN (
    'Test notification',
    'Enquire on payment voucher issues',
    'Setup a meeting with likimani'
);


-- Query 4: Check the raw JSONB structure of property values
SELECT 
    tp.title,
    tpr.name as property_name,
    tpv.value,
    jsonb_typeof(tpv.value) as jsonb_type,
    CASE 
        WHEN jsonb_typeof(tpv.value) = 'string' THEN tpv.value #>> '{}'
        ELSE tpv.value::text
    END as extracted_value
FROM task_pages tp
JOIN task_property_values tpv ON tp.id = tpv.page_id
JOIN task_properties tpr ON tpv.property_id = tpr.id
WHERE tp.title IN (
    'Test notification',
    'Enquire on payment voucher issues',
    'Setup a meeting with likimani'
)
ORDER BY tp.title, tpr.name;


-- Query 5: Check if properties are defined for the categories
SELECT 
    tpr.category_id,
    tpr.name as property_name,
    tpr.type as property_type,
    tpr.config
FROM task_properties tpr
WHERE tpr.category_id IN (
    SELECT DISTINCT category_id 
    FROM task_pages 
    WHERE title IN (
        'Test notification',
        'Enquire on payment voucher issues',
        'Setup a meeting with likimani'
    )
)
ORDER BY tpr.category_id, tpr.name;
