'use client'

import { useMemo } from 'react'
import { calculateBalances } from '@/lib/balance'
import { getUserColor } from '@/lib/colors'

interface User {
  id: string
  name: string
}

interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  participants: string[]
}

interface BalanceSummaryProps {
  users: User[]
  expenses: Expense[]
}

export default function BalanceSummary({ users, expenses }: BalanceSummaryProps) {
  const balances = useMemo(() => {
    return calculateBalances(users, expenses)
  }, [users, expenses])

  const userBalances = useMemo(() => {
    return users.map(user => ({
      ...user,
      balance: balances[user.id] || 0
    }))
  }, [users, balances])

  const suggestions = useMemo(() => {
    // Clone para não mutar o original
    const userBalancesCopy = JSON.parse(JSON.stringify(userBalances)) as typeof userBalances
    const debtors = userBalancesCopy.filter(u => u.balance < -0.01).sort((a, b) => a.balance - b.balance)
    const creditors = userBalancesCopy.filter(u => u.balance > 0.01).sort((a, b) => b.balance - a.balance)
    const suggs: { debtor: typeof debtors[0], creditor: typeof creditors[0], amount: string }[] = []

    let i = 0, j = 0
    while (i < debtors.length && j < creditors.length) {
      const debt = Math.min(-debtors[i].balance, creditors[j].balance)
      const formattedDebt = debt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      suggs.push({
          debtor: debtors[i],
          creditor: creditors[j],
          amount: formattedDebt
      })
      debtors[i].balance += debt
      creditors[j].balance -= debt
      if (debtors[i].balance >= -0.01) i++
      if (creditors[j].balance <= 0.01) j++
    }

    return suggs
  }, [userBalances])

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
      <h2 className="text-xl font-semibold mb-4 text-green-400">Resumo de Saldos</h2>
      <ul className="space-y-2">
        {userBalances.map((user) => (
          <li key={user.id} className="flex justify-between items-center p-2 bg-slate-700 rounded border border-slate-600">
            <span className={`truncate mr-4 min-w-0 flex-1 border-r border-slate-600 pr-2 font-bold ${getUserColor(user.id)}`} title={user.name}>{user.name}</span>
            <span className={`font-semibold whitespace-nowrap ${user.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {user.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2 text-green-400">Sugestões de Pagamento</h3>
        {suggestions.length > 0 ? (
          <ul className="space-y-1">
            {suggestions.map((sugg, index) => (
              <li key={index} className="text-sm bg-slate-700 text-slate-200 p-2 rounded border border-slate-600 flex flex-wrap gap-1 items-center">
                  <span className={`font-bold ${getUserColor(sugg.debtor.id)}`}>{sugg.debtor.name}</span>
                  <span>deve pagar</span>
                  <span className="font-mono font-bold text-white bg-slate-800 px-1 rounded">{sugg.amount}</span>
                  <span>para</span>
                  <span className={`font-bold ${getUserColor(sugg.creditor.id)}`}>{sugg.creditor.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Todos quite!</p>
        )}
      </div>
    </div>
  )
}