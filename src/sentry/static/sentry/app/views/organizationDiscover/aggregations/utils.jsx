import {TOPK_COUNTS} from '../data';

/*
* Returns options for aggregation field dropdown
*/

export function getAggregateOptions(columns) {
  const topLevel = [
    {value: 'count', label: 'count'},
    {value: 'uniq', label: 'uniq(...)'},
    {value: 'topK', label: 'topK(...)'},
  ];

  const uniq = columns.map(({name}) => ({
    value: `uniq_${name}`,
    label: `uniq(${name})`,
  }));

  const topKCounts = TOPK_COUNTS.map(num => ({
    value: `topK_${num}`,
    label: `topK(${num})(...)`,
  }));

  const topKValues = TOPK_COUNTS.reduce((acc, num) => {
    return [
      ...acc,
      ...columns.map(({name}) => ({
        value: `topK_${num}_${name}`,
        label: `topK(${num})(${name})`,
      })),
    ];
  }, []);

  return {
    topLevel,
    uniq,
    topKCounts,
    topKValues,
  };
}

/**
 * Returns true if an aggregation is valid and false if not
 *
 * @param {Array} aggregation Aggregation in external Snuba format
 * @param {Object} cols List of column objects
 * @param {String} cols.name Column name
 * @param {String} cols.type Type of column
 * @returns {Boolean} True if valid aggregatoin, false if not
 */
export function isValidAggregation(aggregation, cols) {
  const columns = new Set(cols.map(({name}) => name));
  const topKRegex = /topK\((\d+)\)/;

  const [func, col] = aggregation;

  if (!func) {
    return false;
  }

  if (func === 'count()') {
    return col === null;
  }

  if (func === 'uniq' || func.match(topKRegex)) {
    return columns.has(col);
  }

  if (func === 'avg') {
    const validCols = new Set(
      cols.filter(({type}) => type === 'number').map(({name}) => name)
    );
    return validCols.has(col);
  }

  return false;
}

/**
* Converts aggregation from external Snuba format to internal format for dropdown
*
* @param {Array} external Aggregation in external Snuba format
* @return {String} Aggregation in internal format
**/
export function getInternal(external) {
  const [func, col] = external;

  if (func === null) {
    return '';
  }

  if (func === 'count()') {
    return 'count';
  }

  if (func === 'uniq') {
    return `uniq_${col}`;
  }

  if (func.startsWith('topK')) {
    const count = func.match(/topK\((\d+)\)/)[1];
    return `topK_${count}_${col}`;
  }

  return func;
}

/*
* Converts from external representation (string value from dropdown) to external format (array)
*/
export function getExternal(internal) {
  const uniqRegex = /^uniq_(.+)$/;
  const topKRegex = /^topK_(\d+)_(.+)$/;

  if (internal === 'count') {
    return ['count()', null, 'count'];
  }

  if (internal.match(uniqRegex)) {
    return ['uniq', internal.match(uniqRegex)[1], internal];
  }

  const topKMatch = internal.match(topKRegex);
  if (topKMatch) {
    return [`topK(${parseInt(topKMatch[1], 10)})`, topKMatch[2], internal];
  }

  return internal;
}
