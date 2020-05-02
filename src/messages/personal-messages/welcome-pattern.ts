import { Message } from 'discord.js';
import { User } from '../../entity/user';
import { Connection } from 'typeorm';
import { PersonalMessageState } from '../message-helpers/personal-message-state';
import { handleEnumAnswer } from '../message-helpers/answer-handlers';
import { PricePatterns } from '../../types/price-patterns';
import { MessageHandler } from '../../types/message-handler';
import { Messages } from '../../types/messages';

const handler: MessageHandler = {
    message: Messages.welcomePattern,
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
        user.hasBeenWelcomed = true;
        await Promise.all([
            userRepository.save(user),
            message.reply('Thank you. That is all I need to know'),
            messageState.unsetLastMessage(),
        ]);
        await message.reply(
            `In order to get the most accurate predictions use \`/turnip-sale\` on Sundays to report Daisy Mae's price. Then each morning and afternoon report your turnip price with \`/turnip-price\`. You can run \`/turnip-predict\` at any time to get a link to your latest turnip price predictions. You can always use \`/turnip-help\` to be reminded of the commands I respond to.`,
        );
        return true;
    },
};

export default handler;
