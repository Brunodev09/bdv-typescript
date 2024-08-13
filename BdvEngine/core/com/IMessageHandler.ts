namespace BdvEngine {
    export interface IMessageHandler {
        onMessage(message: Message): void;
    }
}
