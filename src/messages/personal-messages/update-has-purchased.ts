import { Message } from 'discord.js';
import { User } from '../../entity/user';
import { handleYesOrNoAnswer, YesOrNoResponse } from '../message-helpers/answer-handlers';
import { Connection } from 'typeorm';
import { Messages } from '../messages';
import { PersonalMessageState } from '../message-helpers/personal-message-state';

module.exports = {
    message: Messages.updateHasPurchased,
    handler: async (
        _messageState: PersonalMessageState,
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
        return true;
    },
};
