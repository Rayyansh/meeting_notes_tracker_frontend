import type { LoginInput, RegisterInput, User } from '@/types'

export interface AuthService {
  register(input: RegisterInput): Promise<User>
  login(input: LoginInput): Promise<User>
  logout(): Promise<void>
  /** Resolves the signed-in user, or null when there is no valid session. */
  getCurrentUser(): Promise<User | null>
}
