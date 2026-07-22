import crypto from 'node:crypto'
import { logActivity } from './googleSheets.js'

export async function recordActivity({ admin, action, targetType, details }) {
  await logActivity({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    adminEmail: admin?.email || '',
    adminName: admin?.name || '',
    action,
    targetType,
    details: details || '',
  }).catch(() => {})
}
