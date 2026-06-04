import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.OPENROUTER_API_KEY || '';

async function test() {
  try {
    console.log('Sending request to OpenRouter...');
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'black-forest-labs/flux.2-klein-4b',
        messages: [
          {
            role: 'user',
            content:
              'A close-up portrait of a natural Japanese young woman with straight black hair, smiling in a cafe, 8k, photorealistic',
          },
        ],
        modalities: ['image'],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );

    console.log('Response status:', response.status);
    console.log('Response choices:', JSON.stringify(response.data.choices, null, 2));

    // メッセージ全体を出力
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Error occurred:', error.response ? error.response.data : error.message);
  }
}

test();
