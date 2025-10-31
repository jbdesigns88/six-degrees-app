import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket) {
            return;
        }

        // With no args, io() connects to the same host that serves the page.
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to socket server');
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

    emit(event: string, data: any) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    on(event: string, callback: (data: any) => void): () => void {
        if (this.socket) {
            this.socket.on(event, callback);
            // Return an unsubscribe function
            return () => this.socket?.off(event, callback);
        }
        // If socket is not available, return an empty function
        return () => {};
    }
}

// Export a singleton instance of the service
export const socketService = new SocketService();
