import { mock, when, instance, anyString, anything } from 'ts-mockito';
import { Repository, Connection, SelectQueryBuilder } from 'typeorm';

type Constructor<T> = new (...args: unknown[]) => T;

export interface MockRepository<T> {
    repository: Repository<T>;
    queryBuilder: SelectQueryBuilder<T>;
}

export function getMockRepository<T>(): MockRepository<T> {
    const mockRepository: Repository<T> = mock(Repository);
    const mockQueryBuilder = mock(SelectQueryBuilder);
    when(mockRepository.createQueryBuilder(anyString())).thenReturn(instance(mockQueryBuilder));
    when(mockQueryBuilder.orderBy(anything())).thenReturn(instance(mockQueryBuilder));
    when(mockQueryBuilder.where(anything())).thenReturn(instance(mockQueryBuilder));
    when(mockQueryBuilder.where(anything(), anything())).thenReturn(instance(mockQueryBuilder));
    when(mockQueryBuilder.limit(anything())).thenReturn(instance(mockQueryBuilder));
    when(mockQueryBuilder.innerJoinAndSelect(anything(), anything())).thenReturn(instance(mockQueryBuilder));

    return {
        repository: mockRepository,
        queryBuilder: mockQueryBuilder,
    };
}

export function addMockRepository<T>(mockConnection: Connection, repositoryType: Constructor<T>): MockRepository<T> {
    const mock = getMockRepository<T>();
    when(mockConnection.getRepository(repositoryType)).thenReturn(instance(mock.repository));
    return mock;
}
