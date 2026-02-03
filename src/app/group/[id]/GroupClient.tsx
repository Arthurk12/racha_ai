'use client'

import { useState, useEffect } from 'react'
import UserList from '@/components/UserList'
import ExpenseList from '@/components/ExpenseList'
import ExpenseHistory from '@/components/ExpenseHistory'
import BalanceSummary from '@/components/BalanceSummary'
import CustomSelect from '@/components/CustomSelect'
import { addUser, removeUser, addExpense, removeExpense, updateExpense, verifyUser, resetUserPin, updateUserPin, deleteGroup, toggleUserFinishedState } from '@/app/actions'
import { useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'

interface User {
  id: string
  name: string
  isAdmin: boolean
  hasFinishedAdding: boolean
  isDefaultPin?: boolean
}

interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  date: string
  participants: string[]
  isSettlement?: boolean
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
  const pathname = usePathname()
  const justCreated = searchParams.get('created') === 'true'
  
  let [isPending, startTransition] = useTransition()
  let [isAddingExpense, startAddingExpense] = useTransition()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  
  // Notification & Confirmation State
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{ message: string, onConfirm: () => void } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setNotification({ message, type })
      setTimeout(() => setNotification(null), 3000)
  }

  const requestConfirm = (message: string, onConfirm: () => void) => {
      setConfirmConfig({ message, onConfirm })
  }

  // Auth state local to the modal
  const [authName, setAuthName] = useState('')
  const [authPin, setAuthPin] = useState('')
  const [authError, setAuthError] = useState('')
  const [selectedExistingUserId, setSelectedExistingUserId] = useState('')
  const [authMode, setAuthMode] = useState<'existing' | 'new'>('existing') // 'existing' | 'new'
  const [inviteLink, setInviteLink] = useState('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [prevExpenseCount, setPrevExpenseCount] = useState(expenses.length)

  // Polling e Eventos para atualização automática
  useEffect(() => {
    const handleRefresh = () => {
        if (!document.hidden) {
            startTransition(() => {
                router.refresh()
            })
        }
    }

    // Atualiza a cada 4 segundos
    const interval = setInterval(handleRefresh, 4000)

    // Atualiza imediatamente ao focar ou reabrir a aba
    const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            handleRefresh()
        }
    }
    
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', handleRefresh)

    return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', onVisibilityChange)
        window.removeEventListener('focus', handleRefresh)
    }
  }, [router])

  useEffect(() => {
    if (expenses.length > prevExpenseCount) {
        // Use local sound asset for better performance
        const audio = new Audio('/sounds/cash-register.mp3')
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

  const allFinished = users.length > 1 && users.every(u => u.hasFinishedAdding)

  const handleJoin = async () => {
    setAuthError('')
    if (authMode === 'existing') {
        if (!selectedExistingUserId) {
            setAuthError('Selecione seu nome')
            return
        }
        
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
    } else {
        // Mode 'new'
        if (!authName.trim()) {
             setAuthError('Digite seu nome')
             return
        }
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

  const handleRemoveUser = (userId: string) => {
    const isRemovingSelf = userId === currentUserId
    const message = isRemovingSelf 
        ? 'Tem certeza que deseja sair do grupo? Isso removerá seu usuário e todos os registros associados.' 
        : 'Tem certeza que deseja remover este participante?'

    // Pass currentUserId as the requester
    if (currentUserId) {
        requestConfirm(message, () => {
             if (isRemovingSelf) {
                localStorage.removeItem(`racha_ai_user_${groupId}`)
                setCurrentUserId(null)
                setShowAuthModal(true)
                router.push('/')
             }
             
             setPendingId(`remove-user-${userId}`)
             startTransition(async () => {
                await removeUser(groupId, userId, currentUserId)
                setPendingId(null)
             })
        })
    }
  }

  const handleToggleFinished = (userId: string) => {
      setPendingId(`toggle-finished-${userId}`)
      startTransition(async () => {
          await toggleUserFinishedState(groupId, userId)
          setPendingId(null)
      })
  }

  const handleResetPin = (targetUserId: string) => {
    if (currentUserId) {
        requestConfirm('Resetar PIN para 0000?', () => {
             setPendingId(`reset-pin-${targetUserId}`)
             startTransition(async () => {
                await resetUserPin(groupId, targetUserId, currentUserId)
                showToast('PIN resetado para 0000', 'success')
                setPendingId(null)
             })
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
    setPendingId(`remove-expense-${expenseId}`)
    startTransition(async () => {
        await removeExpense(groupId, expenseId)
        setPendingId(null)
    })
  }

  const handleUpdateExpense = (expenseId: string, data: { description: string, amount: number, date: string, participants: string[] }) => {
    if (currentUserId) {
        const formData = new FormData()
        formData.append('description', data.description)
        formData.append('amount', data.amount.toString())
        formData.append('date', data.date)
        data.participants.forEach(p => formData.append('participants', p))
        
        setPendingId(`update-expense-${expenseId}`)
        startTransition(async () => {
            const result: any = await updateExpense(groupId, expenseId, formData, currentUserId)
            setPendingId(null)
            if (result.error) {
                showToast(result.error, 'error')
            } else {
                showToast('Despesa atualizada', 'success')
            }
        })
    }
  }

  const handleChangePin = () => {
    if (newPin.length < 4) {
      showToast('PIN deve ter 4 dígitos', 'error')
      return
    }
    if (currentUserId) {
        startTransition(async () => {
            await updateUserPin(groupId, currentUserId, newPin)
            setShowPinModal(false)
            setNewPin('')
            showToast('PIN alterado com sucesso!', 'success')
        })
    }
  }

  if (isCheckingAuth) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center overflow-hidden relative">
            <div className="text-center z-10 p-8 bg-slate-800/80 backdrop-blur-sm rounded-xl border border-green-500/30 shadow-2xl flex flex-col items-center">
                <div className="text-4xl mb-4 animate-bounce">🪙</div>
                <p className="text-green-400 font-bold text-lg animate-pulse">Contando as moedas...</p>
            </div>
            
            {/* Falling Coins Background */}
            <div className="absolute inset-0 pointer-events-none">
                {[
                    { left: '10%', dur: '3.5s', del: '0s', icon: '🪙' },
                    { left: '30%', dur: '4.2s', del: '1.5s', icon: '💰' },
                    { left: '50%', dur: '3.0s', del: '0.5s', icon: '💸' },
                    { left: '70%', dur: '4.5s', del: '2.0s', icon: '🪙' },
                    { left: '90%', dur: '3.8s', del: '1.0s', icon: '💰' },
                    { left: '20%', dur: '5.0s', del: '2.5s', icon: '💸' },
                    { left: '60%', dur: '3.2s', del: '3.0s', icon: '🪙' },
                    { left: '80%', dur: '4.0s', del: '0.8s', icon: '💰' },
                    { left: '40%', dur: '2.8s', del: '1.8s', icon: '💸' },
                    { left: '15%', dur: '4.8s', del: '3.5s', icon: '🪙' },
                ].map((coin, i) => (
                    <div 
                        key={i}
                        className="absolute -top-10 text-2xl animate-fall opacity-0"
                        style={{
                            left: coin.left,
                            animationDuration: coin.dur,
                            animationDelay: coin.del,
                        }}
                    >
                        {coin.icon}
                    </div>
                ))}
            </div>
        </div>
    )
  }

  // Se não estiver autenticado/selecionado, mostra apenas a "Landing do Grupo" (Modal Centralizado)
  // O fundo é escuro para focar na entrada.
  if (showAuthModal) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
             <div className="bg-slate-800 p-8 rounded-lg shadow-2xl max-w-md w-full border border-slate-700">
            <h1 className="text-3xl font-bold mb-2 text-center text-green-400 flex items-center justify-center gap-2">
                <Image src="/icon" alt="Logo" width={32} height={32} className="rounded-full shadow-sm" />
                Racha AI
            </h1>
            <p className="text-center text-slate-400 mb-6">Você foi convidado para o grupo <span className="text-slate-200 font-semibold">{groupName}</span></p>

            <h2 className="text-xl font-bold mb-6 text-center text-white">Quem é você?</h2>
            
            <div className="space-y-4">
                {/* Accordion Item 1: Existing User */}
                <div className={`border ${authMode === 'existing' ? 'border-green-500/50 bg-slate-700/50' : 'border-slate-700 bg-slate-800'} rounded-lg transition-all ${authMode === 'existing' ? 'overflow-visible' : 'overflow-hidden'}`}>
                    <button 
                        onClick={() => {
                            setAuthMode('existing')
                            setAuthError('')
                            setAuthPin('')
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none"
                    >
                         <span className={`font-medium ${authMode === 'existing' ? 'text-green-400' : 'text-slate-400'}`}>Já estou no grupo</span>
                         <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${authMode === 'existing' ? 'border-green-400' : 'border-slate-500'}`}>
                              {authMode === 'existing' && <div className="w-2 h-2 bg-green-400 rounded-full" />}
                         </div>
                    </button>
                    
                    {authMode === 'existing' && (
                        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                             <p className="text-xs text-slate-400 mb-2">Selecione seu nome e digite seu PIN.</p>
                             {users.length > 0 ? (
                                <CustomSelect 
                                    value={selectedExistingUserId}
                                    onChange={(val) => {
                                        setSelectedExistingUserId(val)
                                        setAuthError('')
                                    }}
                                    options={users}
                                    placeholder="Selecione seu nome..."
                                    className="mb-3"
                                />
                             ) : (
                                 <p className="text-sm text-yellow-500 mb-3 bg-yellow-900/20 p-2 rounded border border-yellow-900/50">
                                     Ainda não há ninguém no grupo. Use a opção abaixo para entrar.
                                 </p>
                             )}

                             <input
                                type="password"
                                placeholder="Seu PIN (4 dígitos)"
                                maxLength={4}
                                value={authPin}
                                onChange={(e) => setAuthPin(e.target.value)}
                                disabled={!selectedExistingUserId && users.length > 0}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white outline-none focus:ring-1 focus:ring-green-400 placeholder-slate-600 tracking-widest text-center"
                                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                            />
                        </div>
                    )}
                </div>

                {/* Accordion Item 2: New User */}
                <div className={`border ${authMode === 'new' ? 'border-green-500/50 bg-slate-700/50' : 'border-slate-700 bg-slate-800'} rounded-lg transition-all overflow-hidden`}>
                    <button 
                        onClick={() => {
                            setAuthMode('new')
                            setAuthError('')
                            setAuthPin('')
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none"
                    >
                         <span className={`font-medium ${authMode === 'new' ? 'text-green-400' : 'text-slate-400'}`}>Sou novo aqui</span>
                         <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${authMode === 'new' ? 'border-green-400' : 'border-slate-500'}`}>
                              {authMode === 'new' && <div className="w-2 h-2 bg-green-400 rounded-full" />}
                         </div>
                    </button>
                    
                    {authMode === 'new' && (
                        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                            <p className="text-xs text-slate-400 mb-2">Crie seu perfil e defina um PIN de acesso.</p>
                   <input
                                type="text"
                                placeholder="Seu Nome"
                                value={authName}
                                onChange={(e) => setAuthName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded mb-3 text-white outline-none focus:ring-1 focus:ring-green-400 placeholder-slate-600"
                                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                            />
                             <input
                                type="password"
                                placeholder="Crie um PIN (4 dígitos)"
                                maxLength={4}
                                value={authPin}
                                onChange={(e) => setAuthPin(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white outline-none focus:ring-1 focus:ring-green-400 placeholder-slate-600 tracking-widest text-center"
                                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                            />
                        </div>
                    )}
                </div>
            </div>

            {authError && <p className="text-red-400 text-sm mt-4 font-medium text-center bg-red-900/20 p-2 rounded border border-red-900/30">{authError}</p>}

            <button
              onClick={handleJoin}
              disabled={
                  (authMode === 'existing' && (!selectedExistingUserId || authPin.length < 4)) ||
                  (authMode === 'new' && (!authName.trim() || authPin.length < 4))
              }
              className="w-full bg-green-500 text-slate-900 py-3 rounded hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all font-bold text-lg mt-6 shadow-lg"
            >
              {isPending ? 'Entrando...' : 'Entrar no Grupo'}
            </button>
          </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 relative">
      {/* Default PIN Warning Overlay */}
      {currentUser?.isDefaultPin && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 px-4">
             <div className="bg-slate-800/95 border border-amber-500/50 p-6 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.2)] max-w-sm w-full text-center pointer-events-auto backdrop-blur-md animate-in zoom-in duration-300">
                 <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border border-amber-500/20 shadow-inner">
                    ⚠️
                 </div>
                 <h3 className="text-white font-bold text-lg mb-2">Troque sua Senha</h3>
                 <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                    Sua conta está usando o PIN padrão <span className="font-mono text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-500/30">0000</span>. 
                    Por segurança, defina uma nova senha agora mesmo.
                 </p>
                 <div className="text-xs text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-700/50">
                    Clique em <span className="text-amber-400 font-semibold">🔑 Alterar PIN</span> no topo direito da tela.
                 </div>
             </div>
          </div>
      )}

      {/* Pin Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-slate-800 p-6 rounded-xl shadow-2xl max-w-sm w-full border border-slate-600 animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold mb-4 text-white">Trocar meu PIN</h3>
                <input
                    type="password"
                    maxLength={4}
                    placeholder="Novo PIN (4 dígitos)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white mb-4 text-center text-xl tracking-widest outline-none focus:ring-2 focus:ring-green-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleChangePin()}
                />
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowPinModal(false)} 
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleChangePin} 
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold" 
                        disabled={newPin.length < 4}
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h1 className="text-3xl font-bold mb-1 text-green-400 flex items-center gap-2">
                <Image src="/icon" alt="Logo" width={32} height={32} className="rounded-full shadow-sm" />
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
                            showToast('Link copiado!', 'success')
                        }}
                        className="text-sm bg-slate-800 hover:bg-slate-700 text-white md:px-3 md:py-1 px-4 py-2 rounded border border-slate-600 transition-colors flex items-center gap-1"
                        title="Copiar Link de Convite"
                    >
                        🔗 <span className="hidden sm:inline">Copiar Link</span>
                    </button>
                 )}
                 <button
                    onClick={() => setShowPinModal(true)}
                    className="text-sm bg-slate-800 hover:bg-slate-700 text-white md:px-3 md:py-1 px-4 py-2 rounded border border-slate-600 transition-colors"
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
                className="text-sm text-red-400 hover:text-red-300 hover:underline ml-2 md:p-1 p-2"
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
                    setTimeout(() => {
                        setLinkCopied(false)
                        const params = new URLSearchParams(searchParams.toString())
                        params.delete('created')
                        router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname)
                    }, 3000)
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

        {/* Banner de Todos Finalizados */}
        {allFinished && (
            <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/50 p-4 rounded-lg mb-8 text-center animate-in zoom-in duration-300 shadow-lg shadow-green-900/20">
                <p className="text-green-300 font-bold text-lg flex items-center justify-center gap-2">
                    <span>🎉</span> Grupo Fechado!
                </p>
                <p className="text-green-400/80 text-sm">Todos os participantes marcaram que finalizaram seus lançamentos.</p>
                <p className="text-xs text-green-500/60 mt-1">Os saldos abaixo são finais. Podem prosseguir com os pagamentos.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="contents md:flex md:flex-col md:gap-6">
            <div className="order-1">
              <BalanceSummary users={users} expenses={expenses} currentUserId={currentUserId} onConfirm={requestConfirm} />
            </div>
            
            <div className="order-3">
              <ExpenseHistory 
                  users={users} 
                  expenses={expenses} 
                  removeExpense={handleRemoveExpense} 
                  updateExpense={handleUpdateExpense} 
                  currentUserId={currentUserId}
                  isAdmin={isCurrentUserAdmin}
                  onShowToast={showToast}
                  pendingId={pendingId}
              />
            </div>
          </div>
          <div className="contents md:flex md:flex-col md:gap-6">
            <div className="order-2">
              <ExpenseList 
                users={users} 
                expenses={expenses} 
                addExpense={handleAddExpense} 
                removeExpense={handleRemoveExpense} 
                currentUserId={currentUserId}
                isPending={isAddingExpense}
                isAdmin={isCurrentUserAdmin}
                onShowToast={showToast}
                onToggleFinished={handleToggleFinished}
                hasFinishedAdding={currentUser?.hasFinishedAdding}
              />
            </div>
            <div className="order-4">
              <UserList 
                users={users} 
                removeUser={handleRemoveUser} 
                isAdmin={isCurrentUserAdmin}
                currentUserId={currentUserId}
                onResetPin={handleResetPin}
                onToggleFinished={handleToggleFinished}
                onInfo={(msg) => showToast(msg, 'info')}
                pendingId={pendingId}
              />
            </div>
          </div>
        </div>
        {isCurrentUserAdmin && (
             <div className="mt-8 pt-6 border-t border-slate-700">
               <h3 className="text-lg font-bold text-red-500 mb-2">Zona de Perigo (Admin)</h3>
               <button
                 onClick={() => {
                   requestConfirm('Tem certeza? Isso apagará o grupo e todas as despesas permanentemente.', () => {
                      if (currentUserId) {
                       startTransition(async () => {
                         const res = await deleteGroup(groupId, currentUserId)
                         if (res && res.success) {
                           router.push('/?groupClosed=true')
                         } else {
                           showToast('Erro ao excluir grupo.', 'error')
                         }
                       })
                      }
                   })
                 }}
                 className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-2 rounded hover:bg-red-900 transition-colors text-sm"
               >
                 ⚠️ Encerrar e Excluir Grupo
               </button>
             </div>
        )}

        <footer className="mt-12 text-center text-slate-500 text-xs py-4 border-t border-slate-800 flex flex-col items-center gap-4">
            <div>
                <p>Grupos inativos por mais de 30 dias serão automaticamente removidos.</p>
                <p>Projeto Vibecoded © 2026</p>
            </div>
            
            <div className="flex gap-4">
                <a 
                    href="https://github.com/arthurk12/racha_ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-full border border-slate-700 transition-colors text-xs font-medium"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    <span>GitHub</span>
                </a>
                
                <a 
                    href="https://github.com/arthurk12/racha_ai/issues/new" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 px-4 py-2 rounded-full border border-slate-700 transition-colors text-xs font-medium"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span>Reportar Bug</span>
                </a>
            </div>
        </footer>

        {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 ${
            notification.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' :
            notification.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' :
            'bg-slate-800/90 border-slate-600 text-slate-100'
        }`}>
            {notification.type === 'success' && <span>✅</span>}
            {notification.type === 'error' && <span>❌</span>}
            {notification.type === 'info' && <span>ℹ️</span>}
            <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-white mb-2">Confirmação</h3>
                <p className="text-slate-300 mb-6">{confirmConfig.message}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setConfirmConfig(null)}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => {
                            confirmConfig.onConfirm()
                            setConfirmConfig(null)
                        }}
                        autoFocus
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
      )}
      </div>
    </div>
  )
}