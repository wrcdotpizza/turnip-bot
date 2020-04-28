import { mock, when, instance, anyString, anything } from 'ts-mockito';
import { Repository, Connection, SelectQueryBuilder } from 'typeorm';

type Constructor<T> = new (...args: unknown[]) => T;

export interface MockRepository<T> {
    repository: Repository<T>;
    queryBuilder: SelectQueryBuilder<T>;
}

export function addMockRepository<T>(mockConnection: Connection, repositoryType: Constructor<T>): MockRepository<T> {
    const mockRepository = mock(Repository);
    const mockRepositoryInstance = instance(mockRepository);
    when(mockConnection.getRepository(repositoryType)).thenReturn(mockRepositoryInstance);

    const mockQueryBuilder = mock(SelectQueryBuilder);

    when(mockRepository.createQueryBuilder(anyString())).thenReturn(instance(mockQueryBuilder));
    when(mockQueryBuilder.orderBy(anything())).thenReturn(instance(mockQueryBuilder));
    when(mockQueryBuilder.where(anything())).thenReturn(instance(mockQueryBuilder));
    when(mockQueryBuilder.where(anything(), anything())).thenReturn(instance(mockQueryBuilder));
    when(mockQueryBuilder.innerJoinAndSelect(anything(), anything())).thenReturn(instance(mockQueryBuilder));

    return {
        repository: mockRepository,
        queryBuilder: mockQueryBuilder,
    };
}
