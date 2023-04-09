const functions = require("firebase-functions");
const openai = require("./openai");
// const cors = require("cors")({
//   origin: true,
// });

exports.getChat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }
  const resp = await openai.getChat(data.messages, data.temp);
  return resp;
});
