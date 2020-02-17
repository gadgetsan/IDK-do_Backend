/*LISTE DES PARTS DE SET QUI N'ONT PAS D'EMPLACEMENT, on les ajoutes*/
INSERT INTO parts_locations(
    UserId,
    CreatedAt,
    UpdatedAt,
    PartsColorId,
    RebrickableId,
    PartId,
    RebrickableColor,
    Quantity,
    LocationCode,
    LocationId,
    ColorId
)
SELECT
    sets_users.userid,
    NOW() AS CreatedAt,
    NOW() AS UpdatedAt,
    parts_colors.id AS PartsColorId,
    parts.rebrickableid,
    parts.id AS PartId,
    colors.rebrickableid AS RebrickableColor,
    SUM(sets_parts.quantity) AS Quantity,
    NULL AS LocationCode,
    NULL AS LocationId,
    colors.id AS ColorId
FROM
    sets_users
JOIN sets ON sets.id = sets_users.setid
JOIN sets_parts ON sets_parts.setid = sets_users.setid
JOIN parts_colors ON parts_colors.id = sets_parts.partscolorid
JOIN colors ON colors.id = parts_colors.colorid
JOIN parts ON parts.id = parts_colors.partid
LEFT JOIN parts_locations ON parts_locations.partscolorid = parts_colors.id
WHERE
    parts_locations.id IS NULL AND sets_users.userid = :userId
GROUP BY
    sets_users.userid,
    parts_colors.Id,
    parts.RebrickableId,
    parts.Id,
    colors.RebrickableId,
    colors.id;
    
/*ENSUITE ON MET TOUT à 0*/
UPDATE parts_locations SET Quantity = 0 WHERE UserId = :userId;

/*MISE À JOUR DES QUANTITÉES DE PARTS*/
UPDATE
    parts_locations
JOIN(
    SELECT
        parts_colors.id,
        SUM(sets_parts.Quantity) AS Quantity
    FROM
        sets_users
    JOIN sets ON sets.id = sets_users.SetId
    JOIN sets_parts ON sets_parts.SetId = sets.Id
    JOIN parts_colors ON parts_colors.Id = sets_parts.PartsColorId
    WHERE
        sets_users.userId = :userId
    GROUP BY
        parts_colors.id
) AS real_parts_qt
ON
    real_parts_qt.id = parts_locations.PartsColorId
SET
    parts_locations.Quantity = real_parts_qt.Quantity;