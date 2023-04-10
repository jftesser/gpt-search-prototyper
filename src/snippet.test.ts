import assert from 'node:assert';
import { load, Env, index, Index, search } from './snippet';

describe("snippet", () => {
    let env: undefined | Env;
    let index_: undefined | Index;
    beforeAll(async () => {
        env = await load();
        index_ = await index(env, "I like apples.  I like snails.", { snippetLength: 3 });
    });
    test("can load environment", () => {
        expect(env).toBeTruthy();
    })
    test("can index document", () => {
        expect(index_).toBeTruthy();
    })
    test("can search index", async () => {
        assert(index_);
        await expect(search(index_, "apples are my favorite food", { numResults: 1 })).resolves.toEqual(["I like apples."])
    })

})