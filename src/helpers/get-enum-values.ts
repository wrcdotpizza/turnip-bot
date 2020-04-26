export function getEnumValues<T>(enumType: any, isNumeric = false): Array<T> {
    return Object.keys(enumType)
        .filter(k => typeof enumType[k as any] === (isNumeric ? 'number' : 'string'))
        .map(k => enumType[k as any]);
}
