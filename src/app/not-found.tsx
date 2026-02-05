'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function NotFound() {
  const [message, setMessage] = useState({ text: 'Carregando...', emoji: '🤔' })

  useEffect(() => {
    const messages = [
      { text: "Eita! Esse grupo sumiu mais rápido que salário na conta.", emoji: "💸" },
      { text: "404: O grupo foi dali na esquina e já volta (mentira, não volta).", emoji: "🏃‍♂️" },
      { text: "Parece que você digitou errado... ou foi o gato andando no teclado?", emoji: "🐈" },
      { text: "Opa! Não tem nada aqui. Nem fiado só amanhã.", emoji: "🚫" },
      { text: "Esse link é mais falso que 'só vou tomar uma'.", emoji: "🍺" },
      { text: "Nada por aqui... Só o eco. (eco) (eco)...", emoji: "🗣️" },
      { text: "Esse grupo visualizou e não respondeu.", emoji: "👀" },
      { text: "Vixi! Deu ruim. Chama o síndico!", emoji: "📢" },
      { text: "Foi de arrasta pra cima.", emoji: "💀" },
      { text: "Esse grupo tá mais perdido que azeitona em boca de banguelo.", emoji: "🦷" },
      { text: "Se esse link fosse um boleto, já tinha vencido.", emoji: "🧾" },
    ]
    const randomIndex = Math.floor(Math.random() * messages.length)
    setMessage(messages[randomIndex])
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700 text-center">
        <div className="text-6xl mb-6 select-none">
            {message.emoji}
        </div>
        
        <h1 className="text-3xl font-bold text-green-400 mb-2">
            Grupo não encontrado
        </h1>
        
        <p className="text-slate-300 mb-8 leading-relaxed">
            {message.text}
        </p>

        <Link 
            href="/"
            className="block w-full bg-green-500 text-slate-900 font-bold py-2 px-4 rounded-md hover:bg-green-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
            Voltar para o Início
        </Link>
      </div>
      
      <div className="mt-6 pt-6 text-center">
        <p className="text-xs text-slate-500 leading-relaxed">
            Racha AI - Dividindo contas, não amizades.
        </p>
      </div>
    </div>
  )
}
