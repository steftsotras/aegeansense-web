import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

function clientWithError(detail) {
  const source = fs.readFileSync(new URL('../lib/api/client.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const context = {
    exports: {}, process: { env: {} }, URLSearchParams,
    fetch: async () => ({ ok: false, status: 422, statusText: 'Unprocessable Entity', json: async () => ({ detail }) }),
  };
  vm.runInNewContext(outputText, context);
  return context.exports;
}

test('validation errors become displayable field messages', async () => {
  const { ApiClient, ApiError } = clientWithError([
    { loc: ['body', 'name'], msg: 'Field required' },
    { loc: ['body', 'finot_url'], msg: 'Invalid URL' },
  ]);
  await assert.rejects(new ApiClient().getProfiles(), error => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.detail, 'name: Field required; finot_url: Invalid URL');
    return true;
  });
});

test('plain error messages are preserved', async () => {
  const { ApiClient } = clientWithError('Profile not found');
  await assert.rejects(new ApiClient().getProfiles(), error => error.detail === 'Profile not found');
});

test('unexpected error detail objects do not reach React', async () => {
  const { ApiClient } = clientWithError({ unexpected: true });
  await assert.rejects(new ApiClient().getProfiles(), error => error.detail === undefined);
});
