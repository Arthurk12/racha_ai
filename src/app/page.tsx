'use client'

import { createGroup } from './actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    groupName: '',
    adminName: '',
    adminPin: ''
  })
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    
    if (formData.adminPin.length < 4) {
      alert('PIN deve ter 4 dígitos')
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
        alert('Erro ao criar grupo: Retorno vazio do servidor.')
      }
    } catch (error) {
      console.error(error)
      setIsPending(false)
      alert('Erro grave ao criar grupo. Verifique o console ou os logs.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-400">Racha AI</h1>
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
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-400"
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
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-white placeholder-slate-400"
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
        </form>
      </div>
    </div>
  )
}