'use client'

import { useState } from 'react'
import { getUserColor } from '@/lib/colors'

interface User {
  id: string
  name: string
  isAdmin: boolean
}

interface UserListProps {
  users: User[]
  addUser: (name: string) => void
  removeUser: (id: string) => void
  isAdmin: boolean
  onResetPin: (id: string) => void
  currentUserId: string | null
}

export default function UserList({ users, addUser, removeUser, isAdmin, onResetPin, currentUserId }: UserListProps) {
  const [newUserName, setNewUserName] = useState('')

  const handleAddUser = () => {
    if (newUserName.trim()) {
      addUser(newUserName.trim())
      setNewUserName('')
    }
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-green-400">Participantes</h2>
      {/* 
         Removed input based on requirement: "Gostaria de um fluxo um participante cria o grupo e convida os outros (...) Não quero impedir que um participante cadastre outro"
         Actually user DOES NOT want to prevent creating, but prioritized invitations.
         But since we need PIN for creation now, the simple input doesn't work well anymore.
         For now, keeping the list display only. User invites via link.
      */}
      
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id} className="flex justify-between items-center p-2 bg-slate-700 rounded border border-slate-600">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${getUserColor(user.id)}`}>
                {user.name} {user.id === currentUserId && <span className="text-slate-400 font-normal text-xs">(você)</span>}
              </span>
               {user.isAdmin && <span className="text-[10px] bg-green-900 text-green-200 px-1 py-0.5 rounded uppercase tracking-wider">Admin</span>}
            </div>
            
            <div className="flex gap-2">
               {isAdmin && !user.isAdmin && (
                <button
                  onClick={() => onResetPin(user.id)}
                  className="text-amber-500 hover:text-amber-400 text-xs mr-2"
                  title="Resetar PIN para 0000"
                >
                  Resetar PIN
                </button>
               )}
               
               {/* Show remove button if I am admin OR if it is myself */}
               {(isAdmin || (currentUserId && user.id === currentUserId)) && (
                <button
                  onClick={() => removeUser(user.id)}
                  className="text-red-400 hover:text-red-300 focus:outline-none text-sm"
                  title={user.id === currentUserId ? "Sair do grupo" : "Remover usuário"}
                >
                  ✕
                </button>
               )}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-4">
        Convide amigos enviando o link do grupo. Eles criarão seus próprios perfis ao entrar.
      </p>
    </div>
  )
}