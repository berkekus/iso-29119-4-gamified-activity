import { io, type Socket } from 'socket.io-client'

// VITE_SOCKET_URL can be set in .env.local, defaults to localhost:3001
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? 'http://localhost:3001'

let _socket: Socket | null = null

/** Returns the singleton Socket.IO client, connecting on first call. */
export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    })
  }
  return _socket
}

/** Tear down the socket connection and reset the singleton. */
export function destroySocket(): void {
  if (_socket) {
    _socket.disconnect()
    _socket = null
  }
}
