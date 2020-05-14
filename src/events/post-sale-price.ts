import { getEventEmitter } from '../global/event-emitter';
import { SalePrice } from '../commands/sale-price';

import * as PostSaleOperations from './operations';

export function registerEvents(): void {
    getEventEmitter().on(`post ${SalePrice.command}`, async msg => {
        for (const operation of Object.values(PostSaleOperations)) {
            if (await operation.shouldSend(msg)) {
                if ((await msg.messageState.getLastMessage()) === null) {
                    await operation.execute(msg);
                    await msg.messageState.setLastMessage(operation.message);
                } else {
                    await msg.messageState.enqueueMessage(operation.message);
                }
            }
        }
    });
}
