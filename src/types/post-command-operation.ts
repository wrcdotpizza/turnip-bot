import { PostCommandEvent } from './post-command-event';
import { Messages } from './messages';

export interface PostCommandOperation {
    readonly message: Messages;
    shouldSend(event: PostCommandEvent): Promise<boolean>;
    execute(event: PostCommandEvent): Promise<void>;
}
