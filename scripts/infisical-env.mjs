import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { fileURLToPath } from 'node:url'

function getInfisicalConfig() {
  const env = process.env
  let clientId = env.SINTYA_INFISICAL_CLIENT_ID
  let clientSecret = env.SINTYA_INFISICAL_CLIENT_SECRET
  let projectId = env.SINTYA_INFISICAL_PROJECT_ID
  let apiUrl = env.INFISICAL_API_URL || env.INFISICAL_HOST_URL || 'https://app.infisical.com/api'
  let secretPath = '/Sintya-Finance'
  let environment = env.INFISICAL_ENV || 'dev'

  if (env.INFISICAL_SECRET_PATH && env.INFISICAL_SECRET_PATH.toLowerCase().includes('sintya')) {
    secretPath = env.INFISICAL_SECRET_PATH
  }

  // Prioritaskan kredensial infisical-personal khusus Sintya Finance dari mcp_config.json
  const mcpConfigPath = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json')
  if (fs.existsSync(mcpConfigPath)) {
    try {
      const content = fs.readFileSync(mcpConfigPath, 'utf8').replace(/^\uFEFF/, '')
      const mcp = JSON.parse(content)
      const personal = mcp.mcpServers?.['infisical-personal']?.env
      if (personal) {
        clientId = clientId || personal.INFISICAL_CLIENT_ID || personal.INFISICAL_UNIVERSAL_AUTH_CLIENT_ID
        clientSecret = clientSecret || personal.INFISICAL_CLIENT_SECRET || personal.INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET
        projectId = projectId || personal.INFISICAL_PROJECT_ID
        apiUrl = personal.INFISICAL_API_URL || personal.INFISICAL_HOST_URL || apiUrl
      }
    } catch (err) {
      console.error('Peringatan: Gagal membaca mcp_config.json:', err.message)
    }
  }

  // Fallback ke env umum jika belum terdefinisi
  clientId = clientId || env.INFISICAL_CLIENT_ID || env.INFISICAL_UNIVERSAL_AUTH_CLIENT_ID
  clientSecret = clientSecret || env.INFISICAL_CLIENT_SECRET || env.INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET
  projectId = projectId || env.INFISICAL_PROJECT_ID

  return {
    clientId,
    clientSecret,
    projectId,
    apiUrl: apiUrl.endsWith('/api') ? apiUrl : `${apiUrl.replace(/\/+$/, '')}/api`,
    secretPath,
    environment,
  }
}

export async function loadInfisicalSecrets() {
  const config = getInfisicalConfig()

  if (!config.clientId || !config.clientSecret || !config.projectId) {
    throw new Error(
      'Kredensial Infisical tidak ditemukan! Pastikan INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET, dan INFISICAL_PROJECT_ID telah disetel atau terdaftar di mcp_config.json (infisical-personal).'
    )
  }

  const loginBody = JSON.stringify({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  })

  const token = await new Promise((resolve, reject) => {
    const parsedUrl = new URL(`${config.apiUrl}/v1/auth/universal-auth/login`)
    const req = https.request(
      parsedUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginBody),
        },
      },
      (res) => {
        let raw = ''
        res.on('data', (c) => (raw += c))
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(raw).accessToken)
            } catch (e) {
              reject(new Error(`Gagal parse respon auth Infisical: ${e.message}`))
            }
          } else {
            reject(new Error(`Login Infisical gagal (${res.statusCode}): ${raw}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(loginBody)
    req.end()
  })

  const secretsUrl = new URL(`${config.apiUrl}/v3/secrets/raw`)
  secretsUrl.searchParams.set('workspaceId', config.projectId)
  secretsUrl.searchParams.set('environment', config.environment)
  secretsUrl.searchParams.set('secretPath', config.secretPath)

  const secretsData = await new Promise((resolve, reject) => {
    const req = https.get(
      secretsUrl,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let raw = ''
        res.on('data', (c) => (raw += c))
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(raw))
            } catch (e) {
              reject(new Error(`Gagal parse secrets Infisical: ${e.message}`))
            }
          } else {
            reject(new Error(`Ambil secrets Infisical gagal (${res.statusCode}): ${raw}`))
          }
        })
      }
    )
    req.on('error', reject)
  })

  const envObj = {}
  if (Array.isArray(secretsData.secrets)) {
    for (const s of secretsData.secrets) {
      if (s.secretKey) {
        envObj[s.secretKey] = s.secretValue ?? ''
      }
    }
  }

  return envObj
}
