const { Configuration, OpenAIApi } = require("openai");
const functions = require("firebase-functions");

const configuration = new Configuration({
  apiKey: functions.config().openai.key,
  organization: functions.config().openai.org
});
const openai = new OpenAIApi(configuration);

module.exports = {
  async getDalle(msg, reaction = "") {
    console.log("Getting DALL-E with prompt: " + msg);
    const response = await openai.createImage({
      prompt: msg,
      n: 1,
      size: "256x256",
      response_format: "b64_json",
    });
    //functions.logger.info(response.data)
    const blob = response.data.data[0].b64_json;
    return blob;
  },
  async getChat(msgs, temp) {
    console.log("Getting GPT4 with prompt: " + JSON.stringify(msgs), temp);
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: msgs,
      temperature: temp,
    });
    console.log(completion,'raw response')
    let choices = completion.data.choices;
    if (choices.length) {
      let choice = choices[0].message;
      return choice;
    }
    return completion;
  },
};
