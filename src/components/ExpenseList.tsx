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
}

export default function ExpenseList({ users, expenses, addExpense, removeExpense, currentUserId, isPending }: ExpenseListProps) {
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
    setDate(new Date().toISOString().split('T')[0])
  }, [])

  // Set default payer to current user
  useEffect(() => {
    if (currentUserId) {
      setPaidBy(currentUserId)
    }
  }, [currentUserId])
  
  // Removed handleDateChange since we are using native date picker

  const handleAddExpense = () => {
    if (description.trim() && amount && paidBy && participants.length > 0 && date) {
      const parsedAmount = parseFloat(amount.replace(',', '.'))
      if (isNaN(parsedAmount)) return
      
      // date is already YYYY-MM-DD from input type="date"
      
      addExpense({
        description: description.trim(),
        amount: parsedAmount,
        paidBy,
        date,
        participants
      })
      
      // Reset form
      setDescription('')
      setAmount('')
      // Reset date to today
      setDate(new Date().toISOString().split('T')[0])
      
      setPaidBy(currentUserId || '') 
      setParticipants(users.map(u => u.id))
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
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-400"
        />
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white"
        >
          <option value="">Quem pagou?</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
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