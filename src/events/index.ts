import * as Operations from './operations';
import { Messages } from '../types/messages';
import { PostCommandEvent } from '../types/turnip-events';
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

export async function fireOperationForMessage(message: Messages, event: PostCommandEvent): Promise<void> {
    let found = false;
    for (const operation of Object.values(Operations)) {
        if (operation.message === message) {
            if (await operation.shouldSend(event)) {
                found = true;
                await operation.execute(event);
                await event.messageState.setLastMessage(operation.message);
            }
        }
    }
    if (!found) {
        console.error(`Unable to find operation for message ${message}`);
    }
}
