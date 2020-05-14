import { Connection } from 'typeorm';
import { User } from '../../entity/user';
import { TurnipWeek } from '../../entity/turnip-week';
import { PostCommandEvent } from '../../types/post-command-event';
import { Messages } from '../../types/messages';
import { PostCommandOperation } from '../post-command-operation';

const isFirstTurnipWeek = async (connection: Connection, user: User): Promise<boolean> => {
    const turnipWeekRepo = connection.getRepository(TurnipWeek);
    const numTurnipWeeks = await turnipWeekRepo.count({ user });
    return numTurnipWeeks <= 1;
};

class TurnipPurchaseReminder implements PostCommandOperation {
    readonly message: Messages = Messages.updateHasPurchased;

    async shouldSend({ connection, user }: PostCommandEvent): Promise<boolean> {
        const isFirstWeek = await isFirstTurnipWeek(connection, user);
        return !user.hasPurchasedTurnipsOnIsland && !isFirstWeek;
    }

    async execute({ msg, messageState }: PostCommandEvent): Promise<void> {
        await msg.author.send(
            'Hey there, it looks like you just had another Sunday with Daisy Mae. Have you purchased turnips on your own island yet?',
        );
        await messageState.setLastMessage(Messages.updateHasPurchased);
    }
}

class SetPatternReminder implements PostCommandOperation {
    readonly message: Messages = Messages.askForPattern;

    async shouldSend({ connection, user }: PostCommandEvent): Promise<boolean> {
        return !(await isFirstTurnipWeek(connection, user));
    }

    async execute({ msg, messageState }: PostCommandEvent): Promise<void> {
        await msg.author.send(
            `What was your pattern for your previous week? You can find it by running \`/turnip-predict\` and scrolling to the bottom. Only submit a pattern if it has 100% chance.`,
        );
        await messageState.setLastMessage(Messages.askForPattern);
    }
}

const PatternReminder = new SetPatternReminder();
const HasPurchasedReminder = new TurnipPurchaseReminder();

export { PatternReminder, HasPurchasedReminder };
