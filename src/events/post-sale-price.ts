import { getEventEmitter } from '../global/event-emitter';
import { PostCommandEvent } from '../types/turnip-events';
import { SalePrice } from '../commands/sale-price';
import { Messages } from '../types/messages';
import { TurnipWeek } from '../entity/turnip-week';

export const sendTurnipPurchaseReminder = async ({
    msg,
    user,
    messageState,
    connection,
}: PostCommandEvent): Promise<void> => {
    const turnipWeekRepo = connection.getRepository(TurnipWeek);
    const numTurnipWeeks = await turnipWeekRepo.count({ user });
    if (user.hasPurchasedTurnipsOnIsland || numTurnipWeeks <= 1) {
        return;
    }
    await msg.author.send(
        'Hey there, it looks like you just had another Sunday with Daisy Mae. Have you purchased turnips on your own island yet?',
    );
    await messageState.setLastMessage(Messages.updateHasPurchased);
};

export function registerEvents(): void {
    getEventEmitter().on(`post ${SalePrice.command}`, sendTurnipPurchaseReminder);
}
