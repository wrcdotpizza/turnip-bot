enum PriceWindow {
    am = 'am',
    pm = 'pm',
}

export enum PriceDay {
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
}

export const PriceDayString = {
    [PriceDay.monday]: 'monday',
    [PriceDay.tuesday]: 'tuesday',
    [PriceDay.wednesday]: 'wednesday',
    [PriceDay.thursday]: 'thursday',
    [PriceDay.friday]: 'friday',
    [PriceDay.saturday]: 'saturday',
};

export interface DailyPriceAverage {
    averagePrice: number;
    day: PriceDay;
    priceWindow: PriceWindow;
}

export interface ReportResponse {
    report: Array<DailyPriceAverage>;
}

interface TurnipPrice {
    priceId: number;
    price: number;
    day: PriceDay;
    window: PriceWindow;
}

interface TurnipPriceResponse {
    prices: Array<TurnipPrice>;
}

export interface Week {
    weekId: number;
    price: number;
}

interface WeekResponse {
    weeks: Array<Week>;
}

const baseUrl = 'http://localhost';

export async function getWeeksForUser(userId: number): Promise<WeekResponse> {
    let response = await fetch(`${baseUrl}/user/${userId}/turnip-week`);
    return response.json();
}

export async function getTurnipPricesForWeek(userId: number, weekId: number): Promise<TurnipPriceResponse> {
    let response = await fetch(`${baseUrl}/user/${userId}/turnip-week/${weekId}/turnip-prices`);
    return response.json();
}

export async function setWeekPriceForUser(userId: number, price: number): Promise<number> {
    let response = await fetch(`${baseUrl}/user/${userId}/turnip-week`, {
        method: 'POST',
        body: JSON.stringify({
            price,
        }),
    });
    return response.json();
}

export async function setPriceForDay(
    userId: number,
    weekId: number,
    price: number,
    day: PriceDay,
    priceWindow: PriceWindow,
): Promise<number> {
    let response = await fetch(`${baseUrl}/user/${userId}/turnip-week/${weekId}/turnip-prices`, {
        method: 'POST',
        body: JSON.stringify({
            price,
            day,
            priceWindow,
        }),
    });
    return response.json();
}

export async function getReport(): Promise<ReportResponse> {
    let response = await fetch(`${baseUrl}/report`);
    return response.json();
}
