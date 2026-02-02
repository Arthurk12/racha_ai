export interface User {
  id: string
  name: string
}

export interface Expense {
  id?: string
  description?: string
  date?: Date | string
  amount: number
  paidBy: string
  participants: string[]
}

export interface DebtBreakdownItem {
  expenseId?: string
  description: string
  date?: Date | string
  totalAmount: number
  oweAmount: number
  isPayer: boolean // true = user paid and other owes (Credit); false = other paid and user owes (Debt)
}

export function getDebtBreakdown(user1Id: string, user2Id: string, expenses: Expense[]): DebtBreakdownItem[] {
  const breakdown: DebtBreakdownItem[] = []

  expenses.forEach(expense => {
    if (expense.participants.length === 0) return
    const splitAmount = expense.amount / expense.participants.length
    
    // Case 1: user1 paid, user2 participated -> user2 owes user1 (Credit for u1)
    if (expense.paidBy === user1Id && expense.participants.includes(user2Id)) {
      breakdown.push({
        expenseId: expense.id,
        description: expense.description || 'Despesa sem descrição',
        date: expense.date,
        totalAmount: expense.amount,
        oweAmount: splitAmount,
        isPayer: true
      })
    }
    
    // Case 2: user2 paid, user1 participated -> user1 owes user2 (Debt for u1)
    if (expense.paidBy === user2Id && expense.participants.includes(user1Id)) {
      breakdown.push({
        expenseId: expense.id,
        description: expense.description || 'Despesa sem descrição',
        date: expense.date,
        totalAmount: expense.amount,
        oweAmount: splitAmount,
        isPayer: false
      })
    }
  })

  // Sort by date descending if available
  return breakdown.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })
}

export function calculateBalances(users: User[], expenses: Expense[]) {
  const balanceMap: { [key: string]: number } = {}

  users.forEach(user => {
    balanceMap[user.id] = 0
  })

  expenses.forEach(expense => {
    if (expense.participants.length === 0) return

    const splitAmount = expense.amount / expense.participants.length
    expense.participants.forEach(participantId => {
      // Check if participant and payer exist in our map to avoid errors with deleted users logic
      if (balanceMap[participantId] === undefined) return
      
      if (participantId !== expense.paidBy) {
        if (balanceMap[expense.paidBy] !== undefined) {
          balanceMap[expense.paidBy] += splitAmount
        }
        balanceMap[participantId] -= splitAmount
      }
    })
  })

  return balanceMap
}

export function calculatePairwiseDebts(users: User[], expenses: Expense[]) {
  const debts: { [key: string]: number } = {}
  
  const getKey = (from: string, to: string) => `${from}:${to}`

  expenses.forEach(expense => {
      if (expense.participants.length === 0) return
      const splitAmount = expense.amount / expense.participants.length
      expense.participants.forEach(participantId => {
          if (participantId !== expense.paidBy) {
              // participantId owes expense.paidBy
              const key = getKey(participantId, expense.paidBy)
              debts[key] = (debts[key] || 0) + splitAmount
          }
      })
  })

  const usersIds = users.map(u => u.id)
  const finalDebts: { debtorId: string, creditorId: string, amount: number }[] = []

  for (let i = 0; i < usersIds.length; i++) {
      for (let j = i + 1; j < usersIds.length; j++) {
          const u1 = usersIds[i]
          const u2 = usersIds[j]
          const d1 = debts[getKey(u1, u2)] || 0
          const d2 = debts[getKey(u2, u1)] || 0
          
          if (d1 > d2) {
              finalDebts.push({ debtorId: u1, creditorId: u2, amount: d1 - d2 })
          } else if (d2 > d1) {
              finalDebts.push({ debtorId: u2, creditorId: u1, amount: d2 - d1 })
          }
      }
  }
  
  return finalDebts
}
