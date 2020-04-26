import { Command } from './command';
import { Message } from 'discord.js';
import { User } from '../entity/user';

const HelpMessage = `
Turnip Tracker help.

**Report your island's price**:
- Command: \`/turnip-price <turnip_price> (am or pm) (monday-saturday)\`
- _Ex: /turnip-price 123 am monday (This would report your price as 123 bells for Monday morning (8am - 12pm))_

**Report Daisy Mae's price**:
- Command: \`/turnip-sale <turnip_price>\`
- _Ex: /turnip-sale 85 (This mean's Daisy Mae is selling turnips for 85 bells on **YOUR** island)_

**Get your price prediction**:
- Command: \`/turnip-predict\`
- _You will be returned a link to https://turnipprophet.io, showing you your price pattern prediction for the week._

**Get help**:
- Command: \`/turnip-help\`
- _See this message_
`

export class Help implements Command {
    public static command = '/turnip-help';

    public validate(_: Message, _1: User): Promise<boolean> {
        return Promise.resolve(true);
    }

    public async execute(message: Message, _: User): Promise<void> {
        await message.author.send(HelpMessage);
    }

}