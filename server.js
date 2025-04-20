const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dialogflow = require("@google-cloud/dialogflow");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve frontend files

// Initialize Dialogflow session client with service account key
const sessionClient = new dialogflow.SessionsClient({
  keyFilename: "service-account.json", // your downloaded service account key file
});

// Set your Dialogflow project ID
const projectId = "resumeassistantchatbot-aork";

app.post("/message", async (req, res) => {
  const sessionId = Math.random().toString(36).substring(7); // random session ID
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

    // Check for custom payload in response messages
    if (result.fulfillmentMessages) {
      const payloadMsg = result.fulfillmentMessages.find(msg => msg.payload);
      if (payloadMsg) {
        res.json({ reply: payloadMsg.payload.fields });
        return;
      }
    }

    // Fallback: If no custom payload, send fulfillmentText
    res.json({
      reply: result.fulfillmentText,
    });

  } catch (error) {
    console.error("Dialogflow API error:", error);
    res.status(500).send("Error communicating with Dialogflow.");
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
