import { Entity, Column, PrimaryColumn, ManyToMany } from 'typeorm';
import { User } from './user';

@Entity()
export class DiscordServer {
    @PrimaryColumn()
    serverId?: string;

    @Column()
    name?: string;

    @ManyToMany(() => User, user => user.discordServers)
    users?: Array<User>;
}
