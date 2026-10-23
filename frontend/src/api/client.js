import { MESSAGES } from '../constants/messages'

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.data = data
  }
}

function firstMessagePerField(errors = {}) {
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, messages[0]])
  )
}

export async function request(method, path, body) {
  let response

  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && { 'Content-Type': 'application/json' })
      },
      body: body && JSON.stringify(body)
    })
  } catch {
    throw new ApiError(MESSAGES.errors.network, 0)
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const isClientError = response.status < 500 && payload?.message
    throw new ApiError(
      isClientError ? payload.message : MESSAGES.errors.server,
      response.status,
      firstMessagePerField(payload?.errors),
      payload?.data ?? null
    )
  }

  return payload
}
