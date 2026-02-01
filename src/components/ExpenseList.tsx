'use client'

import { useState, useEffect } from 'react'

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
      
      addExpense({
        description: description.trim(),
        amount: parsedAmount,
        paidBy,
        date: isoDate,
        participants
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
      <h2 className="text-xl font-semibold mb-4 text-green-400">Despesas</h2>
      <div className="space-y-4 mb-4">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da despesa"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-400"
        />
        <input
          type="text"
          value={amount}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9,]/g, '')
            setAmount(value)
          }}
          placeholder="Valor (R$)"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-400"
        />
        <div className="relative">
            <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="DD/MM/AAAA"
            value={date}
            onChange={handleDateChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-400"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="relative w-6 h-6">
                    <input 
                        type="date" 
                        onChange={handlePickerChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400 pointer-events-none">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                    </svg>
                </div>
            </div>
        </div>
        <div className="relative">
            {/* If admin, show full select. If not, show read-only or disabled select enforcing current user */}
            <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                disabled={!isAdmin}
                className={`w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white ${!isAdmin ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
                <option value="">Quem pagou?</option>
                {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                ))}
            </select>
        </div>
        <div>
          <p className="mb-2 text-slate-300">Participantes:</p>
          <div className="flex flex-wrap gap-2">
            {users.map(user => (
              <label key={user.id} className="flex items-center text-slate-300">
                <input
                  type="checkbox"
                  checked={participants.includes(user.id)}
                  onChange={() => toggleParticipant(user.id)}
                  className="mr-2 accent-green-500"
                />
                {user.name}
              </label>
            ))}
          </div>
        </div>
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