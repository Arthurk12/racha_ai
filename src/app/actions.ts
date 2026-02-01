'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createGroup(groupName: string, adminName: string, adminPin: string) {
  if (!groupName || !adminName || !adminPin) return null

  try {
    const group = await prisma.group.create({
      data: { 
        name: groupName,
        users: {
          create: {
            name: adminName,
            pin: adminPin,
            isAdmin: true
          }
        }
      },
      include: {
        users: true
      }
    })

    const adminUser = group.users[0]
    return { groupId: group.id, adminId: adminUser.id }
  } catch (error) {
    console.error('Erro detalhado ao criar grupo:', error)
    throw error // Re-throw para ser tratado pelo Next.js ou capturado no client
  }
}

export async function addUser(groupId: string, formData: FormData) {
  const name = formData.get('name') as string
  const pin = formData.get('pin') as string
  
  if (!name || !pin) return { error: 'Dados inválidos' }

  // Check uniqueness (Simple case insensitive check simulation)
  const users = await prisma.user.findMany({
    where: { groupId }
  })
  
  const sameNameUser = users.find((u: { name: string }) => u.name.toLowerCase() === name.toLowerCase())

  if (sameNameUser) {
    return { error: 'Já existe alguém com esse nome no grupo.' }
  }

  const user = await prisma.user.create({
    data: {
      name,
      pin,
      groupId
    }
  })

  revalidatePath(`/group/${groupId}`)
  return { user }
}

export async function resetUserPin(groupId: string, targetUserId: string, adminUserId: string) {
  // Verify if requester is admin
  const requester = await prisma.user.findUnique({ where: { id: adminUserId } })
  if (!requester || !requester.isAdmin) {
      return { error: 'Apenas administradores podem resetar senhas.' }
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { pin: '0000' } // Resets to default
  })

  revalidatePath(`/group/${groupId}`)
  return { success: true }
}

export async function updateUserPin(groupId: string, userId: string, newPin: string) {
  if (!newPin || newPin.length < 4) return { error: 'PIN inválido' }

  await prisma.user.update({
    where: { id: userId },
    data: { pin: newPin }
  })
  
  revalidatePath(`/group/${groupId}`)
  return { success: true }
}

export async function deleteGroup(groupId: string, adminUserId: string) {
  const requester = await prisma.user.findUnique({ where: { id: adminUserId } })
  if (!requester || !requester.isAdmin) {
      return { error: 'Apenas administradores podem excluir o grupo.' }
  }

  // Deleting in order: Expenses -> Users -> Group
  await prisma.expense.deleteMany({ where: { groupId } })
  await prisma.user.deleteMany({ where: { groupId } })
  await prisma.group.delete({ where: { id: groupId } })

  return { success: true }
}

export async function removeUser(groupId: string, userId: string, requesterId: string) {
  // Allow remove if: requester is the user themselves OR requester is admin
  if (!requesterId) return { error: 'Não autorizado' }
  
  const requester = await prisma.user.findUnique({ where: { id: requesterId } })
  
  if (!requester) return { error: 'Usuário não encontrado' }
  
  if (requester.id !== userId && !requester.isAdmin) {
    return { error: 'Você não tem permissão para remover este usuário.' }
  }
  
  await prisma.user.delete({
    where: { id: userId }
  })
  revalidatePath(`/group/${groupId}`)
  return { success: true }
}

export async function verifyUser(userId: string, pin: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (user && user.pin === pin) {
    return true
  }
  return false
}

export async function addExpense(groupId: string, formData: FormData) {
  const description = formData.get('description') as string
  const amount = parseFloat(formData.get('amount') as string)
  const paidById = formData.get('paidBy') as string
  const dateStr = formData.get('date') as string
  const participantIds = formData.getAll('participants') as string[]

  if (!description || !amount || !paidById || participantIds.length === 0) return

  // Create date object, ensuring it's treated correctly (default to now if missing)
  // When coming from input type="date", it is YYYY-MM-DD. 
  // We append time to current time or set to noon to avoid timezone rolling date back.
  // Simple approach: new Date(dateStr) typically creates UTC midnight.
  // Better approach for display: keep the string or just use the date.
  // For sorting: Date object is fine.
  // FIX: Appending T12:00:00Z to ensure it is treated as Noon UTC, avoiding timezone shifts to previous day in Western Hemisphere
  const date = dateStr ? new Date(`${dateStr}T12:00:00Z`) : new Date()

  await prisma.expense.create({
    data: {
      description,
      amount,
      paidById,
      groupId,
      date,
      participants: {
        create: participantIds.map(id => ({ userId: id }))
      }
    }
  })

  revalidatePath(`/group/${groupId}`)
}

export async function removeExpense(groupId: string, expenseId: string) {
  await prisma.expense.delete({
    where: { id: expenseId }
  })
  revalidatePath(`/group/${groupId}`)
}

export async function updateExpense(groupId: string, expenseId: string, formData: FormData, requesterId: string) {
    const amountStr = formData.get('amount') as string
    const dateStr = formData.get('date') as string
    const participantIds = formData.getAll('participants') as string[]
    
    // Validate
    if (!amountStr || !dateStr || participantIds.length === 0) return { error: 'Dados inválidos' }

    const amount = parseFloat(amountStr)
    // FIX: Use noon UTC to prevent date shifting
    const date = new Date(`${dateStr}T12:00:00Z`)

    // Check permissions
    const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: { paidBy: true }
    })
    
    if (!expense) return { error: 'Despesa não encontrada' }

    const requester = await prisma.user.findUnique({ where: { id: requesterId } })
    if (!requester) return { error: 'Usuário não encontrado' }

    const isOwner = expense.paidById === requesterId
    const isAdmin = requester.isAdmin

    if (!isOwner && !isAdmin) {
        return { error: 'Permissão negada' }
    }

    await prisma.expense.update({
        where: { id: expenseId },
        data: {
            amount,
            date,
            participants: {
                deleteMany: {},
                create: participantIds.map(id => ({ userId: id }))
            }
        }
    })

    revalidatePath(`/group/${groupId}`)
    return { success: true }
}