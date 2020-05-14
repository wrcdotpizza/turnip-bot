import { Message } from 'discord.js';
import { User } from '../../entity/user';
import { Connection } from 'typeorm';
import { PersonalMessageState } from '../message-helpers/personal-message-state';
import { handleEnumAnswer } from '../message-helpers/answer-handlers';
import { PricePatterns } from '../../types/price-patterns';
import { MessageHandler } from '../../types/message-handler';
import { Messages } from '../../types/messages';

const handler: MessageHandler = {
    message: Messages.askForPattern,
    handler: async (
        messageState: PersonalMessageState,
        connection: Connection,
        message: Message,
        user: User,
    ): Promise<boolean> => {
        const patternResponse = handleEnumAnswer<PricePatterns>(message.content.toLowerCase(), PricePatterns);
        if (patternResponse === null) {
            await message.reply("Sorry, I don't know what that means");
            return false;
        }
        const userRepository = connection.getRepository(User);
        user.previousPattern = patternResponse;
        await Promise.all([
            userRepository.save(user),
            message.reply('Thank you. That is all I need to know'),
            messageState.unsetLastMessage(),
        ]);
        return true;
    },
};

export default handler;
