/**
 * Vertex request shape. Tool results that are lists must be objects, because
 * functionResponse.response is a struct and Vertex rejects a JSON array.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { toContents } = require('../src/ai/llm');

test('list tool results are wrapped as objects', () => {
  const contents = toContents([{
    role: 'user',
    content: [{
      type: 'tool_result',
      tool_use_id: 'get_health_findings:0',
      name: 'get_health_findings',
      content: JSON.stringify([{ id: 'BP_RISING' }]),
    }],
  }]);
  const response = contents[0].parts[0].functionResponse.response;
  assert.equal(Array.isArray(response), false);
  assert.deepEqual(response, { items: [{ id: 'BP_RISING' }] });
});

test('object tool results stay objects', () => {
  const contents = toContents([{
    role: 'user',
    content: [{
      type: 'tool_result',
      tool_use_id: 'get_profile:0',
      name: 'get_profile',
      content: JSON.stringify({ name: 'Arjun' }),
    }],
  }]);
  assert.deepEqual(contents[0].parts[0].functionResponse.response, { name: 'Arjun' });
});
