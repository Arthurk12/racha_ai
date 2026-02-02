'use client'

import { useMemo, useState } from 'react'
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
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  const balances = useMemo(() => {
    return calculateBalances(users, expenses)
  }, [users, expenses])

  const rawDebts = useMemo(() => {
     return calculatePairwiseDebts(users, expenses)
  }, [users, expenses])

  const userBalances = useMemo(() => {
    return users.map(user => {
      // Calculate breakdown for this user
      const toPay = rawDebts.filter(d => d.debtorId === user.id && d.amount > 0.01)
      const toReceive = rawDebts.filter(d => d.creditorId === user.id && d.amount > 0.01)
      
      return {
        ...user,
        balance: balances[user.id] || 0,
        toPay,
        toReceive
      }
    })
  }, [users, balances, rawDebts])

  const suggestions = useMemo(() => {
    return rawDebts
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
  }, [users, rawDebts])

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
      <h2 className="text-xl font-semibold mb-4 text-green-400">Resumo de Saldos</h2>
      <ul className="space-y-2">
        {userBalances.map((user) => (
          <li key={user.id} className="bg-slate-700 rounded border border-slate-600 overflow-hidden">
            <div 
                className="flex justify-between items-center p-2 cursor-pointer hover:bg-slate-600/50 transition-colors"
                onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
            >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 text-slate-400 transition-transform ${expandedUserId === user.id ? 'rotate-90' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className={`truncate flex-1 border-r border-slate-600 pr-2 font-bold ${getUserColor(user.id)}`} title={user.name}>{user.name}</span>
                </div>
                
                <div className="flex flex-col items-end">
                <span className={`font-semibold whitespace-nowrap ${user.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Math.abs(user.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    {user.balance > 0.01 ? 'a receber' : user.balance < -0.01 ? 'a pagar' : 'quite'}
                </span>
                </div>
            </div>
            
            {/* Details Breakdown */}
            {expandedUserId === user.id && (user.toPay.length > 0 || user.toReceive.length > 0) && (
                <div className="bg-slate-800/50 p-3 pt-0 text-xs border-t border-slate-600 animate-in slide-in-from-top-1">
                    {user.toReceive.length > 0 && (
                        <div className="mb-2 mt-2">
                            <p className="text-green-400 font-bold mb-1">Recebe de:</p>
                            <ul className="space-y-1 pl-2 border-l-2 border-green-500/20">
                                {user.toReceive.map((debt, i) => {
                                    const payer = users.find(u => u.id === debt.debtorId)
                                    return (
                                        <li key={i} className="flex justify-between text-slate-300">
                                            <span>{payer?.name || 'Alguém'}</span>
                                            <span className="font-mono">{debt.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                    {user.toPay.length > 0 && (
                        <div className="mt-2">
                            <p className="text-red-400 font-bold mb-1">Paga para:</p>
                            <ul className="space-y-1 pl-2 border-l-2 border-red-500/20">
                                {user.toPay.map((debt, i) => {
                                    const receiver = users.find(u => u.id === debt.creditorId)
                                    return (
                                        <li key={i} className="flex justify-between text-slate-300">
                                            <span>{receiver?.name || 'Alguém'}</span>
                                            <span className="font-mono">{debt.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}
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