import jwt from 'jsonwebtoken'

function verifyToken(req, res, next, { allowTeacher }) {
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
  } catch {
    res.status(401).json({ error: 'Invalid or expired session, please log in again' })
    return
  }

  if (req.admin.role === 'teacher' && !allowTeacher) {
    res.status(403).json({ error: 'Teacher accounts cannot perform this action' })
    return
  }
  next()
}

// Admins and staff only. Teacher logins are rejected everywhere except routes that opt in with requireAuthOrTeacher.
export function requireAuth(req, res, next) {
  verifyToken(req, res, next, { allowTeacher: false })
}

export function requireAuthOrTeacher(req, res, next) {
  verifyToken(req, res, next, { allowTeacher: true })
}

export function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== 'super') {
    res.status(403).json({ error: 'Only a super admin can perform this action' })
    return
  }
  next()
}

// Attaches req.admin when a valid token is sent, but never rejects the request.
export function optionalAuth(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ')

  if (scheme === 'Bearer' && token && process.env.JWT_SECRET) {
    try {
      req.admin = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      // Treat an invalid token as an anonymous visitor.
    }
  }
  next()
}
