-- AlterTable
ALTER TABLE "ConversationMember" ADD COLUMN     "lastReadAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RoomMember" ADD COLUMN     "lastReadAt" TIMESTAMP(3);
