import { MessagePriority } from './message';
import { SubscriptionNode } from './subscriptionNode';
export class MessageBus {
    constructor() { }
    static subscribe(code, handler) {
        if (!MessageBus.subs[code]) {
            MessageBus.subs[code] = [];
        }
        if (MessageBus.subs[code].indexOf(handler) !== -1) {
            console.log(`MessageBus::Attempting to push duplicate handler to messaging code ${code}. No subscription added.`);
        }
        else {
            MessageBus.subs[code].push(handler);
        }
    }
    static unsubscribe(code, handler) {
        if (!MessageBus.subs[code]) {
            console.log(`MessageBus::There is no such handler subscribed to code ${code}.`);
            return;
        }
        if (MessageBus.subs[code].indexOf(handler) !== -1) {
            MessageBus.subs[code].splice(MessageBus.subs[code].indexOf(handler), 1);
        }
    }
    static emit(message) {
        console.log(`MessageBus::Message Emitted: ${JSON.stringify(message)}`);
        let handlers = MessageBus.subs[message.code];
        if (!handlers)
            return;
        for (let handler of handlers) {
            if (message.priority === MessagePriority.CRITICAL) {
                handler.onMessage(message);
            }
            else {
                MessageBus.messageQueue.push(new SubscriptionNode(message, handler));
            }
        }
    }
    static update(time) {
        if (!MessageBus.messageQueue.length)
            return;
        let limit = Math.min(MessageBus.queueMessageTick, MessageBus.messageQueue.length);
        for (let i = 0; i < limit; i++) {
            let node = MessageBus.messageQueue.shift();
            node.handler.onMessage(node.message);
        }
    }
}
MessageBus.subs = {};
MessageBus.queueMessageTick = 10;
MessageBus.messageQueue = [];
//# sourceMappingURL=messageBus.js.map