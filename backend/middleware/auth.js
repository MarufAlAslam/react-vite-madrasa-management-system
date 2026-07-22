import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  if (!process.env.JWT_SECRET) {
    res.status(500).json({ error: 'JWT_SECRET is not configured on the server' })
    return
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session, please log in again' })
  }
}

export function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== 'super') {
    res.status(403).json({ error: 'Only a super admin can perform this action' })
    return
  }
  next()
}
