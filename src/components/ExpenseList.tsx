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
  participants: string[]
}

interface ExpenseListProps {
  users: User[]
  expenses: Expense[]
  addExpense: (expense: Omit<Expense, 'id'>) => void
  removeExpense: (id: string) => void
  currentUserId: string | null
}

export default function ExpenseList({ users, expenses, addExpense, removeExpense, currentUserId }: ExpenseListProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [participants, setParticipants] = useState<string[]>([])

  // Set default participants to all users when the list changes
  useEffect(() => {
    setParticipants(users.map(u => u.id))
  }, [users])

  // Set default payer to current user
  useEffect(() => {
    if (currentUserId) {
      setPaidBy(currentUserId)
    }
  }, [currentUserId])

  const handleAddExpense = () => {
    if (description.trim() && amount && paidBy && participants.length > 0) {
      const parsedAmount = parseFloat(amount.replace(',', '.'))
      if (isNaN(parsedAmount)) return
      
      addExpense({
        description: description.trim(),
        amount: parsedAmount,
        paidBy,
        participants
      })
      setDescription('')
      setAmount('')
      setPaidBy(currentUserId || '') // Reset to current user
      setParticipants(users.map(u => u.id)) // Reset to all users
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
          className="w-full px-4 py-2 bg-green-500 text-slate-900 rounded-md hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 font-bold shadow"
        >
          Adicionar Despesa
        </button>
      </div>
    </div>
  )
}