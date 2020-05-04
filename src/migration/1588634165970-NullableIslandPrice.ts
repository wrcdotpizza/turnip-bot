import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class NullableIslandPrice1588634165970 implements MigrationInterface {
    private oldIslandPriceColumn: TableColumn;
    private newIslandPriceColumn: TableColumn;

    constructor() {
        this.oldIslandPriceColumn = new TableColumn({
            isNullable: false,
            name: 'islandPrice',
            type: 'integer',
        });

        this.newIslandPriceColumn = this.oldIslandPriceColumn.clone();
        this.newIslandPriceColumn.isNullable = true;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn('turnip_week', 'islandPrice', this.newIslandPriceColumn);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn('turnip_week', 'islandPrice', this.oldIslandPriceColumn);
    }
}
