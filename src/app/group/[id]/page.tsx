import { prisma } from '@/lib/prisma'
import GroupClient from './GroupClient'
import { notFound } from 'next/navigation'

export default async function GroupPage({ params }: { params: { id: string } }) {
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      users: true,
      expenses: {
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          participants: true
        }
      }
    }
  })

  if (!group) {
    notFound()
  }

  // Transform data to match frontend interfaces
  const expenses = group.expenses.map((exp: any) => ({
    id: exp.id,
    description: exp.description,
    amount: exp.amount,
    paidBy: exp.paidById,
    date: exp.date ? exp.date.toISOString() : new Date().toISOString(),
    participants: exp.participants.map((p: any) => p.userId)
  }))
  
  const users = group.users.map((u: any) => ({
    id: u.id,
    name: u.name,
    isAdmin: u.isAdmin
  }))

  return (
    <GroupClient 
      groupId={group.id} 
      groupName={group.name} 
      users={users} 
      expenses={expenses} 
    />
  )
}