import { Message } from 'discord.js';
import { PersonalMessageState } from './models/personal-message-state';
import { Messages } from '../types/messages';

export async function beginWelcomeConversation(messageState: PersonalMessageState, msg: Message): Promise<void> {
    await msg.author.send('Sounds like you want to start tracking your turnips. I have a few questions for you...');
    await msg.author.send('Have you purchased turnips on your island before?');
    await messageState.setLastMessage(Messages.welcomeIslandPurchase);
}
