import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TurnipWeek } from './turnip-week';

export enum PriceWindow {
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

export const PriceDayForString = {
    [PriceDayString[PriceDay.monday]]: PriceDay.monday,
    [PriceDayString[PriceDay.tuesday]]: PriceDay.tuesday,
    [PriceDayString[PriceDay.wednesday]]: PriceDay.wednesday,
    [PriceDayString[PriceDay.thursday]]: PriceDay.thursday,
    [PriceDayString[PriceDay.friday]]: PriceDay.friday,
    [PriceDayString[PriceDay.saturday]]: PriceDay.saturday,
};

@Entity()
export class TurnipPrice {
    @PrimaryGeneratedColumn()
    id?: string;

    @Column()
    price?: number;

    @Column({ enum: [PriceWindow.am, PriceWindow.pm] })
    priceWindow?: PriceWindow;

    @Column({ default: false })
    isSellPrice?: boolean;

    @Column({
        enum: [
            PriceDay.monday,
            PriceDay.tuesday,
            PriceDay.wednesday,
            PriceDay.thursday,
            PriceDay.friday,
            PriceDay.saturday,
        ],
    })
    day?: PriceDay;

    @CreateDateColumn()
    createdAt?: Date;

    @ManyToOne(() => TurnipWeek, week => week.turnipPrices)
    turnipWeek?: TurnipWeek;
}
