import UrlParser from 'url-parse';

export class Parse {
    private static UrlRegex = /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/;

    public static getLinkFromMessage(messageContent: string): UrlParser {
        const url = this.UrlRegex.exec(messageContent);
        if (url === null) {
            fail('Could not find url in message');
        }
        return this.parseLink(url[0]);
    }

    public static parseLink(link: string): UrlParser {
        return UrlParser(link, true);
    }
}
