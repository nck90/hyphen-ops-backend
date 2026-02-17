import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.documentLink.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.log.deleteMany()
  await prisma.eventParticipant.deleteMany()
  await prisma.event.deleteMany()
  await prisma.project.deleteMany()
  await prisma.member.deleteMany()

  console.log('기본 seed는 데모 데이터를 생성하지 않습니다. 모든 데이터가 비워졌습니다.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

