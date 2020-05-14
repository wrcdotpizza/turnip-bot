import { Message } from 'discord.js';
import { User } from '../../entity/user';
import { handleYesOrNoAnswer, YesOrNoResponse } from '../answer-handlers';
import { Connection } from 'typeorm';
import { PersonalMessageState } from '../models/personal-message-state';
import { MessageHandler } from '../../types/message-handler';
import { Messages } from '../../types/messages';

const handler: MessageHandler = {
    message: Messages.updateHasPurchased,
    handler: async (
        messageState: PersonalMessageState,
        connection: Connection,
        message: Message,
        user: User,
    ): Promise<boolean> => {
        const response = handleYesOrNoAnswer(message.content);
        if (response === YesOrNoResponse.unknown) {
            await message.reply('Sorry, I didn\'t understand. Try "yes" or "no".');
            return false;
        }

        const userRepository = connection.getRepository(User);
        user.hasPurchasedTurnipsOnIsland = response === YesOrNoResponse.yes;
        await userRepository.save(user);
        await messageState.unsetLastMessage();
        return true;
    },
};

export default handler;
