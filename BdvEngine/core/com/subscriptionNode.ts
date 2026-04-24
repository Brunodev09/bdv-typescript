import { Message } from './message';
import { IMessageHandler } from './IMessageHandler';

export class SubscriptionNode {
    public message: Message;
    public handler: IMessageHandler;

    public constructor(message: Message, handler: IMessageHandler) {
        this.message = message;
        this.handler = handler;
    }
}
