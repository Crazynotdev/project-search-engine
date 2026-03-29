export const chunkArray = <T>(arr: Array<T>, size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) },
        (_, i) => arr.slice(i * size, i * size + size)
    );

