import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic' // static by default, unless reading the request

export async function GET(request: Request) {
  try {
    // Check for authentication if needed (optional for now, but recommended)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    console.log('Starting Cleanup Cron Job...')
    
    // Define "vm.inactive" as groups not updated in the last 30 days
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

    // 2. Delete Relational Data (Expenses & Users)
    // Note: If you have Cascade Delete configured in Prisma schema, just deleting the group is enough.
    // Assuming we want to be safe and specific:
    
    await prisma.expense.deleteMany({
        where: { groupId: { in: ids } }
    })

    await prisma.user.deleteMany({
        where: { groupId: { in: ids } }
    })
    
    // 3. Delete Groups
    const result = await prisma.group.deleteMany({
        where: { id: { in: ids } }
    })

    console.log(`Cleanup complete. Deleted ${result.count} groups.`)

    return NextResponse.json({ 
        success: true, 
        deletedGroups: result.count,
        deletedIds: ids 
    })
  } catch (error) {
    console.error('Cleanup Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
