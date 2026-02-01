export const USER_COLORS = [
  'text-cyan-300',
  'text-pink-300',
  'text-emerald-300',
  'text-violet-300',
  'text-amber-300',
  'text-rose-300',
  'text-sky-300',
  'text-lime-300',
  'text-fuchsia-300',
  'text-teal-300',
  'text-red-300',
  'text-orange-300',
  'text-yellow-300',
  'text-green-300',
  'text-blue-300',
  'text-indigo-300',
  'text-purple-300',
  'text-red-400',
  'text-cyan-400',
  'text-fuchsia-400'
]

export const getUserColor = (userId: string) => {
  if (!userId) return 'text-slate-200'
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}
