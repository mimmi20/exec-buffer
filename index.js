import fs from 'node:fs';
import { execa } from 'execa';
import pFinally from 'p-finally';
import pify from 'pify';
import { rimraf } from 'rimraf'
import tempfile from 'tempfile';

const fsP = pify(fs);
const rmP = pify(rimraf);
export const input = Symbol('inputPath');
export const output = Symbol('outputPath');

const func = async opts => {
	opts = Object.assign({}, opts);

	if (!Buffer.isBuffer(opts.input)) {
		return Promise.reject(new Error('Input is required'));
	}

	if (typeof opts.bin !== 'string') {
		return Promise.reject(new Error('Binary is required'));
	}

	if (!Array.isArray(opts.args)) {
		return Promise.reject(new Error('Arguments are required'));
	}

	const inputPath = opts.inputPath || tempfile();
	const outputPath = opts.outputPath || tempfile();

	opts.args = opts.args.map(x => x === input ? inputPath : x === output ? outputPath : x);

	const promise = fsP.writeFile(inputPath, opts.input)
		.then(() => execa(opts.bin, opts.args))
		.then(() => fsP.readFile(outputPath));

	return pFinally(promise, () => Promise.all([
		rmP(inputPath),
		rmP(outputPath)
	]));
};

export default func;
