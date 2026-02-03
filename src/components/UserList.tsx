'use client'

import { useState, useEffect } from 'react'
import { getUserColor } from '@/lib/colors'
import { useParams } from 'next/navigation'
import { UAParser } from 'ua-parser-js'

interface User {
  id: string
  name: string
  isAdmin: boolean
  hasFinishedAdding: boolean
}

interface UserListProps {
  users: User[]
  removeUser: (id: string) => void
  isAdmin: boolean
  onResetPin: (id: string) => void
  onToggleFinished: (id: string) => void
  currentUserId: string | null
  onInfo: (message: string) => void
  pendingId: string | null
}

export default function UserList({ users, removeUser, isAdmin, onResetPin, onToggleFinished, currentUserId, onInfo, pendingId }: UserListProps) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const params = useParams()
  const groupId = params.id as string

  useEffect(() => {
    const parser = new UAParser()
    const result = parser.getResult()
    // type: console, mobile, tablet, smarttv, wearable, embedded
    const isMobileDevice = result.device.type === 'mobile' || result.device.type === 'tablet'
    setIsMobile(isMobileDevice)
  }, [])

  const handleToggleFinishedLocal = () => {
    if (!currentUserId) return
    onToggleFinished(currentUserId)
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-green-400 inline-block mr-2">Participantes</h2>
        {isMobile && (
            <div className="flex flex-col gap-1 mt-2">
                <span className="text-xs text-slate-400 leading-tight">
                * <strong>FINALIZAR:</strong> Sinalize que você já lançou todas suas despesas.
                </span>
                <span className="text-xs text-amber-500 leading-tight">
                * <strong>Resetar PIN:</strong> O admin pode resetar o PIN de alguém para 0000.
                </span>
            </div>
        )}
      </div>
      
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id} className="flex justify-between items-center p-2 bg-slate-700 rounded border border-slate-600">
            <div className="flex items-center gap-2">
                <div className="flex flex-col">
                    <span className={`font-bold flex items-center gap-2 ${getUserColor(user.id)}`}>
                        {user.name} 
                        {user.id === currentUserId && <span className="text-slate-400 font-normal text-xs">(você)</span>}
                        {user.hasFinishedAdding && (
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 font-semibold flex items-center gap-1" title="Finalizou os lançamentos">
                                ✓ <span className="hidden sm:inline">Pronto</span>
                            </span>
                        )}
                    </span>
                </div>
               {user.isAdmin && <span className="text-[10px] bg-green-900 text-green-200 px-1 py-0.5 rounded uppercase tracking-wider">Admin</span>}
            </div>
            
            <div className="flex gap-2 items-center">
               {currentUserId === user.id && (
                  <div className="relative group/finish flex items-center">
                      <button
                        onClick={handleToggleFinishedLocal}
                        disabled={pendingId === `toggle-finished-${user.id}`}
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded border transition-colors flex items-center gap-1 ${user.hasFinishedAdding ? 'bg-green-600 text-white border-green-500 hover:bg-green-500' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700 hover:text-white'} ${pendingId === `toggle-finished-${user.id}` ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                          {pendingId === `toggle-finished-${user.id}` && (
                            <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {user.hasFinishedAdding ? 'Reabrir' : 'Finalizar?'}
                      </button>
                      
                      {/* Tooltip for Desktop Hover */}
                      <div className="hidden md:block absolute bottom-full right-0 mb-2 w-56 bg-slate-800 text-slate-200 text-xs rounded p-3 border border-slate-600 shadow-xl opacity-0 group-hover/finish:opacity-100 transition-opacity z-20 pointer-events-none">
                          <p className="font-semibold text-green-400 mb-1">Para que serve?</p>
                          <p>
                            Sinalize aos outros participantes que você já lançou todas suas despesas. 
                            Assim, todos saberão que o saldo é final e podem prosseguir com os pagamentos.
                          </p>
                          <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-800 border-b border-r border-slate-600 rotate-45"></div>
                      </div>
                  </div>
               )}

               {isAdmin && !user.isAdmin && (
                <div className="relative group/tooltip">
                  <button
                    onClick={() => onResetPin(user.id)}
                    disabled={pendingId === `reset-pin-${user.id}`}
                    className="text-amber-500 hover:text-amber-400 text-xs mr-2 border border-amber-500/30 px-2 py-0.5 rounded hover:bg-amber-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {pendingId === `reset-pin-${user.id}` ? (
                        <svg className="animate-spin h-3 w-3 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        'Resetar PIN'
                    )}
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
                  disabled={pendingId === `remove-user-${user.id}`}
                  className="text-red-400 hover:text-red-300 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={user.id === currentUserId ? "Sair do grupo" : "Remover usuário"}
                >
                  {pendingId === `remove-user-${user.id}` ? (
                     <svg className="animate-spin h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                  ) : (
                     '✕'
                  )}
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