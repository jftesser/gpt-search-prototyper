import { load } from './snippet';

describe("snippet", () => {
    test("can load model", async () => {
        await expect(load()).resolves.toBeTruthy();
    })
})