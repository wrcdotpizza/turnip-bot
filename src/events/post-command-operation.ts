import { PostCommandEvent } from '../types/post-command-event';
import { Messages } from '../types/messages';

export interface PostCommandOperation {
    readonly message: Messages;
    shouldSend(event: PostCommandEvent): Promise<boolean>;
    execute(event: PostCommandEvent): Promise<void>;
}
