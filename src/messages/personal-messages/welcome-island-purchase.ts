import { Message } from 'discord.js';
import { User } from '../../entity/user';
import { handleYesOrNoAnswer, YesOrNoResponse } from '../message-helpers/answer-handlers';
import { Connection } from 'typeorm';
import { Messages } from '../messages';
import { PersonalMessageState } from '../message-helpers/personal-message-state';

async function askForPreviousPattern(messageState: PersonalMessageState, user: User, msg: Message): Promise<void> {
    await msg.author.send(
        `Thanks. What was your previous turnip price pattern? (fluctuating, large spike, decreasing, small spike)`,
    );
    await msg.author.send(`If you don't know, just answer "unknown".`);
    messageState.setLastMessage(Messages.welcomePattern);
}

module.exports = {
    message: Messages.welcomeIslandPurchase,
    handler: async (
        messageState: PersonalMessageState,
        connection: Connection,
        message: Message,
        user: User,
    ): Promise<boolean> => {
        const userRepository = connection.getRepository(User);
        const islandPurchaseResponse = handleYesOrNoAnswer(message.content.toLowerCase());
        if (islandPurchaseResponse === YesOrNoResponse.unknown) {
            await message.reply("Sorry, I don't know what that means");
            return false;
        }
        user.hasPurchasedTurnipsOnIsland = islandPurchaseResponse === YesOrNoResponse.yes;
        await userRepository.save(user);
        await askForPreviousPattern(messageState, user, message);
        return true;
    },
};
