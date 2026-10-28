import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { normalizeError } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'

const MIN_PASSWORD_LENGTH = 8

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name.').max(100, 'Name must be 100 characters or fewer.'),
    email: z.string().trim().min(1, 'Enter your email address.').pipe(z.email('Enter a valid email address.')),
    password: z
      .string()
      .min(1, 'Enter a password.')
      .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })
type RegisterForm = z.infer<typeof registerSchema>

const FORM_FIELDS = ['name', 'email', 'password'] as const

export default function RegisterPage() {
  const { register: registerUser, status } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  if (status === 'authenticated') return <Navigate to="/" replace />

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setFormError(null)
    try {
      await registerUser({ name, email, password })
      navigate('/', { replace: true })
    } catch (error) {
      const friendly = normalizeError(error)
      // Show server-reported field problems (e.g. duplicate email) on the field.
      let mapped = false
      for (const field of FORM_FIELDS) {
        const message = friendly.fieldErrors?.[field]
        if (message) {
          setError(field, { message })
          mapped = true
        }
      }
      if (!mapped) setFormError(friendly.message)
    }
  })

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-semibold">Create an account</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Meeting Notes &amp; Action Tracker</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <TextField label="Name" autoComplete="name" error={errors.name?.message} {...register('name')} />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating account…' : 'Register'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
