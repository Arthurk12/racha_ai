'use client'

import { useMemo } from 'react'
import { calculateBalances, calculatePairwiseDebts } from '@/lib/balance'
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
    const debts = calculatePairwiseDebts(users, expenses)
    return debts
      .filter(d => d.amount > 0.01)
      .map(d => {
        const debtor = users.find(u => u.id === d.debtorId)
        const creditor = users.find(u => u.id === d.creditorId)
        if (!debtor || !creditor) return null
        
        return {
          debtor,
          creditor,
          amount: d.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
  }, [users, expenses])

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