'use client'

import { createGroup } from './actions'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showExitModal, setShowExitModal] = useState(false)

  useEffect(() => {
    if (searchParams.get('groupClosed') === 'true') {
        setShowExitModal(true)
        // Clean URL without refresh
        router.replace('/')
    }
  }, [searchParams, router])

  const [formData, setFormData] = useState({
    groupName: '',
    adminName: '',
    adminPin: ''
  })
  const [isPending, setIsPending] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
      setErrorToast(msg)
      setTimeout(() => setErrorToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    
    if (formData.adminPin.length < 4) {
      showToast('PIN deve ter 4 dígitos')
      setIsPending(false)
      return
    }

    try {
      const result = await createGroup(formData.groupName, formData.adminName, formData.adminPin)
      
      if (result) {
        localStorage.setItem(`racha_ai_user_${result.groupId}`, result.adminId)
        router.push(`/group/${result.groupId}?created=true`)
      } else {
        setIsPending(false)
        showToast('Erro ao criar grupo: Tente novamente.')
      }
    } catch (error) {
      console.error(error)
      setIsPending(false)
      showToast('Erro de conexão. Verifique sua internet.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative">
       {/* Error Toast */}
       {errorToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl border bg-red-900/90 border-red-500 text-red-100 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
              <span>⚠️</span>
              <span className="font-medium text-sm">{errorToast}</span>
          </div>
       )}

      {/* Success Modal for Group Closure */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-800 border border-green-500/30 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
            
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-400 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Grupo Encerrado!</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              Obrigado por usar o <span className="text-green-400 font-semibold">Racha AI</span>. 
              <br/>
              Esperamos ter ajudado a organizar suas despesas!
            </p>

            <button
              onClick={() => setShowExitModal(false)}
              className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Começar Novo Grupo
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-400 flex items-center justify-center gap-2">
            <Image src="/icon" alt="Logo" width={32} height={32} className="rounded-full shadow-sm" />
            Racha AI
        </h1>
        <p className="text-center text-slate-300 mb-8">
          Divida despesas com amigos de forma simples e sem login.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-slate-300 mb-1">
              Nome do Grupo / Evento
            </label>
            <input
              type="text"
              id="groupName"
              value={formData.groupName}
              onChange={(e) => setFormData({...formData, groupName: e.target.value})}
              placeholder="Ex: Churrasco de Domingo"
              required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-400 font-sans"
            />
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-sm font-medium text-green-400 mb-3">Seus Dados (Administrador)</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="adminName" className="block text-sm font-medium text-slate-300 mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                  placeholder="Ex: João Silva"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-400 font-sans"
                />
              </div>
              <div>
                <label htmlFor="adminPin" className="block text-sm font-medium text-slate-300 mb-1">
                  Crie um PIN (4 dígitos)
                </label>
                <input
                  type="password"
                  id="adminPin"
                  value={formData.adminPin}
                  onChange={(e) => setFormData({...formData, adminPin: e.target.value})}
                  placeholder="****"
                  maxLength={4}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-400 tracking-widest"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Você usará este PIN para administrar o grupo.
                </p>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-green-500 text-slate-900 font-bold py-2 px-4 rounded-md hover:bg-green-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
          >
           {isPending ? 'Criando...' : 'Criar Grupo'}
          </button>
          
          <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              ⚠️ <span className="font-medium text-slate-400">Procurando um grupo específico?</span><br/>
              Para entrar em um grupo existente, você precisa do <strong>link de convite</strong>. Peça para seus amigos compartilharem com você e acesse pelo link.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}