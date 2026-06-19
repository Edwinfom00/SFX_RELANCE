-- =====================================================================
-- Procédure stockée : sp_sfx_SetTransmissionDate
-- À exécuter dans la base de données BrainOPX
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.sp_sfx_SetTransmissionDate
    @NoPiece         NVARCHAR(100),
    @DateTransmission DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @DateTransmission IS NULL
        SET @DateTransmission = GETDATE();

    UPDATE dbo.tn_Pieces_Ventes
    SET [Date Transmission] = @DateTransmission
    WHERE [Num Piece Vente] = @NoPiece;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO
