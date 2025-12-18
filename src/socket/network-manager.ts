type MessageHandler<T> = (data: T) => void;

export class NetworkManager<TMessage = unknown> {
  private socket: WebSocket;
  private queue: unknown[] = [];
  private handlers: MessageHandler<TMessage>[] = [];

  constructor(url: string) {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.queue.forEach((msg) => this.socket.send(JSON.stringify(msg)));
      this.queue = [];
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as TMessage;
      this.handlers.forEach((handler) => handler(data));
    };

    this.socket.onerror = (err) => {
      console.error("WebSocket error", err);
    };
  }

  send(data: unknown) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      this.queue.push(data);
    }
  }

  onMessage(handler: MessageHandler<TMessage>) {
    this.handlers.push(handler);
  }
}
