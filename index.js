import { writeFile, readFile } from 'node:fs/promises';
import { execa } from 'execa';
import { rimraf } from 'rimraf'
import tempfile from 'tempfile';

export const input = Symbol('inputPath');
export const output = Symbol('outputPath');

const pFinally = async function(
  promise,
  onFinally = (() => {})
) {
  let value;
  try {
    value = await promise;
  } catch (error) {
    await onFinally();
    throw error;
  }

  await onFinally();
  return value;
};

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

	opts.args = opts.args.map(function (x) {
		return x === input ? inputPath : x === output ? outputPath : x;
	});

	const promise = writeFile(inputPath, opts.input)
		.then(() => execa(opts.bin, opts.args))
		.then(() => readFile(outputPath));

	return pFinally(promise, () => Promise.all([
		rimraf(inputPath),
		rimraf(outputPath)
	]));
};

export default func;
