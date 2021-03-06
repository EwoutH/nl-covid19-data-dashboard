import { isDefined, isPresent } from 'ts-is-present';
import { assert } from '~/utils/assert';
import { getDaysForTimeframe, TimeframeOption } from '~/utils/timeframe';

export type Value = DailyValue | WeeklyValue;

// This type limits the allowed property names to those with a number type,
// so its like keyof T, but filtered down to only the appropriate properties.
export type NumberProperty<T extends Value> = {
  [K in keyof T]: T[K] extends number | null ? K : never;
}[keyof T];

export type DailyValue = {
  date_unix: number;
};

export type WeeklyValue = {
  date_start_unix: number;
  date_end_unix: number;
};

/**
 * To read an arbitrary value property from the passed in data, we need to cast
 * the type to a dictionary internally, otherwise TS will complain the index
 * signature is missing on the passed in value type T.
 */
export type AnyValue = Record<string, number | null>;
export type AnyFilteredValue = Record<string, number>;

export function isDailyValue(timeSeries: Value[]): timeSeries is DailyValue[] {
  const firstValue = (timeSeries as DailyValue[])[0];

  assert(
    isDefined(firstValue),
    'Unable to determine timestamps if time series is empty'
  );

  return firstValue.date_unix !== undefined;
}

export function isWeeklyValue(
  timeSeries: Value[]
): timeSeries is WeeklyValue[] {
  const firstValue = (timeSeries as WeeklyValue[])[0];

  assert(
    isDefined(firstValue),
    'Unable to determine timestamps if time series is empty'
  );

  return firstValue.date_end_unix !== undefined;
}

/**
 * From all the defined values, extract the highest number so we know how to
 * scale the y-axis. We need to do this for each of the keys that are used to
 * render lines, so that the axis scales with whatever key contains the highest
 * values.
 */
export function calculateYMax(
  values: TrendValue[][],
  signaalwaarde = -Infinity
) {
  const peakValues = values.map((list) =>
    list
      .map((x) => x.__value)
      .filter(isPresent) // omit null values
      .reduce((acc, value) => (value > acc ? value : acc), -Infinity)
  );

  const overallMaximum = Math.max(...peakValues);

  /**
   * Value cannot be 0, hence the 1 If the value is below signaalwaarde, make
   * sure the signaalwaarde floats in the middle
   */
  return Math.max(overallMaximum, signaalwaarde * 2, 1);
}

/**
 * From a list of values, return the ones that are within the timeframe.
 *
 * This is similar to getFilteredValues but here we assume the value is passed
 * in as-is from the data, and we detect what type of timestamp we should filter
 * on.
 */
export function getTimeframeValues(
  values: Value[],
  timeframe: TimeframeOption
) {
  const boundary = getTimeframeBoundaryUnix(timeframe);

  if (isDailyValue(values)) {
    return values.filter((x) => x.date_unix >= boundary);
  }

  if (isWeeklyValue(values)) {
    return values.filter((x) => x.date_start_unix >= boundary);
  }

  throw new Error(`Incompatible timestamps are used in value ${values[0]}`);
}

const oneDayInSeconds = 24 * 60 * 60;

function getTimeframeBoundaryUnix(timeframe: TimeframeOption) {
  if (timeframe === 'all') {
    return 0;
  }
  const days = getDaysForTimeframe(timeframe);
  return Date.now() / 1000 - days * oneDayInSeconds;
}

export type TrendValue = {
  __date: Date;
  __value: number;
};

const timestampToDate = (d: number) => new Date(d * 1000);

export function getTrendData<T extends Value>(
  values: T[],
  valueKeys: NumberProperty<T>[],
  timeframe: TimeframeOption
): (TrendValue & Value)[][] {
  return valueKeys.map((key) => getSingleTrendData(values, key, timeframe));
}

export function getSingleTrendData<T extends Value>(
  values: T[],
  valueKey: NumberProperty<T>,
  timeframe: TimeframeOption
): (TrendValue & Value)[] {
  const valuesInFrame = getTimeframeValues(values, timeframe);

  if (valuesInFrame.length === 0) {
    /**
     * It could happen that you are using an old dataset and select last week as
     * a timeframe at which point the values will be empty. This would not
     * happen on production, but for development we can just render nothing.
     */
    return [];
  }

  if (isDailyValue(valuesInFrame)) {
    return valuesInFrame
      .map((x) => ({
        ...x,
        /**
         * Not sure why we need to cast to number if isPresent is used to filter
         * out the null values.
         */
        __value: x[valueKey as keyof DailyValue],
        __date: timestampToDate(x.date_unix),
      }))
      .filter((x) => isPresent(x.__value));
  }

  if (isWeeklyValue(valuesInFrame)) {
    return valuesInFrame
      .map((x) => ({
        ...x,
        /**
         * Not sure why we need to cast to number if isPresent is used to filter
         * out the null values.
         */
        __value: x[valueKey as keyof WeeklyValue],
        __date: timestampToDate(x.date_start_unix),
      }))
      .filter((x) => isPresent(x.__value));
  }

  throw new Error(
    `Incompatible timestamps are used in value ${valuesInFrame[0]}`
  );
}
