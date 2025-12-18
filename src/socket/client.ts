type MessageHandler<T> = (data: T) => void;

export class SocketClient<TMessage = unknown> {
  private socket: WebSocket;
  private queue: unknown[] = [];
  private handlers: MessageHandler<TMessage>[] = [];

  constructor(
    url: string,
    updateStatus?: (text: string) => void,
    vibrate?: (pattern: number[]) => void,
  ) {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      if (updateStatus) updateStatus("Conectado");

      this.queue.forEach((msg) => this.socket.send(JSON.stringify(msg)));
      this.queue = [];
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as TMessage;
      this.handlers.forEach((handler) => handler(data));
    };

    this.socket.onerror = () => {
      if (updateStatus) updateStatus("Erro de conexão");
      if (vibrate) vibrate([200, 100, 200]);
    };

    this.socket.onclose = () => {
      if (updateStatus) updateStatus("Conexão encerrada");
    };
  }

  send(data: unknown): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      this.queue.push(data);
    }
  }

  onMessage(handler: MessageHandler<TMessage>): void {
    this.handlers.push(handler);
  }
}
