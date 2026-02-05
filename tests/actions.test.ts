import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  createGroup, addUser, checkUpdates, resetUserPin, updateUserPin, 
  deleteGroup, removeUser, verifyUser, addExpense, removeExpense, 
  updateExpense, toggleUserFinishedState, settleDebt 
} from '@/app/actions'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    expense: {
        create: vi.fn(),
        delete: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn()
    }
  }
}))

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_pin'),
    compare: vi.fn(),
  }
}))

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Group Helpers ---
  describe('checkUpdates', () => {
      it('should return timestamp', async () => {
          const now = new Date()
          vi.mocked(prisma.group.findUnique).mockResolvedValue({ updatedAt: now } as any)
          const result = await checkUpdates('g1')
          expect(result).toBe(now.getTime())
      })
      it('should return 0 if group not found', async () => {
        vi.mocked(prisma.group.findUnique).mockResolvedValue(null)
        const result = await checkUpdates('g1')
        expect(result).toBe(0)
    })
  })

  describe('createGroup', () => {
    it('should create a group successfully', async () => {
      vi.mocked(prisma.group.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.group.create).mockResolvedValue({ 
        id: '1234-5678', 
        name: 'Test Group', 
        users: [{ id: 'user-1', name: 'Admin', pin: 'hashed_pin', isAdmin: true }] 
      } as any)

      const result = await createGroup('Test Group', 'Admin', '1234')

      expect(result).toEqual({ groupId: '1234-5678', adminId: 'user-1' })
      expect(prisma.group.create).toHaveBeenCalled()
      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10)
    })

    it('should retry if generated ID exists', async () => {
      vi.mocked(prisma.group.findUnique)
        .mockResolvedValueOnce({ id: 'COLLISION' } as any)
        .mockResolvedValue(null)

      vi.mocked(prisma.group.create).mockResolvedValue({ 
        id: 'NEW-ID', 
        users: [{ id: 'u1' }] 
      } as any)

      await createGroup('G', 'A', '1')
      expect(prisma.group.findUnique).toHaveBeenCalledTimes(2)
    })

    it('should throw error if ID generation fails repeatedly', async () => {
         vi.mocked(prisma.group.findUnique).mockResolvedValue({ id: 'COLLISION' } as any)
         await expect(createGroup('G', 'A', '1')).rejects.toThrow('Não foi possível gerar um ID único')
    })

    it('should return null if missing params', async () => {
        const result = await createGroup('', '', '')
        expect(result).toBeNull()
    })

    it('should catch and rethrow error during group creation', async () => {
      vi.mocked(prisma.group.findUnique).mockResolvedValue(null)
      const error = new Error('DB Error')
      vi.mocked(prisma.group.create).mockRejectedValue(error)
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(createGroup('FailGroup', 'Admin', '1234')).rejects.toThrow('DB Error')
      expect(consoleSpy).toHaveBeenCalledWith('Erro detalhado ao criar grupo:', error)
      
      consoleSpy.mockRestore()
    })
  })

  describe('addUser', () => {
    it('should add a user successfully', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]) 
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new-user' } as any)

      const formData = new FormData()
      formData.append('name', 'Alice')
      formData.append('pin', '1234')

      await addUser('group-1', formData)

      expect(prisma.user.create).toHaveBeenCalled()
    })

    it('should return error if name exists', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { name: 'Bob', id: 'existing' }
      ] as any)

      const formData = new FormData()
      formData.append('name', 'bob') 
      formData.append('pin', '1234')

      const result = await addUser('group-1', formData)
      expect(result).toEqual({ error: 'Já existe alguém com esse nome no grupo.' })
    })

    it('should return error if invalid data', async () => {
        const result = await addUser('g1', new FormData())
        expect(result).toEqual({ error: 'Dados inválidos' })
    })
  })

  describe('User Management', () => {
      it('resetUserPin: should update pin if admin', async () => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin', isAdmin: true } as any)
          const result = await resetUserPin('g1', 'target', 'admin')
          expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
              where: { id: 'target' },
              data: { pin: 'hashed_pin' }
          }))
          expect(result).toEqual({ success: true })
      })

      it('resetUserPin: should deny if not admin', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user', isAdmin: false } as any)
        const result = await resetUserPin('g1', 'target', 'user')
        expect(result).toHaveProperty('error')
      })

      it('updateUserPin: should update pin', async () => {
          const result = await updateUserPin('g1', 'u1', '1234')
          expect(prisma.user.update).toHaveBeenCalled()
          expect(result).toEqual({ success: true })
      })

      it('updateUserPin: should fail short pin', async () => {
        const result = await updateUserPin('g1', 'u1', '123')
        expect(result).toHaveProperty('error')
      })

      it('removeUser: should remove self', async () => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', isAdmin: false } as any)
          const result = await removeUser('g1', 'u1', 'u1')
          expect(prisma.user.delete).toHaveBeenCalled()
          expect(result).toEqual({ success: true })
      })

      it('removeUser: should allow admin to remove others', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin', isAdmin: true } as any)
        const result = await removeUser('g1', 'u2', 'admin')
        expect(prisma.user.delete).toHaveBeenCalled()
    })

    it('removeUser: should deny non-admin removing others', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', isAdmin: false } as any)
        const result = await removeUser('g1', 'u2', 'u1')
        expect(result).toHaveProperty('error')
    })
  })

  describe('verifyUser', () => {
      it('should verify with bcrypt', async () => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue({ pin: 'hashed' } as any)
          vi.mocked(bcrypt.compare).mockImplementation(async () => true)
          const result = await verifyUser('u1', '1234')
          expect(result).toBe(true)
      })

      it('should fallback to plain text and migrate', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ pin: '1234', id: 'u1' } as any)
        vi.mocked(bcrypt.compare).mockImplementation(async () => false)
        const result = await verifyUser('u1', '1234')
        expect(result).toBe(true)
        expect(prisma.user.update).toHaveBeenCalled() // Migration happened
    })

    it('should return false if wrong pin', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ pin: 'hashed' } as any)
        vi.mocked(bcrypt.compare).mockImplementation(async () => false)
        const result = await verifyUser('u1', 'wrong')
        expect(result).toBe(false)
    })
  })

  describe('Expenses', () => {
      it('addExpense: should create expense', async () => {
          const fd = new FormData()
          fd.append('description', 'Test')
          fd.append('amount', '100')
          fd.append('paidBy', 'u1')
          fd.append('participants', 'u1')
          fd.append('participants', 'u2')

          await addExpense('g1', fd)
          expect(prisma.expense.create).toHaveBeenCalled()
          expect(prisma.group.update).toHaveBeenCalled()
      })

      it('addExpense: should ignore invalid', async () => {
          await addExpense('g1', new FormData())
          expect(prisma.expense.create).not.toHaveBeenCalled()
      })

      it('removeExpense: should delete', async () => {
          await removeExpense('g1', 'e1')
          expect(prisma.expense.delete).toHaveBeenCalledWith({ where: { id: 'e1' }})
      })

      it('updateExpense: should update if owner', async () => {
        vi.mocked(prisma.expense.findUnique).mockResolvedValue({ paidById: 'u1' } as any)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', isAdmin: false } as any)
        
        const fd = new FormData()
        fd.append('description', 'Upd')
        fd.append('amount', '50')
        fd.append('date', '2023-01-01')
        fd.append('participants', 'u2')

        const result = await updateExpense('g1', 'e1', fd, 'u1')
        expect(prisma.expense.update).toHaveBeenCalled()
        expect(result).toEqual({ success: true })
      })

      it('updateExpense: should update if admin', async () => {
        vi.mocked(prisma.expense.findUnique).mockResolvedValue({ paidById: 'u2' } as any)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin', isAdmin: true } as any)
        
        const fd = new FormData()
        fd.append('description', 'Upd')
        fd.append('amount', '50')
        fd.append('date', '2023-01-01')
        fd.append('participants', 'u2')

        const result = await updateExpense('g1', 'e1', fd, 'admin')
        expect(result).toEqual({ success: true })
      })

      it('updateExpense: should deny non-owner non-admin', async () => {
        vi.mocked(prisma.expense.findUnique).mockResolvedValue({ paidById: 'u2' } as any)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', isAdmin: false } as any)
        
        const fd = new FormData()
        fd.append('description', 'Upd')
        fd.append('amount', '50')
        fd.append('date', '2023-01-01')
        fd.append('participants', 'u2')

        const result = await updateExpense('g1', 'e1', fd, 'u1')
        expect(result).toHaveProperty('error')
      })
  })

  describe('Other Actions', () => {
      it('toggleUserFinishedState: should toggle', async () => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', hasFinishedAdding: false } as any)
          await toggleUserFinishedState('g1', 'u1')
          expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
              data: { hasFinishedAdding: true }
          }))
      })

      it('settleDebt: should create settlement expense', async () => {
          vi.mocked(prisma.user.findUnique)
            .mockResolvedValueOnce({ id: 'd1' } as any)
            .mockResolvedValueOnce({ id: 'c1' } as any)

          await settleDebt('g1', 'd1', 'c1', 50)
          
          expect(prisma.expense.create).toHaveBeenCalledWith(expect.objectContaining({
              data: expect.objectContaining({
                  isSettlement: true,
                  amount: 50
              })
          }))
      })

      it('deleteGroup: should delete everything if admin', async () => {
          vi.mocked(prisma.user.findUnique).mockResolvedValue({ isAdmin: true } as any)
          await deleteGroup('g1', 'admin')
          expect(prisma.expense.deleteMany).toHaveBeenCalled()
          expect(prisma.user.deleteMany).toHaveBeenCalled()
          expect(prisma.group.delete).toHaveBeenCalled()
      })

      it('deleteGroup: should deny if not admin', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ isAdmin: false } as any)
        const result = await deleteGroup('g1', 'user')
        expect(result).toHaveProperty('error')
    })
  })
})
