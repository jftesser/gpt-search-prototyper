import * as tf from "@tensorflow/tfjs";
import * as use from "@tensorflow-models/universal-sentence-encoder";


export type IndexOptions = {
    // Length in words
    snippetLength?: number,
    overlap?: number,
};

export type Env = (document: string, options?: IndexOptions) => Promise<Index>;

type IndexInternals = {
    model: use.UniversalSentenceEncoder,
    snippets: [string, Float32Array | Int32Array | Uint8Array][]
}

export type SearchOptions = {
    numResults?: number
}

export type Index = (query: string, options?: SearchOptions) => Promise<string[]>;

const extractSnippets = function* (document: string, snippetLength: number, overlap: number) {
    const makeWords = (segment: string) => segment.split(/[\s\n]+/m);
    const words = makeWords(document);
    for (let i = 0; i < words.length; i += snippetLength - overlap) {
        yield words.slice(i, i + snippetLength).join(" ");
    }

    // expanding out to sentende boundaries only seems to hurt
    /* for (let i = 0; i < words.length; i += snippetLength - overlap) {
        // look backwards up to overlap for the last word that includes sentence ending punctuation
        let os = 1;
        while (os < overlap && i - os > 0 && !words[i - os].match(/[.?!,]/)) { os++; }
        let fos = 0;
        while (fos < overlap && words.length > i + snippetLength + fos && !words[i + snippetLength + fos].match(/[.?!,]/)) { fos++; }
        yield words.slice(i - (os-1), i + snippetLength + fos + 1).join(" ");
    }*/
}

const search = async (index: IndexInternals, query: string, options?: SearchOptions): Promise<string[]> => {
    const numResults = options?.numResults ?? 5;
    const embedTensor = await index.model.embed(query);
    let ret: [string, number][] = [];
    for (const [snippet, embed] of index.snippets) {
        const score = await tf.matMul(embedTensor, tf.reshape(embed, [1, -1]), false, true).data();
        // console.log("Score:", snippet, score[0]);
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
    const overlap = options?.overlap ?? 10;
    const snippets = Array.from(extractSnippets(document, snippetLength, overlap));
    let embeds: Promise<[string, Float32Array | Int32Array | Uint8Array]>[] = [];
    const maxEmbeddingAtOnce = 50;
    for (let i = 0; i < snippets.length; i += maxEmbeddingAtOnce) {
        const thisSlice = snippets.slice(i, i + maxEmbeddingAtOnce)
        // console.log("embedding", i, thisSlice.length, snippets.length)
        const embedTensor = await model.embed(thisSlice);
        const newEmbeds = [...Array(thisSlice.length).keys()].map((j): Promise<[string, Float32Array | Int32Array | Uint8Array]> => {
            return (async () => { return [thisSlice[j], await tf.slice(embedTensor, [j, 0], [1]).data()] })()
        })
        embeds = embeds.concat(newEmbeds);
    }
    const internals: IndexInternals = {
        model: model,
        snippets: await Promise.all(embeds),
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



