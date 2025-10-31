import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;

    connect(userId: string) {
        if (this.socket?.connected) {
            return;
        }
        
        // Disconnect any existing socket before creating a new one
        if (this.socket) {
            this.socket.disconnect();
        }

        // Pass the userId as a query parameter for authentication
        this.socket = io({
            query: { userId }
        });

        this.socket.on('connect', () => {
            console.log('Connected to socket server with user ID:', userId);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event: string, data: any, ack?: (response: any) => void) {
        if (this.socket) {
            if (ack) {
                this.socket.emit(event, data, ack);
            } else {
                this.socket.emit(event, data);
            }
        }
    }

    on(event: string, callback: (data: any) => void): () => void {
        if (this.socket) {
            this.socket.on(event, callback);
            return () => this.socket?.off(event, callback);
        }
        return () => {};
    }
}

export const socketService = new SocketService();
