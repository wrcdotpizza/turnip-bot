// @ts-nocheck
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

export interface TurnipPrice {
    priceId: string;
    price: number;
    day: PriceDay;
    window: PriceWindow;
}

interface TurnipPriceResponse {
    prices: Array<TurnipPrice>;
}

export interface Week {
    weekId: string;
    price: number;
}

interface WeekResponse {
    weeks: Array<Week>;
}

export function build(basePrefix: string) {
    const baseUrl = "http://localhost/" + basePrefix;
    async function getWeeksForUser(userId: string): Promise<WeekResponse> {
        let response = await fetch(`${baseUrl}/user/${userId}/turnip-week`);
        return response.json();
    }

    async function getTurnipPricesForWeek(userId: string, weekId: string): Promise<Array<TurnipPrice>> {
        let response = await fetch(`${baseUrl}/user/${userId}/turnip-week/${weekId}/turnip-prices`);
        return response.json(); 
    }

    async function setWeekPriceForUser(userId: string, price: number): Promise<string> {
        let response = await fetch(`${baseUrl}/user/${userId}/turnip-week`, {
            method: 'POST',
            body: JSON.stringify({
                price,
            }),
            headers: {"Content-Type": "application/json"},
        });
        return response.json();
    }

    async function setPriceForDay(
        userId: string,
        weekId: string,
        price: number,
        day: PriceDay,
        window: PriceWindow,
    ): Promise<string> {
        let response = await fetch(`${baseUrl}/user/${userId}/turnip-week/${weekId}/turnip-prices`, {
            method: 'POST',
            body: JSON.stringify({
                price,
                day,
                window,
            }),
            headers: {"Content-Type": "application/json"},
        });
        return response.json();
    }

    async function getReport(): Promise<ReportResponse> {
        let response = await fetch(`${baseUrl}/report`);
        return response.json();
    }

    return {
        getWeeksForUser,
        getTurnipPricesForWeek,
        setWeekPriceForUser,
        setPriceForDay,
        getReport
    }
}