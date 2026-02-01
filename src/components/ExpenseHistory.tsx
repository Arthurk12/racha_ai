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
  date: string
  participants: string[]
}

interface ExpenseHistoryProps {
  users: User[]
  expenses: Expense[]
  removeExpense: (id: string) => void
  currentUserId: string | null
  isAdmin: boolean
}

const getCategoryIcon = (description: string) => {
  const lower = description.toLowerCase()
  
  if (lower.match(/almoço|jantar|comida|lanche|restaurante|ifood|mercado|feira|bar|cerveja|drink|churrasco|pizza|burguer|burger|agua|açaí|sorvete|alimenta/)) return '🍔'
  if (lower.match(/uber|99|taxi|gasolina|estacionamento|pedagio|onibus|metro|passagem|combustivel|transporte/)) return '🚗'
  if (lower.match(/praia|parque|viagem|hotel|pousada|clube|piscina|lazer/)) return '🏖️'
  if (lower.match(/show|festa|ingresso|netflix|spotify|cinema|jogo|entretenimento/)) return '🎟️'
  if (lower.match(/farmacia|remedio|medico|hospital|consulta|exame|saude/)) return '💊'
  if (lower.match(/conserto|mecanico|bateria|pneu|emergencia/)) return '🚨'
  
  return '📝'
}

export default function ExpenseHistory({ users, expenses, removeExpense, currentUserId, isAdmin }: ExpenseHistoryProps) {
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
            const canDelete = isAdmin || isMyExpense;
            const categoryIcon = getCategoryIcon(expense.description);

            return (
                <li 
                key={expense.id} 
                className={`flex justify-between items-start p-3 rounded-lg border transition-all hover:bg-slate-700/50 ${
                    isMyExpense 
                    ? 'bg-slate-800 border-green-500/30' 
                    : 'bg-slate-800 border-slate-700'
                }`}
                >
                <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-full text-2xl flex-shrink-0 border border-slate-600 shadow-sm mt-1">
                        {categoryIcon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <p className="font-semibold text-slate-100 truncate capitalize flex-1 min-w-0" title={expense.description}>
                                {expense.description}
                            </p>
                            <span className="text-green-400 font-bold whitespace-nowrap flex-shrink-0">
                                {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                             <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600">
                                {expense.date ? new Date(expense.date).toLocaleDateString('pt-BR') : 'Data n/a'}
                             </span>
                             <span className="text-xs text-slate-400">
                                Pago por <span className="text-slate-200 font-medium">{users.find(u => u.id === expense.paidBy)?.name || 'Desconhecido'}</span>
                             </span>
                        </div>
                        
                        <p className="text-xs text-slate-500 mt-1 truncate">
                           Participantes: {expense.participants.map(id => users.find(u => u.id === id)?.name).join(', ')}
                        </p>
                    </div>
                </div>

                {canDelete && (
                    <button
                        onClick={() => removeExpense(expense.id)}
                        className="text-slate-500 hover:text-red-400 p-2 ml-2 transition-colors rounded-full hover:bg-slate-700/80"
                        title="Remover Despesa"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                )}
                </li>
            )
            })}
        </ul>
      )}
    </div>
  )
}
