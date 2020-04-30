import { Message } from 'discord.js';
import { User } from '../../entity/user';
import { Connection } from 'typeorm';
import { Messages } from '../messages';
import { PersonalMessageState } from '../message-helpers/personal-message-state';
import { handleEnumAnswer } from '../message-helpers/answer-handlers';
import { PricePatterns } from '../../types/price-patterns';
import { Help } from '../../commands/help';

module.exports = {
    message: Messages.welcomePattern,
    handler: async (
        messageState: PersonalMessageState,
        connection: Connection,
        message: Message,
        user: User,
    ): Promise<boolean> => {
        const patternResponse = handleEnumAnswer<PricePatterns>(message.content.toLowerCase(), PricePatterns);
        const userRepository = connection.getRepository(User);
        if (patternResponse === null) {
            await message.reply("Sorry, I don't know what that means");
            return;
        }
        user.previousPattern = patternResponse;
        user.hasBeenWelcomed = true;
        await Promise.all([
            userRepository.save(user),
            message.reply('Thank you. That is all I need to know'),
            messageState.unsetLastMessage(),
        ]);
        const help = new Help();
        await help.execute(message, user);
        return true;
    },
};
