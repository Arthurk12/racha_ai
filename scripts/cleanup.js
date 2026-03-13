// Script to be run via node/cron for backend maintenance
// Usage: node scripts/cleanup.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Cleanup...')
  
  // Define "inactive" as groups not updated in the last 30 days
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() - 30)

  console.log(`Deleting groups updated before ${expirationDate.toISOString()}`)

  // Find groups (optional: check if they have recent expenses to spare them)
  // For simplicity: delete all old groups
  
  try {
    // Delete transactions is better but deleteMany with cascade logic or manual
    // Since we don't know if cascade is on in DB, we do manual
    
    // 1. Find IDs
    const oldGroups = await prisma.group.findMany({
        where: {
            updatedAt: { lt: expirationDate }
        },
        select: { id: true }
    })
    
    const ids = oldGroups.map(g => g.id)
    
    if (ids.length === 0) {
        console.log('No old groups found.')
        return
    }

    console.log(`Found ${ids.length} groups to remove.`)

    // 2. Delete ExpenseParticipant first (FK references both Expense and User)
    const participants = await prisma.expenseParticipant.deleteMany({
        where: { expense: { groupId: { in: ids } } }
    })
    console.log(`Deleted ${participants.count} expense participants.`)

    // 3. Delete Expenses
    const expenses = await prisma.expense.deleteMany({
        where: { groupId: { in: ids } }
    })
    console.log(`Deleted ${expenses.count} expenses.`)

    // 4. Delete Users
    const users = await prisma.user.deleteMany({
        where: { groupId: { in: ids } }
    })
    console.log(`Deleted ${users.count} users.`)

    // 5. Delete Groups
    const groups = await prisma.group.deleteMany({
        where: { id: { in: ids } }
    })

    console.log(`Deleted ${groups.count} groups successfully.`)
    
  } catch (e) {
      console.error('Error cleaning up:', e)
  } finally {
      await prisma.$disconnect()
  }
}

main()
