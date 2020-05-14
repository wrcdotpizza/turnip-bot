import { Connection } from 'typeorm';
import { User } from '../../entity/user';
import { TurnipWeek } from '../../entity/turnip-week';
import { PostCommandEvent } from '../../types/post-command-event';
import { Messages } from '../../types/messages';
import { PostCommandOperation } from '../post-command-operation';
import { getEnumValues } from '../../helpers/get-enum-values';
import { PricePatterns } from '../../types/price-patterns';

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

    async execute({ msg }: PostCommandEvent): Promise<void> {
        await msg.author.send(
            'Hey there, it looks like you just had another Sunday with Daisy Mae. Have you purchased turnips on your own island yet?',
        );
    }
}

class SetPatternReminder implements PostCommandOperation {
    readonly message: Messages = Messages.askForPattern;

    async shouldSend({ connection, user }: PostCommandEvent): Promise<boolean> {
        return !(await isFirstTurnipWeek(connection, user));
    }

    async execute({ msg }: PostCommandEvent): Promise<void> {
        const patternString = getEnumValues(PricePatterns)
            .map(p => `\`${p}\``)
            .join(', ');
        await msg.author.send(
            `What was your pattern for your previous week? (${patternString})
You can find it your pattern by running \`/turnip-predict\` and scrolling to the bottom of the page.            
Only submit a pattern if it had a 100% chance.`,
        );
    }
}

const PatternReminder = new SetPatternReminder();
const HasPurchasedReminder = new TurnipPurchaseReminder();

export { PatternReminder, HasPurchasedReminder };
