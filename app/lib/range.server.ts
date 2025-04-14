export interface Range {
  start: number;
  end: number;
}

function make416(message: string) {
  return new Response(message, { status: 416 });
}

export function parseRange(range: string, size?: number): Range {
  if (range.includes(","))
    throw make416("Multi-range requests are not supported");

  const [unit, rangeStr] = range.split("=");
  if (unit !== "bytes") throw make416("Invalid Range unit");

  const outRange = { start: 0, end: 0 };

  // Parse the range
  const [start, end] = rangeStr.split("-");
  outRange.start = parseInt(start, 10);
  outRange.end = parseInt(end, 10);

  // Replace empty fields with absolute values
  if (isNaN(outRange.start) && !isNaN(outRange.end)) {
    outRange.start = size ? Math.max(0, size - outRange.end) : 0;
    outRange.end = size ? size - 1 : 0;
  } else if (!isNaN(outRange.start) && isNaN(outRange.end)) {
    outRange.end = size ? size - 1 : 0;
  }

  // Validation
  if (isNaN(outRange.start) || isNaN(outRange.end))
    throw make416("Invalid Range values");
  if (outRange.start > outRange.end)
    throw make416("Range start is greater than end");
  if (size && outRange.end >= size)
    throw make416("Range end is greater than file size");
  if (outRange.start < 0) throw make416("Range start is negative");

  return outRange;
}

export function makeContentRangeHeader(range: Range, size: number): string {
  return `bytes ${range.start}-${range.end}/${size}`;
}
