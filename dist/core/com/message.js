import { MessageBus } from './messageBus';
export var MessagePriority;
(function (MessagePriority) {
    MessagePriority[MessagePriority["DEFAULT"] = 0] = "DEFAULT";
    MessagePriority[MessagePriority["CRITICAL"] = 1] = "CRITICAL";
})(MessagePriority || (MessagePriority = {}));
export class Message {
    constructor(code, sender, context, priority = MessagePriority.DEFAULT) {
        this.code = code;
        this.sender = sender;
        this.context = context;
        this.priority = priority;
    }
    static send(code, sender, context) {
        MessageBus.emit(new Message(code, sender, context, MessagePriority.DEFAULT));
    }
    static sendCritical(code, sender, context) {
        MessageBus.emit(new Message(code, sender, context, MessagePriority.CRITICAL));
    }
    static subscribe(code, handler) {
        MessageBus.subscribe(code, handler);
    }
    static unsubscribe(code, handler) {
        MessageBus.unsubscribe(code, handler);
    }
}
//# sourceMappingURL=message.js.map