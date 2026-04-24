import type { Message } from './message';

export interface IMessageHandler {
    onMessage(message: Message): void;
}
