import type { AuthService } from '../services/auth'
import type { User } from '@/types'
import { AppError } from '../errors'
import { delay, failIf, newId, readJSON, writeJSON } from './storage'

// MOCK ONLY: passwords are kept in localStorage purely to simulate login.
// The real backend owns credentials; nothing like this ships in Phase B.
interface StoredUser extends User {
  password: string
}

const toUser = ({ id, name, email }: StoredUser): User => ({ id, name, email })

export const authMock: AuthService = {
  async register(input) {
    await delay()
    failIf('network')
    const users = readJSON<StoredUser[]>('users', [])
    const email = input.email.trim().toLowerCase()
    if (users.some((u) => u.email === email)) {
      throw new AppError('CONFLICT', 'An account with this email already exists.', {
        fieldErrors: { email: 'An account with this email already exists.' },
      })
    }
    const user: StoredUser = { id: newId(), name: input.name.trim(), email, password: input.password }
    writeJSON('users', [...users, user])
    writeJSON('session', { userId: user.id })
    return toUser(user)
  },

  async login(input) {
    await delay()
    failIf('network')
    const email = input.email.trim().toLowerCase()
    const user = readJSON<StoredUser[]>('users', []).find(
      (u) => u.email === email && u.password === input.password,
    )
    if (!user) throw new AppError('UNAUTHORIZED', 'Incorrect email or password.')
    writeJSON('session', { userId: user.id })
    return toUser(user)
  },

  async logout() {
    // Clear first so a navigation during the simulated delay cannot keep the session alive.
    writeJSON('session', null)
    await delay(150)
  },

  async getCurrentUser() {
    await delay(150)
    const session = readJSON<{ userId: string } | null>('session', null)
    if (!session) return null
    const user = readJSON<StoredUser[]>('users', []).find((u) => u.id === session.userId)
    return user ? toUser(user) : null
  },
}
