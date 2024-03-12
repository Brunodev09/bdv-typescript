namespace BdvEngine {
    
    export class MessageBus {
        
        private static subs: {[code: string]: IMessageHandler[]} = {};

        private static queueMessageTick: number = 10;
        private static messageQueue: SubscriptionNode[] = [];

        private constructor() { }

        public static subscribe(code: string, handler: IMessageHandler): void {
            if (!MessageBus.subs[code]) {
                MessageBus.subs[code] = [];
            }
            if (MessageBus.subs[code].indexOf(handler) !== -1) {
                console.log(`MessageBus::Attempting to push duplicate handler to messaging code ${code}. No subscription added.`);
            } else {
                MessageBus.subs[code].push(handler);
            }
        }

        public static unsubscribe(code: string, handler: IMessageHandler): void {
            if (!MessageBus.subs[code]) {
                console.log(`MessageBus::There is no such handler subscribed to code ${code}.`);
                return;
            }
            if (MessageBus.subs[code].indexOf(handler) !== -1) {
                MessageBus.subs[code].splice(MessageBus.subs[code].indexOf(handler), 1);
            } 
        }

        public static emit(message: Message): void {
            console.log(`MessageBus::Message Emitted: ${JSON.stringify(message)}`);
            let handlers = MessageBus.subs[message.code];

            if (!handlers) return;

            for (let handler of handlers) {
                if (message.priority === MessagePriority.CRITICAL) {
                    handler.onMessage(message);
                } else {
                    MessageBus.messageQueue.push(new SubscriptionNode(message, handler));
                }
            }
        }

        public static update(time: number): void {
            if (!MessageBus.messageQueue.length) return;
            let limit = Math.min(MessageBus.queueMessageTick, MessageBus.messageQueue.length);

            for (let i = 0; i < limit; i++) {
                let node = MessageBus.messageQueue.shift();
                node.handler.onMessage(node.message);
            }
        }
    }

}