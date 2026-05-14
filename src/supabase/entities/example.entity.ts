import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Example entity used to demonstrate the TypeORM integration with Supabase.
 * The table name defaults to the class name in snake_case (`example`) but can be
 * overridden via the `@Entity` decorator options.
 */
@Entity({ name: 'example' })
export class ExampleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;
}
