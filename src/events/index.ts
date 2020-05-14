import * as PostSalePrice from './post-sale-price';
import * as Operations from './operations';
import { Messages } from '../types/messages';
import { PostCommandEvent } from '../types/turnip-events';

export function registerEvents(): void {
    PostSalePrice.registerEvents();
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
