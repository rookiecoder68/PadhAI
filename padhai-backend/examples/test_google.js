// quick script to verify Google GenAI provider
const { summarizeText } = require('../src/azureClient');

async function run() {
  try {
    const summary = await summarizeText('Photosynthesis converts CO2 into O2 and glucose...', 'brief');
    console.log('summary:', summary);
  } catch (e) {
    console.error('error', e.message);
  }
}

run();
