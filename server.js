const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dialogflow = require("@google-cloud/dialogflow");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve frontend files

// Initialize Dialogflow session client
const sessionClient = new dialogflow.SessionsClient({
  keyFilename: "service-account.json", // your Dialogflow service account JSON
});

// Set your Dialogflow project ID
const projectId = "resumeassistantchatbot-aork";

app.post("/message", async (req, res) => {
  const sessionId = Math.random().toString(36).substring(7);
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: req.body.message,
        languageCode: "en",
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    // Check for custom payload in fulfillmentMessages
    if (result.fulfillmentMessages) {
      const payloadMsg = result.fulfillmentMessages.find(msg => msg.payload);
      if (payloadMsg) {
        res.json({
          reply: {
            type: "richContent",
            content: payloadMsg.payload.fields
          }
        });
        return;
      }
    }

    // Else, send plain text response
    res.json({
      reply: {
        type: "text",
        content: result.fulfillmentText
      }
    });

  } catch (error) {
    console.error("Dialogflow API error:", error);
    res.status(500).send("Error communicating with Dialogflow.");
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
