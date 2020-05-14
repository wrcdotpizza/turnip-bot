import { getEventEmitter } from '../global/event-emitter';
import { SalePrice } from '../commands/sale-price';

import * as PostSaleOperations from './operations';

export function registerEvents(): void {
    getEventEmitter().on(`post ${SalePrice.command}`, async msg => {
        for (const operation of Object.values(PostSaleOperations)) {
            if (await operation.shouldSend(msg)) {
                await msg.messageState.enqueueMessage(operation.message);
            }
        }
    });
}
