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
  updateExpense: (id: string, data: { amount: number, date: string, participants: string[] }) => void
  currentUserId: string | null
  isAdmin: boolean
}

import { getUserColor } from '@/lib/colors'

const getCategoryIcon = (description: string) => {
  // Normalize: lowercase and remove accents (e.g., 'á' -> 'a', 'ç' -> 'c')
  const normalized = description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
  
  if (normalized.match(/almoco|jantar|comida|lanche|restaurante|ifood|mercado|feira|bar|cerveja|drink|churrasco|pizza|burguer|burger|agua|acai|sorvete|alimenta/)) return '🍔'
  if (normalized.match(/uber|99|taxi|gasolina|estacionamento|pedagio|onibus|metro|passagem|combustivel|transporte/)) return '🚗'
  if (normalized.match(/hotel|pousada|airbnb|hostel|resort|motel|hospedagem/)) return '🏨'
  if (normalized.match(/praia|parque|viagem|clube|piscina|lazer/)) return '🏖️'
  if (normalized.match(/show|festa|ingresso|netflix|spotify|cinema|jogo|entretenimento/)) return '🎟️'
  if (normalized.match(/farmacia|remedio|medico|hospital|consulta|exame|saude/)) return '💊'
  if (normalized.match(/conserto|mecanico|bateria|pneu|emergencia/)) return '🚨'
  
  return '📝'
}

export default function ExpenseHistory({ users, expenses, removeExpense, updateExpense, currentUserId, isAdmin }: ExpenseHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Edit State
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editParticipants, setEditParticipants] = useState<string[]>([])
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id)
    setEditAmount(expense.amount.toFixed(2).replace('.', ','))
    setEditParticipants(expense.participants)
    setIsParticipantsOpen(false)
    
    // Format date YYYY-MM-DD -> DD/MM/YYYY
    if (expense.date) {
        const d = new Date(expense.date)
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        setEditDate(`${dd}/${mm}/${yyyy}`)
    } else {
        setEditDate('')
    }
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditAmount('')
    setEditDate('')
    setEditParticipants([])
    setIsParticipantsOpen(false)
  }

  const saveEditing = (id: string) => {
    const amount = parseFloat(editAmount.replace(/\./g, '').replace(',', '.'))
    if (isNaN(amount) || editDate.length !== 10) {
        alert('Dados inválidos')
        return
    }

    if (editParticipants.length === 0) {
        alert('Selecione pelo menos um participante')
        return
    }

    const [day, month, year] = editDate.split('/')
    if (!day || !month || !year) {
        alert('Data inválida')
        return
    }
    const isoDate = `${year}-${month}-${day}`
    
    updateExpense(id, { amount, date: isoDate, participants: editParticipants })
    setEditingId(null)
  }

  const toggleEditParticipant = (userId: string) => {
    setEditParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleEditDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 8) v = v.slice(0, 8)
    
    if (v.length > 4) {
        v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`
    } else if (v.length > 2) {
        v = `${v.slice(0, 2)}/${v.slice(2)}`
    }
    setEditDate(v)
  }
  
  const handleEditPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value // YYYY-MM-DD
      if (!val) return
      const [y, m, d] = val.split('-')
      setEditDate(`${d}/${m}/${y}`)
  }

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
            const canEdit = isAdmin || isMyExpense;
            const isEditing = editingId === expense.id;
            const categoryIcon = getCategoryIcon(expense.description);
            const userColor = getUserColor(expense.paidBy);

            return (
                <li 
                key={expense.id} 
                className={`flex justify-between items-start p-3 rounded-lg border transition-all hover:bg-slate-700/50 w-full ${
                    isMyExpense 
                    ? 'bg-green-900/10 border-green-500/30' 
                    : 'bg-slate-800 border-slate-700'
                }`}
                >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-full text-2xl flex-shrink-0 border border-slate-600 shadow-sm mt-1">
                        {categoryIcon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <p className="font-semibold text-slate-100 truncate capitalize flex-1 min-w-0 mr-1" title={expense.description}>
                                {expense.description}
                            </p>
                            {isEditing ? (
                                <input 
                                    type="text"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                                    className="w-24 px-2 py-1 text-sm bg-slate-900 border border-slate-600 rounded text-white focus:ring-1 focus:ring-green-400 outline-none text-right"
                                    autoFocus
                                />
                            ) : (
                                <span className="text-green-400 font-bold whitespace-nowrap flex-shrink-0">
                                    {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap overflow-hidden">
                             {isEditing ? (
                                <div className="relative w-28">
                                    <input
                                        type="text"
                                        value={editDate}
                                        onChange={handleEditDateChange}
                                        maxLength={10}
                                        className="w-full pl-2 pr-6 py-0.5 text-[10px] bg-slate-900 border border-slate-600 rounded-full text-white focus:ring-1 focus:ring-green-400 outline-none"
                                    />
                                     <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                        <div className="relative w-4 h-4">
                                            <input 
                                                type="date" 
                                                onChange={handleEditPickerChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 pointer-events-none">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                             ) : (
                                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600 truncate max-w-[120px]">
                                    {expense.date ? new Date(expense.date).toLocaleDateString('pt-BR') : 'Data n/a'}
                                </span>
                             )}
                             <span className="text-xs text-slate-400 truncate flex-1 min-w-0">
                                Pago por <span className={`font-bold ${userColor}`}>{users.find(u => u.id === expense.paidBy)?.name || 'Desconhecido'}</span>
                             </span>
                        </div>
                        
                        <div className="text-xs text-slate-500 mt-1 min-h-[24px]">
                           {isEditing ? (
                              <div className="w-full">
                                <button
                                   type="button"
                                   onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                                   className="text-[10px] bg-slate-900 border border-slate-600 rounded px-2 py-0.5 flex items-center gap-1 text-green-400 hover:text-green-300 w-fit"
                                >
                                   Rachar com: {editParticipants.length} {editParticipants.length === 1 ? 'pessoa' : 'pessoas'}
                                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-3 h-3 transition-transform ${isParticipantsOpen ? 'rotate-180' : ''}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                                {isParticipantsOpen && (
                                     <div className="mt-1 w-full bg-slate-800 border border-slate-600 rounded shadow-inner max-h-40 overflow-y-auto animate-in fade-in zoom-in duration-100">
                                        {users.map(u => (
                                           <label key={u.id} className="flex items-center px-3 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0">
                                              <input 
                                                type="checkbox" 
                                                checked={editParticipants.includes(u.id)}
                                                onChange={() => toggleEditParticipant(u.id)}
                                                className="mr-2 accent-green-500"
                                              />
                                              <span className={`text-xs font-semibold ${getUserColor(u.id)}`}>{u.name}</span>
                                           </label>
                                        ))}
                                     </div>
                                )}
                              </div>
                           ) : (
                               <>
                               Participantes: {expense.participants.map((id, idx) => {
                                   const u = users.find(user => user.id === id);
                                   if (!u) return null;
                                   return (
                                     <span key={id}>
                                       {idx > 0 && ', '}
                                       <span className={getUserColor(id)}>{u.name}</span>
                                     </span>
                                   )
                               })}
                               </>
                           )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1 ml-2">
                    {canEdit && (
                        isEditing ? (
                            <>
                                <button
                                    onClick={() => saveEditing(expense.id)}
                                    className="text-green-500 hover:text-green-400 p-1 transition-colors rounded hover:bg-slate-700/80"
                                    title="Salvar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </button>
                                <button
                                    onClick={cancelEditing}
                                    className="text-slate-400 hover:text-slate-300 p-1 transition-colors rounded hover:bg-slate-700/80"
                                    title="Cancelar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => startEditing(expense)}
                                    className="text-slate-500 hover:text-blue-400 p-1 transition-colors rounded hover:bg-slate-700/80"
                                    title="Editar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => removeExpense(expense.id)}
                                    className="text-slate-500 hover:text-red-400 p-1 transition-colors rounded hover:bg-slate-700/80"
                                    title="Remover Despesa"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            </>
                        )
                    )}
                </div>
                </li>
            )
            })}
        </ul>
      )}
    </div>
  )
}
