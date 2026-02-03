'use client'

import { useMemo, useState } from 'react'
import { calculateBalances, calculatePairwiseDebts, getDebtBreakdown } from '@/lib/balance'
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
  date?: string | Date
}

interface BalanceSummaryProps {
  users: User[]
  expenses: Expense[]
}

export default function BalanceSummary({ users, expenses }: BalanceSummaryProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [expandedSuggestionIndex, setExpandedSuggestionIndex] = useState<number | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

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
                <div className="flex items-center gap-2 overflow-hidden mr-2 flex-1 min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 text-slate-400 flex-shrink-0 transition-transform ${expandedUserId === user.id ? 'rotate-90' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className={`truncate flex-1 border-r border-slate-600 pr-2 font-bold ${getUserColor(user.id)}`} title={user.name}>{user.name}</span>
                </div>
                
                <div className="flex flex-col items-end shrink-0">
                <span className={`font-semibold whitespace-nowrap ${user.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Math.abs(user.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium whitespace-nowrap">
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
                                        <li key={i} className="flex justify-between text-slate-300 gap-2">
                                            <span className="truncate" title={payer?.name}>{payer?.name || 'Alguém'}</span>
                                            <span className="font-mono whitespace-nowrap shrink-0">{debt.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
                                        <li key={i} className="flex justify-between text-slate-300 gap-2">
                                            <span className="truncate" title={receiver?.name}>{receiver?.name || 'Alguém'}</span>
                                            <span className="font-mono whitespace-nowrap shrink-0">{debt.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
      <div className="mt-4 border-t border-slate-700 pt-4">
        <button 
           onClick={() => setShowSuggestions(!showSuggestions)}
           className="w-full flex justify-between items-center text-left focus:outline-none group"
        >
             <h3 className="text-lg font-semibold text-green-400 group-hover:text-green-300 transition-colors">Sugestões de Pagamento</h3>
             <span className={`text-slate-400 transition-transform duration-200 ${showSuggestions ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {showSuggestions && (
            <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                {suggestions.length > 0 ? (
                <ul className="space-y-2">
                    {suggestions.map((sugg, index) => {
                    const isExpanded = expandedSuggestionIndex === index
                    const breakdown = isExpanded ? getDebtBreakdown(sugg.debtor.id, sugg.creditor.id, expenses) : []

                    return (
                    <li key={index} className="bg-slate-700 text-slate-200 rounded border border-slate-600 flex flex-col">
                        <div 
                            className="p-3 flex items-center gap-2 cursor-pointer hover:bg-slate-600/50 transition-colors overflow-hidden"
                            onClick={() => setExpandedSuggestionIndex(isExpanded ? null : index)}
                        >
                            <span className={`font-bold truncate min-w-[60px] ${getUserColor(sugg.debtor.id)}`} title={sugg.debtor.name}>{sugg.debtor.name}</span>
                            <span className="whitespace-nowrap shrink-0 text-sm">paga</span>
                            <span className="font-mono font-bold text-white bg-slate-800 px-1 rounded whitespace-nowrap shrink-0 text-sm">{sugg.amount}</span>
                            <span className="whitespace-nowrap shrink-0 text-sm">a</span>
                            <span className={`font-bold truncate min-w-[60px] ${getUserColor(sugg.creditor.id)}`} title={sugg.creditor.name}>{sugg.creditor.name}</span>
                            <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 pl-1 ml-auto">{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {isExpanded && (
                            <div className="bg-slate-800/50 p-3 border-t border-slate-600 animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Origem do Saldo</p>
                            {breakdown.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">Nenhum registro detalhado encontrado.</p>
                            ) : (
                                <ul className="space-y-2 text-sm">
                                    {breakdown.map((item, idx) => {
                                        // Logic: If isPayer=true (user1/Debtor paid), it reduces the debt (-)
                                        // If isPayer=false (user2/Creditor paid), it increases the debt (+)
                                        const isDebtorPaying = item.isPayer
                                        const valueSign = isDebtorPaying ? '-' : '+'
                                        const textColor = isDebtorPaying ? 'text-green-400' : 'text-red-400'

                                        return (
                                        <li key={idx} className="flex justify-between items-start border-b border-slate-700/50 pb-1 last:border-0 pl-2 border-l-2" style={{borderLeftColor: isDebtorPaying ? '#4ade80' : '#f87171'}}>
                                            <div className="flex flex-col">
                                                <span className="text-slate-300 font-medium">{item.description}</span>
                                                <span className="text-[10px] text-slate-500">
                                                    {item.date ? new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem data'} • 
                                                    {isDebtorPaying ? ` ${sugg.debtor.name} pagou` : ` ${sugg.creditor.name} pagou`}
                                                </span>
                                            </div>
                                            <span className={`font-mono ${textColor} ml-4 whitespace-nowrap`}>
                                                {valueSign} {item.oweAmount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                            </span>
                                        </li>
                                        )
                                    })}
                                </ul>
                            )}
                            </div>
                        )}
                    </li>
                    )})}
                </ul>
                ) : (
                <p className="text-sm text-slate-400">Todos quite!</p>
                )}
            </div>
        )}
      </div>
    </div>
  )
}