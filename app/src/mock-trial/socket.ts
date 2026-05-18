import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? 'http://localhost:3001'

let _socket: Socket | null = null

export function getMockTrialSocket(): Socket {
  if (!_socket) {
    _socket = io(`${SOCKET_URL}/mock-trial`, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    })
  }
  return _socket
}

export function destroyMockTrialSocket(): void {
  if (_socket) {
    _socket.disconnect()
    _socket = null
  }
}
