import { Message } from 'discord.js';
import { User } from '../../entity/user';
import { handleYesOrNoAnswer, YesOrNoResponse } from '../message-helpers/answer-handlers';
import { Connection } from 'typeorm';
import { PersonalMessageState } from '../message-helpers/personal-message-state';
import { MessageHandler } from '../../types/message-handler';
import { Messages } from '../../types/messages';

async function askForPreviousPattern(messageState: PersonalMessageState, msg: Message): Promise<void> {
    await msg.author.send(
        `Thanks. What was your previous turnip price pattern? (fluctuating, large spike, decreasing, small spike)`,
    );
    await msg.author.send(`If you don't know, just answer "unknown".`);
    await messageState.setLastMessage(Messages.welcomePattern);
}

const handler: MessageHandler = {
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
        await askForPreviousPattern(messageState, message);
        return true;
    },
};

export default handler;
