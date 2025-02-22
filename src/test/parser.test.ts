import * as assert from 'node:assert';
import sinon from 'sinon';
import { ClusterSMIParser, ParseError } from '../parser';
import type { ClusterSMIOutput } from '../types';
import { testData } from './parserTestData';

/**
 * @throws {Error}
 * If the given data is not splittable.
 */
function splitTestData(data: string): { timestamp: string; table: string } {
   const lines = data.split('\n').filter((line) => line.trim() !== '');

   if (!lines[0].startsWith('[2J')) {
      throw new Error('Given data is not splittable');
   }

   return {
      timestamp: lines[0],
      table: lines.slice(1).join('\n'),
   };
}

/**
 * Write the timestamp and table data to the parser separately, as this is how the output from cluster-smi is actually provided.
 */
function writeTestData(parser: ClusterSMIParser, data: string): void {
   const { timestamp, table } = splitTestData(data);
   parser.write(Buffer.from(timestamp));
   parser.write(Buffer.from(table));
}

suite('ClusterSMIParser', () => {
   let parser: ClusterSMIParser;
   let onUpdateSpy: sinon.SinonSpy;
   let onErrorSpy: sinon.SinonSpy;

   setup(() => {
      parser = new ClusterSMIParser();
      onUpdateSpy = sinon.spy();
      onErrorSpy = sinon.spy();
      parser.onDidUpdate(onUpdateSpy);
      parser.onError(onErrorSpy);
   });

   teardown(() => {
      sinon.restore();
   });

   suite('Writing', () => {
      test('Should parse a valid cluster-smi output', async () => {
         const { raw, parsed } = testData.valid;

         writeTestData(parser, raw);

         assert.strictEqual(onUpdateSpy.calledOnce, true);
         assert.strictEqual(onErrorSpy.called, false);

         const result = onUpdateSpy.getCalls()[0].args[0] as ClusterSMIOutput;

         assert.deepStrictEqual(result, parsed);
      });

      test('Should emit an error if the table comes before the timestamp', async () => {
         const { raw } = testData.valid;

         const { timestamp, table } = splitTestData(raw);
         parser.write(Buffer.from(table));
         parser.write(Buffer.from(timestamp));

         assert.strictEqual(onUpdateSpy.called, false);
         assert.strictEqual(onErrorSpy.callCount, 8); // because the table has 8 rows including the header

         for (const call of onErrorSpy.getCalls()) {
            const error = call.args[0] as ParseError;

            assert.strictEqual(error instanceof ParseError, true);
         }
      });

      test('Should emit an error if the table col count is incorrect', async () => {
         const { raw, invalidLineCount } = testData.invalidColCount;

         writeTestData(parser, raw);

         assert.strictEqual(onUpdateSpy.called, true);
         assert.strictEqual(onErrorSpy.callCount, invalidLineCount);

         for (const call of onErrorSpy.getCalls()) {
            const error = call.args[0] as ParseError;

            assert.strictEqual(error instanceof ParseError, true);
         }
      });

      test('Should emit an error if fields are unexpectedly empty', async () => {
         const { raw, invalidLineCount } = testData.unexpectedEmptyFields;

         writeTestData(parser, raw);

         assert.strictEqual(onUpdateSpy.called, true);
         assert.strictEqual(onErrorSpy.callCount, invalidLineCount);

         for (const call of onErrorSpy.getCalls()) {
            const error = call.args[0] as ParseError;

            assert.strictEqual(error instanceof ParseError, true);
         }
      });
   });
});
