namespace BdvEngine {
    
    export enum MessagePriority {
        DEFAULT,
        CRITICAL
    }

    export class Message {

        // A messaging system is preferable to having to deal with Promises which are exclusive to Javascript.
        // In this way the engine can be easily ported to any other programming language.
        public code: string;
        public context: any;
        public sender: any;

        public priority: MessagePriority;

        public constructor(code: string, sender: any, context?: any, priority: MessagePriority = MessagePriority.DEFAULT) {
            this.code = code;
            this.sender = sender;
            this.context = context;
            this.priority = priority;
        }

        public static send(code: string, sender: any, context?: any): void {
            MessageBus.emit(new Message(code, sender, context, MessagePriority.DEFAULT));
        }

        public static sendCritical(code: string, sender: any, context?: any): void {
            MessageBus.emit(new Message(code, sender, context, MessagePriority.CRITICAL));
        }

        public static subscribe(code: string, handler: IMessageHandler): void {
            MessageBus.subscribe(code, handler);
        }

        public static unsubscribe(code: string, handler: IMessageHandler): void {
            MessageBus.unsubscribe(code, handler);
        }
    }
}