BEGIN TRY

BEGIN TRAN;

-- AlterTable: optimistic locking cho tồn kho
ALTER TABLE [dbo].[Product] ADD [version] INT NOT NULL CONSTRAINT [Product_version_df] DEFAULT 0;

-- AlterTable: phân quyền CUSTOMER / STAFF
ALTER TABLE [dbo].[User] ADD [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'CUSTOMER';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
