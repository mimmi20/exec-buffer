import { readFile } from 'node:fs/promises';
import path from 'node:path';
import gifsicle from 'gifsicle';
import isGif from 'is-gif';
import { pathExists } from 'path-exists'
import test from 'ava';
import m, { input, output } from './index.js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('set temporary directories', async t => {
	t.truthy(input);
	t.truthy(output);
});

test('return a optimized buffer', async t => {
	const buf = await readFile(path.join(__dirname, 'fixture.gif'));
	const data = await m({
		input: buf,
		bin: gifsicle,
		args: ['-o', output, input]
	});

	t.true(data.length < buf.length);
	t.true(isGif(data));
});

test('remove temporary files', async t => {
	// Skip the test on Windows
	if (process.platform === 'win32') {
		t.pass();
		return;
	}

	const buf = await readFile(path.join(__dirname, 'fixture.gif'));

	try {
		await m({
			input: buf,
			bin: 'foobarunicorn',
			args: [output, input]
		});
		t.pass();
	} catch (err) {
		console.log(err);
		t.is(err.code, 'ENOENT');
		t.false(await pathExists(err.spawnargs[0]));
		t.false(await pathExists(err.spawnargs[1]));
	}
});
