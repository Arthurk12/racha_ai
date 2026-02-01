'use client'

import { useState, useEffect } from 'react'
import UserList from '@/components/UserList'
import ExpenseList from '@/components/ExpenseList'
import ExpenseHistory from '@/components/ExpenseHistory'
import BalanceSummary from '@/components/BalanceSummary'
import { addUser, removeUser, addExpense, removeExpense, updateExpense, verifyUser, resetUserPin, updateUserPin, deleteGroup } from '@/app/actions'
import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface User {
  id: string
  name: string
  isAdmin: boolean
}

interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  date: string
  participants: string[]
}

interface GroupClientProps {
  groupId: string
  groupName: string
  users: User[]
  expenses: Expense[]
}

export default function GroupClient({ groupId, groupName, users, expenses }: GroupClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justCreated = searchParams.get('created') === 'true'
  
  let [isPending, startTransition] = useTransition()
  let [isAddingExpense, startAddingExpense] = useTransition()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Auth state local to the modal
  const [authName, setAuthName] = useState('')
  const [authPin, setAuthPin] = useState('')
  const [authError, setAuthError] = useState('')
  const [selectedExistingUserId, setSelectedExistingUserId] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [prevExpenseCount, setPrevExpenseCount] = useState(expenses.length)

  useEffect(() => {
    if (expenses.length > prevExpenseCount) {
        // Use a more reliable sound source (Cash Register Kaching)
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3')
        audio.volume = 0.5
        audio.play().catch(console.error)
    }
    setPrevExpenseCount(expenses.length)
  }, [expenses.length, prevExpenseCount])

  useEffect(() => {
    setInviteLink(window.location.href)
    const storedUserId = localStorage.getItem(`racha_ai_user_${groupId}`)
    if (storedUserId && users.find(u => u.id === storedUserId)) {
      setCurrentUserId(storedUserId)
      setShowAuthModal(false)
    } else {
      setShowAuthModal(true)
    }
    setIsCheckingAuth(false)
  }, [groupId, users])

  const currentUser = users.find(u => u.id === currentUserId)
  const isCurrentUserAdmin = currentUser?.isAdmin || false

  const handleJoin = async () => {
    setAuthError('')
    
    if (selectedExistingUserId) {
      if (!authPin || authPin.length < 4) {
        setAuthError('Digite o PIN de 4 dígitos')
        return
      }

      startTransition(async () => {
        const isValid = await verifyUser(selectedExistingUserId, authPin)
        if (isValid) {
          localStorage.setItem(`racha_ai_user_${groupId}`, selectedExistingUserId)
          setCurrentUserId(selectedExistingUserId)
          setShowAuthModal(false)
          setAuthPin('')
        } else {
          setAuthError('PIN incorreto')
        }
      })
      return
    }

    if (authName.trim()) {
       if (!authPin || authPin.length < 4) {
        setAuthError('Crie um PIN de 4 dígitos')
        return
      }

      const formData = new FormData()
      formData.append('name', authName.trim())
      formData.append('pin', authPin)
      
      startTransition(async () => {
        const result: any = await addUser(groupId, formData)
        if (result.error) {
          setAuthError(result.error)
        } else if (result.user) {
          localStorage.setItem(`racha_ai_user_${groupId}`, result.user.id)
          setCurrentUserId(result.user.id)
          setShowAuthModal(false)
          setAuthPin('')
        }
      })
    }
  }

  const handleAddUser = (name: string) => {
    // Legacy support or distinct implementation if needed. 
    // Currently users add themselves via modal.
  }

  const handleRemoveUser = (userId: string) => {
    if (userId === currentUserId) {
      localStorage.removeItem(`racha_ai_user_${groupId}`)
      setCurrentUserId(null)
      setShowAuthModal(true)
      router.push('/')
    }
    // Pass currentUserId as the requester
    if (currentUserId) {
        startTransition(async () => {
          await removeUser(groupId, userId, currentUserId)
        })
    }
  }

  const handleResetPin = (targetUserId: string) => {
    if (currentUserId && confirm('Resetar PIN para 0000?')) {
        startTransition(async () => {
          await resetUserPin(groupId, targetUserId, currentUserId)
        })
    }
  }

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    const formData = new FormData()
    formData.append('description', expense.description)
    formData.append('amount', expense.amount.toString())
    formData.append('paidBy', expense.paidBy)
    formData.append('date', expense.date)
    expense.participants.forEach(p => formData.append('participants', p))
    
    startAddingExpense(() => addExpense(groupId, formData))
  }

  const handleRemoveExpense = (expenseId: string) => {
    startTransition(() => removeExpense(groupId, expenseId))
  }

  const handleUpdateExpense = (expenseId: string, data: { description: string, amount: number, date: string, participants: string[] }) => {
    if (currentUserId) {
        const formData = new FormData()
        formData.append('description', data.description)
        formData.append('amount', data.amount.toString())
        formData.append('date', data.date)
        data.participants.forEach(p => formData.append('participants', p))
        
        startTransition(async () => {
            const result: any = await updateExpense(groupId, expenseId, formData, currentUserId)
            if (result.error) {
                alert(result.error)
            }
        })
    }
  }

  const handleChangePin = () => {
    if (newPin.length < 4) {
      alert('PIN deve ter 4 dígitos')
      return
    }
    if (currentUserId) {
        startTransition(async () => {
            await updateUserPin(groupId, currentUserId, newPin)
            setShowPinModal(false)
            setNewPin('')
            alert('PIN alterado com sucesso!')
        })
    }
  }

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-green-400">Carregando...</div>
  }

  // Se não estiver autenticado/selecionado, mostra apenas a "Landing do Grupo" (Modal Centralizado)
  // O fundo é escuro para focar na entrada.
  if (showAuthModal) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
             <div className="bg-slate-800 p-8 rounded-lg shadow-2xl max-w-md w-full border border-slate-700">
            <h1 className="text-3xl font-bold mb-2 text-center text-green-400 flex items-center justify-center gap-2">
                <img src="/icon" alt="Logo" className="w-8 h-8 rounded-full shadow-sm" />
                Racha AI
            </h1>
            <p className="text-center text-slate-400 mb-6">Você foi convidado para o grupo <span className="text-slate-200 font-semibold">{groupName}</span></p>
            
            <h2 className="text-xl font-bold mb-4 text-center text-white">Quem é você?</h2>
            
            {users.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-slate-300 font-medium">Já estou no grupo:</p>
                <select 
                  value={selectedExistingUserId}
                  onChange={(e) => {
                    setSelectedExistingUserId(e.target.value)
                    setAuthName('')
                    setAuthPin('')
                    setAuthError('')
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded mb-2 text-white outline-none focus:ring-2 focus:ring-green-400 font-sans"
                >
                  <option value="">Selecione seu nome...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <p className="mb-2 text-slate-300 font-medium">{users.length > 0 ? 'Ou sou novo aqui:' : 'Digite seu nome para começar:'}</p>
              <input
                type="text"
                placeholder="Seu nome"
                value={authName}
                onChange={(e) => {
                  setAuthName(e.target.value)
                  setSelectedExistingUserId('')
                  setAuthPin('')
                  setAuthError('')
                }}
                disabled={!!selectedExistingUserId}
                className={`w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white outline-none focus:ring-2 focus:ring-green-400 placeholder-slate-500 ${selectedExistingUserId ? 'opacity-50' : ''}`}
              />
            </div>
            
            <div className="mb-6">
               <p className="mb-2 text-slate-300 font-medium">
                 {selectedExistingUserId ? 'Digite seu PIN:' : 'Crie um PIN (4 dígitos):'}
               </p>
               <input
                type="password"
                placeholder="****"
                maxLength={4}
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white outline-none focus:ring-2 focus:ring-green-400 placeholder-slate-500 tracking-widest text-center text-xl"
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
              {authError && <p className="text-red-400 text-sm mt-2 font-medium">{authError}</p>}
            </div>

            <button
              onClick={handleJoin}
              disabled={(!authName.trim() && !selectedExistingUserId) || authPin.length < 4}
              className="w-full bg-green-500 text-slate-900 py-2 rounded hover:bg-green-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-bold text-lg"
            >
              {isPending ? 'Entrando...' : (selectedExistingUserId ? 'Entrar' : 'Entrar no Grupo')}
            </button>
          </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 relative">
      {/* Pin Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full border border-slate-700">
                <h3 className="text-xl font-bold mb-4 text-white">Trocar meu PIN</h3>
                <input
                    type="password"
                    maxLength={4}
                    placeholder="Novo PIN (4 dígitos)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white mb-4 text-center text-xl tracking-widest"
                />
                <div className="flex gap-2">
                    <button onClick={() => setShowPinModal(false)} className="flex-1 bg-slate-600 text-white py-2 rounded">Cancelar</button>
                    <button onClick={handleChangePin} className="flex-1 bg-green-600 text-white py-2 rounded disabled:opacity-50" disabled={newPin.length < 4}>Salvar</button>
                </div>
            </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h1 className="text-3xl font-bold mb-1 text-green-400 flex items-center gap-2">
                <img src="/icon" alt="Logo" className="w-8 h-8 rounded-full shadow-sm" />
                Racha AI
             </h1>
             <h2 className="text-xl text-slate-400">Grupo: <span className="text-slate-200">{groupName}</span></h2>
           </div>
           {currentUserId && (
             <div className="flex gap-2 items-center">
                 {!justCreated && (
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href.split('?')[0])
                            alert('Link copiado!')
                        }}
                        className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded border border-slate-600 transition-colors flex items-center gap-1"
                        title="Copiar Link de Convite"
                    >
                        🔗 <span className="hidden sm:inline">Copiar Link</span>
                    </button>
                 )}
                 <button
                    onClick={() => setShowPinModal(true)}
                    className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded border border-slate-600 transition-colors"
                 >
                    🔑 <span className="hidden sm:inline">Alterar PIN</span>
                 </button>
                 <button 
                onClick={() => {
                    localStorage.removeItem(`racha_ai_user_${groupId}`)
                    setCurrentUserId(null)
                    // setShowAuthModal(true) // Removed to redirect instead
                    router.push('/')
                }}
                className="text-sm text-red-400 hover:text-red-300 hover:underline ml-2"
                >
                Sair
                </button>
             </div>
           )}
        </div>

        {/* Invite Link Header - Only shows if just created */}
        {justCreated && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-8 flex flex-col md:flex-row items-stretch gap-4 shadow-sm relative animate-fade-in">
          <div className="flex-1 w-full flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-1">
                <p className="text-green-400 text-sm font-bold uppercase tracking-wider">Grupo Criado com Sucesso!</p>
             </div>
             <p className="text-slate-400 text-sm mb-1 font-medium">Convide amigos enviando este link:</p>
             <div className="bg-slate-900 px-3 py-2 rounded border border-slate-600 flex items-center justify-between h-10">
                <span className="text-green-300 font-mono text-sm truncate mr-2">{inviteLink.split('?')[0]}</span>
             </div>
          </div>
          <div className="flex flex-col justify-end">
            <button
                onClick={() => {
                if (inviteLink) {
                    navigator.clipboard.writeText(inviteLink.split('?')[0])
                    setLinkCopied(true)
                    setTimeout(() => setLinkCopied(false), 2000)
                }
                }}
                className={`whitespace-nowrap font-medium px-4 h-10 rounded transition-all shadow-md active:scale-95 transform flex items-center justify-center min-w-[120px] ${
                    linkCopied ? 'bg-green-600 text-white' : 'bg-green-500 hover:bg-green-400 text-slate-900'
                }`}
            >
                {linkCopied ? 'Copiado! ✓' : 'Copiar Link'}
            </button>
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <UserList 
              users={users} 
              addUser={handleAddUser} 
              removeUser={handleRemoveUser} 
              isAdmin={isCurrentUserAdmin}
              currentUserId={currentUserId}
              onResetPin={handleResetPin}
            />
            {isPending && <p className="text-sm text-green-400 mb-2 animate-pulse">Atualizando...</p>}
            <ExpenseList 
              users={users} 
              expenses={expenses} 
              addExpense={handleAddExpense} 
              removeExpense={handleRemoveExpense} 
              currentUserId={currentUserId}
              isPending={isAddingExpense}
              isAdmin={isCurrentUserAdmin}
            />
          </div>
          <div className="flex flex-col gap-6">
            <BalanceSummary users={users} expenses={expenses} />
            
            <ExpenseHistory 
                users={users} 
                expenses={expenses} 
                removeExpense={handleRemoveExpense}               updateExpense={handleUpdateExpense}                currentUserId={currentUserId}
                isAdmin={isCurrentUserAdmin}
            />
          </div>
        </div>
        {isCurrentUserAdmin && (
             <div className="mt-8 pt-6 border-t border-slate-700">
               <h3 className="text-lg font-bold text-red-500 mb-2">Zona de Perigo (Admin)</h3>
               <button
                 onClick={() => {
                   if (confirm('Tem certeza? Isso apagará o grupo e todas as despesas permanentemente.')) {
                      if (currentUserId) {
                       startTransition(async () => {
                         const res = await deleteGroup(groupId, currentUserId)
                         if (res && res.success) {
                           router.push('/?groupClosed=true')
                         } else {
                           alert('Erro ao excluir grupo.')
                         }
                       })
                      }
                   }
                 }}
                 className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-2 rounded hover:bg-red-900 transition-colors text-sm"
               >
                 ⚠️ Encerrar e Excluir Grupo
               </button>
             </div>
        )}

        <footer className="mt-12 text-center text-slate-500 text-xs py-4 border-t border-slate-800">
            <p>Grupos inativos por mais de 30 dias serão automaticamente removidos.</p>
            <p>Projeto Vibecoded © 2026</p>
        </footer>
      </div>
    </div>
  )
}