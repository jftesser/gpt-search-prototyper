import * as tf from "@tensorflow/tfjs";
import * as use from "@tensorflow-models/universal-sentence-encoder";

type Env = {
    model: use.UniversalSentenceEncoder
};

export const load = async (): Promise<Env> => {
    await tf.ready();
    return {
        model: await use.load()
    }
}