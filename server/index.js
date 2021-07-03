const needle = require('needle');
const axios = require('axios');
const TOKEN = process.env.TWITTER_BEARER_TOKEN;
const botToken = process.env.TRADERS_SLACK;
const slackURL = 'https://slack.com/api/chat.postMessage';

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL =
  'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id';

const rules = [
  { value: 'from:denvermullets' },
  { value: 'from:ShamsCharania' },
  { value: 'from:wojespn' },
  { value: 'from:MarcJSpears' },
  { value: 'from:JeffPassan' },
  { value: 'from:Ken_Rosenthal' },
  { value: 'from:JonHeyman' },
  { value: 'from:BNightengale' },
  { value: 'from:adamschefter' },
  { value: 'from:RapSheet' },
  { value: 'from:JasonLaCanfora' },
  { value: 'from:JayGlazer' },
  { value: 'from:JosinaAnderson' },
  { value: 'from:MikeGarafolo' },
  { value: 'from:TSNBobMcKenzie' },
  { value: 'from:PierreVLeBrun' },
  { value: 'from:FriedgeHNIC' },
  { value: 'from:reporterchris' },
  { value: 'from:TheSteinLine' },
  { value: 'from:ChrisBHaynes' },
  { value: 'from:espn_macmahon' },
  // { value: 'from:MarcJSpears' },
  // { value: 'from:MarcJSpears' },
  // { value: 'from:MarcJSpears' },
  // { value: 'from:MarcJSpears' },
  // { value: 'from:MarcJSpears' },
];

// get rules
async function getRules() {
  const response = await needle('get', rulesURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  return response.body;
}

// set rules
async function setRules() {
  const data = {
    add: rules,
  };

  const response = await needle('post', rulesURL, data, {
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  return response.body;
}

// delete rules
async function deleteRules(rules) {
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map((rule) => rule.id);

  const data = {
    delete: {
      ids: ids,
    },
  };

  const response = await needle('post', rulesURL, data, {
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  return response.body;
}

function streamTweets() {
  const stream = needle.get(streamURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  stream.on('data', (data) => {
    try {
      const json = JSON.parse(data);
      sendToSlack(json);
      console.log(json);
    } catch (error) {
      // twitter sends an empty response to signify no new tweets
      // it seems like after a short time the node app will just fail after
      // getting so many empty responses, which is less than ideal
      console.log(error);
    }
  });
}

async function sendToSlack(json) {
  const res = await axios.post(
    slackURL,
    {
      channel: '#shamsbot_test',
      text: `https://twitter.com/${json.data.author_id}/status/${json.data.id}`,
    },
    { headers: { authorization: `Bearer ${botToken}` } }
  );
}

(async () => {
  let currentRules;

  try {
    // get our current list of rules
    currentRules = await getRules();

    // let's clear what rules have been set (just in case there's a change)
    await deleteRules(currentRules);

    // set new rules with twitter
    await setRules();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

  streamTweets();
})();
