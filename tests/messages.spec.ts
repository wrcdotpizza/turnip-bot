import { buildMessageHandlers } from '../src/messages/build-handlers';
import { MessageHandler } from '../src/types/message-handler';
import * as ExpectedPersonalMessages from '../src/messages/personal-messages';

describe('buildMessageHandlers', () => {
    let commands: Array<MessageHandler>;
    let messages: Array<string>;

    beforeEach(() => {
        messages = [];
        commands = Object.values(ExpectedPersonalMessages);
        messages = commands.map(c => c.message);
    });

    it('should build message handlers with all keys', () => {
        const results = buildMessageHandlers();
        expect(Object.keys(results).sort()).toEqual(messages.sort());
    });

    it('should include all files in message handlers directory', () => {
        const results = buildMessageHandlers();
        expect(Object.keys(results).length).toEqual(commands.length);
    });
});
