export interface User {
  id: string
  name: string
}

export interface Expense {
  amount: number
  paidBy: string
  participants: string[]
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
