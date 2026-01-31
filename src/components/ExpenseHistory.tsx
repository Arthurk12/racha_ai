'use client'

import { useState } from 'react'

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

interface ExpenseHistoryProps {
  users: User[]
  expenses: Expense[]
  removeExpense: (id: string) => void
  currentUserId: string | null
}

export default function ExpenseHistory({ users, expenses, removeExpense, currentUserId }: ExpenseHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 mt-6 md:mt-0">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-xl font-semibold text-green-400 focus:outline-none"
      >
        <span>Histórico de Despesas</span>
        <span className="text-sm bg-slate-700 px-2 py-1 rounded border border-slate-600">
            {isExpanded ? '🔽' : '◀️'} {expenses.length}
        </span>
      </button>

      {isExpanded && (
        <ul className="space-y-4 mt-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {expenses.length === 0 && <p className="text-slate-500 text-sm">Nenhuma despesa registrada.</p>}
            {expenses.map((expense) => {
            const isMyExpense = currentUserId === expense.paidBy;
            return (
                <li 
                key={expense.id} 
                className={`flex justify-between items-center p-3 rounded border ${
                    isMyExpense 
                    ? 'bg-green-900/30 border-green-500/50 flex-row-reverse text-right' 
                    : 'bg-slate-700 border-slate-600'
                }`}
                >
                <div className="flex-1">
                    <p className="font-semibold text-slate-100">{expense.description}</p>
                    <p className="text-sm text-slate-400">
                    {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} {isMyExpense ? '- Pago por mim' : `- Pago por ${users.find(u => u.id === expense.paidBy)?.name}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                    Participantes: {expense.participants.map(id => users.find(u => u.id === id)?.name).join(', ')}
                    </p>
                </div>
                <button
                    onClick={() => removeExpense(expense.id)}
                    className="text-red-400 hover:text-red-300 focus:outline-none mx-4 p-2"
                    title="Remover Despesa"
                >
                    ✕
                </button>
                </li>
            )
            })}
        </ul>
      )}
    </div>
  )
}
