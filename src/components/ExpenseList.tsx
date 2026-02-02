'use client'

import { useState, useEffect, useRef } from 'react'
import { getUserColor } from '../lib/colors'

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

interface ExpenseListProps {
  users: User[]
  expenses: Expense[]
  addExpense: (expense: Omit<Expense, 'id'>) => void
  removeExpense: (id: string) => void
  currentUserId: string | null
  isPending?: boolean
  isAdmin: boolean
}

export default function ExpenseList({ users, expenses, addExpense, removeExpense, currentUserId, isPending, isAdmin }: ExpenseListProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [date, setDate] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [isDirectPayment, setIsDirectPayment] = useState(false)
  const participantsRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (participantsRef.current && !participantsRef.current.contains(event.target as Node)) {
        setIsParticipantsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [participantsRef]);

  // Set default participants to all users when the list changes
  useEffect(() => {
    setParticipants(users.map(u => u.id))
  }, [users])

  // Initialize date
  useEffect(() => {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    setDate(`${dd}/${mm}/${yyyy}`)
  }, [])

  // Set default payer to current user
  useEffect(() => {
    if (currentUserId) {
      setPaidBy(currentUserId)
    }
  }, [currentUserId])
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 8) v = v.slice(0, 8)
    
    if (v.length > 4) {
        v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`
    } else if (v.length > 2) {
        v = `${v.slice(0, 2)}/${v.slice(2)}`
    }
    setDate(v)
  }

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value // YYYY-MM-DD
      if (!val) return
      const [y, m, d] = val.split('-')
      setDate(`${d}/${m}/${y}`)
  }

  const handleAddExpense = () => {
    if (description.trim() && amount && paidBy && participants.length > 0 && date.length === 10) {
      const parsedAmount = parseFloat(amount.replace(',', '.'))
      if (isNaN(parsedAmount)) return
      
      const [day, month, year] = date.split('/')
      // Basic validation
      if (!day || !month || !year) return

      // Create format for backend (YYYY-MM-DD)
      const isoDate = `${year}-${month}-${day}`
      
      // If it's a group expense (split), ensure the payer is always included implicitly
      const finalParticipants = (!isDirectPayment && !participants.includes(paidBy)) 
          ? [...participants, paidBy]
          : participants

      addExpense({
        description: description.trim(),
        amount: parsedAmount,
        paidBy,
        date: isoDate,
        participants: finalParticipants
      })
      
      // Reset form
      setDescription('')
      setAmount('')
      // Reset date to today
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()
      setDate(`${dd}/${mm}/${yyyy}`)
      
      setPaidBy(currentUserId || '') 
      setParticipants(users.map(u => u.id))
      setIsDirectPayment(false) // Reset direct payment mode
    } else if (date.length !== 10) {
        alert('Data inválida. Use o formato DD/MM/AAAA')
    }
  }

  const toggleParticipant = (userId: string) => {
    setParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
      <h2 className="text-xl font-semibold mb-4 text-green-400">Adicionar Despesa</h2>
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Mercado, Uber..."
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Valor</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9,]/g, '')
              setAmount(value)
            }}
            placeholder="0,00"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-500"
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-400 mb-1">Data</label>
           <div className="relative">
              <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              value={date}
              onChange={handleDateChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div 
                      className="relative w-6 h-6 cursor-pointer hover:text-green-400 transition-colors"
                      onClick={() => {
                          try {
                            const input = dateInputRef.current
                            if (!input) return
                            
                            if (typeof (input as any).showPicker === 'function') {
                                (input as any).showPicker()
                            } else {
                                input.click()
                            }
                          } catch (e) {
                              console.error(e)
                          }
                      }}
                  >
                      <input 
                          ref={dateInputRef}
                          type="date" 
                          onChange={handlePickerChange}
                          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                          tabIndex={-1}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-inherit pointer-events-none">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                      </svg>
                  </div>
              </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 focus:outline-none"
        >
          {showOptions ? 'Menos opções' : 'Mais opções...'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showOptions && (
          <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-200">
            {isAdmin && (
              <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Pago Por</label>
                  <div className="relative">
                      {/* If admin, show full select. If not, show read-only or disabled select enforcing current user */}
                      <select
                          value={paidBy}
                          onChange={(e) => setPaidBy(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white font-sans"
                      >
                          <option value="">Quem pagou?</option>
                          {users.map(user => (
                              <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                      </select>
                  </div>
              </div>
            )}

            <div className="flex items-center gap-2 py-1">
                <input
                    type="checkbox"
                    id="isDirectPayment"
                    checked={isDirectPayment}
                    onChange={(e) => {
                        setIsDirectPayment(e.target.checked)
                        if (e.target.checked) {
                            setParticipants([]) // Clear to force selection
                        } else {
                            setParticipants(users.map(u => u.id)) // Reset to all
                        }
                    }}
                    className="w-4 h-4 accent-green-500 rounded border-slate-500 bg-slate-700 text-green-500 focus:ring-green-500 focus:ring-offset-slate-800"
                />
                <label htmlFor="isDirectPayment" className="text-sm font-medium text-slate-300 cursor-pointer select-none flex items-center gap-1 group relative">
                    Paguei por/pra alguém
                    <span className="cursor-help text-slate-500 hover:text-slate-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                        </svg>
                    </span>
                    <span className="invisible group-hover:visible absolute left-0 -top-12 bg-slate-900 text-xs text-slate-200 p-2 rounded w-48 shadow-xl border border-slate-700 z-50 pointer-events-none">
                        Use para compras individuais. Ex: Você pagou um lanche só para o João.
                    </span>
                </label>
            </div>
            
            <div className="relative" ref={participantsRef}>
               <label className="block text-sm font-medium text-slate-400 mb-1">
                   {isDirectPayment ? 'Para quem foi o pagamento?' : 'Rachar com'}
               </label>
              
              {isDirectPayment ? (
                 <select
                    value={participants[0] || ''}
                    onChange={(e) => setParticipants([e.target.value])}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white font-sans"
                 >
                    <option value="">Selecione o beneficiário</option>
                    {users.filter(u => u.id !== paidBy).map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                 </select>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-left text-white flex justify-between items-center"
                  >
                    <span className={participants.length === 0 ? 'text-slate-400' : ''}>
                      {participants.length === users.length 
                          ? 'Todos os participantes' 
                          : participants.length === 0 
                            ? 'Selecione os participantes'
                            : `${participants.length} participante${participants.length !== 1 ? 's' : ''}`}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 transition-transform ${isParticipantsOpen ? 'rotate-180' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                
                  {isParticipantsOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                        {users.filter(user => user.id !== paidBy).map(user => (
                              <label key={user.id} className="flex items-center px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={participants.includes(user.id)}
                                  onChange={() => toggleParticipant(user.id)}
                                  className="mr-3 w-4 h-4 accent-green-500 rounded border-slate-500 bg-slate-700 text-green-500 focus:ring-green-500 focus:ring-offset-slate-800"
                                />
                                <span className={`font-medium ${getUserColor(user.id)}`}>{user.name}</span>
                              </label>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleAddExpense}
          disabled={isPending}
          className={`w-full px-4 py-2 bg-green-500 text-slate-900 rounded-md hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 font-bold shadow flex items-center justify-center ${isPending ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adicionando...
            </>
          ) : 'Adicionar Despesa'}
        </button>
      </div>
    </div>
  )
}