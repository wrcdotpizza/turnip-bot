import { Command } from './command';
import { Message } from 'discord.js';
import { User } from '../entity/user';
import { getEnumValues } from '../helpers/get-enum-values';
import { PricePatterns } from '../types/price-patterns';

export const HelpMessage = `
Turnip Tracker help.

**Report your island's price**:
- Command: \`/turnip-price <turnip_price> (am or pm) (monday-saturday)\`
- _Ex: /turnip-price 123 am monday (This would report your price as 123 bells for Monday morning (8am - 12pm))_

**Report Daisy Mae's price**:
- Command: \`/turnip-sale <turnip_price>\`
- _Ex: /turnip-sale 85 (This mean's Daisy Mae is selling turnips for 85 bells on **YOUR** island)_

**Get price prediction**:
- Command: \`/turnip-predict\`
- _You will be returned a link to https://turnipprophet.io, showing you your price pattern prediction for the week._
- Command: \`/turnip-predict @<user>\`
- _You will be returned a link to https://turnipprophet.io, showing you the price pattern prediction for the mentioned user._

**Update your previous pattern**:
- Command: \`/turnip-pattern <${getEnumValues(PricePatterns).join(' or ')}>\`
- _This will update your stored previous pattern to the specified pattern. This ensures you get the most accurate predictions from the prophet_

**Get help**:
- Command: \`/turnip-help\`
- _See this message_
`;

export class Help implements Command {
    public static command = '/turnip-help';

    public help(_: Message, _1: User): Promise<void> {
        return Promise.resolve();
    }

    public validate(_: Message, _1: User): Promise<boolean> {
        return Promise.resolve(true);
    }

    public async execute(message: Message, _: User): Promise<void> {
        await message.author.send(HelpMessage);
    }
}
