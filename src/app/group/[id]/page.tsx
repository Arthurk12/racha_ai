import { prisma } from '@/lib/prisma'
import GroupClient from './GroupClient'
import { notFound } from 'next/navigation'

export default async function GroupPage({ params }: { params: { id: string } }) {
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      users: true,
      expenses: {
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