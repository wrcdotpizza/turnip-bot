import { Message } from 'discord.js';
import { User } from '../../entity/user';
import { Connection } from 'typeorm';
import { PersonalMessageState } from '../models/personal-message-state';
import { MessageHandler } from '../../types/message-handler';
import { Messages } from '../../types/messages';
import UpdatePattern from './update-pattern';

const handler: MessageHandler = {
    message: Messages.welcomePattern,
    handler: async (
        messageState: PersonalMessageState,
        connection: Connection,
        message: Message,
        user: User,
    ): Promise<boolean> => {
        const wasSuccess = await UpdatePattern.handler(messageState, connection, message, user);
        if (!wasSuccess) {
            return false;
        }
        const userRepository = connection.getRepository(User);
        user.hasBeenWelcomed = true;
        await userRepository.save(user);
        return true;
    },
};

export default handler;
