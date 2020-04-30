import { Message } from 'discord.js';
import { Messages } from '../messages';
import { PersonalMessageState } from '../message-helpers/personal-message-state';

export async function beginWelcomeConversation(messageState: PersonalMessageState, msg: Message): Promise<void> {
    await msg.author.send('Sounds like you want to start tracking your turnips. I have a few questions for you...');
    await msg.author.send('Have you purchased turnips on your island before?');
    await messageState.setLastMessage(Messages.welcomeIslandPurchase);
}
