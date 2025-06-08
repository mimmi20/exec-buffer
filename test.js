import fs from 'node:fs';
import path from 'node:path';
import gifsicle from 'gifsicle';
import isGif from 'is-gif';
import { pathExists } from 'path-exists'
import pify from 'pify';
import test from 'ava';
import m from './index.js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('set temporary directories', async t => {
	const {input, output} = await m;
	t.truthy(input);
	t.truthy(output);
});

test('return a optimized buffer', async t => {
	const buf = await pify(fs.readFile)(path.join(__dirname, 'fixture.gif'));
	const data = await m({
		input: buf,
		bin: gifsicle,
		args: ['-o', m.output, m.input]
	});

	t.true(data.length < buf.length);
	t.true(isGif(data));
});

test('remove temporary files', async t => {
	const buf = await pify(fs.readFile)(path.join(__dirname, 'fixture.gif'));
	const err = await t.throws(await m({
		input: buf,
		bin: 'foobarunicorn',
		args: [m.output, m.input]
	}));

	t.is(err.code, 'ENOENT');
	t.false(await pathExists(err.spawnargs[0]));
	t.false(await pathExists(err.spawnargs[1]));
});
