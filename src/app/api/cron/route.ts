import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    console.log('Starting Cleanup Cron Job...')

    // Define "inactive" as groups not updated in the last 30 days
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() - 30)

    // 1. Find IDs of old groups
    const oldGroups = await prisma.group.findMany({
        where: {
            updatedAt: { lt: expirationDate }
        },
        select: { id: true }
    })

    const ids = oldGroups.map(g => g.id)

    if (ids.length === 0) {
        return NextResponse.json({ message: 'No old groups found', deleted: 0 })
    }

    // 2. Delete all related data in correct order inside a transaction to avoid FK violations.
    // ExpenseParticipant must be deleted before Expense and User, since it holds
    // FK references to both. Relying solely on DB-level cascades is unsafe if the
    // constraint was not applied in the production migration.
    await prisma.$transaction([
        prisma.expenseParticipant.deleteMany({
            where: { expense: { groupId: { in: ids } } }
        }),
        prisma.expense.deleteMany({
            where: { groupId: { in: ids } }
        }),
        prisma.user.deleteMany({
            where: { groupId: { in: ids } }
        }),
        prisma.group.deleteMany({
            where: { id: { in: ids } }
        }),
    ])

    console.log(`Cleanup complete. Deleted ${ids.length} groups.`)

    return NextResponse.json({
        success: true,
        deletedGroups: ids.length,
        deletedIds: ids
    })
  } catch (error) {
    console.error('Cleanup Error:', error)
    return NextResponse.json({
        success: false,
        error: 'Internal Server Error',
        detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

