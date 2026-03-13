import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'

class AuthService {
  // Generate JWT tokens
  static generateTokens(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    }

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = jwt.sign(
      { userId: user._id }, 
      JWT_REFRESH_SECRET, 
      { expiresIn: '7d' }
    )

    return { accessToken, refreshToken }
  }

  // Verify access token
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return null
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET)
    } catch (error) {
      return null
    }
  }

  // Hash password
  static async hashPassword(password) {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  // Compare password
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword)
  }

  // Register user
  static async register(userData) {
    const { name, email, password, role = 'user' } = userData

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password)

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    })

    // Generate tokens
    const tokens = this.generateTokens(user)

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      addresses: user.addresses,
      createdAt: user.createdAt
    }

    return { user: userResponse, tokens }
  }

  // Login user
  static async login(email, password) {
    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Check password
    const isPasswordValid = await this.comparePassword(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // Generate tokens
    const tokens = this.generateTokens(user)

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      addresses: user.addresses,
      createdAt: user.createdAt
    }

    return { user: userResponse, tokens }
  }

  // Refresh tokens
  static async refreshTokens(refreshToken) {
    const decoded = this.verifyRefreshToken(refreshToken)
    if (!decoded) {
      throw new Error('Invalid refresh token')
    }

    // Find user
    const user = await User.findById(decoded.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Generate new tokens
    const tokens = this.generateTokens(user)

    return tokens
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword)

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword })

    return { message: 'Password changed successfully' }
  }

  // Reset password request
  static async requestPasswordReset(email) {
    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If an account exists, a reset email has been sent' }
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    // Save reset token to user
    user.passwordResetToken = resetToken
    user.passwordResetExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    // TODO: Send email with reset link
    // await EmailService.sendPasswordResetEmail(email, resetToken)

    return { message: 'If an account exists, a reset email has been sent' }
  }

  // Reset password
  static async resetPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid reset token')
      }

      const user = await User.findOne({
        _id: decoded.userId,
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      })

      if (!user) {
        throw new Error('Invalid or expired reset token')
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword)

      // Update password and clear reset token
      user.password = hashedNewPassword
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await user.save()

      return { message: 'Password reset successful' }
    } catch (error) {
      throw new Error('Invalid or expired reset token')
    }
  }

  // Logout (invalidate tokens on server side if needed)
  static async logout(userId) {
    // TODO: Implement token blacklisting if needed
    // For now, tokens are invalidated client-side
    return { message: 'Logout successful' }
  }
}

export default AuthService
