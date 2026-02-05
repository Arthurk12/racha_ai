import { describe, it, expect } from 'vitest'
import { calculateBalances, getDebtBreakdown, calculatePairwiseDebts, Expense, User } from '../src/lib/balance'

describe('Balance Logic', () => {
    
    it('should split 50/50 correctly (Test Case 1)', () => {
        const users = [{id: 'A', name: 'Alice'}, {id: 'B', name: 'Bob'}]
        const expenses = [{amount: 100, paidBy: 'A', participants: ['A', 'B']}]
        const result = calculateBalances(users, expenses)

        expect(result['A']).toBe(50)
        expect(result['B']).toBe(-50)
    })

    it('should split correctly among 3 people (Test Case 2)', () => {
        const users = [{id: 'A', name: 'Alice'}, {id: 'B', name: 'Bob'}, {id: 'C', name: 'Charlie'}]
        const expenses = [{amount: 90, paidBy: 'A', participants: ['A', 'B', 'C']}]
        const result = calculateBalances(users, expenses)

        expect(result['A']).toBe(60)
        expect(result['B']).toBe(-30)
        expect(result['C']).toBe(-30)
    })

    it('should handle uneven payments correctly (Test Case 3)', () => {
        const users = [{id: 'A', name: 'Alice'}, {id: 'B', name: 'Bob'}, {id: 'C', name: 'Charlie'}]
        const expenses = [
            {amount: 100, paidBy: 'A', participants: ['A', 'B']},
            {amount: 60, paidBy: 'B', participants: ['A', 'B', 'C']}
        ]
        const result = calculateBalances(users, expenses)

        expect(result['A']).toBe(30)
        expect(result['B']).toBe(-10)
        expect(result['C']).toBe(-20)
    })

    it('should handle offsetting payments correctly (Test Case 4)', () => {
        const users = [{id: 'A', name: 'Alice'}, {id: 'B', name: 'Bob'}]
        const expenses = [
            {amount: 50, paidBy: 'A', participants: ['B']}, 
            {amount: 50, paidBy: 'B', participants: ['A']} 
        ]
        const result = calculateBalances(users, expenses)

        expect(result['A']).toBe(0)
        expect(result['B']).toBe(0)
    })

    // --- New Tests for Full Coverage ---

    it('should ignore expense with no participants', () => {
        const users = [{id: 'A', name: 'Alice'}]
        const expenses = [{amount: 100, paidBy: 'A', participants: []}]
        const result = calculateBalances(users, expenses)
        expect(result['A']).toBe(0)
    })

    it('should ignore deleted users in balance calculation', () => {
        const users = [{id: 'A', name: 'Alice'}]
        // B doesn't exist in 'users' array
        const expenses = [{amount: 100, paidBy: 'A', participants: ['A', 'B']}]
        const result = calculateBalances(users, expenses)
        
        // As defined in logic: if participant does not exist, we skip processing for them entirely.
        // Therefore, A does not get the +50 credit for covering B.
        expect(result['A']).toBe(0)
    })

    describe('getDebtBreakdown', () => {
        it('should list correct credits (User1 paid for User2)', () => {
            const expenses: Expense[] = [
                { id: '1', amount: 100, paidBy: 'A', participants: ['A', 'B'], description: 'Food', date: new Date() }
            ]
            // A paid 100. Split 50. B owes A 50.
            // Check breakdown for A vs B.
            // Case 1: user1=A, user2=B. A paid, B participated. -> Credit for A.
            const result = getDebtBreakdown('A', 'B', expenses)
            expect(result).toHaveLength(1)
            expect(result[0].isPayer).toBe(true)
            expect(result[0].oweAmount).toBe(50)
        })

        it('should list correct debts (User2 paid for User1)', () => {
            const expenses: Expense[] = [
                { id: '1', amount: 100, paidBy: 'B', participants: ['A', 'B'], description: 'Food', date: new Date() }
            ]
            // B paid 100. Split 50. A owes B 50.
            // Check breakdown for A vs B.
            // Case 2: user2=B paid, user1=A participated. -> Debt for A.
            const result = getDebtBreakdown('A', 'B', expenses)
            expect(result).toHaveLength(1)
            expect(result[0].isPayer).toBe(false)
            expect(result[0].oweAmount).toBe(50)
        })

        it('should return empty if no relation', () => {
            const expenses: Expense[] = [
                { id: '1', amount: 100, paidBy: 'C', participants: ['C'], description: 'Solo', date: new Date() }
            ]
            const result = getDebtBreakdown('A', 'B', expenses)
            expect(result).toHaveLength(0)
        })

        it('should use default description if missing', () => {
             const expenses: Expense[] = [
                { id: '1', amount: 100, paidBy: 'B', participants: ['A', 'B'], description: undefined, date: new Date() }
            ]
            const result = getDebtBreakdown('A', 'B', expenses)
            expect(result[0].description).toBe('Despesa sem descrição')
        })

        it('should sort by date descending', () => {
            const d1 = new Date('2023-01-01')
            const d2 = new Date('2023-01-02')
            const expenses: Expense[] = [
                { id: '1', amount: 10, paidBy: 'A', participants: ['B'], date: d1 },
                { id: '2', amount: 10, paidBy: 'A', participants: ['B'], date: d2 }
            ]
            const result = getDebtBreakdown('A', 'B', expenses)
            expect(result[0].date).toBe(d2) // Newest first
            expect(result[1].date).toBe(d1)
        })
    })

    describe('calculatePairwiseDebts', () => {
        it('should simplify debts correctly', () => {
            // A owes B 100
            // B owes A 60
            // Result: A owes B 40
            const users = [{id: 'A', name: 'Alice'}, {id: 'B', name: 'Bob'}]
            const expenses = [
                { amount: 100, paidBy: 'B', participants: ['A'] }, // A owes B 100
                { amount: 60, paidBy: 'A', participants: ['B'] },  // B owes A 60
            ]
            const result = calculatePairwiseDebts(users, expenses)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({ debtorId: 'A', creditorId: 'B', amount: 40 })
        })

        it('should handle multiple items efficiently', () => {
            // A owes B 10
            // B owes C 10
            // C owes A 10
            // Algorithm doesn't optimize graph (A->B->C->A), it just does pairwise
            // So A->B 10, B->C 10, C->A 10
            const users = [{id: 'A', name: ''}, {id: 'B', name: ''}, {id: 'C', name: ''}]
            const expenses = [
                { amount: 10, paidBy: 'B', participants: ['A'] },
                { amount: 10, paidBy: 'C', participants: ['B'] },
                { amount: 10, paidBy: 'A', participants: ['C'] },
            ]
            const result = calculatePairwiseDebts(users, expenses)
            expect(result).toHaveLength(3) // 3 distinct pairwise debts
        })

    describe('Additional Coverage', () => {
        it('calculatePairwiseDebts should return empty list if no expenses', () => {
            const users: User[] = [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }]
            const expenses: Expense[] = []
            const result = calculatePairwiseDebts(users, expenses)
            expect(result).toHaveLength(0)
        })

       it('calculatePairwiseDebts should ignore expenses with no participants', () => {
            const users: User[] = [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }]
            const expenses: Expense[] = [
                { amount: 100, paidBy: 'B', participants: [] }
            ]
            const result = calculatePairwiseDebts(users, expenses)
            expect(result).toHaveLength(0)
        })

        it('getDebtBreakdown should ignore expenses with no participants', () => {
             const breakdown = getDebtBreakdown('A', 'B', [{
                 amount: 100, paidBy: 'A', participants: [],
                 description: 'Empty', id: '1'
             }])
             expect(breakdown).toHaveLength(0)
        })

        it('calculateBalances should ignore expenses with no participants', () => {
             const users = [{id: 'A', name: 'A'}]
             const expenses = [{ amount: 100, paidBy: 'A', participants: [] }]
             const result = calculateBalances(users, expenses)
             expect(result['A']).toBe(0)
        })

        it('getDebtBreakdown should handle sort with missing dates', () => {
             const expenses: Expense[] = [
                 { id: '1', amount: 10, paidBy: 'A', participants: ['B'], date: undefined },
                 { id: '2', amount: 10, paidBy: 'A', participants: ['B'], date: '2023-01-01' },
                 { id: '3', amount: 10, paidBy: 'A', participants: ['B'], date: null as any }
             ]
             const breakdown = getDebtBreakdown('A', 'B', expenses)
             expect(breakdown).toHaveLength(3)
             expect(breakdown[0].expenseId).toBe('2')
        })
    })
})

})
