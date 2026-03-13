import { NextResponse } from 'next/server'
import AuthService from '@/lib/auth'
import { withAuth } from '@/middleware/auth'

export async function POST(request) {
  return withAuth(async (req) => {
    try {
      const userId = req.user._id
      await AuthService.logout(userId)

      return NextResponse.json({
        message: 'Logout successful'
      })
    } catch (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      )
    }
  })()
}
