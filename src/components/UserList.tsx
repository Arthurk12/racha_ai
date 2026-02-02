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
  removeUser: (id: string) => void
  isAdmin: boolean
  onResetPin: (id: string) => void
  currentUserId: string | null
}

export default function UserList({ users, removeUser, isAdmin, onResetPin, currentUserId }: UserListProps) {
  const [linkCopied, setLinkCopied] = useState(false)

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-green-400 inline-block mr-2">Participantes</h2>
        <span className="text-[10px] text-amber-500/80 md:hidden block mt-1 leading-tight">
          * Para resetar um PIN esquecido, o admin pode clicar em &quot;Resetar PIN&quot; (define como 0000).
        </span>
      </div>
      
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
                <div className="relative group/tooltip">
                  <button
                    onClick={() => onResetPin(user.id)}
                    className="text-amber-500 hover:text-amber-400 text-xs mr-2 border border-amber-500/30 px-2 py-0.5 rounded hover:bg-amber-500/10 transition-colors"
                  >
                    Resetar PIN
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs rounded p-2 border border-slate-600 shadow-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-10 hidden md:block">
                    Restaura o PIN deste usuário para &quot;0000&quot; caso ele tenha esquecido.
                  </div>
                   {/* Mobile helper below button visible on click/active or just static text if easier, but requested mechanism working on mobile. 
                       Simple approach: Alert confiramtion already exists in parent component. 
                       Just making the button more descriptive visually.
                   */}
                </div>
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
        Convide amigos enviando o <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href); 
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
          }} 
          className="text-green-400 hover:text-green-300 underline cursor-pointer bg-transparent border-none p-0 inline transition-all"
        >
          {linkCopied ? 'link (copiado!)' : 'link'}
        </button> do grupo. Eles criarão seus próprios perfis ao entrar.
      </p>
    </div>
  )
}