import * as tf from "@tensorflow/tfjs";
import * as use from "@tensorflow-models/universal-sentence-encoder";

export type Env = {
    model: use.UniversalSentenceEncoder
};

export const load = async (): Promise<Env> => {
    await tf.ready();
    return {
        model: await use.load()
    }
}

export type Index = {
    model: use.UniversalSentenceEncoder,
    snippets: [string][]
}

export type IndexOptions = {
    // Length in words
    snippetLength?: number
};

const snippets = function* (document: string, snippetLength: number) {
    const words = document.split(/(\s+)/);
    for (let i = 0; i < words.length; i += snippetLength) {
        yield words.slice(i, i + snippetLength).join(" ");
    }
}

const mapped = function* <T, U>(f: (t: T) => U, i: Iterable<T>) {
    for (const t of i) {
        yield f(t)
    }
}

export const index = async (env: Env, document: string, options?: IndexOptions): Promise<Index> => {
    const snippetLength = options?.snippetLength ?? 150;

    return {
        model: env.model,
        snippets: Array.from(mapped((x) => [x], snippets(document, snippetLength)))
    }
}