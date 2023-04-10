import * as tf from "@tensorflow/tfjs";
import * as use from "@tensorflow-models/universal-sentence-encoder";


export type IndexOptions = {
    // Length in words
    snippetLength?: number
};

export type Env = (document: string, options?: IndexOptions) => Promise<Index>;

type IndexInternals = {
    model: use.UniversalSentenceEncoder,
    snippets: [string, tf.Tensor2D][]
}

export type SearchOptions = {
    numResults?: number
}

export type Index = (query: string, options?: SearchOptions) => Promise<string[]>;

const extractSnippets = function* (document: string, snippetLength: number) {
    const words = document.split(/[\s\n]+/m);
    for (let i = 0; i < words.length; i += snippetLength) {
        yield words.slice(i, i + snippetLength).join(" ");
    }
}

const search = async (index: IndexInternals, query: string, options?: SearchOptions): Promise<string[]> => {
    const numResults = options?.numResults ?? 5;
    const embedTensor = await index.model.embed(query);
    let ret: [string, number][] = [];
    for (const [snippet, embed] of index.snippets) {
        const score = await tf.matMul(embedTensor, embed, false, true).data();
        if (ret.length < numResults) {
            ret.push([snippet, score[0]]);
            ret.sort(([_a, n], [_b, m]) => n - m)
        } else if (score[0] > ret[ret.length - 1][1]) {
            ret.pop();
            ret.push([snippet, score[0]]);
            ret.sort(([_a, n], [_b, m]) => m - n)
        }
    }
    return ret.map(([v]) => v);
}
const index = async (model: use.UniversalSentenceEncoder, document: string, options?: IndexOptions): Promise<Index> => {
    const snippetLength = options?.snippetLength ?? 80;
    const snippets = Array.from(extractSnippets(document, snippetLength));
    const embedTensor = await model.embed(snippets);
    const embeds = [...Array(snippets.length).keys()].map((i): [string, tf.Tensor2D] => {
        return [snippets[i], tf.slice(embedTensor, [i, 0], [1])]
    })
    const internals: IndexInternals = {
        model: model,
        snippets: embeds,
    }
    return async (query: string, options?: SearchOptions) => { return await search(internals, query, options) }
}

export const load = async (): Promise<Env> => {
    await tf.ready();
    const model = await use.load();
    return async (document: string, options?: IndexOptions) => {
        return await index(model, document, options)
    }
}



